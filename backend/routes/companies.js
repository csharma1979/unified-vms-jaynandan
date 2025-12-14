const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const Company = require('../models/Company');
const Location = require('../models/Location');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const csv = require('csv-stringify');

// Export all companies with their locations as CSV
router.get('/download', adminAuth, async (req, res) => {
  try {
    // Fetch all companies
    const companies = await Company.find({}).lean();
    
    // Fetch all locations and populate company details
    const locations = await Location.find({}).populate('companyId userId').lean();
    
    // Create a map of companyId to locations for easier lookup
    const companyLocationsMap = {};
    locations.forEach(location => {
      const companyId = location.companyId ? location.companyId._id.toString() : null;
      if (companyId) {
        if (!companyLocationsMap[companyId]) {
          companyLocationsMap[companyId] = [];
        }
        companyLocationsMap[companyId].push(location);
      }
    });
    
    // Prepare data for CSV - flatten companies with their locations
    const csvData = [];
    
    // Add header row
    csvData.push([
      'Company ID', 'Company Name', 'Company Phone', 'Company Email',
      'Location ID', 'Location Name', 'Location Address', 'Location Email',
      'Contact Person', 'Contact Mobile', 'Account Manager', 'Agent Login Mobile'
    ]);
    
    // Process each company
    for (const company of companies) {
      const companyId = company._id.toString();
      const companyLocations = companyLocationsMap[companyId] || [];
      
      if (companyLocations.length > 0) {
        // If company has locations, create a row for each location
        for (const location of companyLocations) {
          csvData.push([
            company._id,
            company.name,
            company.phone,
            company.email,
            location._id,
            location.name,
            location.address,
            location.email,
            location.contactPerson,
            location.contactMobile,
            location.userId ? location.userId._id : '',
            location.userId ? location.userId.mobileNo : ''
          ]);
        }
      } else {
        // If company has no locations, create a row with blank location fields
        csvData.push([
          company._id,
          company.name,
          company.phone,
          company.email,
          '', // Location ID
          '', // Location Name
          '', // Location Address
          '', // Location Email
          '', // Contact Person
          '', // Contact Mobile
          '', // Account Manager
          ''  // Agent Login Mobile
        ]);
      }
    }
    
    // Convert to CSV
    csv.stringify(csvData, (err, output) => {
      if (err) {
        return res.status(500).send({ error: 'Failed to generate CSV: ' + err.message });
      }
      
      // Set headers for CSV download
      res.header('Content-Type', 'text/csv');
      res.attachment('companies_locations.csv');
      res.send(output);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send({ error: 'Failed to export companies data: ' + error.message });
  }
});

// Create a new company (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name } = req.body;

    // Create company
    const company = new Company({
      name
    });

    await company.save();

    res.status(201).send(company);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all companies with pagination, search, and filtering (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build search query
    let searchQuery = {};
    if (search) {
      // First, find locations that match the search term
      const locationMatches = await Location.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { contactMobile: { $regex: search, $options: 'i' } }
        ]
      }).select('_id companyId');
      
      // Extract company IDs from matching locations
      const companyIdsFromLocations = locationMatches.map(location => location.companyId);
      
      // Build search query that includes both company and location data
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { _id: { $in: companyIdsFromLocations } }
        ]
      };
    }
    
    // Get total count for pagination
    const totalCount = await Company.countDocuments(searchQuery);
    
    // Get paginated results
    const companies = await Company.find(searchQuery)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.send({
      companies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a specific company (Admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }
    
    res.send(company);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update a company (Admin only)
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }
    
    res.send(company);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Delete a company (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }
    
    // Also delete associated locations
    await Location.deleteMany({ companyId: company._id });
    
    res.send(company);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Create a location for a company (Admin only)
router.post('/:companyId/locations', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }
    
    const { name, address, email, contactPerson, contactMobile, mobileNo, password } = req.body;
    
    // Validate Login ID (Mobile No.) - must be exactly 10 digits
    if (!mobileNo || mobileNo.length !== 10 || !/^\d{10}$/.test(mobileNo)) {
      return res.status(400).send({ error: 'Please enter a valid 10-digit mobile number for Login ID' });
    }
    
    // Validate Contact Mobile - if provided, must be exactly 10 digits
    if (contactMobile && (contactMobile.length !== 10 || !/^\d{10}$/.test(contactMobile))) {
      return res.status(400).send({ error: 'Please enter a valid 10-digit mobile number for Contact Mobile' });
    }
    
    // Check if Login ID mobile number already exists
    const existingUser = await User.findOne({ mobileNo });
    if (existingUser) {
      return res.status(400).send({ error: 'This mobile number is already registered as Login ID' });
    }
    
    // Create location
    const location = new Location({
      companyId: company._id,
      name,
      address,
      email,
      contactPerson,
      contactMobile
    });
    
    await location.save();
    
    // Create agent user for this location
    const saltRounds = 8;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const agentUser = new User({
      role: 'agent',
      mobileNo: mobileNo,
      passwordHash: hashedPassword,
      companyId: company._id,
      locationId: location._id
    });
    
    await agentUser.save();
    
    // Update location with userId
    location.userId = agentUser._id;
    await location.save();
    
    res.status(201).send({ location, agentUser });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all locations for a company (Admin only)
router.get('/:companyId/locations', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    
    if (!company) {
      return res.status(404).send({ error: 'Company not found' });
    }
    
    const locations = await Location.find({ companyId: company._id }).populate('userId', 'mobileNo');
    res.send(locations);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update a location (Admin only)
router.patch('/:companyId/locations/:locationId', adminAuth, async (req, res) => {
  try {
    // Extract password and contactMobile from request body
    const { password, contactMobile, ...locationData } = req.body;
    
    // Validate Contact Mobile - if provided, must be exactly 10 digits
    if (contactMobile !== undefined) {
      if (contactMobile.length !== 10 || !/^\d{10}$/.test(contactMobile)) {
        return res.status(400).send({ error: 'Please enter a valid 10-digit mobile number for Contact Mobile' });
      }
      locationData.contactMobile = contactMobile;
    }
    
    // Only allow updating specific fields for security
    const allowedUpdates = ['name', 'address', 'email', 'contactPerson', 'contactMobile'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (locationData[key] !== undefined) {
        updates[key] = locationData[key];
      }
    }
    
    const location = await Location.findOneAndUpdate(
      { _id: req.params.locationId, companyId: req.params.companyId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!location) {
      return res.status(404).send({ error: 'Location not found' });
    }
    
    // If password is provided, update the password for the agent user associated with this location
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const User = require('../models/User');
      
      // Hash the new password
      const saltRounds = 8;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update password for the agent user associated with this location
      if (location.userId) {
        await User.findByIdAndUpdate(
          location.userId,
          { passwordHash: hashedPassword },
          { new: true, runValidators: true }
        );
      }
    }
    
    res.send(location);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Delete a location (Admin only)
router.delete('/:companyId/locations/:locationId', adminAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({
      _id: req.params.locationId,
      companyId: req.params.companyId
    });
    
    if (!location) {
      return res.status(404).send({ error: 'Location not found' });
    }
    
    // Also delete associated agent user
    await User.findByIdAndDelete(location.userId);
    
    res.send(location);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;