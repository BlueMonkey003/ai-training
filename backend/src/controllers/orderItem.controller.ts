import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { OrderItem } from '../models/OrderItem.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { io } from '../server';
import { emitOrderUpdate } from '../sockets/socketHandlers';

export const addOrderItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id: orderId } = req.params;
        const { itemName, notes, price, menuItemId } = req.body;

        // Check of order bestaat en open is
        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error('Order niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        if (order.status === 'closed') {
            const error = new Error('Order is al gesloten') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Toestaan van meerdere items per gebruiker per order: geen check meer op bestaand item

        let finalName = itemName;
        let finalPrice = price;

        // Als menuItemId is meegegeven, haal prijs/naam uit restaurant menu (snapshot)
        if (menuItemId) {
            const orderWithRestaurant = await Order.findById(orderId).populate('restaurantId');
            if (!orderWithRestaurant) {
                const error = new Error('Order niet gevonden') as ApiError;
                error.statusCode = 404;
                throw error;
            }
            const restaurant: any = orderWithRestaurant.restaurantId;
            const categories = restaurant?.menu?.categories || [];
            let found: any = null;
            for (const c of categories) {
                const match = (c.items || []).find((i: any) => i.id === menuItemId);
                if (match) { found = match; break; }
            }
            if (!found) {
                const error = new Error('Menu item niet gevonden') as ApiError;
                error.statusCode = 400;
                throw error;
            }
            // Gebruik client-berekende naam/prijs als die zijn meegegeven; anders val terug op menu snapshot
            const hasClientName = typeof itemName === 'string' && itemName.trim().length > 0;
            const hasClientPrice = typeof price === 'number' && !Number.isNaN(price);

            finalName = hasClientName ? itemName : found.name;
            finalPrice = hasClientPrice ? price : (typeof found.price === 'number' ? found.price : undefined);

            // Minimale validatie: prijs mag niet negatief zijn en niet onlogisch lager dan basisprijs
            if (typeof found.price === 'number' && typeof finalPrice === 'number' && finalPrice < found.price) {
                finalPrice = found.price;
            }
        }

        // Maak nieuw item
        const orderItem = await OrderItem.create({
            orderId,
            userId: req.user!._id,
            itemName: finalName,
            notes,
            price: finalPrice,
        });

        const populatedItem = await OrderItem.findById(orderItem._id)
            .populate('userId', 'name email profileImageUrl');

        // Emit order update event
        emitOrderUpdate(io, orderId, {
            type: 'item_added',
            item: populatedItem,
        });

        res.status(201).json({
            success: true,
            item: populatedItem,
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id: orderId, itemId } = req.params;
        const { itemName, notes, price } = req.body;

        // Check of order open is
        const order = await Order.findById(orderId);
        if (!order || order.status === 'closed') {
            const error = new Error('Order niet beschikbaar voor wijzigingen') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Update item - alleen eigenaar mag wijzigen
        const orderItem = await OrderItem.findOneAndUpdate(
            {
                _id: itemId,
                orderId,
                userId: req.user!._id,
            },
            { itemName, notes, price },
            { new: true, runValidators: true }
        ).populate('userId', 'name email profileImageUrl');

        if (!orderItem) {
            const error = new Error('Item niet gevonden of geen rechten') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Emit order update event
        emitOrderUpdate(io, orderId, {
            type: 'item_updated',
            item: orderItem,
        });

        res.json({
            success: true,
            item: orderItem,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteOrderItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id: orderId, itemId } = req.params;

        // Check of order open is
        const order = await Order.findById(orderId);
        if (!order || order.status === 'closed') {
            const error = new Error('Order niet beschikbaar voor wijzigingen') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Verwijder item - alleen eigenaar mag verwijderen
        const orderItem = await OrderItem.findOneAndDelete({
            _id: itemId,
            orderId,
            userId: req.user!._id,
        });

        if (!orderItem) {
            const error = new Error('Item niet gevonden of geen rechten') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Emit order update event
        emitOrderUpdate(io, orderId, {
            type: 'item_deleted',
            itemId,
            userId: req.user!._id,
        });

        res.json({
            success: true,
            message: 'Item verwijderd',
        });
    } catch (error) {
        next(error);
    }
}; 