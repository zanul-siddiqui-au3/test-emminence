const { User, Transaction } = require('../models');

// Credit balance to direct child 
const creditBalance = async (senderId, receiverId, amount, description = '') => {
  try {
    // Get sender and receiver
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

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

    await sender.save();
    await receiver.save();

    // Create debit transaction for sender deduct amount
    const debitTransaction = await Transaction.create({
      type: 'debit',
      amount: amount,
      senderId: senderId,
      receiverId: receiverId,
      balanceAfter: sender.walletBalance,
      description: description || `Balance transfer to ${receiver.username}`,
      status: 'completed'
    });

    // Create credit transaction for receiver add amount
    const creditTransaction = await Transaction.create({
      type: 'credit',
      amount: amount,
      senderId: senderId,
      receiverId: receiverId,
      balanceAfter: receiver.walletBalance,
      description: description || `Balance received from ${sender.username}`,
      status: 'completed'
    });

    return {
      success: true,
      debitTransaction,
      creditTransaction
    };

  } catch (error) {
    throw error;
  }
};

// Admin/Owner recharge wallet
const rechargeWallet = async (userId, amount, description = 'Wallet recharge') => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Allow admin or owner (user with no parent) to recharge
  if (user.role !== 'admin' && user.parentId !== null) {
    throw new Error('Only admin or owner can recharge wallet');
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

// Get detailed balance statement with credit/debit breakdown
const getBalanceStatement = async (userId, filters = {}) => {
  // Only show transactions that actually affect this user:
  // - For 'credit' type: user must be the receiver
  // - For 'debit' type: user must be the sender
  // - For 'recharge' type: user must be the receiver
  const query = {
    $or: [
      { type: 'credit', receiverId: userId },
      { type: 'debit', senderId: userId },
      { type: 'recharge', receiverId: userId },
      { type: 'commission', receiverId: userId }
    ]
  };

  // Apply filters
  if (filters.type) {
    // Override the main query with specific type filter
    query.$or = query.$or.filter(condition => condition.type === filters.type);
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

  // Format transactions with clear debit/credit indication
  const formattedTransactions = transactions.map(txn => {
    const isCredit = txn.receiverId._id.toString() === userId.toString();
    const isDebit = txn.senderId && txn.senderId._id.toString() === userId.toString();

    return {
      _id: txn._id,
      type: txn.type,
      transactionType: isCredit ? 'CREDIT' : 'DEBIT',
      amount: txn.amount,
      balanceAfter: txn.balanceAfter,
      sender: txn.senderId ? {
        _id: txn.senderId._id,
        username: txn.senderId.username,
        email: txn.senderId.email
      } : null,
      receiver: {
        _id: txn.receiverId._id,
        username: txn.receiverId.username,
        email: txn.receiverId.email
      },
      description: txn.description,
      status: txn.status,
      timestamp: txn.createdAt,
      createdAt: txn.createdAt
    };
  });

  // Calculate totals
  const creditTotal = formattedTransactions
    .filter(txn => txn.transactionType === 'CREDIT')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const debitTotal = formattedTransactions
    .filter(txn => txn.transactionType === 'DEBIT')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const user = await User.findById(userId).select('walletBalance');

  return {
    currentBalance: user.walletBalance,
    totalCredit: creditTotal,
    totalDebit: debitTotal,
    netChange: creditTotal - debitTotal,
    transactionCount: formattedTransactions.length,
    transactions: formattedTransactions
  };
};

module.exports = {
  creditBalance,
  rechargeWallet,
  getBalanceSummary,
  getBalanceStatement
};