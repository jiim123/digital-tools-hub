const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'Helvetica.afm',
    url: 'https://raw.githubusercontent.com/foliojs/pdfkit/master/lib/font/data/Helvetica.afm'
  },
  {
    name: 'Helvetica-Bold.afm',
    url: 'https://raw.githubusercontent.com/foliojs/pdfkit/master/lib/font/data/Helvetica-Bold.afm'
  }
];

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download each font file
fonts.forEach(font => {
  const filePath = path.join(fontsDir, font.name);
  const file = fs.createWriteStream(filePath);
  
  https.get(font.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if download fails
    console.error(`Error downloading ${font.name}:`, err.message);
  });
}); 