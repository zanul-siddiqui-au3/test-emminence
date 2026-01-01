const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet and transaction management
 */

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get current wallet balance
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
router.get('/balance', authMiddleware, walletController.getBalance);

/**
 * @swagger
 * /api/wallet/credit:
 *   post:
 *     summary: Credit balance to direct child user
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balance credited successfully
 */
router.post('/credit', authMiddleware, walletController.creditToChild);

/**
 * @swagger
 * /api/wallet/recharge:
 *   post:
 *     summary: Recharge wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet recharged successfully
 */
router.post('/recharge', authMiddleware, checkRole('admin'), walletController.rechargeWallet);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', authMiddleware, walletController.getTransactions);

/**
 * @swagger
 * /api/wallet/summary:
 *   get:
 *     summary: Get balance summary (own + downline)
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Balance summary retrieved
 */
router.get('/summary', authMiddleware, walletController.getBalanceSummary);

module.exports = router;