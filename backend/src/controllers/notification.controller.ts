import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export const getNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { unread } = req.query;
        const filter: any = { userId: req.user!._id };

        if (unread === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .sort('-createdAt')
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user!._id,
            read: false,
        });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications,
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user!._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            const error = new Error('Notificatie niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            notification,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user!._id, read: false },
            { read: true }
        );

        res.json({
            success: true,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        next(error);
    }
}; 