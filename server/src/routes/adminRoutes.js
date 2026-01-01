const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// All admin routes require admin role
router.use(authMiddleware, checkRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/next-level:
 *   get:
 *     summary: Get next level users (direct children)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Next level users retrieved
 */
router.get('/users/:userId/next-level', adminController.getNextLevelUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/hierarchy:
 *   get:
 *     summary: Get complete downline hierarchy tree for any user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hierarchy tree retrieved
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/hierarchy', adminController.getUserHierarchy);

/**
 * @swagger
 * /api/admin/credit-balance:
 *   post:
 *     summary: Credit balance to any user (deducts from parent automatically)
 *     tags: [Admin]
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
 *         description: Balance credited (deducted from parent)
 *       400:
 *         description: Parent has insufficient balance
 */
router.post('/credit-balance', adminController.creditBalance);

/**
 * @swagger
 * /api/admin/global-summary:
 *   get:
 *     summary: Get global balance summary across all users
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Global summary retrieved
 */
router.get('/global-summary', adminController.getGlobalSummary);

module.exports = router;