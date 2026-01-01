const adminService = require('../services/adminService');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, parentId, isActive, limit } = req.query;

    const filters = {
      role,
      parentId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: parseInt(limit) || 100
    };

    const users = await adminService.getAllUsers(filters);

    res.status(200).json({
      status: 'success',
      data: {
        count: users.length,
        users
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users'
    });
  }
};

// Get next level users
const getNextLevelUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await adminService.getNextLevelUsers(userId);

    res.status(200).json({
      status: 'success',
      data: {
        count: users.length,
        users
      }
    });
  } catch (error) {
    console.error('Get next level users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get next level users'
    });
  }
};

// Get user hierarchy tree
const getUserHierarchy = async (req, res) => {
  try {
    const { userId } = req.params;

    const hierarchy = await adminService.getUserHierarchyTree(userId);

    if (!hierarchy) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { hierarchy }
    });
  } catch (error) {
    console.error('Get user hierarchy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user hierarchy'
    });
  }
};

// Admin credit balance (deduct from parent)
const creditBalance = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than 0'
      });
    }

    const result = await adminService.adminCreditBalance(userId, amount, description);

    res.status(200).json({
      status: 'success',
      message: 'Balance credited successfully (deducted from parent)',
      data: result
    });

  } catch (error) {
    console.error('Admin credit balance error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to credit balance'
    });
  }
};

// Get global balance summary
const getGlobalSummary = async (req, res) => {
  try {
    const summary = await adminService.getGlobalBalanceSummary();

    res.status(200).json({
      status: 'success',
      data: summary
    });
  } catch (error) {
    console.error('Get global summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get global summary'
    });
  }
};

module.exports = {
  getAllUsers,
  getNextLevelUsers,
  getUserHierarchy,
  creditBalance,
  getGlobalSummary
};