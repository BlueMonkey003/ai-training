import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { uploadToCloudinary } from '../config/cloudinary.config';
import { Receipt } from '../models/Receipt.model';
import { Order } from '../models/Order.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { io } from '../server';
import { emitNotification } from '../sockets/socketHandlers';

/**
 * Upload receipt for a closed order (admin only)
 */
export const uploadReceiptForOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { orderId } = req.params as any;

        const order = await Order.findById(orderId).populate('restaurantId');
        if (!order) {
            const error = new Error('Order niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }
        if (order.status !== 'closed') {
            const error = new Error('Bonnetje kan alleen bij gesloten orders worden geüpload') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        if (!req.file) {
            const error = new Error('Geen bestand geüpload') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // upload naar Cloudinary
        const fileUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/receipts');

        // één bonnetje per order: model heeft unique index op orderId
        const r = await Receipt.create({
            orderId: order._id,
            restaurantId: (order.restaurantId as any)._id,
            uploadedBy: req.user!._id,
            fileUrl,
            fileType: req.file.mimetype,
            originalName: req.file.originalname,
            // amount en notes later via AI (N8N), dus optioneel
        });

        // Notificaties naar alle admins (behalve de uploader)
        const admins = await User.find({ role: 'admin', _id: { $ne: req.user!._id } });
        const message = `Nieuw bonnetje geüpload voor ${(order.restaurantId as any).name}`;
        const notifications = await Promise.all(
            admins.map(a => Notification.create({
                userId: a._id,
                type: 'receipt_uploaded',
                message,
                orderId: order._id,
                restaurantId: (order.restaurantId as any)._id,
                receiptId: r._id,
                route: `/receipts`,
            }))
        );
        notifications.forEach(n => emitNotification(io, String(n.userId), n));

        res.status(201).json({ success: true, receipt: r });
    } catch (error) {
        // duplicate key -> already has receipt
        if ((error as any)?.code === 11000) {
            (error as any).statusCode = 400;
            (error as any).message = 'Er is al een bonnetje gekoppeld aan deze order';
        }
        next(error);
    }
};

export const listReceipts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { from, to, restaurantId, userId, orderId, participantId, page = '1', pageSize = '20' } = req.query as any;
        const filter: any = {};
        if (restaurantId) filter.restaurantId = restaurantId;
        if (userId) filter.uploadedBy = userId;
        if (orderId) filter.orderId = orderId;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }
        const skip = (parseInt(page) - 1) * parseInt(pageSize);
        const includeTotals = String((req.query as any).includeTotals) === 'true';
        if (!includeTotals) {
            const [items, total] = await Promise.all([
                Receipt.find(filter)
                    .populate('restaurantId', 'name imageUrl')
                    .populate('uploadedBy', 'name email profileImageUrl')
                    .sort('-createdAt')
                    .skip(skip)
                    .limit(parseInt(pageSize)),
                Receipt.countDocuments(filter),
            ]);
            return res.json({ success: true, receipts: items, total });
        }

        // Aggregatie met totals per order + deelnemers (distinct users)
        // Cast ids for aggregation $match
        const aggMatch: any = { ...filter };
        if (aggMatch.restaurantId && mongoose.Types.ObjectId.isValid(aggMatch.restaurantId)) {
            aggMatch.restaurantId = new mongoose.Types.ObjectId(aggMatch.restaurantId);
        }
        if (aggMatch.uploadedBy && mongoose.Types.ObjectId.isValid(aggMatch.uploadedBy)) {
            aggMatch.uploadedBy = new mongoose.Types.ObjectId(aggMatch.uploadedBy);
        }
        if (aggMatch.orderId && mongoose.Types.ObjectId.isValid(aggMatch.orderId)) {
            aggMatch.orderId = new mongoose.Types.ObjectId(aggMatch.orderId);
        }
        const participantObjectId = participantId && mongoose.Types.ObjectId.isValid(participantId) ? new mongoose.Types.ObjectId(participantId) : null;

        const pipeline: any[] = [
            { $match: aggMatch },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(pageSize) },
            {
                $lookup: { from: 'orderitems', localField: 'orderId', foreignField: 'orderId', as: 'orderItems' },
            },
            {
                $addFields: {
                    orderTotal: { $sum: { $map: { input: '$orderItems', as: 'oi', in: { $ifNull: ['$$oi.price', 0] } } } },
                    participantIds: { $setUnion: ['$orderItems.userId', []] },
                    participantTotal: participantObjectId ? { $sum: { $map: { input: '$orderItems', as: 'oi', in: { $cond: [{ $eq: ['$$oi.userId', participantObjectId] }, { $ifNull: ['$$oi.price', 0] }, 0] } } } } : undefined,
                },
            },
            { $lookup: { from: 'restaurants', localField: 'restaurantId', foreignField: '_id', as: 'restaurant' } },
            { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'uploadedBy', foreignField: '_id', as: 'u' } },
            { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'participantIds', foreignField: '_id', as: 'participants' } },
            {
                $project: {
                    orderId: 1,
                    createdAt: 1,
                    fileUrl: 1,
                    fileType: 1,
                    originalName: 1,
                    rating: 1,
                    amount: 1,
                    orderTotal: 1,
                    participantTotal: 1,
                    restaurantId: '$restaurant._id',
                    restaurant: { name: '$restaurant.name', imageUrl: '$restaurant.imageUrl' },
                    uploadedBy: { _id: '$u._id', name: '$u.name', email: '$u.email', profileImageUrl: '$u.profileImageUrl' },
                    participants: { $map: { input: '$participants', as: 'p', in: { _id: '$$p._id', name: '$$p.name', email: '$$p.email', profileImageUrl: '$$p.profileImageUrl' } } },
                },
            },
        ];

        const [items, totalArr] = await Promise.all([
            Receipt.aggregate(pipeline),
            Receipt.countDocuments(filter),
        ]);
        res.json({ success: true, receipts: items, total: totalArr });
    } catch (error) {
        next(error);
    }
};

