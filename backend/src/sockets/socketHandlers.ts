import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

interface SocketWithUser extends Socket {
    userId?: string;
}

export const setupSocketHandlers = (io: Server) => {
    // Authenticatie middleware voor Socket.IO
    io.use(async (socket: SocketWithUser, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authenticatie vereist'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error('Gebruiker niet gevonden'));
            }

            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Ongeldige token'));
        }
    });

    io.on('connection', (socket: SocketWithUser) => {
        console.log(`Gebruiker ${socket.userId} verbonden`);

        // Join persoonlijke room voor gebruiker-specifieke events
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Join order room wanneer gebruiker een order bekijkt
        socket.on('join:order', (orderId: string) => {
            socket.join(`order:${orderId}`);
            console.log(`Gebruiker ${socket.userId} joined order ${orderId}`);
        });

        // Leave order room
        socket.on('leave:order', (orderId: string) => {
            socket.leave(`order:${orderId}`);
            console.log(`Gebruiker ${socket.userId} left order ${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Gebruiker ${socket.userId} disconnected`);
        });
    });
};

// Helper functies voor het verzenden van events
export const emitOrderUpdate = (io: Server, orderId: string, data: any) => {
    io.to(`order:${orderId}`).emit('order:update', data);
};

export const emitOrderClosed = (io: Server, orderId: string, data: any) => {
    io.to(`order:${orderId}`).emit('order:closed', data);
};

export const emitNewOrder = (io: Server, data: any) => {
    io.emit('order:new', data);
};

export const emitNotification = (io: Server, userId: string, notification: any) => {
    io.to(`user:${userId}`).emit('notification:new', notification);
}; 