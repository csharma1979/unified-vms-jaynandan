import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AgentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalProjectCost: 0,
    totalHandlingCharges: 0,
    totalPaidAmount: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    paidPayments: 0,
    advancePayments: 0
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    transactionType: '',
    poNo: '',
    invoiceNo: '',
    projectCost: '',
    handlingChargesPercentage: '',
    calculatedHandlingCharges: '',
    payableAmount: '',
    instructions: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [currentPage, pageSize]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      
      // Add pagination parameters
      params.append('page', currentPage);
      params.append('limit', pageSize);
      
      // Add search and filter parameters
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('transactionType', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/payments?${params.toString()}`);
      setPayments(response.data.payments);
      setTotalPages(response.data.pagination.totalPages);
      setTotalPayments(response.data.pagination.totalPayments);
      setTotalAmount(response.data.totalAmount);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await api.get('/analytics/agent/payments/stats');
      setPaymentStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayments();
    fetchPaymentStats();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchPayments();
    fetchPaymentStats();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate handling charges and payable amount when project cost or percentage changes
    if (name === 'projectCost' || name === 'handlingChargesPercentage') {
      const projectCost = name === 'projectCost' ? parseFloat(value) || 0 : parseFloat(formData.projectCost) || 0;
      const percentage = name === 'handlingChargesPercentage' ? parseFloat(value) || 0 : parseFloat(formData.handlingChargesPercentage) || 0;
      
      let calculatedHandlingCharges = '';
      if (projectCost && percentage) {
        calculatedHandlingCharges = ((projectCost * percentage) / 100).toFixed(2);
      }
      
      const handlingCharges = parseFloat(calculatedHandlingCharges) || 0;
      const payableAmount = projectCost - handlingCharges;
      
      setFormData({
        ...formData,
        [name]: value,
        calculatedHandlingCharges,
        payableAmount: payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'
      });
    } 
    // Auto-calculate payable amount when calculated handling charges change directly
    else if (name === 'calculatedHandlingCharges') {
      const projectCost = parseFloat(formData.projectCost) || 0;
      const handlingCharges = parseFloat(value) || 0;
      const payableAmount = projectCost - handlingCharges;
      
      setFormData({
        ...formData,
        [name]: value,
        payableAmount: payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'
      });
    }
    // For all other fields, just update the field value
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      // Close modal first, then show success message
      setShowPaymentForm(false);
      setFormData({
        transactionType: '',
        poNo: '',
        invoiceNo: '',
        projectCost: '',
        handlingChargesPercentage: '',
        calculatedHandlingCharges: '',
        payableAmount: '',
        instructions: ''
      });
      // Refresh payments list and stats
      fetchPayments();
      fetchPaymentStats();
      // Show success message after UI updates
      setTimeout(() => {
        alert('Payment request submitted successfully!');
      }, 100);
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Error submitting payment request: ' + (error.response?.data?.error || error.message));
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'advance': return 'Advance Payment';
      case 'invoice_payment': return 'Project Payment';
      case 'final_payment': return 'Partial Payment';
      default: return type;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Requests</h1>
        <div className="text-right">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Raise Payment Request
          </button>
        </div>
      </div>

      {/* Payment Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-2xl mr-4">
              💼
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Project Cost</p>
              <p className="text-2xl font-bold text-gray-800">₹{paymentStats.totalProjectCost.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-800">{paymentStats.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-2xl mr-4">
              👍
            </div>
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-2xl font-bold text-gray-800">{paymentStats.approvedPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-teal-500 rounded-lg p-3 text-white text-2xl mr-4">
              💵
            </div>
            <div>
              <p className="text-gray-500 text-sm">Paid Requests</p>
              <p className="text-2xl font-bold text-gray-800">{paymentStats.paidPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="PO/Invoice No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="advance">Advance</option>
              <option value="invoice_payment">Project</option>
              <option value="final_payment">Partial</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
        {/* Total Payment Display */}
        <div className="mt-4 text-left">
          <p className="text-sm text-gray-600">Total Payment: ₹{totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Cost
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handling Charges (%)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calculated Handling Charges
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payable Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <React.Fragment key={payment._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getTransactionTypeLabel(payment.transactionType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.poNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{payment.projectCost?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.handlingChargesPercentage || 'N/A'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{payment.calculatedHandlingCharges?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{payment.payableAmount?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                  
                  {/* Payment Screenshot Row - Only show when status is paid and screenshot exists */}
                  {payment.status === 'paid' && payment.screenshotURL && (
                    <tr className="bg-gray-50">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">Payment Proof:</span>
                          {payment.screenshotFileType === 'application/pdf' ? (
                            <a 
                              href={payment.screenshotURL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <a 
                              href={payment.screenshotURL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              View Screenshot
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payment requests found.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Page Size:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            Showing {Math.min(pageSize, totalPayments - (currentPage - 1) * pageSize)} of {totalPayments} payments
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Payment Request Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Raise Payment Request</h2>
            <form onSubmit={handleSubmitPayment}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transactionType">
                  Select Payment Type
                </label>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Payment Type</option>
                  <option value="advance">Advance Payment</option>
                  <option value="invoice_payment">Project Payment</option>
                  <option value="final_payment">Partial Payment</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="poNo">
                  PO Number
                </label>
                <input
                  type="text"
                  id="poNo"
                  name="poNo"
                  value={formData.poNo}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceNo">
                  Invoice No. (Optional)
                </label>
                <input
                  type="text"
                  id="invoiceNo"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectCost">
                  Project Cost
                </label>
                <input
                  type="number"
                  id="projectCost"
                  name="projectCost"
                  value={formData.projectCost}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="handlingChargesPercentage">
                  Handling Charges (%)
                </label>
                <input
                  type="number"
                  id="handlingChargesPercentage"
                  name="handlingChargesPercentage"
                  value={formData.handlingChargesPercentage}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  step="0.01"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="calculatedHandlingCharges">
                  Calculated Handling Charges
                </label>
                <input
                  type="text"
                  id="calculatedHandlingCharges"
                  name="calculatedHandlingCharges"
                  value={formData.calculatedHandlingCharges}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payableAmount">
                  Payable Amount
                </label>
                <input
                  type="text"
                  id="payableAmount"
                  name="payableAmount"
                  value={formData.payableAmount || ''}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="instructions">
                  Instruction Note
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPayments;