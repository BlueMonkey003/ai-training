import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
dotenv.config({ path: envFile });

// Debug: Check if environment variables are loaded
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to create storage after config is loaded
const createProfileStorage = () => new CloudinaryStorage({
    cloudinary: cloudinary as any,
    params: async (req: any, file: any) => {
        return {
            folder: 'lunchmonkeys/profiles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
            public_id: `profile_${Date.now()}`,
        };
    },
} as any);

const createRestaurantStorage = () => new CloudinaryStorage({
    cloudinary: cloudinary as any,
    params: async (req: any, file: any) => {
        return {
            folder: 'lunchmonkeys/restaurants',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1200, height: 800, crop: 'limit' }],
            public_id: `restaurant_${Date.now()}`,
        };
    },
} as any);

export const uploadProfile = multer({
    storage: createProfileStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

export const uploadRestaurant = multer({
    storage: createRestaurantStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});

export { cloudinary }; 