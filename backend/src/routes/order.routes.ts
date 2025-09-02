import { Router } from 'express';
import {
    getOrders,
    createOrder,
    getOrderById,
    closeOrder
} from '../controllers/order.controller';
import {
    addOrderItem,
    updateOrderItem,
    deleteOrderItem
} from '../controllers/orderItem.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         restaurantId:
 *           $ref: '#/components/schemas/Restaurant'
 *         date:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         status:
 *           type: string
 *           enum: [open, closed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrderItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         orderId:
 *           type: string
 *         userId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             profileImageUrl:
 *               type: string
 *         itemName:
 *           type: string
 *         notes:
 *           type: string
 *         price:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Haal alle orders op
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lijst van orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Niet geauthenticeerd
 */
router.get('/', authenticate, getOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Maak nieuwe order (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *             properties:
 *               restaurantId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Order aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Er is al een open order voor vandaag
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen admin rechten
 */
router.post('/', authenticate, requireAdmin, createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Haal specifieke order op met items
 *     tags: [Orders]
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
 *         description: Order details met items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderItem'
 *       401:
 *         description: Niet geauthenticeerd
 *       404:
 *         description: Order niet gevonden
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @swagger
 * /api/orders/{id}:
 *   patch:
 *     summary: Sluit order (admin only)
 *     tags: [Orders]
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
 *         description: Order gesloten
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen admin rechten
 *       404:
 *         description: Order niet gevonden
 */
router.patch('/:id', authenticate, requireAdmin, closeOrder);

// Order items routes
router.post('/:id/items', authenticate, addOrderItem);
router.patch('/:id/items/:itemId', authenticate, updateOrderItem);
router.delete('/:id/items/:itemId', authenticate, deleteOrderItem);

export default router; 