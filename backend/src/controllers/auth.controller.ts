import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { generateToken } from '../utils/jwt.utils';
import { ApiError } from '../middleware/error.middleware';
import { generateTempPassword, sendPasswordResetEmail, sendPasswordChangedEmail, sendVerificationEmail } from '../services/email.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Wachtwoord complexiteit validatie
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Wachtwoord moet minimaal 8 karakters zijn');
    if (!/[A-Z]/.test(password)) errors.push('Wachtwoord moet minimaal 1 hoofdletter bevatten');
    if (!/[a-z]/.test(password)) errors.push('Wachtwoord moet minimaal 1 kleine letter bevatten');
    if (!/[0-9]/.test(password)) errors.push('Wachtwoord moet minimaal 1 cijfer bevatten');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Wachtwoord moet minimaal 1 speciaal teken bevatten');
    return { valid: errors.length === 0, errors };
};

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password, birthDate } = req.body;

        // Valideer wachtwoord complexiteit
        const pwValidation = validatePassword(password);
        if (!pwValidation.valid) {
            const error = new Error(pwValidation.errors.join(', ')) as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Check of email eindigt op @bluemonkeysit.nl
        const fullEmail = email.includes('@') ? email : `${email}@bluemonkeysit.nl`;
        if (!fullEmail.toLowerCase().endsWith('@bluemonkeysit.nl')) {
            const error = new Error('Alleen emailadressen met @bluemonkeysit.nl zijn toegestaan') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Check of gebruiker al bestaat
        const existingUser = await User.findOne({ email: fullEmail });
        if (existingUser) {
            const error = new Error('Email is al in gebruik') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Genereer verificatie token (24 uur geldig)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000);

        // Maak nieuwe gebruiker (emailVerified = false, isActive = true maar kan pas inloggen na verificatie)
        const user = await User.create({
            name,
            email: fullEmail,
            passwordHash: password,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
        });

        // Stuur verificatie email
        try {
            await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            // Als email faalt, verwijder gebruiker (rollback)
            await user.deleteOne();
            const error = new Error('Email kon niet worden verstuurd. Probeer het later opnieuw.') as ApiError;
            error.statusCode = 500;
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Account aangemaakt. Controleer je email om je account te activeren.',
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

        // Check email verificatie
        if (!user.emailVerified) {
            const error = new Error('Email nog niet geverifieerd. Controleer je inbox voor de activatielink.') as ApiError;
            error.statusCode = 403;
            throw error;
        }

        // Check of account actief is
        if (!user.isActive) {
            const error = new Error('Account is gedeactiveerd. Neem contact op met een beheerder.') as ApiError;
            error.statusCode = 403;
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

        // Trim tempPassword (spaties kunnen per ongeluk mee worden gekopieerd)
        const cleanTempPassword = (tempPassword || '').trim();

        // Vind gebruiker op basis van email OF temp password (temp password is uniek)
        let user = null;
        if (email) {
            user = await User.findOne({ email });
        } else {
            // Zoek via temp password als email ontbreekt
            const users = await User.find({
                resetPasswordExpires: { $gt: new Date() }
            });
            for (const u of users) {
                if (u.resetPasswordToken) {
                    const isMatch = await bcrypt.compare(cleanTempPassword, u.resetPasswordToken);
                    if (isMatch) {
                        user = u;
                        break;
                    }
                }
            }
        }

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

        // Vergelijk tijdelijk wachtwoord (gebruik cleaned versie)
        const isValidTemp = await bcrypt.compare(cleanTempPassword, user.resetPasswordToken);
        if (!isValidTemp) {
            const error = new Error('Ongeldig tijdelijk wachtwoord') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Update wachtwoord (emailVerified blijft onveranderd!)
        user.passwordHash = newPassword; // wordt gehashed door pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // BELANGRIJK: markeer emailVerified als niet-gewijzigd zodat Mongoose het niet reset
        user.markModified('passwordHash');
        user.markModified('resetPasswordToken');
        user.markModified('resetPasswordExpires');
        // emailVerified wordt NIET gemarkeerd als modified, dus blijft behouden
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

export const verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.params;

        // Vind gebruiker met deze token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            const error = new Error('Ongeldige of verlopen activatielink') as ApiError;
            error.statusCode = 400;
            throw error;
        }

        // Activeer gebruiker
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email succesvol geverifieerd! Je kunt nu inloggen.',
        });
    } catch (error) {
        next(error);
    }
}; 