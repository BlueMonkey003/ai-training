import { io, Socket } from 'socket.io-client';
import type { Order, OrderItem, Notification } from '../../../shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string) {
        if (this.socket?.connected) return;

        this.socket = io(API_URL, {
            auth: {
                token,
            },
        });

        this.socket.on('connect', () => {
            console.log('Socket verbonden');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket verbroken');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connectie fout:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinOrder(orderId: string) {
        this.socket?.emit('join:order', orderId);
    }

    leaveOrder(orderId: string) {
        this.socket?.emit('leave:order', orderId);
    }

    onNewOrder(callback: (order: Order) => void) {
        this.socket?.on('order:new', callback);
    }

    onOrderUpdate(callback: (data: { type: string; item?: OrderItem; itemId?: string }) => void) {
        this.socket?.on('order:update', callback);
    }

    onOrderClosed(callback: (order: Order) => void) {
        this.socket?.on('order:closed', callback);
    }

    onNotification(callback: (notification: Notification) => void) {
        this.socket?.on('notification:new', callback);
    }

    removeAllListeners() {
        this.socket?.removeAllListeners();
    }
}

export default new SocketService(); 