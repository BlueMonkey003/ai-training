import nodemailer from 'nodemailer';
import { IUser } from '../models/User.model';
import path from 'path';
import fs from 'fs';

// Email configuratie
const createTransporter = () => {
    // Voor development gebruik je meestal een test service zoals Mailtrap of Gmail
    // Voor productie gebruik je een echte email service (SendGrid, AWS SES, etc.)

    if (process.env.NODE_ENV === 'development') {
        // Development configuratie met Gmail
        // Zorg ervoor dat "Less secure app access" is ingeschakeld of gebruik een App Password
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    } else {
        // Productie configuratie
        return nodemailer.createTransport({
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
    const logoPath = path.join(__dirname, '../../images/bluemonkeys-logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"LunchMonkeys" <noreply@lunchmonkeys.nl>',
        to: user.email,
        subject: '🔑 Wachtwoord reset - LunchMonkeys',
        attachments: logoExists ? [{
            filename: 'bluemonkeys-logo.png',
            path: logoPath,
            cid: 'bluemonkeys_logo'
        }] : [],
        html: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    <!-- Header met logo -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 40px 20px; border-bottom: 3px solid #1AB0D2;">
                            <img src="cid:bluemonkeys_logo" alt="BlueMonkeys" width="250" style="display: block; max-width: 250px; height: auto; margin: 0 auto;" />
                        </td>
                    </tr>
                    
                    <!-- Titel -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px;">
                            <h1 style="margin: 0; color: #333333; font-size: 28px; font-family: Arial, sans-serif; font-weight: bold;">Wachtwoord Reset</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px; font-family: Arial, sans-serif; color: #333333;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
                                Hallo <strong>${user.name}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.5;">
                                Je hebt een wachtwoord reset aangevraagd voor je LunchMonkeys account. Gebruik onderstaand tijdelijk wachtwoord:
                            </p>
                            
                            <!-- Tijdelijk wachtwoord box -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td align="center" bgcolor="#1AB0D2" style="padding: 20px; border-radius: 6px;">
                                        <p style="margin: 0 0 5px; font-size: 12px; color: #ffffff; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                                            Tijdelijk Wachtwoord
                                        </p>
                                        <code style="font-size: 24px; font-weight: bold; color: #ffffff; font-family: monospace, Courier; letter-spacing: 3px;">
                                            ${tempPassword}
                                        </code>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Instructies -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td bgcolor="#fef3c7" style="padding: 15px; border-radius: 6px; border: 1px solid #fbbf24;">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #92400e; font-family: Arial, sans-serif;">
                                            <strong>⏰ Belangrijk:</strong>
                                        </p>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e; font-family: Arial, sans-serif;">
                                            <li>Dit wachtwoord is slechts 1 uur geldig</li>
                                            <li>Gebruik dit wachtwoord om een nieuw wachtwoord in te stellen</li>
                                            <li>Je hoeft geen emailadres in te vullen, alleen dit wachtwoord</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.5; color: #666666; font-family: Arial, sans-serif;">
                                Als je geen wachtwoord reset hebt aangevraagd, neem dan contact op met een administrator.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 30px 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 5px; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                                Met vriendelijke groet,<br><strong>Het LunchMonkeys Team</strong>
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif;">
                                BlueMonkeys IT &copy; ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
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
    const logoPath = path.join(__dirname, '../../images/bluemonkeys-logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"LunchMonkeys" <noreply@lunchmonkeys.nl>',
        to: user.email,
        subject: '✅ Wachtwoord gewijzigd - LunchMonkeys',
        attachments: logoExists ? [{
            filename: 'bluemonkeys-logo.png',
            path: logoPath,
            cid: 'bluemonkeys_logo'
        }] : [],
        html: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    <!-- Header met logo -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 40px 20px; border-bottom: 3px solid #1AB0D2;">
                            <img src="cid:bluemonkeys_logo" alt="BlueMonkeys" width="250" style="display: block; max-width: 250px; height: auto; margin: 0 auto;" />
                        </td>
                    </tr>
                    
                    <!-- Titel -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px;">
                            <h1 style="margin: 0; color: #333333; font-size: 28px; font-family: Arial, sans-serif; font-weight: bold;">Wachtwoord Gewijzigd</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px; font-family: Arial, sans-serif; color: #333333;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
                                Hallo <strong>${user.name}</strong>,
                            </p>
                            
                            <!-- Success box -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td align="center" bgcolor="#d1fae5" style="padding: 20px; border-radius: 6px; border: 1px solid #10b981;">
                                        <p style="margin: 0; font-size: 18px; color: #065f46; font-family: Arial, sans-serif; font-weight: bold;">
                                            ✅ Je wachtwoord is succesvol gewijzigd!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0; font-size: 16px; line-height: 1.5;">
                                Je kunt nu inloggen met je nieuwe wachtwoord.
                            </p>
                            
                            <!-- Waarschuwing -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td bgcolor="#fee2e2" style="padding: 15px; border-radius: 6px; border: 1px solid #ef4444;">
                                        <p style="margin: 0; font-size: 14px; color: #991b1b; font-family: Arial, sans-serif;">
                                            <strong>⚠️ Belangrijk:</strong> Als je deze wijziging NIET hebt aangevraagd, neem dan onmiddellijk contact op met een administrator.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 30px 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 5px; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                                Met vriendelijke groet,<br><strong>Het LunchMonkeys Team</strong>
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif;">
                                BlueMonkeys IT &copy; ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
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

// Stuur email verificatie link
export const sendVerificationEmail = async (user: IUser, token: string): Promise<void> => {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

    // Lees logo bestand
    const logoPath = path.join(__dirname, '../../images/bluemonkeys-logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"LunchMonkeys" <noreply@lunchmonkeys.nl>',
        to: user.email,
        subject: '🍽️ Activeer je LunchMonkeys account',
        attachments: logoExists ? [{
            filename: 'bluemonkeys-logo.png',
            path: logoPath,
            cid: 'bluemonkeys_logo'
        }] : [],
        html: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
        }
        :root { color-scheme: light dark; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main container -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    <!-- Header met logo -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 40px 20px; border-bottom: 3px solid #1AB0D2;">
                            <img src="cid:bluemonkeys_logo" alt="BlueMonkeys" width="250" style="display: block; max-width: 250px; height: auto; margin: 0 auto;" />
                        </td>
                    </tr>
                    
                    <!-- Welkom tekst -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 20px;">
                            <h1 style="margin: 0; color: #333333; font-size: 28px; font-family: Arial, sans-serif; font-weight: bold;">Welkom bij LunchMonkeys!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="mobile-padding" style="padding: 40px; font-family: Arial, sans-serif; color: #333333;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
                                Hallo <strong>${user.name}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.5;">
                                Bedankt voor je registratie bij LunchMonkeys! Klik op de knop hieronder om je account te activeren:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 25px 0;">
                                        <a href="${verificationUrl}" style="display: inline-block; background-color: #1AB0D2; color: #ffffff; font-size: 18px; font-family: Arial, sans-serif; font-weight: bold; text-decoration: none; padding: 15px 40px; border-radius: 6px; mso-padding-alt: 0; text-align: center;">
                                            <!--[if mso]>
                                            <i style="mso-font-width: 400%; mso-text-raise: 30pt;">&nbsp;</i>
                                            <![endif]-->
                                            <span style="mso-text-raise: 15pt;">✅ Activeer Account</span>
                                            <!--[if mso]>
                                            <i style="mso-font-width: 400%;">&nbsp;</i>
                                            <![endif]-->
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Fallback -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #1AB0D2;">
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                                            <strong>Werkt de knop niet?</strong>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #666666; font-family: monospace, Courier; word-break: break-all;">
                                            ${verificationUrl}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Warning -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td bgcolor="#fef3c7" style="padding: 15px; border-radius: 6px; border: 1px solid #fbbf24;">
                                        <p style="margin: 0; font-size: 14px; color: #92400e; font-family: Arial, sans-serif;">
                                            <strong>⏰ Let op:</strong> Deze link is 24 uur geldig.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 25px 0 0; font-size: 14px; line-height: 1.5; color: #666666; font-family: Arial, sans-serif;">
                                Als je dit account niet hebt aangemaakt, kun je deze email negeren.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" bgcolor="#f9fafb" style="padding: 30px 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 5px; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                                Met vriendelijke groet,<br><strong>Het LunchMonkeys Team</strong>
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif;">
                                BlueMonkeys IT &copy; ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Verificatie email kon niet worden verstuurd');
    }
};
