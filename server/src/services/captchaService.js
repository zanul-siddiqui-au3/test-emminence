const svgCaptcha = require('svg-captcha');
const { generateUniqueId } = require('../utils/crypto');

const captchaSessions = new Map();

// Clean expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of captchaSessions.entries()) {
    if (now - data.timestamp > parseInt(process.env.CAPTCHA_SESSION_EXPIRY)) {
      captchaSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);


const generateCaptcha = () => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 2,
    color: true,
    background: '#f0f0f0'
  });

  const sessionId = generateUniqueId();
  
  captchaSessions.set(sessionId, {
    text: captcha.text.toLowerCase(),
    timestamp: Date.now()
  });

  return {
    sessionId,
    svg: captcha.data
  };
};

// Verify CAPTCHA
const verifyCaptcha = (sessionId, userInput) => {
  const session = captchaSessions.get(sessionId);
  
  if (!session) {
    return { valid: false, message: 'CAPTCHA session expired or invalid' };
  }

  const now = Date.now();
  if (now - session.timestamp > parseInt(process.env.CAPTCHA_SESSION_EXPIRY)) {
    captchaSessions.delete(sessionId);
    return { valid: false, message: 'CAPTCHA expired' };
  }

  const isValid = session.text === userInput.toLowerCase();
  captchaSessions.delete(sessionId); 

  return {
    valid: isValid,
    message: isValid ? 'CAPTCHA verified' : 'Invalid CAPTCHA'
  };
};

module.exports = {
  generateCaptcha,
  verifyCaptcha
};