# Service Business Management System

A web-based application for managing service businesses with Admin and Company Agent roles.

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React.js with Vite
- **Database**: MongoDB
- **Styling**: Tailwind CSS

## Features

### Admin Portal
- Company & Location Management
- Invoice Generation
- Payment Request Processing
- Journal Entry Management
- Dashboard Analytics
- Payment Analytics with Summary Cards

### Company Agent Portal
- Invoice Status Updates
- Payment Request Submission
- Dashboard Overview
- Payment Analytics with Summary Cards

## Project Structure

```
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── agent/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/service_business_management
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Quick Start

Alternatively, you can start both frontend and backend simultaneously using the provided script:
```bash
./start-dev.sh
```

## Default Credentials

### Admin Logins
- **Primary Admin**:
  - **Mobile**: 9986028369
  - **Password**: Eha@123#$
  
- **Secondary Admin**:
  - **Mobile**: 8007633000
  - **Password**: Reshma@123#

### Agent Login
- Created by Admin during location creation
- Login using mobile number and password

## API Endpoints

### Authentication
- `POST /api/auth/login` - Unified login for Admin and Agent (NEW)
- `POST /api/auth/admin-login` - Legacy Admin login
- `POST /api/auth/agent-login` - Legacy Agent login

### Companies
- `POST /api/companies` - Create company (Admin)
- `GET /api/companies` - Get all companies (Admin)
- `GET /api/companies/:id` - Get specific company (Admin)
- `PATCH /api/companies/:id` - Update company (Admin)
- `DELETE /api/companies/:id` - Delete company (Admin)
- `POST /api/companies/:companyId/locations` - Create location (Admin)
- `GET /api/companies/:companyId/locations` - Get company locations (Admin)

### Invoices
- `POST /api/invoices` - Create invoice (Admin)
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `PATCH /api/invoices/:id/status` - Update invoice status
- `PATCH /api/invoices/:id` - Update invoice details (Admin)
- `DELETE /api/invoices/:id` - Delete invoice (Admin)

### Payments
- `POST /api/payments` - Create payment request (Agent)
- `GET /api/payments` - Get all payment requests
- `GET /api/payments/:id` - Get specific payment request
- `PATCH /api/payments/:id/status` - Update payment status (Admin)
- `DELETE /api/payments/:id` - Delete payment request (Admin)

### Journal
- `POST /api/journal` - Create journal entry (Admin)
- `GET /api/journal` - Get all journal entries (Admin)
- `GET /api/journal/:id` - Get specific journal entry (Admin)
- `PATCH /api/journal/:id` - Update journal entry (Admin)
- `DELETE /api/journal/:id` - Delete journal entry (Admin)

### Analytics
- `GET /api/analytics/summary` - Get summary statistics (Admin)
- `GET /api/analytics/payments/trend` - Get payment trends (Admin)
- `GET /api/analytics/companies/growth` - Get company growth data (Admin)
- `GET /api/analytics/journal/activity` - Get journal activity (Admin)
- `GET /api/analytics/agent/payments/stats` - Get agent payment statistics
- `GET /api/analytics/agent/payments/trend` - Get agent payment trends

## Recent Enhancements

### Unified Authentication
- Single sign-in page for both Admin and Agent users
- Role-based redirection to respective dashboards
- Improved security with JWT tokens

### Enhanced UI/UX
- Modern dashboard designs with analytics cards and charts
- Responsive layouts for all device sizes
- Active navigation state highlighting
- Profile dropdown with logout functionality
- Clean header design with clickable logo navigation

### Payment Analytics
- Agent payment analytics with summary cards
- Key metrics: Total Project Cost, Handling Charges, Paid Amounts
- Status breakdown: Pending, Approved, Rejected, Paid requests
- Advance payments tracking

### Improved Navigation
- Hamburger menu for mobile responsiveness
- Active state highlighting for current page
- Clickable SBM logo for dashboard navigation
- Minimal header on login page

## Development

To build the frontend for production:
```bash
cd frontend
npm run build
```

## Production Deployment

Before moving to production, follow the detailed [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md) to ensure all test data is removed and the application is properly configured for production use.

Key steps include:
- Running database cleanup scripts to remove test payment data
- Verifying frontend components use real API calls
- Checking environment configuration
- Performing final validation

Always backup your database before running cleanup scripts.

## Deploying with PM2

PM2 is a production process manager for Node.js applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin tasks.

### Prerequisites

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Ensure you have MongoDB running either locally or have a MongoDB Atlas connection string.

### Backend Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/service_business_management
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   
   ```

4. Start the backend application with PM2:
   ```bash
   pm2 start server.js --name "vms-backend" --watch
   ```

   Alternatively, you can use the provided ecosystem.config.js file to start both applications:
   ```bash
   pm2 start ecosystem.config.js
   ```

5. Save the PM2 process list and corresponding environments:
   ```bash
   pm2 save
   ```

6. Setup PM2 to start on system boot:
   ```bash
   pm2 startup
   ```
   Follow the instructions provided by the command to complete the setup.

### Frontend Deployment

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the frontend for production:
   ```bash
   npm run build
   ```

4. Serve the built files using a static server managed by PM2. First, install serve globally:
   ```bash
   npm install -g serve
   ```

5. Start the frontend application with PM2:
   ```bash
   pm2 start "serve -s dist -l 30009" --name "vms-frontend"
   ```

   Alternatively, you can use the provided ecosystem.config.js file to start both applications:
   ```bash
   pm2 start ecosystem.config.js
   ```

6. Save the PM2 process list:
   ```bash
   pm2 save
   ```

### Managing Applications with PM2

- Check application status:
  ```bash
  pm2 status
  ```

- View application logs:
  ```bash
  pm2 logs
  ```

- Restart an application:
  ```bash
  pm2 restart vms-backend
  pm2 restart vms-frontend
  ```

  Or restart all applications:
  ```bash
  pm2 restart ecosystem.config.js
  ```

- Stop an application:
  ```bash
  pm2 stop vms-backend
  pm2 stop vms-frontend
  ```

  Or stop all applications:
  ```bash
  pm2 stop ecosystem.config.js
  ```

- Delete an application from PM2:
  ```bash
  pm2 delete vms-backend
  pm2 delete vms-frontend
  ```

  Or delete all applications:
  ```bash
  pm2 delete ecosystem.config.js
  ```

> Note: The ecosystem.config.js file provides a convenient way to manage both applications together. You can start, stop, restart, and monitor both the backend and frontend applications with a single command.

## License

This project is proprietary and confidential.