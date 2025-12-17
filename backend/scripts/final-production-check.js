const fs = require('fs');
const path = require('path');

// Patterns that might indicate test data or development artifacts
const testPatterns = [
  { name: 'Test/Demo/Sample keywords', pattern: /\b(test|demo|sample|sandbox)\b/i },
  { name: 'Placeholder values', pattern: /\b(todo|fixme|placeholder)\b/i },
  { name: 'Mock data assignments', pattern: /const\s+mock[A-Za-z]+\s*=/i },
  { name: 'Console log statements', pattern: /console\.(log|warn|error)\s*\(/g },
  { name: 'setTimeout mocks', pattern: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{/g },
  { name: 'Simulate API comments', pattern: /simulate\s+api/i },
  { name: 'Hardcoded test values', pattern: /\b(123456|abcdef|test@example\.com)\b/i }
];

// Files/directories to exclude from scanning
const excludePaths = [
  'node_modules',
  '.git',
  'scripts', // Exclude our own scripts directory
  'package-lock.json',
  'yarn.lock'
];

// Function to check if a path should be excluded
const shouldExclude = (filePath) => {
  return excludePaths.some(exclude => filePath.includes(exclude));
};

// Function to scan a file for test patterns
const scanFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];
    
    testPatterns.forEach(patternObj => {
      const matches = content.match(patternObj.pattern);
      if (matches) {
        findings.push({
          pattern: patternObj.name,
          count: matches.length
        });
      }
    });
    
    return findings;
  } catch (error) {
    // Skip binary files or files that can't be read as text
    return [];
  }
};

// Function to recursively scan directories
const scanDirectory = (dirPath) => {
  const allFindings = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      
      // Skip excluded paths
      if (shouldExclude(fullPath)) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        const subFindings = scanDirectory(fullPath);
        allFindings.push(...subFindings);
      } else if (stat.isFile()) {
        // Scan file if it's likely a source file
        if (/\.(js|jsx|ts|tsx|json|md|html|css|scss)$/i.test(fullPath)) {
          const findings = scanFile(fullPath);
          if (findings.length > 0) {
            allFindings.push({
              file: fullPath,
              findings: findings
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return allFindings;
};

// Function to print findings in a readable format
const printFindings = (allFindings) => {
  if (allFindings.length === 0) {
    console.log('✅ No test patterns or development artifacts found in the codebase.');
    return;
  }
  
  console.log(`\n⚠️  Found ${allFindings.length} files with potential test patterns or development artifacts:\n`);
  
  // Group findings by pattern type
  const patternSummary = {};
  
  allFindings.forEach(fileFinding => {
    console.log(`📁 ${fileFinding.file}`);
    
    fileFinding.findings.forEach(finding => {
      console.log(`   🔍 ${finding.pattern}: ${finding.count} occurrence(s)`);
      
      // Add to pattern summary
      if (!patternSummary[finding.pattern]) {
        patternSummary[finding.pattern] = 0;
      }
      patternSummary[finding.pattern] += finding.count;
    });
    
    console.log('');
  });
  
  // Print pattern summary
  console.log('📊 Pattern Summary:');
  Object.keys(patternSummary).forEach(pattern => {
    console.log(`   ${pattern}: ${patternSummary[pattern]} total occurrence(s)`);
  });
};

// Function to check environment configuration
const checkEnvironmentConfig = () => {
  console.log('\n=== Environment Configuration Check ===');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    
    // Check for production-like settings
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('MONGO_URI') && !envContent.includes('localhost')) {
      console.log('✅ MongoDB URI appears to be configured for production');
    } else {
      console.log('⚠️  Check MongoDB URI configuration for production');
    }
    
    if (envContent.includes('JWT_SECRET') && !envContent.includes('your_jwt_secret')) {
      console.log('✅ JWT secret appears to be properly configured');
    } else {
      console.log('⚠️  Check JWT secret configuration for production');
    }
  } else {
    console.log('⚠️  No .env file found. Make sure environment variables are set properly.');
  }
};

// Main execution function
const runFinalCheck = () => {
  console.log('=== FINAL PRODUCTION READINESS CHECK ===');
  console.log('Scanning codebase for test data and development artifacts...\n');
  
  // Scan the entire project directory
  const projectRoot = path.join(__dirname, '../../');
  const findings = scanDirectory(projectRoot);
  
  // Print findings
  printFindings(findings);
  
  // Check environment configuration
  checkEnvironmentConfig();
  
  // Final recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  if (findings.length > 0) {
    console.log('❌ Issues found that should be addressed before production deployment:');
    console.log('   1. Review and remove any test data or development artifacts identified above');
    console.log('   2. Ensure all TODO comments are resolved');
    console.log('   3. Remove any console.log statements that are not for error tracking');
    console.log('   4. Verify that all mock data has been replaced with real API calls');
  } else {
    console.log('✅ Codebase appears to be clean for production deployment');
    console.log('   However, please ensure you have completed all checklist items in the deployment guide');
  }
};

// Run the final check
if (require.main === module) {
  runFinalCheck();
}

module.exports = { scanFile, scanDirectory };