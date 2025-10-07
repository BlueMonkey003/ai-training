export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'employee' | 'admin';
    profileImageUrl?: string;
    birthDate?: string;
    isActive: boolean;
    emailVerified: boolean;
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
    // Optioneel: varianten (bijv. 15cm/30cm) die een prijsdelta toevoegen
    variants?: Array<{
        id: string;
        name: string;
        priceDelta: number;
    }>;
    // Optioneel: optiegroepen (single/multi) met opties die een prijsdelta kunnen toevoegen
    optionGroups?: Array<{
        id: string;
        name: string;
        type: 'single' | 'multi';
        required?: boolean;
        maxSelect?: number;
        appliesTo?: string;
        options: Array<{
            id: string;
            name: string;
            priceDelta: number;
            default?: boolean;
        }>;
    }>;
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