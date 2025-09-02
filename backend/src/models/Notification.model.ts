import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'order_reminder' | 'order_closed' | 'new_item';
    message: string;
    read: boolean;
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
            enum: ['order_reminder', 'order_closed', 'new_item'],
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
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index voor het vinden van ongelezen notificaties per gebruiker
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 