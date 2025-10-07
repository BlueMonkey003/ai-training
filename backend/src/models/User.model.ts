import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'employee' | 'admin';
    profileImageUrl?: string;
    birthDate?: Date;
    isActive: boolean;
    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Naam is verplicht'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is verplicht'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Geef een geldig emailadres op'],
            validate: {
                validator: function (email: string) {
                    return email.toLowerCase().endsWith('@bluemonkeysit.nl');
                },
                message: 'Alleen emailadressen met @bluemonkeysit.nl zijn toegestaan'
            }
        },
        passwordHash: {
            type: String,
            required: [true, 'Wachtwoord is verplicht'],
        },
        role: {
            type: String,
            enum: ['employee', 'admin'],
            default: 'employee',
        },
        profileImageUrl: {
            type: String,
            default: null,
        },
        birthDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            default: null,
        },
        emailVerificationExpires: {
            type: Date,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Wachtwoord hashen voor opslaan
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Wachtwoord vergelijken
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Verwijder gevoelige velden uit JSON response
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.emailVerificationToken;
    delete obj.emailVerificationExpires;
    return obj;
};

export const User = mongoose.model<IUser>('User', userSchema); 