const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const Journal = require('../models/Journal');
const Location = require('../models/Location');
const { auth } = require('../middleware/auth');

// Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const [
      totalCompanies,
      totalLocations,
      totalPayments,
      pendingPayments,
      approvedPayments,
      totalJournals
    ] = await Promise.all([
      Company.countDocuments(),
      Location.countDocuments(),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'approved' }),
      Journal.countDocuments()
    ]);

    res.json({
      totalCompanies,
      totalLocations,
      totalPayments,
      pendingPayments,
      approvedPayments,
      totalJournals
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ message: 'Error fetching summary statistics' });
  }
});

// Get agent-specific payment statistics
router.get('/agent/payments/stats', auth, async (req, res) => {
  try {
    // Agents can only see their own payments
    const filter = { createdBy: req.user._id };

    // Get counts for each status and transaction type
    const [
      totalPayments,
      pendingPayments,
      approvedPayments,
      paidPayments,
      rejectedPayments,
      advancePayments
    ] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.countDocuments({ ...filter, status: 'pending' }),
      Payment.countDocuments({ ...filter, status: 'approved' }),
      Payment.countDocuments({ ...filter, status: 'paid' }),
      Payment.countDocuments({ ...filter, status: 'rejected' }),
      Payment.countDocuments({ ...filter, transactionType: 'advance' })
    ]);

    // Get total paid amount
    const paidAmountResult = await Payment.aggregate([
      { $match: { ...filter, status: 'paid' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$calculatedHandlingCharges' }
        }
      }
    ]);

    // Get total project cost and total handling charges
    const financialStatsResult = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalProjectCost: { $sum: '$projectCost' },
          totalHandlingCharges: { $sum: '$calculatedHandlingCharges' }
        }
      }
    ]);

    const totalPaidAmount = paidAmountResult.length > 0 ? paidAmountResult[0].totalAmount : 0;
    const totalProjectCost = financialStatsResult.length > 0 ? financialStatsResult[0].totalProjectCost : 0;
    const totalHandlingCharges = financialStatsResult.length > 0 ? financialStatsResult[0].totalHandlingCharges : 0;

    res.json({
      totalPayments,
      pendingPayments,
      approvedPayments,
      paidPayments,
      rejectedPayments,
      advancePayments,
      totalPaidAmount,
      totalProjectCost,
      totalHandlingCharges
    });
  } catch (error) {
    console.error('Error fetching agent payment stats:', error);
    res.status(500).json({ message: 'Error fetching agent payment statistics' });
  }
});

// Get agent payment trend data (last 6 months)
router.get('/agent/payments/trend', auth, async (req, res) => {
  try {
    // Agents can only see their own payments
    const filter = { createdBy: req.user._id };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payments = await Payment.find({
      ...filter,
      createdAt: { $gte: sixMonthsAgo }
    }).select('createdAt status calculatedHandlingCharges');

    // Group by month
    const trendData = {};
    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!trendData[month]) {
        trendData[month] = { 
          month, 
          total: 0, 
          pending: 0, 
          approved: 0, 
          paid: 0,
          totalAmount: 0,
          paidAmount: 0
        };
      }
      trendData[month].total++;
      trendData[month][payment.status]++;
      trendData[month].totalAmount += payment.calculatedHandlingCharges || 0;
      if (payment.status === 'paid') {
        trendData[month].paidAmount += payment.calculatedHandlingCharges || 0;
      }
    });

    // Convert to array and sort by month
    const result = Object.values(trendData).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching agent payments trend:', error);
    res.status(500).json({ message: 'Error fetching agent payments trend data' });
  }
});

// Get payment statistics with amounts
router.get('/payments/stats', async (req, res) => {
  try {
    // Get counts and amounts for each status
    const pendingStats = await Payment.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$calculatedHandlingCharges' }
        }
      }
    ]);

    const approvedStats = await Payment.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$calculatedHandlingCharges' }
        }
      }
    ]);

    const paidStats = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$calculatedHandlingCharges' }
        }
      }
    ]);

    // Get total payments count
    const totalPayments = await Payment.countDocuments();

    res.json({
      pending: {
        count: pendingStats.length > 0 ? pendingStats[0].count : 0,
        amount: pendingStats.length > 0 ? pendingStats[0].totalAmount : 0
      },
      approved: {
        count: approvedStats.length > 0 ? approvedStats[0].count : 0,
        amount: approvedStats.length > 0 ? approvedStats[0].totalAmount : 0
      },
      paid: {
        count: paidStats.length > 0 ? paidStats[0].count : 0,
        amount: paidStats.length > 0 ? paidStats[0].totalAmount : 0
      },
      total: totalPayments
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Error fetching payment statistics' });
  }
});

// Get payments trend data (last 6 months)
router.get('/payments/trend', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payments = await Payment.find({
      createdAt: { $gte: sixMonthsAgo }
    }).select('createdAt status');

    // Group by month
    const trendData = {};
    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!trendData[month]) {
        trendData[month] = { month, total: 0, pending: 0, approved: 0, paid: 0 };
      }
      trendData[month].total++;
      trendData[month][payment.status]++;
    });

    // Convert to array and sort by month
    const result = Object.values(trendData).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching payments trend:', error);
    res.status(500).json({ message: 'Error fetching payments trend data' });
  }
});

// Get company growth data (monthly)
router.get('/companies/growth', async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const companies = await Company.find({
      createdAt: { $gte: twelveMonthsAgo }
    }).select('createdAt');

    // Group by month
    const growthData = {};
    companies.forEach(company => {
      const month = company.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!growthData[month]) {
        growthData[month] = { month, count: 0 };
      }
      growthData[month].count++;
    });

    // Convert to array and sort by month
    const result = Object.values(growthData).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching company growth data:', error);
    res.status(500).json({ message: 'Error fetching company growth data' });
  }
});

// Get journal activity data (weekly)
router.get('/journals/activity', async (req, res) => {
  try {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

    const journals = await Journal.find({
      createdAt: { $gte: twelveWeeksAgo }
    }).select('createdAt');

    // Group by week
    const activityData = {};
    journals.forEach(journal => {
      // Get week number
      const date = new Date(journal.createdAt);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
      const week = Math.ceil(days / 7);
      const yearWeek = `${date.getFullYear()}-W${week}`;

      if (!activityData[yearWeek]) {
        activityData[yearWeek] = { week: yearWeek, count: 0 };
      }
      activityData[yearWeek].count++;
    });

    // Convert to array and sort
    const result = Object.values(activityData).sort((a, b) => 
      a.week.localeCompare(b.week)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching journal activity data:', error);
    res.status(500).json({ message: 'Error fetching journal activity data' });
  }
});

module.exports = router;