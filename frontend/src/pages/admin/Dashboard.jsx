import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalJournals: 0
  });
  
  const [paymentsTrend, setPaymentsTrend] = useState([]);
  const [companyGrowth, setCompanyGrowth] = useState([]);
  const [journalActivity, setJournalActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [summaryRes, paymentsRes, companiesRes, journalsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/payments/trend'),
        api.get('/analytics/companies/growth'),
        api.get('/analytics/journals/activity')
      ]);

      setStats(summaryRes.data);
      setPaymentsTrend(paymentsRes.data);
      setCompanyGrowth(companiesRes.data);
      setJournalActivity(journalsRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Handle database export
  const handleExportDatabase = async () => {
    try {
      setExportLoading(true);
      const response = await api.get('/export/database', {
        responseType: 'blob' // Important for handling binary data
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'database_export.zip');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Database exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export database: ' + (error.response?.data?.error || error.message));
    } finally {
      setExportLoading(false);
    }
  };

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Card data for summary metrics
  const statCards = [
    { title: 'Total Companies', value: stats.totalCompanies, icon: '🏢', color: 'bg-blue-500' },
    { title: 'Total Payments', value: stats.totalPayments, icon: '💳', color: 'bg-green-500' },
    { title: 'Pending Payments', value: stats.pendingPayments, icon: '⏳', color: 'bg-yellow-500' },
    { title: 'Approved Payments', value: stats.approvedPayments, icon: '✅', color: 'bg-purple-500' },
    { title: 'Journal Entries', value: stats.totalJournals, icon: '📝', color: 'bg-pink-500' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <button
          onClick={handleExportDatabase}
          disabled={exportLoading}
          className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            exportLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {exportLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Database (CSV)
            </>
          )}
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3 text-white text-2xl mr-4`}>
                {card.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Payments Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Payments Trend (Last 6 Months)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paymentsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Payments" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
                <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Company Growth Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Company Growth (Last 12 Months)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="New Companies" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Journal Activity Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Journal Activity (Last 12 Weeks)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={journalActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#ef4444" name="Entries" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Payment Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: stats.pendingPayments },
                    { name: 'Approved', value: stats.approvedPayments },
                    { name: 'Total', value: stats.totalPayments }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Pending', value: stats.pendingPayments },
                    { name: 'Approved', value: stats.approvedPayments },
                    { name: 'Total', value: stats.totalPayments }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;