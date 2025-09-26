import { Router } from 'express';
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    importRestaurantMenu,
    getRestaurantMenu,
} from '../controllers/restaurant.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadRestaurant } from '../config/cloudinary.config';
import multer from 'multer';

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

/**
 * @swagger
 * /api/restaurants/{id}/menu:
 *   get:
 *     summary: Haal het embedded menu van een restaurant op
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 menu:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 variants:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id: { type: string }
 *                                       name: { type: string }
 *                                       priceDelta: { type: number }
 *                                 optionGroups:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id: { type: string }
 *                                       name: { type: string }
 *                                       type: { type: string, enum: [single, multi] }
 *                                       required: { type: boolean }
 *                                       maxSelect: { type: number }
 *                                       options:
 *                                         type: array
 *                                         items:
 *                                           type: object
 *                                           properties:
 *                                             id: { type: string }
 *                                             name: { type: string }
 *                                             priceDelta: { type: number }
 */
router.get('/:id/menu', getRestaurantMenu);

/**
 * @swagger
 * /api/restaurants/{id}/menu/import:
 *   post:
 *     summary: Importeer menukaart (XML of JSON) en vervang bestaande menu
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Menu geïmporteerd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 menu:
 *                   type: object
 */
router.post('/:id/menu/import', authenticate, requireAdmin, multer({ limits: { fileSize: 1 * 1024 * 1024 } }).single('file'), importRestaurantMenu);

export default router;