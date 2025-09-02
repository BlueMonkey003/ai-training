import { Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export const getUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-passwordHash');

        if (!user) {
            const error = new Error('Gebruiker niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { name, password } = req.body;

        // Gebruiker mag alleen eigen profiel wijzigen (tenzij admin)
        if (String(req.user!._id) !== id && req.user!.role !== 'admin') {
            const error = new Error('Geen rechten om deze gebruiker te wijzigen') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (password) updateData.passwordHash = password; // wordt gehashed door pre-save hook

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!user) {
            const error = new Error('Gebruiker niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
}; 