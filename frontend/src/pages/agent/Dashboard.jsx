import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AgentDashboard = () => {
  const [stats, setStats] = useState({
    paymentRequests: 0
  });
  
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    paidPayments: 0,
    totalPaidAmount: 0
  });
  
  const [paymentTrend, setPaymentTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [dashboardRes, paymentStatsRes, paymentTrendRes] = await Promise.all([
        // Simulate existing dashboard data
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: {
                stats: {
                  paymentRequests: 7
                }
              }
            });
          }, 1000);
        }),
        // Fetch payment statistics
        api.get('/analytics/agent/payments/stats'),
        // Fetch payment trend data
        api.get('/analytics/agent/payments/trend')
      ]);

      // Set existing dashboard data
      setStats(dashboardRes.data.stats);
      
      // Set payment statistics
      setPaymentStats(paymentStatsRes.data);
      
      // Set payment trend data
      setPaymentTrend(paymentTrendRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Agent Dashboard</h1>
      
      {/* Payment Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-2xl mr-4">
              💳
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Payment Requests</p>
              <p className="text-3xl font-bold text-gray-800">{paymentStats.totalPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3 text-white text-2xl mr-4">
              ⏳
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-800">{paymentStats.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 text-white text-2xl mr-4">
              ✅
            </div>
            <div>
              <p className="text-gray-500 text-sm">Approved Payments</p>
              <p className="text-3xl font-bold text-gray-800">{paymentStats.approvedPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 text-white text-2xl mr-4">
              💰
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Paid Amount</p>
              <p className="text-3xl font-bold text-gray-800">₹{paymentStats.totalPaidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Trend Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Activity Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalAmount" 
                name="Total Amount" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="paidAmount" 
                name="Paid Amount" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Payment Requests Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Requests</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-center text-gray-700">You have <span className="font-bold text-indigo-600">{stats.paymentRequests}</span> pending payment requests</p>
          <div className="mt-4 flex justify-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              View Payment Requests
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AgentDashboard;