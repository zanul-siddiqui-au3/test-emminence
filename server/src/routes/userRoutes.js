const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireDownlineAccess, requireDirectChildAccess } = require('../middlewares/hierachyAuthMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and hierarchy
 */

/**
 * @swagger
 * /api/users/create-child:
 *   post:
 *     summary: Create a direct child user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: childuser
 *               email:
 *                 type: string
 *                 example: child@example.com
 *               password:
 *                 type: string
 *                 example: Child@123
 *     responses:
 *       201:
 *         description: Child user created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/create-child', authMiddleware, userController.createChildUser);

/**
 * @swagger
 * /api/users/my-children:
 *   get:
 *     summary: Get all direct children
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Direct children retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-children', authMiddleware, userController.getMyChildren);

/**
 * @swagger
 * /api/users/my-hierarchy:
 *   get:
 *     summary: Get complete downline hierarchy tree
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Hierarchy retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-hierarchy', authMiddleware, userController.getMyHierarchy);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user details (must be in downline)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:userId', authMiddleware, requireDownlineAccess, userController.getUserDetails);

/**
 * @swagger
 * /api/users/{userId}/change-password:
 *   put:
 *     summary: Change password of direct child user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must be direct child)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       403:
 *         description: Access denied (not direct child)
 */
router.put('/:userId/change-password', authMiddleware, requireDirectChildAccess, userController.changeChildPassword);

module.exports = router;