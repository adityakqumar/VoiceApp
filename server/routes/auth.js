const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sendOtpEmail } = require('../utils/email');

const router = express.Router();

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email } = req.body;

      // Delete any existing OTPs for this email
      await Otp.deleteMany({ email });

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash the OTP before storing
      const hashedOtp = await bcrypt.hash(otpCode, 10);

      await Otp.create({
        email,
        otp: hashedOtp,
      });

      // Send OTP via email (also logs to console as fallback)
      await sendOtpEmail(email, otpCode);

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit OTP is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, otp } = req.body;

      // Find OTP record
      const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
      }

      // Verify OTP
      const isValid = await bcrypt.compare(otp, otpRecord.otp);

      if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // OTP valid — delete it
      await Otp.deleteMany({ email });

      // Find or create user
      let user = await User.findOne({ email });
      let isNewUser = false;

      if (!user) {
        user = await User.create({ email });
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
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// POST /api/auth/set-display-name
router.post(
  '/set-display-name',
  authMiddleware,
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

      // Check if display name is taken
      const existing = await User.findOne({
        displayName: { $regex: new RegExp(`^${displayName}$`, 'i') },
        internalId: { $ne: req.user.internalId },
      });

      if (existing) {
        return res.status(409).json({ error: 'Display name is already taken' });
      }

      req.user.displayName = displayName;
      req.user.isProfileComplete = true;
      await req.user.save();

      res.json({ user: req.user.toSafeJSON() });
    } catch (error) {
      console.error('Set display name error:', error);
      res.status(500).json({ error: 'Failed to set display name' });
    }
  }
);

module.exports = router;
