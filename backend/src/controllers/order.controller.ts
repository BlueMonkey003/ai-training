import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { OrderItem } from '../models/OrderItem.model';
import { Notification } from '../models/Notification.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { io } from '../server';
import { emitNewOrder, emitOrderClosed, emitNotification } from '../sockets/socketHandlers';

export const getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status, date } = req.query;
        const filter: any = {};

        if (status) filter.status = status;
        if (date) {
            const startDate = new Date(date as string);
            const endDate = new Date(date as string);
            endDate.setDate(endDate.getDate() + 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }

        const orders = await Order.find(filter)
            .populate('restaurantId')
            .populate('createdBy', 'name email')
            .sort('-date');

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

export const createOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { restaurantId, date } = req.body;

        // Check of er al een open order is voor vandaag
        const existingOrder = await Order.findOne({
            date: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            status: 'open',
        });

        if (existingOrder) {
            const error = new Error('Er is al een open order voor vandaag') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        const order = await Order.create({
            restaurantId,
            date: date || new Date(),
            createdBy: req.user!._id,
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('restaurantId')
            .populate('createdBy', 'name email');

        // Emit nieuwe order event
        emitNewOrder(io, populatedOrder);

        // Maak notificaties voor alle gebruikers
        const { User } = await import('../models/User.model');
        const users = await User.find({ _id: { $ne: req.user!._id } });

        const notifications = await Promise.all(
            users.map(user =>
                Notification.create({
                    userId: user._id,
                    type: 'order_reminder',
                    message: `Nieuwe lunch bestelling geopend voor ${(populatedOrder!.restaurantId as any).name}`,
                })
            )
        );

        // Stuur notificaties via Socket.IO
        notifications.forEach(notification => {
            emitNotification(io, String(notification.userId), notification);
        });

        res.status(201).json({
            success: true,
            order: populatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('restaurantId')
            .populate('createdBy', 'name email');

        if (!order) {
            const error = new Error('Order niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Haal alle order items op
        const items = await OrderItem.find({ orderId: id })
            .populate('userId', 'name email profileImageUrl');

        res.json({
            success: true,
            order,
            items,
        });
    } catch (error) {
        next(error);
    }
};

export const closeOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndUpdate(
            id,
            { status: 'closed' },
            { new: true }
        ).populate('restaurantId');

        if (!order) {
            const error = new Error('Order niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Emit order closed event
        emitOrderClosed(io, id, order);

        // Maak notificaties voor alle deelnemers
        const items = await OrderItem.find({ orderId: id }).distinct('userId');

        const notifications = await Promise.all(
            items.map(userId =>
                Notification.create({
                    userId,
                    type: 'order_closed',
                    message: `De bestelling voor ${(order.restaurantId as any).name} is gesloten`,
                })
            )
        );

        // Stuur notificaties via Socket.IO
        notifications.forEach(notification => {
            emitNotification(io, String(notification.userId), notification);
        });

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        next(error);
    }
}; 