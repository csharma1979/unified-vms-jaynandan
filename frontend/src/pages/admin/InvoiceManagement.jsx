import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    company: '',
    location: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [formData, setFormData] = useState({
    companyId: '',
    locationId: '',
    amount: '',
    gst: '',
    description: ''
  });
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
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

  const fetchCompanies = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockCompanies = [
          { _id: 'comp1', name: 'ABC Corporation' },
          { _id: 'comp2', name: 'XYZ Enterprises' }
        ];
        setCompanies(mockCompanies);
      }, 500);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchLocations = async (companyId) => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockLocations = {
          'comp1': [
            { _id: 'loc1', name: 'Mumbai Branch' },
            { _id: 'loc2', name: 'Chennai Office' }
          ],
          'comp2': [
            { _id: 'loc3', name: 'Delhi Office' },
            { _id: 'loc4', name: 'Bangalore Branch' }
          ]
        };
        setLocations(mockLocations[companyId] || []);
      }, 500);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setFormData({
      ...formData,
      companyId,
      locationId: ''
    });
    
    if (companyId) {
      fetchLocations(companyId);
    } else {
      setLocations([]);
    }
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call
      console.log('Creating invoice:', formData);
      alert('Invoice created successfully!');
      setShowInvoiceForm(false);
      setFormData({
        companyId: '',
        locationId: '',
        amount: '',
        gst: '',
        description: ''
      });
      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice');
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

  const filteredInvoices = invoices.filter(invoice => {
    if (filter.company && invoice.companyId.name !== filter.company) return false;
    if (filter.location && invoice.locationId.name !== filter.location) return false;
    if (filter.status && invoice.status !== filter.status) return false;
    // Add date filtering logic here if needed
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-800">Invoice Management</h1>
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Invoice
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Invoices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              name="company"
              value={filter.company}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company._id} value={company.name}>{company.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              name="location"
              value={filter.location}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location._id} value={location.name}>{location.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filter.dateFrom}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filter.dateTo}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Invoice</h2>
            <form onSubmit={handleSubmitInvoice}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyId">
                  Company
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleCompanyChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>{company.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="locationId">
                  Location
                </label>
                <select
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  disabled={!formData.companyId}
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location._id} value={location._id}>{location.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gst">
                  GST (₹)
                </label>
                <input
                  type="number"
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredInvoices.map((invoice) => (
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(invoice.status)}`}>
                    {invoice.status.replace('_', ' ').toUpperCase()}
                  </span>
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
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No invoices found matching the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;