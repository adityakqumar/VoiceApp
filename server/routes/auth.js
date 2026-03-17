const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Display name must be 2-30 characters')
      .matches(/^[a-zA-Z0-9_\- ]+$/)
      .withMessage('Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { displayName } = req.body;

      // Find or create user (case-insensitive search)
      let user = await User.findOne({
        displayName: { $regex: new RegExp(`^${displayName}$`, 'i') },
      });
      let isNewUser = false;

      if (!user) {
        user = await User.create({ displayName });
        isNewUser = true;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.internalId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: user.toSafeJSON(),
        isNewUser,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

module.exports = router;
