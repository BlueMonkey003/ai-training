import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { generateToken } from '../utils/jwt.utils';
import { ApiError } from '../middleware/error.middleware';
import { generateTempPassword, sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/email.service';
import bcrypt from 'bcrypt';
import { validatePasswordComplexity, isPasswordPwned } from '../utils/passwordPolicy';

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;

        // Check of email eindigt op @bluemonkeysit.nl
        if (!email.toLowerCase().endsWith('@bluemonkeysit.nl')) {
            const error = new Error('Alleen emailadressen met @bluemonkeysit.nl zijn toegestaan') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Check of gebruiker al bestaat
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email is al in gebruik') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Wachtwoordbeleid afdwingen
        const complexity = validatePasswordComplexity(password, name, email);
        if (!complexity.ok) {
            const error = new Error(complexity.message || 'Ongeldig wachtwoord') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // HIBP breach check (k-anonim)
        const pwned = await isPasswordPwned(password);
        if (pwned) {
            const error = new Error('Dit wachtwoord is bekend uit datalekken, kies een ander wachtwoord') as ApiError;
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

export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        // Vind gebruiker op basis van email
        const user = await User.findOne({ email });
        if (!user) {
            // Om security redenen geven we altijd dezelfde response
            // zodat aanvallers niet kunnen achterhalen welke emails bestaan
            res.json({
                success: true,
                message: 'Als het emailadres bestaat, is er een reset email verstuurd',
            });
            return;
        }

        // Genereer tijdelijk wachtwoord
        const tempPassword = generateTempPassword();

        // Hash het tijdelijke wachtwoord
        const salt = await bcrypt.genSalt(10);
        const hashedTempPassword = await bcrypt.hash(tempPassword, salt);

        // Sla het gehashte tijdelijke wachtwoord op met vervaltijd (1 uur)
        user.resetPasswordToken = hashedTempPassword;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 uur
        await user.save();

        // Stuur email met tijdelijk wachtwoord
        try {
            await sendPasswordResetEmail(user, tempPassword);
        } catch (emailError) {
            // Als email fout gaat, reset de token
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            const error = new Error('Email kon niet worden verstuurd. Probeer het later opnieuw.') as ApiError;
            error.statusCode = 500;
            throw error;
        }

        res.json({
            success: true,
            message: 'Als het emailadres bestaat, is er een reset email verstuurd',
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, tempPassword, newPassword } = req.body;

        // Vind gebruiker
        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            const error = new Error('Ongeldig of verlopen reset token') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Check of token niet verlopen is
        if (user.resetPasswordExpires < new Date()) {
            const error = new Error('Reset token is verlopen') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Vergelijk tijdelijk wachtwoord
        const isValidTemp = await bcrypt.compare(tempPassword, user.resetPasswordToken);
        if (!isValidTemp) {
            const error = new Error('Ongeldig tijdelijk wachtwoord') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Wachtwoordbeleid afdwingen
        const complexity = validatePasswordComplexity(newPassword, undefined, email);
        if (!complexity.ok) {
            const error = new Error(complexity.message || 'Ongeldig wachtwoord') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // HIBP breach check
        const pwned = await isPasswordPwned(newPassword);
        if (pwned) {
            const error = new Error('Dit wachtwoord is bekend uit datalekken, kies een ander wachtwoord') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Update wachtwoord
        user.passwordHash = newPassword; // wordt gehashed door pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Stuur bevestigingsmail
        try {
            await sendPasswordChangedEmail(user);
        } catch (emailError) {
            // Log de error maar ga door, wachtwoord is al gewijzigd
            console.error('Could not send confirmation email:', emailError);
        }

        // Genereer nieuwe login token
        const token = generateToken(String(user._id));

        res.json({
            success: true,
            message: 'Wachtwoord succesvol gewijzigd',
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
}; 