export const getReceiptsSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { from, to } = req.query as any;
        const match: any = {};
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = new Date(from);
            if (to) match.createdAt.$lte = new Date(to);
        }

        const pipeline = [
            { $match: match },
            {
                $facet: {
                    overall: [
                        { $group: { _id: null, totalAmount: { $sum: { $ifNull: ['$amount', 0] } }, count: { $sum: 1 } } },
                    ],
                    byRestaurant: [
                        { $group: { _id: '$restaurantId', totalAmount: { $sum: { $ifNull: ['$amount', 0] } }, count: { $sum: 1 } } },
                        { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
                        { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
                        { $project: { _id: 1, totalAmount: 1, count: 1, name: '$restaurant.name', imageUrl: '$restaurant.imageUrl' } },
                    ],
                    byUser: [
                        // Neem alle orderitems mee die behoren bij de orders waarvoor een bon bestaat
                        { $lookup: { from: 'orderitems', localField: 'orderId', foreignField: 'orderId', as: 'orderItems' } },
                        { $unwind: { path: '$orderItems', preserveNullAndEmptyArrays: false } },
                        { $group: { _id: '$orderItems.userId', totalAmount: { $sum: { $ifNull: ['$orderItems.price', 0] } }, count: { $sum: 1 } } },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                        { $project: { _id: 1, totalAmount: 1, count: 1, name: { $ifNull: ['$user.name', '$user.email'] }, profileImageUrl: '$user.profileImageUrl' } },
                    ],
                },
            },
        ];

        const [result] = await Receipt.aggregate(pipeline);
        res.json({ success: true, summary: result || { overall: [], byRestaurant: [], byUser: [] } });
    } catch (error) {
        next(error);
    }
};

export const getReceiptDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as any;
        const r = await Receipt.findById(id).populate('restaurantId', 'name').populate('uploadedBy', 'name email');
        if (!r) {
            const error = new Error('Bonnetje niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }
        res.json({ success: true, receipt: r });
    } catch (error) {
        next(error);
    }
};

export const deleteReceipt = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params as any;
        const r = await Receipt.findByIdAndDelete(id);
        if (!r) {
            const error = new Error('Bonnetje niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};


