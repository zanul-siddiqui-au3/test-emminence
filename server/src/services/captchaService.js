const svgCaptcha = require('svg-captcha');
const { generateUniqueId } = require('../utils/crypto');

// In-memory session storage for CAPTCHA
// Each session contains: { text: string, timestamp: number, ipAddress?: string }
const captchaSessions = new Map();

// CAPTCHA expires in 5 minutes (300000 milliseconds)
const CAPTCHA_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// Clean expired CAPTCHA sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, data] of captchaSessions.entries()) {
    // Remove sessions older than 5 minutes
    if (now - data.timestamp > CAPTCHA_EXPIRY_TIME) {
      captchaSessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[CAPTCHA] Cleaned ${cleanedCount} expired sessions`);
  }
}, CAPTCHA_EXPIRY_TIME);

/**
 * Generate a new CAPTCHA with a unique session ID
 * @param {string} ipAddress - Optional IP address to tie session to specific client
 * @returns {Object} { sessionId: string, svg: string }
 */
const generateCaptcha = (ipAddress = null) => {
  const captcha = svgCaptcha.create({
    size: 6, // 6 characters
    noise: 2, // Noise level
    color: true, // Colored characters
    background: '#f0f0f0' // Light gray background
  });

  const sessionId = generateUniqueId();
  
  // Store CAPTCHA session with timestamp and optional IP binding
  captchaSessions.set(sessionId, {
    text: captcha.text.toLowerCase(),
    timestamp: Date.now(),
    ipAddress: ipAddress
  });

  console.log(`[CAPTCHA] Generated new session: ${sessionId} (Total active: ${captchaSessions.size})`);

  return {
    sessionId,
    svg: captcha.data
  };
};

/**
 * Verify CAPTCHA input against session
 * @param {string} sessionId - The CAPTCHA session ID
 * @param {string} userInput - User's CAPTCHA input
 * @param {string} ipAddress - Optional IP address for additional validation
 * @returns {Object} { valid: boolean, message: string }
 */
const verifyCaptcha = (sessionId, userInput, ipAddress = null) => {
  if (!sessionId || !userInput) {
    return { valid: false, message: 'CAPTCHA session ID and input are required' };
  }

  const session = captchaSessions.get(sessionId);
  
  // Check if session exists
  if (!session) {
    return { valid: false, message: 'CAPTCHA session expired or invalid' };
  }

  const now = Date.now();
  const sessionAge = now - session.timestamp;

  // Check if CAPTCHA has expired (5 minutes)
  if (sessionAge > CAPTCHA_EXPIRY_TIME) {
    captchaSessions.delete(sessionId);
    console.log(`[CAPTCHA] Session expired: ${sessionId} (Age: ${Math.floor(sessionAge / 1000)}s)`);
    return { valid: false, message: 'CAPTCHA expired. Please refresh and try again.' };
  }

  // Optional: Validate IP address match for additional security
  if (ipAddress && session.ipAddress && session.ipAddress !== ipAddress) {
    captchaSessions.delete(sessionId);
    console.log(`[CAPTCHA] IP mismatch for session: ${sessionId}`);
    return { valid: false, message: 'CAPTCHA session invalid' };
  }

  // Verify CAPTCHA text (case-insensitive)
  const isValid = session.text === userInput.toLowerCase().trim();
  
  // Always delete session after verification attempt (one-time use)
  captchaSessions.delete(sessionId);

  if (isValid) {
    console.log(`[CAPTCHA] Verified successfully: ${sessionId}`);
  } else {
    console.log(`[CAPTCHA] Verification failed: ${sessionId}`);
  }

  return {
    valid: isValid,
    message: isValid ? 'CAPTCHA verified successfully' : 'Invalid CAPTCHA. Please try again.'
  };
};

/**
 * Get current active sessions count (for monitoring)
 * @returns {number}
 */
const getActiveSessionsCount = () => {
  return captchaSessions.size;
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  getActiveSessionsCount
};