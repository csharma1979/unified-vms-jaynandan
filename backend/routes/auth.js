const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Unified login endpoint for both Admin and Agent
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Check for fixed admin credentials first
    // Updated to handle both admin users with their respective passwords
    if ((identifier === '9986028369' && password === 'Eha@123#$') || 
        (identifier === '8007633000' && password === 'Reshma@123#')) {
      // Create or update admin user in database
      let adminUser = await User.findOne({ mobileNo: identifier });
      
      if (!adminUser) {
        // Create admin user if not exists
        adminUser = new User({
          role: 'admin',
          mobileNo: identifier,
          passwordHash: await bcrypt.hash(password, 8)
        });
        await adminUser.save();
      } else {
        // Update password if it's the existing admin user (9986028369)
        // Only update if the password doesn't match the new one
        const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
        if (!isMatch && identifier === '9986028369') {
          adminUser.passwordHash = await bcrypt.hash(password, 8);
          await adminUser.save();
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: adminUser._id, role: 'admin' },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );

      return res.send({
        user: {
          _id: adminUser._id,
          role: adminUser.role,
          mobileNo: adminUser.mobileNo
        },
        token
      });
    }

    // Check for agent user or admin users stored in database
    const user = await User.findOne({ 
      $or: [
        { mobileNo: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    // Return user data based on role
    if (user.role === 'admin') {
      res.send({
        user: {
          _id: user._id,
          role: user.role,
          mobileNo: user.mobileNo
        },
        token
      });
    } else if (user.role === 'agent') {
      res.send({
        user: {
          _id: user._id,
          role: user.role,
          mobileNo: user.mobileNo,
          companyId: user.companyId,
          locationId: user.locationId
        },
        token
      });
    } else {
      return res.status(401).send({ error: 'Invalid user role' });
    }
  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Import auth middleware
const { auth } = require('../middleware/auth');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Get user from request (added by auth middleware)
    const user = req.user;
    
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    
    // For agents, try to fetch location details
    if (user.role === 'agent') {
      try {
        const Location = require('../models/Location');
        // Find location by userId
        const location = await Location.findOne({ userId: user._id }).populate('userId');
        
        if (location && location.userId) {
          // Return enriched user data with location details
          return res.send({
            _id: user._id,
            role: user.role,
            name: location.contactPerson,
            email: location.email,
            mobileNo: location.userId.mobileNo,
            locationId: location._id,
            companyId: location.companyId
          });
        }
      } catch (locationError) {
        console.error('Error fetching location for agent:', locationError.message);
        // Continue with basic user data if location fetch fails
      }
    }
    
    // For admins, return appropriate admin data
    if (user.role === 'admin') {
      return res.send({
        _id: user._id,
        role: user.role,
        name: 'Administrator',
        email: `${user.mobileNo}@admin.com`,
        mobileNo: user.mobileNo
      });
    }
    
    // For agents without location or other cases, return basic user data
    res.send({
      _id: user._id,
      role: user.role,
      name: user.name || user.mobileNo,
      email: user.email || `${user.mobileNo}@agent.com`,
      mobileNo: user.mobileNo,
      ...(user.companyId && { companyId: user.companyId }),
      ...(user.locationId && { locationId: user.locationId })
    });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Debug endpoint to check location details
router.get('/debug-location/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const Location = require('../models/Location');
    
    // Find location by userId
    const location = await Location.findOne({ userId }).populate('userId');
    
    res.send({
      location,
      userId
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Keep existing endpoints for backward compatibility (optional)
// Admin login with fixed credentials
router.post('/admin-login', async (req, res) => {
  console.log('Admin login request received');
  try {
    const { uid, password } = req.body;
    console.log('Request body:', req.body);

    // Check for fixed admin credentials
    // Updated to handle both admin users with their respective passwords
    if ((uid === '9986028369' && password === 'Eha@123#$') || 
        (uid === '8007633000' && password === 'Reshma@123#')) {
      console.log('Valid admin credentials');
      // Create or update admin user in database
      let adminUser = await User.findOne({ mobileNo: uid });
      console.log('Admin user found:', adminUser);
      
      if (!adminUser) {
        // Create admin user if not exists
        adminUser = new User({
          role: 'admin',
          mobileNo: uid,
          passwordHash: await bcrypt.hash(password, 8)
        });
        console.log('Creating new admin user');
        await adminUser.save();
        console.log('Admin user created:', adminUser);
      } else {
        // Update password if it's the existing admin user (9986028369)
        // Only update if the password doesn't match the new one
        const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
        if (!isMatch && uid === '9986028369') {
          adminUser.passwordHash = await bcrypt.hash(password, 8);
          await adminUser.save();
        }
      }

      // Generate JWT token
      console.log('Generating JWT token');
      const token = jwt.sign(
        { userId: adminUser._id, role: 'admin' },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );
      console.log('JWT token generated:', token);

      console.log('Sending response');
      return res.send({
        user: {
          _id: adminUser._id,
          role: adminUser.role,
          mobileNo: adminUser.mobileNo
        },
        token
      });
    }

    res.status(401).send({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Error in admin login:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Agent login
router.post('/agent-login', async (req, res) => {
  try {
    const { mobileNo, password } = req.body;

    // Find agent user
    const user = await User.findOne({ mobileNo, role: 'agent' });

    if (!user) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: 'agent' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    res.send({
      user: {
        _id: user._id,
        role: user.role,
        mobileNo: user.mobileNo,
        companyId: user.companyId,
        locationId: user.locationId
      },
      token
    });
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});

module.exports = router;