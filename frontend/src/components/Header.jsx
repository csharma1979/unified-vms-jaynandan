import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/profile');
          setUserProfile(response.data);
          // Also update localStorage with latest profile data
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserProfile(storedUser);
      }
    };

    fetchUserProfile();
  }, []);

  // Check if we're on the login page
  const isLoginPage = location.pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Minimal header for login page
  if (isLoginPage) {
    return (
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="bg-white text-blue-600 font-bold text-xl p-2 rounded hover:bg-gray-100 transition-colors">
              SBM
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {userProfile?.role === 'admin' ? (
            <Link to="/admin/dashboard" className="bg-white text-blue-600 font-bold text-xl p-2 rounded hover:bg-gray-100 transition-colors">
              SBM
            </Link>
          ) : userProfile?.role === 'agent' ? (
            <Link to="/agent/dashboard" className="bg-white text-blue-600 font-bold text-xl p-2 rounded hover:bg-gray-100 transition-colors">
              SBM
            </Link>
          ) : (
            <div className="bg-white text-blue-600 font-bold text-xl p-2 rounded">
              SBM
            </div>
          )}
        </div>
        
        {/* Hamburger Menu Button (Mobile) */}
        <button 
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {userProfile?.role === 'admin' ? (
            <>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    to="/admin/dashboard" 
                    className={`hover:text-blue-200 ${isActive('/admin/dashboard') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/companies" 
                    className={`hover:text-blue-200 ${isActive('/admin/companies') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Companies
                  </Link>
                </li>
                {/* Temporarily hidden: <li><Link to="/admin/invoices" className="hover:text-blue-200">Invoices</Link></li> */}
                <li>
                  <Link 
                    to="/admin/payments" 
                    className={`hover:text-blue-200 ${isActive('/admin/payments') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Payments
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/journal" 
                    className={`hover:text-blue-200 ${isActive('/admin/journal') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Journal
                  </Link>
                </li>
              </ul>
            </>
          ) : userProfile?.role === 'agent' ? (
            <>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    to="/agent/dashboard" 
                    className={`hover:text-blue-200 ${isActive('/agent/dashboard') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                {/* Temporarily hidden: <li><Link to="/agent/invoices" className="hover:text-blue-200">Invoices</Link></li> */}
                <li>
                  <Link 
                    to="/agent/payments" 
                    className={`hover:text-blue-200 ${isActive('/agent/payments') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                  >
                    Payments
                  </Link>
                </li>
              </ul>
            </>
          ) : (
            <ul className="flex space-x-6">
              <li>
                <Link 
                  to="/" 
                  className={`hover:text-blue-200 ${isActive('/') ? 'font-bold text-white border-b-2 border-white pb-1' : ''}`}
                >
                  Login
                </Link>
              </li>
            </ul>
          )}
          
          {/* Profile Icon with Dropdown */}
          {userProfile?.role && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
                aria-label="User menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fadeIn">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                          {userProfile?.name?.charAt(0).toUpperCase() || userProfile?.mobileNo?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{userProfile?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{userProfile?.role === 'admin' ? 'Admin' : 'Agent'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Name:</span>
                        <span className="ml-1">{userProfile?.name || 'User'}</span>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Email ID:</span>
                        <span className="ml-1">{userProfile?.email}</span>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">User ID:</span>
                        <span className="ml-1">{userProfile?.mobileNo}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-700" ref={menuRef}>
          <div className="container mx-auto px-4 py-3">
            {userProfile?.role === 'admin' ? (
              <ul className="space-y-3 pb-3">
                <li>
                  <Link 
                    to="/admin/dashboard" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/admin/dashboard') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/companies" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/admin/companies') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Companies
                  </Link>
                </li>
                {/* Temporarily hidden: <li><Link to="/admin/invoices" className="block py-2 hover:text-blue-200" onClick={() => setIsMenuOpen(false)}>Invoices</Link></li> */}
                <li>
                  <Link 
                    to="/admin/payments" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/admin/payments') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Payments
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/journal" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/admin/journal') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Journal
                  </Link>
                </li>
              </ul>
            ) : userProfile?.role === 'agent' ? (
              <ul className="space-y-3 pb-3">
                <li>
                  <Link 
                    to="/agent/dashboard" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/agent/dashboard') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                {/* Temporarily hidden: <li><Link to="/agent/invoices" className="block py-2 hover:text-blue-200" onClick={() => setIsMenuOpen(false)}>Invoices</Link></li> */}
                <li>
                  <Link 
                    to="/agent/payments" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/agent/payments') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Payments
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3 pb-3">
                <li>
                  <Link 
                    to="/" 
                    className={`block py-2 hover:text-blue-200 ${isActive('/') ? 'font-bold text-white border-l-4 border-white pl-2' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
              </ul>
            )}
            
            {/* Mobile Profile Section */}
            {userProfile?.role && (
              <div className="border-t border-blue-600 pt-3">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;