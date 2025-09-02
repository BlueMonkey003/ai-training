import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
    restaurantId: mongoose.Types.ObjectId;
    date: Date;
    createdBy: mongoose.Types.ObjectId;
    status: 'open' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, 'Restaurant is verplicht'],
        },
        date: {
            type: Date,
            required: [true, 'Datum is verplicht'],
            default: Date.now,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
        },
    },
    {
        timestamps: true,
    }
);

// Index voor het vinden van orders per datum
orderSchema.index({ date: -1 });
orderSchema.index({ status: 1, date: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema); 