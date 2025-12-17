# Production Deployment Guide

This guide provides step-by-step instructions for preparing the Service Business Management Portal for production deployment by removing all test data and development artifacts.

## Overview

Before moving to production, it's critical to ensure that:
1. All test payment data is removed from the database
2. All frontend components use real API calls instead of mock data
3. No development artifacts remain in the codebase
4. All environment variables are properly configured for production

## Prerequisites

1. Backup your production database before performing any cleanup operations
2. Ensure you have administrative access to the database
3. Verify that all team members have committed their changes
4. Confirm that the application is functioning correctly in a staging environment

## Step-by-Step Cleanup Process

### 1. Database Cleanup

#### Run the Production Cleanup Script

This script interactively identifies and removes test payment data:

```bash
cd backend
npm run cleanup:production
```

The script will:
- Scan the database for payments matching test patterns
- Display identified test payments for review
- Prompt for confirmation before deletion
- Provide detailed logs of all actions taken

#### Manual Verification (Optional)

If you prefer to manually verify test data before deletion, run the identification script first:

```bash
cd backend
node scripts/cleanup-test-payments.js
```

Review the output to confirm which payments will be deleted, then proceed with the production cleanup script.

### 2. Frontend Cleanup

#### Remove Mock Data from Components

Run the frontend mock data removal script:

```bash
cd backend
npm run cleanup:frontend-mocks
```

This script will:
- Scan all frontend component files
- Remove mock data assignments and setTimeout simulations
- Replace mock data usage with TODO comments for real API implementation

#### Verify Real API Implementation

Run the frontend API verification script to ensure all components use real API calls:

```bash
cd backend
npm run verify:frontend-api
```

Address any issues identified by the script before proceeding.

### 3. Final Production Readiness Check

Run the comprehensive production readiness check:

```bash
cd backend
npm run verify:production-ready
```

This script will:
- Scan the entire codebase for test patterns and development artifacts
- Check environment configuration
- Provide detailed reporting of findings
- Offer recommendations for production readiness

### 4. Complete Automated Cleanup (Alternative Approach)

If you prefer to run all cleanup scripts sequentially:

```bash
cd backend
npm run cleanup:all
```

Then run the final verification:

```bash
cd backend
npm run verify:production-ready
```

## Test Data Identification Patterns

The cleanup scripts identify test data based on these patterns:

### Payment Records
- Transaction IDs containing "test", "demo", "sample", or "sandbox"
- PO Numbers containing "test", "demo", "sample", or "sandbox"
- Invoice Numbers containing "test", "demo", "sample", or "sandbox"
- Payments with common test amounts (₹1, ₹10, ₹100, ₹1000, ₹0.01, ₹0.1, ₹0.99)
- Payments created by test users

### User Records
- Names containing "test", "demo", "sample", or "sandbox"
- Emails containing "test", "demo", "sample", or "sandbox"
- Mobile numbers containing "test", "demo", "sample", or "sandbox"

## Environment Configuration

Ensure your production environment is properly configured:

1. **MongoDB Connection**
   - Set `MONGO_URI` to your production database connection string
   - Remove any references to localhost or development databases

2. **Security Settings**
   - Set a strong `JWT_SECRET` value
   - Configure appropriate CORS settings
   - Enable HTTPS in production

3. **Port Configuration**
   - Use appropriate ports for your production environment
   - Backend typically runs on port 4000

Example production `.env` file:
```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_strong_production_secret_here
NODE_ENV=production
```

## Post-Cleanup Verification

After running all cleanup scripts, verify the application:

1. **Database Verification**
   - Confirm that no test payment records remain
   - Verify that all legitimate payment records are intact
   - Check that payment counts and totals are correct

2. **Frontend Verification**
   - Test all payment-related functionality
   - Verify that all components load and display data correctly
   - Confirm that all forms submit data properly

3. **API Endpoint Testing**
   - Test all payment API endpoints
   - Verify authentication and authorization work correctly
   - Confirm that export functionality works as expected

## Rollback Procedure

In case of issues after cleanup:

1. Restore the database from your backup
2. Revert any code changes if necessary
3. Investigate the cause of the issue
4. Re-run cleanup scripts after addressing the issue

## Team Communication

Notify all team members about the cleanup process:

1. Schedule the cleanup during a maintenance window
2. Communicate the expected downtime (typically minimal)
3. Provide instructions for team members to pull the latest changes
4. Document any changes that affect development workflows

## Ongoing Maintenance

To prevent test data from accumulating in the future:

1. **Development Practices**
   - Use dedicated test accounts for development
   - Avoid using production-like data in development
   - Regularly clean development databases

2. **Code Reviews**
   - Check for mock data in code reviews
   - Verify that new components use real API calls
   - Ensure no console.log statements make it to production

3. **Automated Testing**
   - Implement tests that verify data integrity
   - Use separate test databases for automated testing
   - Regularly run the verification scripts as part of CI/CD

## Troubleshooting

### Common Issues

1. **Script fails to connect to database**
   - Verify that `MONGO_URI` is correctly set in your `.env` file
   - Check that your database server is accessible
   - Ensure that your IP is whitelisted if using MongoDB Atlas

2. **Scripts identify legitimate payments as test data**
   - Modify the identification patterns in `cleanup-test-payments.js`
   - Add exceptions for legitimate payments that match test patterns
   - Manually review and restore any incorrectly deleted payments

3. **Frontend components still show mock data**
   - Run the frontend verification script to identify affected files
   - Manually update components that weren't caught by the automated scripts
   - Ensure all components import and use the `api` utility

### Getting Help

If you encounter issues during the cleanup process:

1. Check the script output for error messages
2. Review the logs for detailed information
3. Consult with your team lead or senior developer
4. Refer to the application documentation

## Conclusion

Following this guide will ensure that your Service Business Management Portal is properly prepared for production deployment with all test data removed and development artifacts cleaned up. Regular maintenance of these practices will help keep your production environment clean and secure.