const { User } = require('../models');
const { hashPassword } = require('../utils/password');
const hierarchyService = require('../services/hiearchyService');

// Create child user
const createChildUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const parentId = req.user._id;


    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      parentId,
      createdBy: parentId
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      status: 'success',
      message: 'Child user created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create child user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create child user'
    });
  }
};

// Get direct children
const getMyChildren = async (req, res) => {
  try {
    const children = await hierarchyService.getDirectChildren(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        count: children.length,
        children
      }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get children'
    });
  }
};

// Get complete downline hierarchy
const getMyHierarchy = async (req, res) => {
  try {
    const hierarchy = await hierarchyService.getHierarchyTree(req.user._id);
    const totalDownline = await hierarchyService.countDownlineUsers(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        totalDownline,
        hierarchy
      }
    });
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get hierarchy'
    });
  }
};

// Change child user password
const changeChildPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update user password so child is forced to re-login
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      refreshToken: null
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change child password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
};

// Get user details (must be in downline)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user details'
    });
  }
};

module.exports = {
  createChildUser,
  getMyChildren,
  getMyHierarchy,
  changeChildPassword,
  getUserDetails
};