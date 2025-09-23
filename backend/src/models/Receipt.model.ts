import mongoose, { Schema, Document } from 'mongoose';

export interface IReceipt extends Document {
    orderId: Schema.Types.ObjectId;
    restaurantId: Schema.Types.ObjectId;
    uploadedBy: Schema.Types.ObjectId;
    fileUrl: string;
    fileType: string;
    originalName?: string;
    rating?: number;
    amount?: number;
    currency?: string;
    receiptDate?: Date;
    notes?: string;
    extractedData?: any;
    createdAt: Date;
    updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
        restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        amount: { type: Number },
        currency: { type: String, default: 'EUR' },
        receiptDate: { type: Date },
        notes: { type: String },
        extractedData: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Eén bonnetje per order (huidige eis)
receiptSchema.index({ orderId: 1 }, { unique: true });
receiptSchema.index({ restaurantId: 1, createdAt: -1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', receiptSchema);


