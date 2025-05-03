const fs = require('fs');
const path = require('path');

const tempDir = path.join(process.cwd(), 'temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Add .gitignore to temp directory to prevent committing temporary files
const gitignorePath = path.join(tempDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, '*\n!.gitignore\n');
} 