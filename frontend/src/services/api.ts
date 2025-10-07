import axios from 'axios';
import type { AuthResponse, User, Restaurant, Order, OrderItem, Notification } from '../../../shared/types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

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
    register: async (data: { name: string; email: string; password: string; birthDate?: string }) => {
        const response = await api.post<{ success: boolean; message: string }>('/auth/register', data);
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

    verifyEmail: async (token: string) => {
        const response = await api.get<{ success: boolean; message: string }>(`/auth/verify-email/${token}`);
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

    // Admin endpoints
    getAll: async (params?: { active?: boolean; role?: string }) => {
        const response = await api.get<{ success: boolean; users: User[] }>('/users', { params });
        return response.data;
    },

    updateRole: async (id: string, role: 'admin' | 'employee') => {
        const response = await api.patch<{ success: boolean; user: User }>(`/users/${id}/role`, { role });
        return response.data;
    },

    toggleStatus: async (id: string, isActive: boolean) => {
        const response = await api.patch<{ success: boolean; user: User }>(`/users/${id}/status`, { isActive });
        return response.data;
    },

    resetPassword: async (id: string, newPassword: string) => {
        const response = await api.post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { newPassword });
        return response.data;
    },
};

// Restaurant endpoints
export const restaurantApi = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; restaurants: Restaurant[] }>('/restaurants');
        return response.data;
    },
    getMenu: async (id: string) => {
        const response = await api.get<{ success: boolean; menu: any }>(`/restaurants/${id}/menu`);
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

    importMenu: async (id: string, payload: File | object) => {
        if (payload instanceof File) {
            const fd = new FormData();
            fd.append('file', payload);
            const response = await api.post<{ success: boolean; menu: any }>(`/restaurants/${id}/menu/import`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } else {
            const response = await api.post<{ success: boolean; menu: any }>(`/restaurants/${id}/menu/import`, payload);
            return response.data;
        }
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

// Receipts endpoints (admin)
export const receiptApi = {
    uploadForOrder: async (orderId: string, file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        const response = await api.post<{ success: boolean; receipt: any }>(`/orders/${orderId}/receipts`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    list: async (params?: { from?: string; to?: string; restaurantId?: string; userId?: string; orderId?: string; page?: number; pageSize?: number; includeTotals?: boolean }) => {
        const response = await api.get<{ success: boolean; receipts: any[]; total: number }>(`/receipts`, { params });
        return response.data;
    },
    summary: async (params?: { from?: string; to?: string }) => {
        const response = await api.get<{ success: boolean; summary: any }>(`/receipts/summary`, { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<{ success: boolean; receipt: any }>(`/receipts/${id}`);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete<{ success: boolean }>(`/receipts/${id}`);
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