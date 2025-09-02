import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface ApiError extends Error {
    statusCode?: number;
    errors?: any;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource niet gevonden';
        error = new Error(message) as ApiError;
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if ((err as any).code === 11000) {
        const message = 'Duplicate veld waarde ingevoerd';
        error = new Error(message) as ApiError;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const mongooseError = err as mongoose.Error.ValidationError;
        const message = Object.values(mongooseError.errors)
            .map(val => val.message)
            .join(', ');
        error = new Error(message) as ApiError;
        error.statusCode = 400;
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
}; 