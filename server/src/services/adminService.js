const { User, Transaction } = require('../models');

// Get all users (admin view)
const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.parentId) {
    query.parentId = filters.parentId;
  }
  
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const users = await User.find(query)
    .select('-password -refreshToken')
    .populate('parentId', 'username email')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100);

  return users;
};

// Get next level users (direct children of a user)
const getNextLevelUsers = async (userId) => {
  const users = await User.find({ parentId: userId })
    .select('-password -refreshToken')
    .populate('createdBy', 'username email')
    .sort({ createdAt: -1 });

  return users;
};

// Get complete hierarchy tree for any user 
const getUserHierarchyTree = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  
  if (!user) {
    return null;
  }

  // Recursive function to build complete downline tree
  const buildHierarchyTree = async (parentId) => {
    const children = await User.find({ parentId })
      .select('-password -refreshToken')
      .lean();
    
    // Recursively get children for each child
    for (let child of children) {
      child.children = await buildHierarchyTree(child._id);
      child.childrenCount = child.children.length;
    }
    
    return children;
  };

  const completeTree = await buildHierarchyTree(userId);
  
  // Count total downline users (all descendants)
  const countAllDescendants = (tree) => {
    let count = tree.length;
    for (let node of tree) {
      if (node.children && node.children.length > 0) {
        count += countAllDescendants(node.children);
      }
    }
    return count;
  };

  const totalDownlineCount = countAllDescendants(completeTree);

  return {
    user: user.toObject(),
    downlineTree: completeTree,
    totalDownlineUsers: totalDownlineCount,
    directChildren: completeTree.length
  };
};

// Admin credit balance to any user 
const adminCreditBalance = async (targetUserId, amount, description = '') => {
  try {
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    if (!targetUser.parentId) {
      throw new Error('Cannot credit to top-level user (no parent)');
    }

    const parentUser = await User.findById(targetUser.parentId);
    
    if (!parentUser) {
      throw new Error('Parent user not found');
    }

    if (parentUser.walletBalance < amount) {
      throw new Error('Parent has insufficient balance');
    }

    // Deduct from parent
    parentUser.walletBalance -= amount;
    await parentUser.save();

    // Credit to target
    targetUser.walletBalance += amount;
    await targetUser.save();

    // Create debit transaction for parent
    const debitTransaction = await Transaction.create({
      type: 'debit',
      amount: amount,
      senderId: parentUser._id,
      receiverId: targetUser._id,
      balanceAfter: parentUser.walletBalance,
      description: description || `Admin credit to ${targetUser.username}`,
      status: 'completed'
    });

    // Create credit transaction for target
    const creditTransaction = await Transaction.create({
      type: 'credit',
      amount: amount,
      senderId: parentUser._id,
      receiverId: targetUser._id,
      balanceAfter: targetUser.walletBalance,
      description: description || `Balance from parent via admin`,
      status: 'completed'
    });

    return {
      success: true,
      debitTransaction,
      creditTransaction,
      parentBalance: parentUser.walletBalance,
      targetBalance: targetUser.walletBalance
    };
  } catch (error) {
    throw error;
  }
};

// Get global balance summary
const getGlobalBalanceSummary = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const balanceAggregation = await User.aggregate([
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$walletBalance' },
        averageBalance: { $avg: '$walletBalance' },
        maxBalance: { $max: '$walletBalance' },
        minBalance: { $min: '$walletBalance' }
      }
    }
  ]);

  const totalBalance = balanceAggregation.length > 0 ? balanceAggregation[0].totalBalance : 0;
  const averageBalance = balanceAggregation.length > 0 ? balanceAggregation[0].averageBalance : 0;
  const maxBalance = balanceAggregation.length > 0 ? balanceAggregation[0].maxBalance : 0;
  const minBalance = balanceAggregation.length > 0 ? balanceAggregation[0].minBalance : 0;

  const totalTransactions = await Transaction.countDocuments();

  const volumeAggregation = await Transaction.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Get top users by balance
  const topUsersByBalance = await User.find()
    .select('username email walletBalance role')
    .sort({ walletBalance: -1 })
    .limit(10);

  const admin = await User.findOne({ role: 'admin' }).select('walletBalance username');

  // Get users with zero balance
  const zeroBalanceUsers = await User.countDocuments({ walletBalance: 0 });

  return {
    totalUsers,
    activeUsers,
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    averageBalance: parseFloat(averageBalance.toFixed(2)),
    maxBalance: parseFloat(maxBalance.toFixed(2)),
    minBalance: parseFloat(minBalance.toFixed(2)),
    zeroBalanceUsers,
    adminBalance: admin ? admin.walletBalance : 0,
    adminUsername: admin ? admin.username : null,
    totalTransactions,
    transactionVolume: volumeAggregation,
    topUsersByBalance
  };
};

module.exports = {
  getAllUsers,
  getNextLevelUsers,
  getUserHierarchyTree,
  adminCreditBalance,
  getGlobalBalanceSummary
};