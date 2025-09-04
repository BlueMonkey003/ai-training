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

// Admin only endpoints
export const getAllUsers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            const error = new Error('Geen rechten om gebruikers te bekijken') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        const { active, role } = req.query;
        const filter: any = {};

        if (active !== undefined) {
            filter.isActive = active === 'true';
        }
        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            const error = new Error('Geen rechten om rollen te wijzigen') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'employee'].includes(role)) {
            const error = new Error('Ongeldige rol') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Prevent admin from removing their own admin role
        if (String(req.user!._id) === id && role !== 'admin') {
            const error = new Error('Je kunt je eigen admin rechten niet verwijderen') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
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

export const toggleUserStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            const error = new Error('Geen rechten om gebruikersstatus te wijzigen') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        const { id } = req.params;
        const { isActive } = req.body;

        // Prevent admin from disabling their own account
        if (String(req.user!._id) === id && !isActive) {
            const error = new Error('Je kunt je eigen account niet deactiveren') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
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

export const resetUserPassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            const error = new Error('Geen rechten om wachtwoorden te resetten') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            const error = new Error('Wachtwoord moet minimaal 6 karakters zijn') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findById(id);
        if (!user) {
            const error = new Error('Gebruiker niet gevonden') as ApiError;
            error.statusCode = 404;
            throw error;
        }

        user.passwordHash = newPassword; // wordt gehashed door pre-save hook
        await user.save();

        res.json({
            success: true,
            message: 'Wachtwoord succesvol gereset',
        });
    } catch (error) {
        next(error);
    }
}; 