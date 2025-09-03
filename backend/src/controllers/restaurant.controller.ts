import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../models/Restaurant.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { cloudinary, uploadToCloudinary } from '../config/cloudinary.config';

export const getRestaurants = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const restaurants = await Restaurant.find()
            .populate('createdBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    } catch (error) {
        next(error);
    }
};

export const createRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, websiteUrl, menuUrl } = req.body;

        if (!req.file) {
            const error = new Error('Restaurant afbeelding is verplicht') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Upload image to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/restaurants', {
            width: 1200,
            height: 800,
            crop: 'limit'
        });

        const restaurant = await Restaurant.create({
            name,
            imageUrl,
            websiteUrl,
            menuUrl,
            createdBy: req.user!._id,
        });

        res.status(201).json({
            success: true,
            restaurant,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const updateData: any = { ...req.body };

        // Als er een nieuwe afbeelding is geupload
        if (req.file) {
            // Upload nieuwe afbeelding
            updateData.imageUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/restaurants', {
                width: 1200,
                height: 800,
                crop: 'limit'
            });

            // Verwijder oude afbeelding van Cloudinary
            const restaurant = await Restaurant.findById(id);
            if (restaurant && restaurant.imageUrl) {
                const publicId = restaurant.imageUrl.split('/').pop()?.split('.')[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(`lunchmonkeys/restaurants/${publicId}`);
                }
            }
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            restaurant,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            const error = new Error('Restaurant niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        // Verwijder afbeelding van Cloudinary
        if (restaurant.imageUrl) {
            const publicId = restaurant.imageUrl.split('/').pop()?.split('.')[0];
            if (publicId) {
                await cloudinary.uploader.destroy(`lunchmonkeys/restaurants/${publicId}`);
            }
        }

        await restaurant.deleteOne();

        res.json({
            success: true,
            message: 'Restaurant verwijderd',
        });
    } catch (error) {
        next(error);
    }
}; 