const authService = require('../auth/authService');
const rbac = require('../auth/rbac');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const user = await authService.getUserByToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

// Authorization middleware factory
const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }

      // Convert single permission to array
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      // Check if user has any of the required permissions
      const hasPermission = await rbac.hasAnyPermission(req.user.id, requiredPermissions);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authorization check failed.'
      });
    }
  };
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }

      const userRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!userRoles.includes(req.user.role_name)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient role privileges.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Role check failed.'
      });
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      try {
        const user = await authService.getUserByToken(token);
        req.user = user;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Admin only middleware
const adminOnly = [
  authenticate,
  requireRole('admin')
];

// Premium user middleware
const premiumUser = [
  authenticate,
  requireRole(['admin', 'premium'])
];

module.exports = {
  authenticate,
  authorize,
  requireRole,
  optionalAuth,
  adminOnly,
  premiumUser
};