# Data Cleanup Scripts

This directory contains scripts to help clean up test data before moving to production.

## Scripts

### 1. Payment Data Cleanup (`cleanup-test-payments.js`)

This script identifies and removes test payment data from the database.

#### Features:
- Identifies test payments based on common patterns:
  - Transaction IDs containing "test", "demo", or "sample"
  - PO Numbers containing "test", "demo", or "sample"
  - Invoice Numbers containing "test", "demo", or "sample"
  - Payments with common test amounts (₹1, ₹10, ₹100, ₹1000)
  - Payments created by test users
- Safely deletes identified test payments
- Provides detailed logging of actions taken

#### Usage:
```bash
npm run cleanup:test-data
```

### 2. Frontend Mock Data Removal (`remove-frontend-mock-data.js`)

This script removes mock data from frontend components to ensure only real data is used in production.

#### Features:
- Scans all JSX/JS files in the frontend source directory
- Removes mock data assignments and setTimeout simulations
- Replaces mock data usage with TODO comments for real API implementation

#### Usage:
```bash
npm run cleanup:frontend-mocks
```

### 3. Production Ready Cleanup (`cleanup:production`)

This script provides an interactive way to identify and remove test data with confirmation prompts. It's designed for production use with additional safety measures.

#### Features:
- Interactive confirmation prompts
- Detailed scanning and reporting
- Safe deletion with error handling

#### Usage:
```bash
npm run cleanup:production
```

### 4. Frontend API Verification (`verify:frontend-api`)

This script verifies that frontend components are using real API calls instead of mock data.

#### Features:
- Scans all frontend component files
- Identifies files still using mock data
- Detects TODO comments for incomplete API implementations
- Provides detailed reporting

#### Usage:
```bash
npm run verify:frontend-api
```

### 5. Final Production Readiness Check (`verify:production-ready`)

This script performs a comprehensive scan of the entire codebase to identify any remaining test data, development artifacts, or configuration issues.

#### Features:
- Scans all source files for test patterns
- Checks environment configuration
- Provides detailed reporting of findings
- Offers recommendations for production readiness

#### Usage:
```bash
npm run verify:production-ready
```

### 6. Complete Cleanup (`cleanup:all`)

This script runs both cleanup processes sequentially.

#### Usage:
```bash
npm run cleanup:all
```

## Production Deployment Checklist

Before moving to production, ensure you have:

1. [ ] Run the payment data cleanup script
2. [ ] Run the frontend mock data removal script
3. [ ] Verified that no test data remains in the database
4. [ ] Verified that all components use real API calls
5. [ ] Tested the application thoroughly after cleanup
6. [ ] Backed up the production database
7. [ ] Reviewed and updated any TODO comments
8. [ ] Confirmed all environment variables are set for production
9. [ ] Run the final production readiness check script

## Safety Measures

1. **Identification First**: All scripts first identify and display data that will be affected before making any changes
2. **Confirmation Prompts**: In a production environment, these scripts should include confirmation prompts before deletion
3. **Logging**: Detailed logs are provided for all actions taken
4. **Reversible Actions**: Database deletions are permanent, so always backup your database before running cleanup scripts
5. **Multiple Verification Steps**: Use multiple verification scripts to ensure thoroughness

## Customization

You can customize the identification criteria in `cleanup-test-payments.js` by modifying the `testPatterns` array and the user query.

Common modifications might include:
- Adding specific test user emails or names
- Adding additional test amount values
- Adding custom test patterns for transaction IDs or other fields

## Running the Scripts

1. Ensure you're in the `backend` directory
2. Make sure your MongoDB connection is properly configured in the `.env` file
3. Run the desired script using npm:

```bash
cd backend
npm run cleanup:test-data
# or
npm run cleanup:frontend-mocks
# or
npm run cleanup:all
```

## Pre-production Checklist

Before moving to production, ensure you have:

1. [ ] Run the payment data cleanup script
2. [ ] Run the frontend mock data removal script
3. [ ] Verified that no test data remains in the database
4. [ ] Verified that all components use real API calls
5. [ ] Tested the application thoroughly after cleanup
6. [ ] Backed up the production database