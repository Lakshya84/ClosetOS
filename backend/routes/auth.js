const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { RegisterSchema, LoginSchema } = require('../validators/schemas');

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token helper
const generateToken = (id, email, displayName) => {
  return jwt.sign(
    { id, email, displayName },
    process.env.JWT_SECRET || 'supersecretkeyforauravault123',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new GenZ creator account
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // 1. Validate request body with Zod
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, displayName } = validatedData;

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create and save the new user
    const newUser = await User.create({
      email,
      passwordHash,
      displayName
    });

    // 5. Generate token and respond
    const token = generateToken(newUser._id, newUser.email, newUser.displayName);

    return res.status(201).json({
      _id: newUser._id,
      displayName: newUser.displayName,
      email: newUser.email,
      token
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(err => err.message) 
      });
    }
    
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate creator & retrieve token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // 1. Validate request body with Zod
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 2. Locate user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Verify password match
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 4. Generate token and respond
    const token = generateToken(user._id, user.email, user.displayName);

    return res.status(200).json({
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      token
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(err => err.message) 
      });
    }

    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
});

// @route   POST /api/auth/google
// @desc    Verify Google ID Token and register or login user
// @access  Public
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential token is missing.' });
  }

  try {
    // 1. Verify Google Token ID (credential)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account is missing a verified email address.' });
    }

    // 2. Locate or create User profile
    let user = await User.findOne({ email });
    if (!user) {
      // Create user with a strong random password hash since login is managed by Google
      const randomPassword = Math.random().toString(36).substring(2, 15) + '!@#123abc';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        email,
        passwordHash,
        displayName: name || `Creator_${sub.substring(0, 6)}`
      });
    }

    // 3. Issue standard ClosetOS JWT
    const token = generateToken(user._id, user.email, user.displayName);

    return res.status(200).json({
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return res.status(401).json({ message: 'Google token authentication failed.' });
  }
});

module.exports = router;
