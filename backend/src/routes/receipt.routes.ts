import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadReceipt } from '../config/cloudinary.config';
import { uploadReceiptForOrder, listReceipts, getReceiptsSummary, getReceiptDetail, deleteReceipt } from '../controllers/receipt.controller';
import { Response } from 'express';
import { Receipt } from '../models/Receipt.model';
import https from 'https';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: Beheer en upload van bonnetjes
 */

/**
 * @swagger
 * /api/orders/{orderId}/receipts:
 *   post:
 *     summary: Upload bonnetje voor gesloten order (admin)
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *     responses:
 *       201:
 *         description: Bonnetje geüpload
 */
router.post('/orders/:orderId/receipts', authenticate, requireAdmin, uploadReceipt.single('file'), uploadReceiptForOrder);

/**
 * @swagger
 * /api/receipts:
 *   get:
 *     summary: Lijst van bonnetjes
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Overzicht van bonnetjes
 */
router.get('/receipts', authenticate, requireAdmin, listReceipts);

/**
 * @swagger
 * /api/receipts/summary:
 *   get:
 *     summary: Samenvatting (totalen) van bonnetjes
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Samenvatting
 */
router.get('/receipts/summary', authenticate, requireAdmin, getReceiptsSummary);

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: Detail van bonnetje
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Verwijder bonnetje
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/receipts/:id', authenticate, requireAdmin, getReceiptDetail);
router.delete('/receipts/:id', authenticate, requireAdmin, deleteReceipt);

/**
 * @swagger
 * /api/receipts/{id}/download:
 *   get:
 *     summary: Download bonnetje als attachment
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/receipts/:id/download', authenticate, requireAdmin, async (req, res: Response) => {
    const { id } = req.params as any;
    const r = await Receipt.findById(id);
    if (!r) {
        return res.status(404).json({ success: false, error: 'Bonnetje niet gevonden' });
    }
    const filename = r.originalName || 'receipt';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', r.fileType || 'application/octet-stream');

    https.get(r.fileUrl, (fileRes) => {
        if (fileRes.statusCode && fileRes.statusCode >= 400) {
            res.status(fileRes.statusCode).end();
            return;
        }
        fileRes.pipe(res);
    }).on('error', () => {
        res.status(500).json({ success: false, error: 'Download mislukt' });
    });
});

/**
 * @swagger
 * /api/receipts/{id}/download-url:
 *   get:
 *     summary: Genereer download-URL (met attachment) voor bonnetje
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/receipts/:id/download-url', authenticate, requireAdmin, async (req, res: Response) => {
    const { id } = req.params as any;
    const r = await Receipt.findById(id);
    if (!r) {
        return res.status(404).json({ success: false, error: 'Bonnetje niet gevonden' });
    }
    const separator = r.fileUrl.includes('?') ? '&' : '?';
    const downloadName = encodeURIComponent(r.originalName || 'receipt');
    const url = `${r.fileUrl}${separator}fl_attachment=${downloadName}`;
    res.json({ success: true, url });
});

export default router;


