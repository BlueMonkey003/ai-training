import nodemailer from 'nodemailer';
import { IUser } from '../models/User.model';

// Email configuratie
const createTransporter = () => {
    // Voor development gebruik je meestal een test service zoals Mailtrap of Gmail
    // Voor productie gebruik je een echte email service (SendGrid, AWS SES, etc.)

    if (process.env.NODE_ENV === 'development') {
        // Development configuratie met Gmail
        // Zorg ervoor dat "Less secure app access" is ingeschakeld of gebruik een App Password
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    } else {
        // Productie configuratie
        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true', // true voor 465, false voor andere poorten
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

// Genereer een willekeurig tijdelijk wachtwoord
export const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Stuur wachtwoord reset email
export const sendPasswordResetEmail = async (user: IUser, tempPassword: string): Promise<void> => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"LunchMonkeys" <noreply@lunchmonkeys.nl>',
        to: user.email,
        subject: 'Wachtwoord reset - LunchMonkeys',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Wachtwoord Reset</h2>
                <p>Hallo ${user.name},</p>
                <p>Je hebt een nieuw wachtwoord aangevraagd voor je LunchMonkeys account.</p>
                <p>Je tijdelijke wachtwoord is:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <code style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</code>
                </div>
                <p><strong>Belangrijk:</strong></p>
                <ul>
                    <li>Dit wachtwoord is slechts 1 uur geldig</li>
                    <li>Log in met dit wachtwoord en wijzig het direct naar een nieuw wachtwoord</li>
                    <li>Als je geen wachtwoord reset hebt aangevraagd, neem dan contact op met de administrator</li>
                </ul>
                <p style="margin-top: 30px;">Met vriendelijke groet,<br>Het LunchMonkeys Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email kon niet worden verstuurd');
    }
};

// Stuur bevestigingsmail na succesvol wachtwoord wijzigen
export const sendPasswordChangedEmail = async (user: IUser): Promise<void> => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"LunchMonkeys" <noreply@lunchmonkeys.nl>',
        to: user.email,
        subject: 'Wachtwoord gewijzigd - LunchMonkeys',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Wachtwoord Succesvol Gewijzigd</h2>
                <p>Hallo ${user.name},</p>
                <p>Je wachtwoord is succesvol gewijzigd.</p>
                <p>Als je deze wijziging niet hebt aangevraagd, neem dan onmiddellijk contact op met de administrator.</p>
                <p style="margin-top: 30px;">Met vriendelijke groet,<br>Het LunchMonkeys Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password changed confirmation sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // We gooien hier geen error omdat het wachtwoord al succesvol is gewijzigd
    }
};
