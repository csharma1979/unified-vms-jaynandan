import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AgentInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockInvoices = [
          {
            _id: 'inv1',
            invoiceNo: 'INV-230515-001',
            companyId: { name: 'ABC Corporation' },
            locationId: { name: 'Mumbai Branch' },
            amount: 50000,
            gst: 9000,
            description: 'Software development services',
            status: 'sent',
            createdAt: '2023-05-15T10:30:00Z',
            history: [
              { status: 'draft', timestamp: '2023-05-14T09:00:00Z' },
              { status: 'sent', timestamp: '2023-05-15T10:30:00Z' }
            ]
          },
          {
            _id: 'inv2',
            invoiceNo: 'INV-230516-002',
            companyId: { name: 'XYZ Enterprises' },
            locationId: { name: 'Delhi Office' },
            amount: 75000,
            gst: 13500,
            description: 'Consulting services',
            status: 'approved',
            createdAt: '2023-05-16T14:45:00Z',
            history: [
              { status: 'draft', timestamp: '2023-05-15T11:00:00Z' },
              { status: 'sent', timestamp: '2023-05-16T09:15:00Z' },
              { status: 'approved', timestamp: '2023-05-16T14:45:00Z' }
            ]
          }
        ];
        setInvoices(mockInvoices);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = (invoice) => {
    setSelectedInvoice(invoice);
    setNewStatus(invoice.status);
    setShowStatusModal(true);
  };

  const submitStatusUpdate = async () => {
    try {
      // Simulate API call
      console.log('Updating invoice status:', { invoiceId: selectedInvoice._id, status: newStatus });
      alert('Invoice status updated successfully!');
      setShowStatusModal(false);
      setSelectedInvoice(null);
      setNewStatus('');
      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating invoice status');
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statuses = [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'approved', label: 'Approved' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }
    ];

    // Filter available statuses based on current status
    switch (currentStatus) {
      case 'draft':
        return statuses.filter(s => ['sent', 'approved', 'in_progress', 'completed'].includes(s.value));
      case 'sent':
        return statuses.filter(s => ['approved', 'in_progress', 'completed'].includes(s.value));
      case 'approved':
        return statuses.filter(s => ['in_progress', 'completed'].includes(s.value));
      case 'in_progress':
        return statuses.filter(s => ['completed'].includes(s.value));
      case 'completed':
        return []; // No further status changes allowed
      default:
        return statuses;
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Invoices</h1>

      {/* Invoices List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <li key={invoice._id}>
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {invoice.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(invoice.status)}`}>
                      {invoice.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {invoice.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(invoice)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-sm text-gray-900">{invoice.companyId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">{invoice.locationId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-sm text-gray-900">₹{invoice.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">GST</p>
                    <p className="text-sm text-gray-900">₹{invoice.gst.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="text-sm text-gray-900">
                    {new Date(invoice.createdAt).toLocaleDateString()} at {new Date(invoice.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {invoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No invoices found.</p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Update Invoice Status</h2>
            <div className="mb-4">
              <p className="text-gray-700"><strong>Invoice:</strong> {selectedInvoice.invoiceNo}</p>
              <p className="text-gray-700"><strong>Current Status:</strong> {selectedInvoice.status.replace('_', ' ').toUpperCase()}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                New Status
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Status</option>
                {getStatusOptions(selectedInvoice.status).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusUpdate}
                disabled={!newStatus || newStatus === selectedInvoice.status}
                className={`font-bold py-2 px-4 rounded ${!newStatus || newStatus === selectedInvoice.status ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInvoices;