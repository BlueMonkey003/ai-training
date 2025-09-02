import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { generateToken } from '../utils/jwt.utils';
import { ApiError } from '../middleware/error.middleware';

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;

        // Check of gebruiker al bestaat
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email is al in gebruik') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Maak nieuwe gebruiker
        const user = await User.create({
            name,
            email,
            passwordHash: password, // wordt automatisch gehashed door pre-save hook
        });

        // Genereer token
        const token = generateToken(String(user._id));

        res.status(201).json({
            success: true,
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        // Vind gebruiker
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Ongeldige inloggegevens') as ApiError;
            error.statusCode = 401;
            throw error;
        }

        // Controleer wachtwoord
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const error = new Error('Ongeldige inloggegevens') as ApiError;
            error.statusCode = 401;
            throw error;
        }

        // Genereer token
        const token = generateToken(String(user._id));

        res.json({
            success: true,
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
) => {
    try {
        res.json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
}; 