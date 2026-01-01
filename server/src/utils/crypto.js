const crypto = require('crypto');

const generateUniqueId = () => {
  return crypto.randomUUID();
};

const generateRandomHex = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateUniqueId,
  generateRandomHex,
  generateToken
};