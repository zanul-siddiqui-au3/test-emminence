const { isInDownline, isDirectChild } = require('../services/hiearchyService');

const requireDownlineAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Admin can access anyone
    if (req.user.role === 'admin') {
      return next();
    }

    // User accessing themselves
    if (userId === currentUserId.toString()) {
      return next();
    }

    // Check if target is in downline
    const hasAccess = await isInDownline(currentUserId, userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. User is not in your downline'
      });
    }

    next();
  } catch (error) {
    console.error('Hierarchy guard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authorization check failed'
    });
  }
};

// Ensure target user is direct child of current user
const requireDirectChildAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Admin can access anyone
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if target is direct child
    const isChild = await isDirectChild(currentUserId, userId);
    
    if (!isChild) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. User is not your direct child'
      });
    }

    next();
  } catch (error) {
    console.error('Direct child guard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authorization check failed'
    });
  }
};

module.exports = {
  requireDownlineAccess,
  requireDirectChildAccess
};