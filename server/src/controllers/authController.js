const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateCaptcha, verifyCaptcha } = require('../services/captchaService');

// Get CAPTCHA
const getCaptcha = async (req, res) => {
  try {
    const captcha = generateCaptcha();
    
    res.status(200).json({
      status: 'success',
      data: {
        sessionId: captcha.sessionId,
        svg: captcha.svg
      }
    });
  } catch (error) {
    console.error('Get CAPTCHA error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate CAPTCHA'
    });
  }
};

// Register
const register = async (req, res) => {
  try {
    const { username, email, password, parentId } = req.body;

    // Validation
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

    let createdBy = null;
    if (parentId) {
      const parent = await User.findById(parentId);
      if (!parent) {
        return res.status(400).json({
          status: 'error',
          message: 'Parent user not found'
        });
      }
      createdBy = parentId;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      parentId: parentId || null,
      createdBy
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password, captchaSessionId, captchaText } = req.body;

    // Validation
    if (!username || !password || !captchaSessionId || !captchaText) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Verify CAPTCHA
    const captchaResult = verifyCaptcha(captchaSessionId, captchaText);
    if (!captchaResult.valid) {
      return res.status(400).json({
        status: 'error',
        message: captchaResult.message
      });
    }

    // Find user (include password field)
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Set HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const {  email, role, parentId, isActive} = user.toObject();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: { user: { username, email, role, parentId, isActive} }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
    const newAccessToken = generateAccessToken(user._id);
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Token refresh failed'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
};

module.exports = {
  getCaptcha,
  register,
  login,
  refreshToken,
  logout,
  getProfile
};