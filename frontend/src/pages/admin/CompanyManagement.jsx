import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [companyStats, setCompanyStats] = useState({
    totalCompanies: 0,
    totalLocations: 0
  });
  const [locations, setLocations] = useState({});
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    contactMobile: '',
    email: '',
    mobileNo: '',
    password: ''
  });
  
  // Add state for mobile number validation errors
  const [mobileNoError, setMobileNoError] = useState('');
  const [contactMobileError, setContactMobileError] = useState('');

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch companies with pagination and search
  const fetchCompanies = async (page = 1, size = pageSize, search = debouncedSearchTerm) => {
    try {
      setLoading(true);
      const response = await api.get(`/companies?page=${page}&limit=${size}&search=${search}`);
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
    }
  };

  // Fetch company statistics
  const fetchCompanyStats = async () => {
    try {
      const response = await api.get('/analytics/summary');
      setCompanyStats({
        totalCompanies: response.data.totalCompanies,
        totalLocations: response.data.totalLocations
      });
    } catch (error) {
      console.error('Error fetching company stats:', error);
    }
  };

  useEffect(() => {
    fetchCompanies(currentPage, pageSize, debouncedSearchTerm);
    fetchCompanyStats();
  }, [currentPage, pageSize, debouncedSearchTerm]);

  const fetchLocations = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}/locations`);
      setLocations(prev => ({ ...prev, [companyId]: response.data }));
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

  const handleLocationInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for mobileNo field (Login ID)
    if (name === 'mobileNo') {
      // Remove any non-digit characters
      const numericValue = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (numericValue.length <= 10) {
        setLocationFormData({
          ...locationFormData,
          [name]: numericValue
        });
        
        // Validate the mobile number
        if (numericValue.length > 0 && numericValue.length !== 10) {
          setMobileNoError('Please enter a valid 10-digit mobile number');
        } else {
          setMobileNoError('');
        }
      }
    } 
    // Special handling for contactMobile field
    else if (name === 'contactMobile') {
      // Remove any non-digit characters
      const numericValue = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (numericValue.length <= 10) {
        setLocationFormData({
          ...locationFormData,
          [name]: numericValue
        });
        
        // Validate the mobile number
        if (numericValue.length > 0 && numericValue.length !== 10) {
          setContactMobileError('Please enter a valid 10-digit mobile number');
        } else {
          setContactMobileError('');
        }
      }
    } else {
      setLocationFormData({
        ...locationFormData,
        [name]: value
      });
    }
  };

  const handleSubmitCompany = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        // Update existing company
        await api.patch(`/companies/${editingCompany._id}`, formData);
      } else {
        // Create new company
        await api.post('/companies', formData);
      }
      setShowCompanyForm(false);
      setEditingCompany(null);
      setFormData({
        name: ''
      });
      // Refresh companies list and stats
      fetchCompanies();
      fetchCompanyStats();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    
    // Validate mobile numbers before submission
    let hasErrors = false;
    
    // Validate Login ID (Mobile No.) - only required when creating new location
    if (!editingLocation && (!locationFormData.mobileNo || locationFormData.mobileNo.length !== 10)) {
      setMobileNoError('Please enter a valid 10-digit mobile number');
      hasErrors = true;
    }
    
    // Validate Contact Mobile - if provided, must be exactly 10 digits
    if (locationFormData.contactMobile && locationFormData.contactMobile.length !== 10) {
      setContactMobileError('Please enter a valid 10-digit mobile number');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    try {
      if (editingLocation) {
        // Update existing location
        await api.patch(`/companies/${selectedCompany._id}/locations/${editingLocation._id}`, locationFormData);
      } else {
        // Create new location
        await api.post(`/companies/${selectedCompany._id}/locations`, locationFormData);
      }
      setShowLocationForm(false);
      setEditingLocation(null);
      setLocationFormData({
        name: '',
        address: '',
        contactPerson: '',
        contactMobile: '',
        email: '',
        mobileNo: '',
        password: ''
      });
      setMobileNoError(''); // Clear any error messages
      setContactMobileError(''); // Clear any error messages
      // Refresh locations list
      if (selectedCompany) {
        fetchLocations(selectedCompany._id);
      }
      // Refresh company stats
      fetchCompanyStats();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name
    });
    setShowCompanyForm(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      address: location.address || '',
      contactPerson: location.contactPerson,
      contactMobile: location.contactMobile,
      email: location.email || '',
      mobileNo: '', // Not needed for editing
      password: '' // Reset password field when editing
    });
    setShowLocationForm(true);
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This will also delete all associated locations and agents.')) {
      try {
        await api.delete(`/companies/${companyId}`);
        fetchCompanies();
        // Clear locations cache for this company
        setLocations(prev => {
          const newLocations = { ...prev };
          delete newLocations[companyId];
          return newLocations;
        });
        // Refresh company stats
        fetchCompanyStats();
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeleteLocation = async (companyId, locationId) => {
    if (window.confirm('Are you sure you want to delete this location? This will also delete the associated agent.')) {
      try {
        await api.delete(`/companies/${companyId}/locations/${locationId}`);
        // Refresh locations list
        fetchLocations(companyId);
        // Refresh company stats
        fetchCompanyStats();
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Error deleting location: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const toggleLocations = (company) => {
    if (locations[company._id]) {
      // If locations are already loaded, just toggle visibility
      setSelectedCompany(selectedCompany?._id === company._id ? null : company);
    } else {
      // Load locations and show them
      setSelectedCompany(company);
      fetchLocations(company._id);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const totalPages = pagination.totalPages;
      
      if (totalPages <= 1) return [];
      
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === pagination.totalPages 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, pagination.totalCount)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalCount}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="recordsPerPage" className="mr-2 text-sm text-gray-700">Records per page:</label>
              <select
                id="recordsPerPage"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1 ? 'cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : typeof page === 'number'
                      ? 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      : 'text-gray-700'
                  }`}
                  disabled={typeof page !== 'number'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === pagination.totalPages ? 'cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Download companies and locations data as CSV
  const downloadCompaniesData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/download', {
        responseType: 'blob' // Important for handling binary data
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'companies_locations.csv');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Companies data downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download companies data: ' + (error.response?.data?.error || error.message));
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Company Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={downloadCompaniesData}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            title="Download Company & Location Data (CSV)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
          </button>
          <button
            onClick={() => {
              setEditingCompany(null);
              setFormData({
                name: '',
                phone: '',
                email: ''
              });
              setShowCompanyForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Company
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white text-2xl mr-4">
              🏢
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Companies</p>
              <p className="text-3xl font-bold text-gray-800">{companyStats.totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 text-white text-2xl mr-4">
              📍
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Locations</p>
              <p className="text-3xl font-bold text-gray-800">{companyStats.totalLocations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Company Form Modal */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
            <form onSubmit={handleSubmitCompany}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Company Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyForm(false);
                  }}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <React.Fragment key={company._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                          title="Edit Company"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company._id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                          title="Delete Company"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setEditingLocation(null);
                            setLocationFormData({
                              name: '',
                              address: '',
                              contactPerson: '',
                              contactMobile: '',
                              email: '',
                              mobileNo: '',
                              password: ''
                            });
                            setShowLocationForm(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Add Location"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleLocations(company)}
                          className="text-blue-600 hover:text-blue-900"
                          title={selectedCompany?._id === company._id ? 'Hide Locations' : 'Show Locations'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Locations */}
                    {selectedCompany?._id === company._id && locations[company._id] && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4">
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Locations</h4>
                            {locations[company._id].length > 0 ? (
                              <div className="grid grid-cols-1 gap-4">
                                {locations[company._id].map((location) => (
                                  <div key={location._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between">
                                      <h5 className="text-lg font-medium text-gray-900">{location.name}</h5>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleEditLocation(location)}
                                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none"
                                          title="Edit Location"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLocation(company._id, location._id)}
                                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                          title="Delete Location"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Address</p>
                                        <p className="text-sm text-gray-900">{location.address}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Email ID</p>
                                        <p className="text-sm text-gray-900">{location.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Contact Person</p>
                                        <p className="text-sm text-gray-900">{location.contactPerson}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Contact Mobile</p>
                                        <p className="text-sm text-gray-900">{location.contactMobile}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Login ID (Mobile No.)</p>
                                        <p className="text-sm text-gray-900">{location.userId?.mobileNo || 'N/A'}</p>
                                      </div>

                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No locations found for this company.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>

      {/* Location Form Modal */}
      {showLocationForm && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingLocation ? 'Edit Location' : `Add Location for ${selectedCompany.name}`}</h2>
            <form onSubmit={handleSubmitLocation}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location-name">
                  Location Name
                </label>
                <input
                  type="text"
                  id="location-name"
                  name="name"
                  value={locationFormData.name}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location-address">
                  Location Address
                </label>
                <textarea
                  id="location-address"
                  name="address"
                  value={locationFormData.address}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location-email">
                  Email ID
                </label>
                <input
                  type="email"
                  id="location-email"
                  name="email"
                  value={locationFormData.email}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactPerson">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={locationFormData.contactPerson}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactMobile">
                  Contact Mobile
                </label>
                <input
                  type="tel"
                  id="contactMobile"
                  name="contactMobile"
                  value={locationFormData.contactMobile}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter 10-digit mobile number"
                  required
                />
                {contactMobileError && <p className="text-red-500 text-xs italic mt-1">{contactMobileError}</p>}
              </div>

              {!editingLocation && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobileNo">
                      Login ID (Mobile No.)
                    </label>
                    <input
                      type="tel"
                      id="mobileNo"
                      name="mobileNo"
                      value={locationFormData.mobileNo}
                      onChange={handleLocationInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter 10-digit mobile number"
                      required
                    />
                    {mobileNoError && <p className="text-red-500 text-xs italic mt-1">{mobileNoError}</p>}
                  </div>
                </>
              )}

              {/* Password field for both create and edit modes */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location-password">
                  {editingLocation ? 'Set / Reset Password' : 'Set Login Password'}
                </label>
                <input
                  type="password"
                  id="location-password"
                  name="password"
                  value={locationFormData.password}
                  onChange={handleLocationInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder={editingLocation ? "Enter new password (leave blank to keep existing password)" : "Required"}
                  {...(!editingLocation && { required: true })}
                />
                {editingLocation && (
                  <p className="text-gray-500 text-xs italic mt-1">Enter new password (leave blank to keep existing password)</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLocationForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;