const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Enhanced validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide username, email, and password',
        missing: {
          username: !username,
          email: !email,
          password: !password
        }
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        error: 'Username must be between 3 and 30 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this username or email already exists' 
      });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }

    res.status(500).json({ 
      error: 'Server error during registration' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }

    // Find user by email (with password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login' 
    });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching profile' 
    });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { username, bio, preferredTags, profilePicture } = req.body;
    const updates = {};

    // Username validation
    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ 
          error: 'Username must be between 3 and 30 characters' 
        });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ 
          error: 'Username can only contain letters, numbers, and underscores' 
        });
      }
      updates.username = username.toLowerCase();
    }

    // Bio validation
    if (bio !== undefined) {
      if (bio.length > 500) {
        return res.status(400).json({ 
          error: 'Bio cannot exceed 500 characters' 
        });
      }
      updates.bio = bio;
    }

    // Preferred tags validation
    if (preferredTags) {
      if (!Array.isArray(preferredTags)) {
        return res.status(400).json({ 
          error: 'Preferred tags must be an array' 
        });
      }
      if (preferredTags.length > 20) {
        return res.status(400).json({ 
          error: 'You can have at most 20 preferred tags' 
        });
      }
      updates.preferredTags = preferredTags.map(tag => tag.toLowerCase());
    }

    // Profile picture validation
    if (profilePicture !== undefined) {
      if (profilePicture && !/^https?:\/\/.+/.test(profilePicture)) {
        return res.status(400).json({ 
          error: 'Profile picture must be a valid URL' 
        });
      }
      updates.profilePicture = profilePicture;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Username already exists' 
      });
    }

    res.status(500).json({ 
      error: 'Server error while updating profile' 
    });
  }
});

// Get user stats (admin only - simplified version)
router.get('/stats', auth, async (req, res) => {
  try {
    // In a real app, you'd check if user is admin
    const stats = await User.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching stats' 
    });
  }
});

module.exports = router; 