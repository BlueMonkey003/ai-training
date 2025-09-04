import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Set default NODE_ENV if not specified
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

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

// Memory storage for multer - we'll upload to Cloudinary in the controller
const storage = multer.memoryStorage();

export const uploadProfile = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedFormats.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format. Only JPG, JPEG, PNG and WEBP are allowed.'));
        }
    },
});

export const uploadRestaurant = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedFormats.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format. Only JPG, JPEG, PNG and WEBP are allowed.'));
        }
    },
});

// Helper function to upload to Cloudinary
export const uploadToCloudinary = async (
    file: Express.Multer.File,
    folder: string,
    options?: {
        width?: number;
        height?: number;
        crop?: string;
    }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            folder: folder,
            resource_type: 'image',
            public_id: `${path.parse(file.originalname).name}_${Date.now()}`,
        };

        if (options) {
            uploadOptions.transformation = [options];
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result!.secure_url);
                }
            }
        );

        uploadStream.end(file.buffer);
    });
};

export { cloudinary };