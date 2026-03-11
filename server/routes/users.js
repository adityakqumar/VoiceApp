const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — Get current user profile (no email)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user.toSafeJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/users/lookup/:callId — Lookup user by call ID (no email)
router.get('/lookup/:callId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ callId: req.params.callId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only return safe public info
    res.json({
      displayName: user.displayName,
      callId: user.callId,
    });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

module.exports = router;
