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

  const downlineUsers = await User.find({ parentId: userId })
    .select('-password -refreshToken')
    .populate('parentId', 'username');

  return {
    user,
    directChildren: downlineUsers,
    count: downlineUsers.length
  };
};

// Admin credit balance to any user 
const adminCreditBalance = async (targetUserId, amount, description = '') => {
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

  parentUser.walletBalance -= amount;
  await parentUser.save();

  targetUser.walletBalance += amount;
  await targetUser.save();

  const debitTransaction = await Transaction.create({
    type: 'debit',
    amount: amount,
    senderId: parentUser._id,
    receiverId: targetUser._id,
    balanceAfter: parentUser.walletBalance,
    description: description || `Admin credit to ${targetUser.username}`,
    status: 'completed'
  });

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
};

// Get global balance summary
const getGlobalBalanceSummary = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const balanceAggregation = await User.aggregate([
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$walletBalance' }
      }
    }
  ]);

  const totalBalance = balanceAggregation.length > 0 ? balanceAggregation[0].totalBalance : 0;

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

  const admin = await User.findOne({ role: 'admin' }).select('walletBalance username');

  return {
    totalUsers,
    activeUsers,
    totalBalance,
    adminBalance: admin ? admin.walletBalance : 0,
    adminUsername: admin ? admin.username : null,
    totalTransactions,
    transactionVolume: volumeAggregation
  };
};

module.exports = {
  getAllUsers,
  getNextLevelUsers,
  getUserHierarchyTree,
  adminCreditBalance,
  getGlobalBalanceSummary
};