const mongoose = require('mongoose');
const { User, Transaction } = require('../models');

// Credit balance to direct child 
const creditBalance = async (senderId, receiverId, amount, description = '') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get sender and receiver
    const sender = await User.findById(senderId).session(session);
    const receiver = await User.findById(receiverId).session(session);

    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    // Check if receiver is direct child
    if (!receiver.parentId || receiver.parentId.toString() !== senderId.toString()) {
      throw new Error('Can only credit balance to direct child users');
    }

    if (sender.walletBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update balances
    sender.walletBalance -= amount;
    receiver.walletBalance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    // Using transaction so it shoulde be completed together

    // Create debit transaction for sender deduct amount
    const debitTransaction = await Transaction.create([{
      type: 'debit',
      amount: amount,
      senderId: senderId,
      receiverId: receiverId,
      balanceAfter: sender.walletBalance,
      description: description || `Balance transfer to ${receiver.username}`,
      status: 'completed'
    }], { session });

    // Create credit transaction for receiver add amount
    const creditTransaction = await Transaction.create([{
      type: 'credit',
      amount: amount,
      senderId: senderId,
      receiverId: receiverId,
      balanceAfter: receiver.walletBalance,
      description: description || `Balance received from ${sender.username}`,
      status: 'completed'
    }], { session });

    await session.commitTransaction();

    return {
      success: true,
      debitTransaction: debitTransaction[0],
      creditTransaction: creditTransaction[0]
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Admin recharge wallet
const rechargeWallet = async (userId, amount, description = 'Wallet recharge') => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'admin') {
    throw new Error('Only admin can recharge wallet');
  }

  user.walletBalance += amount;
  await user.save();

  // Create recharge transaction
  const transaction = await Transaction.create({
    type: 'recharge',
    amount: amount,
    senderId: null,
    receiverId: userId,
    balanceAfter: user.walletBalance,
    description,
    status: 'completed'
  });

  return {
    success: true,
    transaction,
    newBalance: user.walletBalance
  };
};

// Get user transactions
const getUserTransactions = async (userId, filters = {}) => {
  const query = {
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  };

  // Apply filters
  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const transactions = await Transaction.find(query)
    .populate('senderId', 'username email')
    .populate('receiverId', 'username email')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100);

  return transactions;
};

// Get balance summary for user and downline
const getBalanceSummary = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Get all users in downline
  let totalDownlineBalance = 0;
  
  const calculateDownlineBalance = async (parentId) => {
    const children = await User.find({ parentId });
    for (const child of children) {
      totalDownlineBalance += child.walletBalance;
      await calculateDownlineBalance(child._id);
    }
  };
  
  await calculateDownlineBalance(userId);

  return {
    myBalance: user.walletBalance,
    downlineBalance: totalDownlineBalance,
    totalBalance: user.walletBalance + totalDownlineBalance
  };
};

module.exports = {
  creditBalance,
  rechargeWallet,
  getUserTransactions,
  getBalanceSummary
};