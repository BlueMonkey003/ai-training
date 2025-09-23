import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'order_reminder' | 'order_closed' | 'new_item' | 'receipt_uploaded';
    message: string;
    read: boolean;
    orderId?: mongoose.Types.ObjectId;
    restaurantId?: mongoose.Types.ObjectId;
    receiptId?: mongoose.Types.ObjectId;
    route?: string;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Gebruiker is verplicht'],
        },
        type: {
            type: String,
            enum: ['order_reminder', 'order_closed', 'new_item', 'receipt_uploaded'],
            required: [true, 'Notificatie type is verplicht'],
        },
        message: {
            type: String,
            required: [true, 'Bericht is verplicht'],
        },
        read: {
            type: Boolean,
            default: false,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            default: null,
        },
        receiptId: {
            type: Schema.Types.ObjectId,
            ref: 'Receipt',
            default: null,
        },
        route: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index voor het vinden van ongelezen notificaties per gebruiker
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 