import { Router } from 'express';
import {
    getUser,
    updateUser,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    resetUserPassword
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Haal gebruiker op
 *     tags: [Users]
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
 *         description: Gebruiker data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Niet geauthenticeerd
 *       404:
 *         description: Gebruiker niet gevonden
 */
router.get('/:id', authenticate, getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update gebruiker profiel
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Gebruiker geupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Niet geauthenticeerd
 *       403:
 *         description: Geen rechten om deze gebruiker te wijzigen
 *       404:
 *         description: Gebruiker niet gevonden
 */
router.patch('/:id', authenticate, updateUser);

// Admin routes
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Haal alle gebruikers op (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter op actieve/inactieve gebruikers
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, employee]
 *         description: Filter op rol
 *     responses:
 *       200:
 *         description: Lijst van gebruikers
 *       403:
 *         description: Geen admin rechten
 */
router.get('/', authenticate, getAllUsers);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update gebruiker rol (Admin)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, employee]
 *     responses:
 *       200:
 *         description: Rol bijgewerkt
 *       403:
 *         description: Geen admin rechten
 */
router.patch('/:id/role', authenticate, updateUserRole);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Toggle gebruiker status (Admin)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status bijgewerkt
 *       403:
 *         description: Geen admin rechten
 */
router.patch('/:id/status', authenticate, toggleUserStatus);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset gebruiker wachtwoord (Admin)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Wachtwoord gereset
 *       403:
 *         description: Geen admin rechten
 */
router.post('/:id/reset-password', authenticate, resetUserPassword);

export default router; 