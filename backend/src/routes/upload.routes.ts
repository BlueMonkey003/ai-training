import { Router } from 'express';
import { uploadProfileImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadProfile } from '../config/cloudinary.config';

const router = Router();

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