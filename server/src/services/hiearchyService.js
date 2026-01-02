const { User } = require('../models');

// Check if child user is in user downline for view hiearchy
const isInDownline = async (currentUserId, targetUserId) => {
  const targetUser = await User.findById(targetUserId);
  
  if (!targetUser) {
    return false;
  }

  return targetUser.ancestors && targetUser.ancestors.some(
    ancestorId => ancestorId.toString() === currentUserId.toString()
  )};

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

const getHierarchyTree = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  
  if (!user) {
    return null;
  }

  // Recursive function to build tree
  const buildTree = async (parentId) => {
    const children = await User.find({ parentId })
      .select('-password -refreshToken')
      .lean();
    
    for (let child of children) {
      child.children = await buildTree(child._id);
    }
    
    return children;
  };

  const children = await buildTree(userId);
  
  return {
    ...user,
    children
  };
};

module.exports = {
  isInDownline,
  isDirectChild,
  getDirectChildren,
  getCompleteDownline,
  countDownlineUsers,
  getHierarchyTree
};