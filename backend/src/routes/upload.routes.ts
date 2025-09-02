import { Router } from 'express';
import { uploadProfileImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = Router();

// Create multer upload middleware with Cloudinary storage
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary as any,
    params: async (req: any, file: any) => {
        return {
            folder: 'lunchmonkeys/profiles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
            public_id: `profile_${Date.now()}`,
        };
    },
} as any);

const uploadProfile = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

/**
 * @swagger
 * /api/upload/profile:
 *   post:
 *     summary: Upload profielfoto
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profielfoto geupload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imageUrl:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Geen afbeelding geupload
 *       401:
 *         description: Niet geauthenticeerd
 */
router.post('/profile', authenticate, uploadProfile.single('image'), uploadProfileImage);

export default router; 