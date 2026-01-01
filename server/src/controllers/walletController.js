const walletService = require('../services/walletService');
const { User } = require('../models');

// Get current balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');

    res.status(200).json({
      status: 'success',
      data: {
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get balance'
    });
  }
};

// Credit balance to child user
const creditToChild = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    // Validation
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

    // Execute credit operation
    const result = await walletService.creditBalance(
      req.user._id,
      userId,
      amount,
      description
    );

    res.status(200).json({
      status: 'success',
      message: 'Balance credited successfully',
      data: result
    });

  } catch (error) {
    console.error('Credit balance error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to credit balance'
    });
  }
};

// Recharge wallet (Admin only)
const rechargeWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid amount is required'
      });
    }

    const result = await walletService.rechargeWallet(
      req.user._id,
      amount,
      description
    );

    res.status(200).json({
      status: 'success',
      message: 'Wallet recharged successfully',
      data: result
    });

  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to recharge wallet'
    });
  }
};

// Get transaction history
const getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, limit } = req.query;

    const filters = {
      type,
      startDate,
      endDate,
      limit: parseInt(limit) || 100
    };

    const transactions = await walletService.getUserTransactions(
      req.user._id,
      filters
    );

    res.status(200).json({
      status: 'success',
      data: {
        count: transactions.length,
        transactions
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transactions'
    });
  }
};

// Get balance summary
const getBalanceSummary = async (req, res) => {
  try {
    const summary = await walletService.getBalanceSummary(req.user._id);

    res.status(200).json({
      status: 'success',
      data: summary
    });

  } catch (error) {
    console.error('Get balance summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get balance summary'
    });
  }
};

module.exports = {
  getBalance,
  creditToChild,
  rechargeWallet,
  getTransactions,
  getBalanceSummary
};