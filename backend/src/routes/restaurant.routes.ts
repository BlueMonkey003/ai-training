import { Router } from 'express';
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
} from '../controllers/restaurant.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = Router();

// Create multer upload middleware for restaurant images
const restaurantStorage = new CloudinaryStorage({
    cloudinary: cloudinary as any,
    params: async (req: any, file: any) => {
        return {
            folder: 'lunchmonkeys/restaurants',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1200, height: 800, crop: 'limit' }],
            public_id: `restaurant_${Date.now()}`,
        };
    },
} as any);

const uploadRestaurant = multer({
    storage: restaurantStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         imageUrl:
 *           type: string
 *         websiteUrl:
 *           type: string
 *         menuUrl:
 *           type: string
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Haal alle restaurants op
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: Lijst van restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 restaurants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 */
router.get('/', getRestaurants);

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Voeg nieuw restaurant toe (admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - websiteUrl
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               menuUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Restaurant toegevoegd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen admin rechten
 */
router.post('/', authenticate, requireAdmin, uploadRestaurant.single('image'), createRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   patch:
 *     summary: Update restaurant (admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               menuUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Restaurant geupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen admin rechten
 *       404:
 *         description: Restaurant niet gevonden
 */
router.patch('/:id', authenticate, requireAdmin, uploadRestaurant.single('image'), updateRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Verwijder restaurant (admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen admin rechten
 *       404:
 *         description: Restaurant niet gevonden
 */
router.delete('/:id', authenticate, requireAdmin, deleteRestaurant);

export default router; 