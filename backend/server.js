const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 4000;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',      // Development frontend
    'http://localhost:30000',     // Development frontend port
    'http://209.145.53.86:30000', // Production frontend
    'http://209.145.53.86',       // Production server root
    'https://209.145.53.86:30000', // Production frontend with HTTPS
    'https://209.145.53.86'       // Production server root with HTTPS
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/service_business_management')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const journalRoutes = require('./routes/journal');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

app.get('/', (req, res) => {
  res.send('Service Business Management API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});