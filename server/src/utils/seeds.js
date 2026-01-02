require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const { hashPassword } = require('./password');

const seedDatabase = async () => {
  try {

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await hashPassword('Admin@123');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      walletBalance: 100000, // Initial balance
      parentId: null,
      isActive: true
    });

    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedDatabase();