import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const JournalManagement = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [paginatedEntries, setPaginatedEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    mode: '',
    narration: '',
    screenshotUrl: ''
  });
  const [paymentEvidence, setPaymentEvidence] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [journalEntries, searchTerm, filterMode, startDate, endDate]);

  useEffect(() => {
    paginateEntries();
  }, [filteredEntries, currentPage, pageSize]);

  const fetchJournalEntries = async () => {
    try {
      const response = await api.get('/journal');
      setJournalEntries(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = journalEntries;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.name.toLowerCase().includes(term) ||
        entry.narration.toLowerCase().includes(term) ||
        entry.amount.toString().includes(term)
      );
    }

    // Apply mode filter
    if (filterMode) {
      filtered = filtered.filter(entry => entry.mode === filterMode);
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(entry => new Date(entry.createdAt) >= start);
    }

    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => new Date(entry.createdAt) <= end);
    }

    setFilteredEntries(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const paginateEntries = () => {
    const total = filteredEntries.length;
    const pages = Math.ceil(total / pageSize);
    setTotalPages(pages);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredEntries.slice(startIndex, endIndex);
    
    setPaginatedEntries(paginated);
  };

  const calculateTotalAmount = () => {
    return filteredEntries.reduce((total, entry) => total + entry.amount, 0);
  };

  const downloadCSV = () => {
    if (filteredEntries.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Entry Name', 'Payment Mode', 'Narration', 'Amount (₹)'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        `"${new Date(entry.createdAt).toLocaleDateString()}"`,
        `"${entry.name}"`,
        `"${getModeLabel(entry.mode)}"`,
        `"${entry.narration}"`,
        entry.amount
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `journal_entries_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleModeFilterChange = (e) => {
    setFilterMode(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMode('');
    setStartDate('');
    setEndDate('');
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setPaymentEvidence(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setPaymentEvidence(null);
    setPreviewUrl('');
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Append file if exists
      if (paymentEvidence) {
        formDataToSend.append('paymentEvidence', paymentEvidence);
      }

      if (editingEntry) {
        // Update existing entry
        await api.patch(`/journal/${editingEntry._id}`, formDataToSend);
      } else {
        // Create new entry
        await api.post('/journal', formDataToSend);
      }
      
      setShowEntryForm(false);
      setEditingEntry(null);
      setFormData({
        name: '',
        amount: '',
        mode: '',
        narration: '',
        screenshotUrl: ''
      });
      setPaymentEvidence(null);
      setPreviewUrl('');
      
      // Refresh journal entries list
      fetchJournalEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Error saving journal entry: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      amount: entry.amount,
      mode: entry.mode,
      narration: entry.narration,
      screenshotUrl: entry.screenshotUrl || ''
    });
    setPaymentEvidence(null);
    setPreviewUrl(entry.screenshotUrl || '');
    setShowEntryForm(true);
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await api.delete(`/journal/${entryId}`);
        // Refresh journal entries list
        fetchJournalEntries();
      } catch (error) {
        console.error('Error deleting journal entry:', error);
        alert('Error deleting journal entry: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'cash': return 'Cash';
      case 'transfer': return 'Bank Transfer';
      case 'upi': return 'UPI';
      case 'cheque': return 'Cheque';
      default: return mode;
    }
  };

  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
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

    if (totalPages <= 1) return null;

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
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === totalPages 
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
                {Math.min(currentPage * pageSize, filteredEntries.length)}
              </span>{' '}
              of <span className="font-medium">{filteredEntries.length}</span> results
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
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : ''
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Journal Management</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-blue-800">₹{totalAmount.toLocaleString()}</p>
          </div>
          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                name: '',
                amount: '',
                mode: '',
                narration: '',
                screenshotUrl: ''
              });
              setPaymentEvidence(null);
              setPreviewUrl('');
              setShowEntryForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Entry
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={filterMode}
              onChange={handleModeFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition duration-150 ease-in-out"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={downloadCSV}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition duration-150 ease-in-out"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Journal Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingEntry ? 'Edit Journal Entry' : 'Add New Journal Entry'}</h2>
            <form onSubmit={handleSubmitEntry}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Entry Name
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mode">
                  Payment Mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="narration">
                  Narration
                </label>
                <textarea
                  id="narration"
                  name="narration"
                  value={formData.narration}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              {/* Payment Evidence Upload */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Payment Evidence
                </label>
                
                {/* Preview */}
                {previewUrl && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm truncate">
                        {paymentEvidence ? paymentEvidence.name : 'Existing image'}
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
                
                {/* Drag and Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-gray-600">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, JPEG, PNG up to 5MB
                    </p>
                  </div>
                </div>
                
                {/* Manual URL Input */}
                <div className="mt-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="screenshotUrl">
                    Or enter image URL
                  </label>
                  <input
                    type="text"
                    id="screenshotUrl"
                    name="screenshotUrl"
                    value={formData.screenshotUrl}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Entries Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Narration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (₹)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Evidence
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getModeLabel(entry.mode)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {entry.narration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{entry.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.screenshotUrl ? (
                        <a 
                          href={entry.screenshotUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Image
                        </a>
                      ) : (
                        'No evidence'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No journal entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  );
};

export default JournalManagement;