import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem extends Document {
    orderId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    itemName: string;
    notes?: string;
    price?: number;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Order is verplicht'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Gebruiker is verplicht'],
        },
        itemName: {
            type: String,
            required: [true, 'Item naam is verplicht'],
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        price: {
            type: Number,
            min: [0, 'Prijs kan niet negatief zijn'],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index voor het vinden van items per order en gebruiker
orderItemSchema.index({ orderId: 1, userId: 1 });

export const OrderItem = mongoose.model<IOrderItem>('OrderItem', orderItemSchema); 