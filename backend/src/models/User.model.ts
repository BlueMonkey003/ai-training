import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'employee' | 'admin';
    profileImageUrl?: string;
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

// Verwijder wachtwoord uit JSON response
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

export const User = mongoose.model<IUser>('User', userSchema); 