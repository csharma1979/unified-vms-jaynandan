const fs = require('fs');
const path = require('path');

// Function to check if a file uses real API calls
const verifyApiCalls = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for mock data patterns
    const hasMockData = content.includes('mockInvoices') || 
                       content.includes('setTimeout') || 
                       content.includes('Simulate API call') ||
                       content.includes('// TODO: Replace with real API call');
    
    // Check for real API usage (importing api utility)
    const hasRealApi = content.includes('import api from') || 
                      content.includes("import api from '../../utils/api'") ||
                      content.includes('axios') ||
                      content.includes('fetch(');
    
    // Check for TODO comments related to API implementation
    const hasTodoComments = (content.match(/\/\/\s*TODO:/g) || []).length;
    
    return {
      hasMockData,
      hasRealApi,
      hasTodoComments,
      needsAttention: hasMockData || hasTodoComments > 0
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
};

// Function to process all files in a directory
const processDirectory = (dirPath) => {
  const results = {
    filesChecked: 0,
    filesNeedingAttention: 0,
    filesWithMockData: 0,
    filesWithTodoComments: 0
  };
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        const subDirResults = processDirectory(filePath);
        results.filesChecked += subDirResults.filesChecked;
        results.filesNeedingAttention += subDirResults.filesNeedingAttention;
        results.filesWithMockData += subDirResults.filesWithMockData;
        results.filesWithTodoComments += subDirResults.filesWithTodoComments;
      } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
        // Process JavaScript/JSX files
        results.filesChecked++;
        const verification = verifyApiCalls(filePath);
        
        if (verification) {
          if (verification.needsAttention) {
            results.filesNeedingAttention++;
            console.log(`\n⚠️  File needs attention: ${filePath}`);
            
            if (verification.hasMockData) {
              results.filesWithMockData++;
              console.log('   - Contains mock data patterns');
            }
            
            if (verification.hasTodoComments > 0) {
              results.filesWithTodoComments++;
              console.log(`   - Contains ${verification.hasTodoComments} TODO comment(s)`);
            }
          } else {
            console.log(`✅ File OK: ${filePath}`);
          }
          
          if (!verification.hasRealApi) {
            console.log('   - Warning: No real API usage detected');
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
  
  return results;
};

// Main execution
const runVerification = () => {
  console.log('=== Frontend API Implementation Verification ===');
  console.log('This tool verifies that frontend components use real API calls.\n');
  
  // Define the frontend source directory
  const frontendSrcDir = path.join(__dirname, '../../frontend/src');
  
  // Process the frontend source directory
  const results = processDirectory(frontendSrcDir);
  
  // Print summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Files checked: ${results.filesChecked}`);
  console.log(`Files needing attention: ${results.filesNeedingAttention}`);
  console.log(`Files with mock data: ${results.filesWithMockData}`);
  console.log(`Files with TODO comments: ${results.filesWithTodoComments}`);
  
  if (results.filesNeedingAttention > 0) {
    console.log('\n❌ Some files need attention before production deployment.');
    console.log('Please review the warnings above and update the components accordingly.');
  } else {
    console.log('\n✅ All files appear to be ready for production.');
  }
};

// Run the verification process
if (require.main === module) {
  runVerification();
}

module.exports = { verifyApiCalls, processDirectory };