import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CompanyManagement from './pages/admin/CompanyManagement';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import JournalManagement from './pages/admin/JournalManagement';
import AgentDashboard from './pages/agent/Dashboard';
import AgentInvoices from './pages/agent/Invoices';
import AgentPayments from './pages/agent/Payments';
import './App.css';

// Component to conditionally render Header based on route
const ConditionalHeader = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  
  return !isLoginPage ? <Header /> : null;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <ConditionalHeader />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompanyManagement />} />
            <Route path="/admin/invoices" element={<InvoiceManagement />} />
            <Route path="/admin/payments" element={<PaymentManagement />} />
            <Route path="/admin/journal" element={<JournalManagement />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/invoices" element={<AgentInvoices />} />
            <Route path="/agent/payments" element={<AgentPayments />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </Router>
  );
}

export default App;