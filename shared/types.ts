export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'employee' | 'admin';
    profileImageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Restaurant {
    _id: string;
    name: string;
    imageUrl: string;
    websiteUrl: string;
    menuUrl?: string;
    menu?: RestaurantMenu;
    createdBy: string | User;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    _id: string;
    restaurantId: string | Restaurant;
    date: string;
    createdBy: string | User;
    status: 'open' | 'closed';
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    _id: string;
    orderId: string;
    userId: string | User;
    itemName: string;
    notes?: string;
    price?: number;
    createdAt: string;
    updatedAt: string;
}

export interface RestaurantMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
}

export interface RestaurantMenuCategory {
    id: string;
    name: string;
    items: RestaurantMenuItem[];
}

export interface RestaurantMenu {
    categories: RestaurantMenuCategory[];
}

export interface Notification {
    _id: string;
    userId: string;
    type: 'order_reminder' | 'order_closed' | 'new_item' | 'receipt_uploaded';
    message: string;
    read: boolean;
    orderId?: string;
    restaurantId?: string;
    receiptId?: string;
    route?: string;
    createdAt: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
} 