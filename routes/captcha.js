const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

// Store captcha in memory (in production, use Redis or session store)
const captchaStore = new Map();

// Export verification function for use in other routes
const verifyCaptcha = (captchaId, captchaText) => {
  if (!captchaId || !captchaText) {
    return { valid: false, message: 'CAPTCHA ID and text are required' };
  }

  const stored = captchaStore.get(captchaId);

  if (!stored) {
    return { valid: false, message: 'CAPTCHA expired or invalid' };
  }

  // Check if captcha is expired (5 minutes)
  if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
    captchaStore.delete(captchaId);
    return { valid: false, message: 'CAPTCHA expired' };
  }

  // Verify captcha text (case-insensitive)
  const isValid = stored.text === captchaText.toLowerCase().trim();

  // Delete captcha after verification (one-time use)
  captchaStore.delete(captchaId);

  return {
    valid: isValid,
    message: isValid ? 'CAPTCHA verified' : 'Invalid CAPTCHA'
  };
};

// Clean up old captchas every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of captchaStore.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) { // 5 minutes
      captchaStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Generate CAPTCHA
router.get('/generate', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: '#f0f0f0',
    width: 200,
    height: 80
  });

  // Generate unique ID for this captcha
  const captchaId = Date.now() + Math.random().toString(36).substring(7);
  
  // Store captcha text with timestamp
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    timestamp: Date.now()
  });

  res.json({
    captchaId: captchaId,
    captchaSvg: captcha.data
  });
});

// Verify CAPTCHA
router.post('/verify', (req, res) => {
  const { captchaId, captchaText } = req.body;
  const result = verifyCaptcha(captchaId, captchaText);
  
  if (!result.valid) {
    return res.status(400).json(result);
  }
  
  res.json(result);
});

module.exports = router;
module.exports.verifyCaptcha = verifyCaptcha;
