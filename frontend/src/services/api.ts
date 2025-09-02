import axios from 'axios';
import type { AuthResponse, User, Restaurant, Order, OrderItem, Notification } from '../../../shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Voeg auth token toe aan requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth endpoints
export const authApi = {
    register: async (data: { name: string; email: string; password: string }) => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: { email: string; password: string }) => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    getMe: async () => {
        const response = await api.get<{ success: boolean; user: User }>('/auth/me');
        return response.data;
    },
};

// User endpoints
export const userApi = {
    getUser: async (id: string) => {
        const response = await api.get<{ success: boolean; user: User }>(`/users/${id}`);
        return response.data;
    },

    updateUser: async (id: string, data: { name?: string; password?: string }) => {
        const response = await api.patch<{ success: boolean; user: User }>(`/users/${id}`, data);
        return response.data;
    },
};

// Restaurant endpoints
export const restaurantApi = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; restaurants: Restaurant[] }>('/restaurants');
        return response.data;
    },

    create: async (data: FormData) => {
        const response = await api.post<{ success: boolean; restaurant: Restaurant }>('/restaurants', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    update: async (id: string, data: FormData) => {
        const response = await api.patch<{ success: boolean; restaurant: Restaurant }>(`/restaurants/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<{ success: boolean }>(`/restaurants/${id}`);
        return response.data;
    },
};

// Order endpoints
export const orderApi = {
    getAll: async (params?: { status?: string; date?: string }) => {
        const response = await api.get<{ success: boolean; orders: Order[] }>('/orders', { params });
        return response.data;
    },

    create: async (data: { restaurantId: string; date?: string }) => {
        const response = await api.post<{ success: boolean; order: Order }>('/orders', data);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<{ success: boolean; order: Order; items: OrderItem[] }>(`/orders/${id}`);
        return response.data;
    },

    close: async (id: string) => {
        const response = await api.patch<{ success: boolean; order: Order }>(`/orders/${id}`);
        return response.data;
    },

    // Order items
    addItem: async (orderId: string, data: { itemName: string; notes?: string; price?: number }) => {
        const response = await api.post<{ success: boolean; item: OrderItem }>(`/orders/${orderId}/items`, data);
        return response.data;
    },

    updateItem: async (orderId: string, itemId: string, data: { itemName?: string; notes?: string; price?: number }) => {
        const response = await api.patch<{ success: boolean; item: OrderItem }>(`/orders/${orderId}/items/${itemId}`, data);
        return response.data;
    },

    deleteItem: async (orderId: string, itemId: string) => {
        const response = await api.delete<{ success: boolean }>(`/orders/${orderId}/items/${itemId}`);
        return response.data;
    },
};

// Notification endpoints
export const notificationApi = {
    getAll: async (unread?: boolean) => {
        const response = await api.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>('/notifications', {
            params: { unread },
        });
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch<{ success: boolean; notification: Notification }>(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch<{ success: boolean; modifiedCount: number }>('/notifications/read-all');
        return response.data;
    },
};

// Upload endpoints
export const uploadApi = {
    uploadProfileImage: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post<{ success: boolean; imageUrl: string; user: User }>('/upload/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

export default api; 