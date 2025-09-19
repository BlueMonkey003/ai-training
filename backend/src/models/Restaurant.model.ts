import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
    name: string;
    imageUrl: string;
    websiteUrl: string;
    menuUrl?: string;
    menu?: {
        categories: Array<{
            id: string;
            name: string;
            items: Array<{
                id: string;
                name: string;
                description?: string;
                price: number;
            }>;
        }>;
        currency?: string;
    };
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
        menu: {
            categories: [
                {
                    id: { type: String, required: true, trim: true },
                    name: { type: String, required: true, trim: true },
                    items: [
                        {
                            id: { type: String, required: true, trim: true },
                            name: { type: String, required: true, trim: true },
                            description: { type: String, default: null },
                            price: { type: Number, required: true, min: 0 },
                        },
                    ],
                },
            ],
            currency: { type: String, default: 'EUR' },
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