const { User } = require('../models');

// Check if child user is in user downline for view hiearchy
const isInDownline = async (currentUserId, targetUserId) => {
  const targetUser = await User.findById(targetUserId);
  return targetUser && targetUser.ancestors.some(
    ancestorId => ancestorId.toString() === currentUserId.toString()
  );
};

const isDirectChild = async (currentUserId, targetUserId) => {
  const targetUser = await User.findById(targetUserId);
  return targetUser && targetUser.parentId && 
         targetUser.parentId.toString() === currentUserId.toString();
};

const getDirectChildren = async (userId) => {
  return await User.find({ parentId: userId }).select('-password -refreshToken');
};

const getCompleteDownline = async (userId) => {
  return await User.find({ ancestors: userId }).select('-password -refreshToken');
};

const countDownlineUsers = async (userId) => {
  return await User.countDocuments({ ancestors: userId });
};

module.exports = {
  isInDownline,
  isDirectChild,
  getDirectChildren,
  getCompleteDownline,
  countDownlineUsers
};