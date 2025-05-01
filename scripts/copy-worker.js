const fs = require('fs');
const path = require('path');

// Try to find the minified worker first, then fall back to regular worker
const possibleSourcePaths = [
  path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js')
];

// Destination path in public directory
const destPath = path.join(__dirname, '..', 'public', 'pdf.worker.min.js');

// Create directories if they don't exist
const destDir = path.dirname(destPath);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Try to copy the worker file
let copied = false;
for (const sourcePath of possibleSourcePaths) {
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`PDF.js worker file copied successfully from ${sourcePath}!`);
      copied = true;
      break;
    } catch (error) {
      console.error(`Error copying from ${sourcePath}:`, error);
    }
  }
}

if (!copied) {
  console.error('Failed to copy PDF.js worker file from any source path');
  process.exit(1);
} 