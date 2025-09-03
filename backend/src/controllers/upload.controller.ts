import { Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { cloudinary, uploadToCloudinary } from '../config/cloudinary.config';

export const uploadProfileImage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.file) {
            const error = new Error('Geen afbeelding geupload') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file, 'lunchmonkeys/profiles', {
            width: 500,
            height: 500,
            crop: 'limit'
        });

        // Verwijder oude profielfoto van Cloudinary
        if (req.user!.profileImageUrl) {
            const publicId = req.user!.profileImageUrl.split('/').pop()?.split('.')[0];
            if (publicId) {
                await cloudinary.uploader.destroy(`lunchmonkeys/profiles/${publicId}`);
            }
        }

        // Update gebruiker met nieuwe profielfoto
        const user = await User.findByIdAndUpdate(
            req.user!._id,
            { profileImageUrl: imageUrl },
            { new: true }
        ).select('-passwordHash');

        res.json({
            success: true,
            imageUrl,
            user,
        });
    } catch (error) {
        next(error);
    }
}; 