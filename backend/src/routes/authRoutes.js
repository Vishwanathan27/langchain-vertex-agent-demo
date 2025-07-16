const express = require('express');
const authService = require('../auth/authService');
const rbac = require('../auth/rbac');
const { authenticate, authorize, adminOnly } = require('../middleware/auth');
const { safeJsonArray } = require('../utils/jsonHelpers');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *             required:
 *               - email
 *               - username
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    
    // Basic validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    const user = await authService.register({
      email,
      username,
      password,
      firstName,
      lastName
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await authService.login({ email, password }, ipAddress, userAgent);
    
    // Set HTTP-only cookie for session token
    res.cookie('sessionToken', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        role: result.user.role_name,
        permissions: safeJsonArray(result.user.permissions)
      },
      token: result.token
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    
    if (sessionToken) {
      await authService.logout(sessionToken);
    }
    
    res.clearCookie('sessionToken');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userPermissions = await rbac.getUserPermissions(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role_name,
        permissions: userPermissions.permissions,
        lastLogin: req.user.last_login_at,
        preferences: req.user.preferences || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *             required:
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }
    
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin routes
/**
 * @swagger
 * /api/auth/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/admin/users', adminOnly, async (req, res) => {
  try {
    const users = await req.app.locals.db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id',
        'users.email',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.is_active',
        'users.email_verified',
        'users.last_login_at',
        'users.created_at',
        'roles.name as role_name'
      )
      .orderBy('users.created_at', 'desc');
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/admin/roles:
 *   get:
 *     summary: Get all roles (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/admin/roles', adminOnly, async (req, res) => {
  try {
    const roles = await rbac.getAllRoles();
    
    res.json({
      success: true,
      roles: roles.map(role => ({
        ...role,
        permissions: safeJsonArray(role.permissions)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/admin/permissions:
 *   get:
 *     summary: Get all available permissions (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/admin/permissions', adminOnly, async (req, res) => {
  try {
    const permissions = rbac.getAvailablePermissions();
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/preferences:
 *   put:
 *     summary: Update user preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               currency:
 *                 type: string
 *                 enum: [INR, USD, EUR]
 *               notifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { theme, currency, notifications } = req.body;
    const userId = req.user.id;
    
    // Get current preferences
    const currentUser = await req.app.locals.db('users')
      .where('id', userId)
      .first();
    
    const currentPreferences = currentUser.preferences || {};
    
    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(theme && { theme }),
      ...(currency && { currency }),
      ...(notifications !== undefined && { notifications })
    };
    
    await req.app.locals.db('users')
      .where('id', userId)
      .update({
        preferences: updatedPreferences,
        updated_at: new Date()
      });
    
    // Log activity
    await logUserActivity(userId, 'preferences_update', `Updated preferences: ${Object.keys(req.body).join(', ')}`, req.ip, req.get('User-Agent'));
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/activity:
 *   post:
 *     summary: Log user activity
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               details:
 *                 type: string
 *               metadata:
 *                 type: object
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Activity logged successfully
 */
router.post('/activity', authenticate, async (req, res) => {
  try {
    const { action, details, metadata } = req.body;
    const userId = req.user.id;
    
    await logUserActivity(userId, action, details, req.ip, req.get('User-Agent'), metadata);
    
    res.json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/activity:
 *   get:
 *     summary: Get user activity history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Number of activities to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *         description: Number of activities to skip
 *     responses:
 *       200:
 *         description: User activity history
 */
router.get('/activity', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;
    
    const activities = await req.app.locals.db('user_activity')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to log user activity
async function logUserActivity(userId, action, details, ipAddress, userAgent, metadata = null) {
  try {
    const db = require('../db/connection');
    
    await db('user_activity').insert({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

module.exports = router;