import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running and database is connected
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-09T10:00:00.000Z"
 *                 service:
 *                   type: string
 *                   example: lunchmonkeys-backend
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: production
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     name:
 *                       type: string
 *                       example: lunchmonkeys-prod
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 error:
 *                   type: string
 *                   example: Database connection failed
 */
export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const dbName = mongoose.connection.db?.databaseName || 'unknown';

        // Get version info
        let versionInfo;
        try {
            versionInfo = require('../../../version.json');
        } catch {
            // Fallback to package.json if version.json doesn't exist
            const packageJson = require('../../package.json');
            versionInfo = {
                version: packageJson.version || '1.0.0',
                buildNumber: 0
            };
        }

        // Determine if we're healthy
        const isHealthy = dbStatus === 'connected';

        const healthStatus = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'lunchmonkeys-backend',
            version: versionInfo.version,
            buildNumber: versionInfo.buildNumber,
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                name: dbName
            }
        };

        // Return appropriate status code
        res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
