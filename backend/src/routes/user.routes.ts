import { Router } from 'express';
import { getUser, updateUser } from '../controllers/user.controller';
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

export default router; 