import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
    name: string;
    imageUrl: string;
    websiteUrl: string;
    menuUrl?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
    {
        name: {
            type: String,
            required: [true, 'Restaurant naam is verplicht'],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, 'Restaurant afbeelding is verplicht'],
        },
        websiteUrl: {
            type: String,
            required: [true, 'Website URL is verplicht'],
            match: [/^https?:\/\/.+/, 'Geef een geldige URL op'],
        },
        menuUrl: {
            type: String,
            match: [/^https?:\/\/.+/, 'Geef een geldige URL op'],
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema); 