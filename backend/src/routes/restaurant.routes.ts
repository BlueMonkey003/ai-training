import { Router } from 'express';
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant
} from '../controllers/restaurant.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadRestaurant } from '../config/cloudinary.config';

const router = Router();

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
 *         updatedAt:
 *           type: string
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
 */
router.get('/', getRestaurants);

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Maak nieuw restaurant (Admin only)
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
 *               - image
 *               - websiteUrl
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               websiteUrl:
 *                 type: string
 *               menuUrl:
 *                 type: string
 */
router.post('/', authenticate, requireAdmin, uploadRestaurant.single('image'), createRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   patch:
 *     summary: Update restaurant (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id', authenticate, requireAdmin, uploadRestaurant.single('image'), updateRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Verwijder restaurant (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', authenticate, requireAdmin, deleteRestaurant);

export default router;