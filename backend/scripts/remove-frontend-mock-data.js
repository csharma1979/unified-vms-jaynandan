const fs = require('fs');
const path = require('path');

// Function to remove mock data from a file
const removeMockDataFromFile = (filePath) => {
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains mock data
    if (content.includes('mockInvoices') || content.includes('setTimeout') || content.includes('Simulate API call')) {
      console.log(`Processing file: ${filePath}`);
      
      // Remove mock data sections
      // Remove useEffect with setTimeout mock
      content = content.replace(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?setTimeout\(\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\d+\);\s*\}\s*,\s*\[\s*\]\s*\);/g, '');
      
      // Remove direct mock data assignments
      content = content.replace(/const\s+mock[A-Za-z]+\s*=\s*\[[\s\S]*?\];/g, '');
      
      // Replace mock data usage with real API calls
      content = content.replace(/set[A-Za-z]+\s*\(\s*mock[A-Za-z]+\s*\)/g, '// TODO: Replace with real API call');
      
      // Remove simulation comments
      content = content.replace(/\/\/\s*Simulate API call/g, '// TODO: Implement real API call');
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated file: ${filePath}`);
    } else {
      console.log(`No mock data found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
};

// Function to process all files in a directory
const processDirectory = (dirPath) => {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        processDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
        // Process JavaScript/JSX files
        removeMockDataFromFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
};

// Main execution
const runFrontendCleanup = () => {
  console.log('=== Frontend Mock Data Removal Tool ===');
  console.log('This tool will remove mock data from frontend components.\n');
  
  // Define the frontend source directory
  const frontendSrcDir = path.join(__dirname, '../../frontend/src');
  
  // Process the frontend source directory
  processDirectory(frontendSrcDir);
  
  console.log('\nFrontend mock data removal process completed.');
};

// Run the cleanup process
if (require.main === module) {
  runFrontendCleanup();
}

module.exports = { removeMockDataFromFile, processDirectory };