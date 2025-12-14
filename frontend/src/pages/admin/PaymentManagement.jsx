import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    adminRemarks: '',
    paymentScreenshot: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  
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
      const response = await api.get('/analytics/payments/stats');
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

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setStatusUpdate({
      status: payment.status,
      adminRemarks: payment.adminRemarks || '',
      paymentScreenshot: null
    });
    setPreviewUrl('');
    setShowPaymentModal(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('status', statusUpdate.status);
      formData.append('adminRemarks', statusUpdate.adminRemarks);
      if (statusUpdate.paymentScreenshot) {
        formData.append('paymentScreenshot', statusUpdate.paymentScreenshot);
      }
      
      const response = await api.patch(`/payments/${selectedPayment._id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Payment status updated successfully!');
      setShowPaymentModal(false);
      setSelectedPayment(null);
      // Refresh payments list and stats
      fetchPayments();
      fetchPaymentStats();
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStatusChange = (e) => {
    setStatusUpdate({
      ...statusUpdate,
      status: e.target.value
    });
  };

  const handleRemarksChange = (e) => {
    setStatusUpdate({
      ...statusUpdate,
      adminRemarks: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, JPEG, PNG, and PDF files are allowed!');
        e.target.value = '';
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB!');
        e.target.value = '';
        return;
      }
      
      setStatusUpdate({
        ...statusUpdate,
        paymentScreenshot: file
      });
      
      // Create preview (only for images)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDF files, we don't create a preview
        setPreviewUrl('');
      }
    }
  };

  const removeFile = () => {
    setStatusUpdate({
      ...statusUpdate,
      paymentScreenshot: null
    });
    setPreviewUrl('');
  };

  // Download payments data as CSV
  const downloadPaymentsData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/export', {
        responseType: 'blob' // Important for handling binary data
      });
      
      // Create a download link with proper filename
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'payments_export.csv'; // Default filename
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Payments data downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download payments data: ' + (error.response?.data?.error || error.message));
    } finally {
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={downloadPaymentsData}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            title="Download Payment Data (CSV)"
            disabled={payments.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
          </button>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">Total Payment: ₹{totalAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Payment Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3 text-white text-2xl mr-4">
              ⏳
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-800">{paymentStats.pending.count}</p>
              <p className="text-gray-600 text-sm">₹{paymentStats.pending.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-2xl mr-4">
              ✅
            </div>
            <div>
              <p className="text-gray-500 text-sm">Approved Payments</p>
              <p className="text-2xl font-bold text-gray-800">{paymentStats.approved.count}</p>
              <p className="text-gray-600 text-sm">₹{paymentStats.approved.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 text-white text-2xl mr-4">
              💰
            </div>
            <div>
              <p className="text-gray-500 text-sm">Paid Payments</p>
              <p className="text-2xl font-bold text-gray-800">{paymentStats.paid.count}</p>
              <p className="text-gray-600 text-sm">₹{paymentStats.paid.amount.toLocaleString()}</p>
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
                  Requested By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
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
                    {payment.createdBy?.locationId?.contactPerson || payment.createdBy?.mobileNo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
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

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Payment Request Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium">{selectedPayment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction Type:</span>
                      <span className="font-medium">{getTransactionTypeLabel(selectedPayment.transactionType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PO Number:</span>
                      <span className="font-medium">{selectedPayment.poNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice No:</span>
                      <span className="font-medium">{selectedPayment.invoiceNo || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Financial Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project Cost:</span>
                      <span className="font-medium">₹{selectedPayment.projectCost?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Handling Charges (%):</span>
                      <span className="font-medium">{selectedPayment.handlingChargesPercentage || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calculated Handling Charges:</span>
                      <span className="font-medium">₹{selectedPayment.calculatedHandlingCharges?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payable Amount:</span>
                      <span className="font-medium">₹{selectedPayment.payableAmount?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Request Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested By:</span>
                      <span className="font-medium">{selectedPayment.createdBy?.locationId?.contactPerson || selectedPayment.createdBy?.mobileNo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted Date:</span>
                      <span className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(selectedPayment.status)}`}>
                        {selectedPayment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Instructions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedPayment.instructions || 'No instructions provided.'}</p>
                </div>
              </div>
              
              {selectedPayment.adminRemarks && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Remarks</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedPayment.adminRemarks}</p>
                  </div>
                </div>
              )}
              
              {selectedPayment.screenshotURL && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Screenshot</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedPayment.screenshotFileType === 'application/pdf' ? (
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-40 h-40 flex items-center justify-center mb-4">
                          <span className="text-gray-500 font-medium">PDF File</span>
                        </div>
                        <a 
                          href={selectedPayment.screenshotURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    ) : (
                      <img src={selectedPayment.screenshotURL} alt="Payment screenshot" className="max-w-full h-auto" />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Update Form */}
            <form onSubmit={handleStatusUpdate} className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  value={statusUpdate.status}
                  onChange={handleStatusChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminRemarks">
                  Admin Remarks (Optional)
                </label>
                <textarea
                  id="adminRemarks"
                  value={statusUpdate.adminRemarks}
                  onChange={handleRemarksChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                />
              </div>
              
              {(statusUpdate.status === 'paid') && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Upload Payment Screenshot
                  </label>
                  
                  {/* Preview */}
                  {previewUrl && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm truncate">
                          {statusUpdate.paymentScreenshot ? statusUpdate.paymentScreenshot.name : 'Existing image'}
                        </span>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-40 max-w-full object-contain border rounded"
                        />
                      </div>
                    </div>
                  )}
                  {!previewUrl && statusUpdate.paymentScreenshot && statusUpdate.paymentScreenshot.type === 'application/pdf' && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm truncate">
                          {statusUpdate.paymentScreenshot.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-40 h-40 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">PDF File</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="paymentScreenshot"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                    />
                    <label
                      htmlFor="paymentScreenshot"
                      className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Choose File
                    </label>
                    <span className="ml-3 text-sm text-gray-500">
                      {statusUpdate.paymentScreenshot ? statusUpdate.paymentScreenshot.name : 'No file chosen'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Allowed file types: JPG, JPEG, PNG, PDF. Max size: 5MB.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;