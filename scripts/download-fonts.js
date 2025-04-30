const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS = [
  {
    url: 'https://github.com/github/hubot-sans/raw/main/fonts/hubot-sans/webfonts/HubotSans-Regular.woff2',
    filename: 'Hubot-Sans-Regular.woff2'
  },
  {
    url: 'https://github.com/github/hubot-sans/raw/main/fonts/hubot-sans/webfonts/HubotSans-Medium.woff2',
    filename: 'Hubot-Sans-Medium.woff2'
  },
  {
    url: 'https://github.com/github/hubot-sans/raw/main/fonts/hubot-sans/webfonts/HubotSans-Bold.woff2',
    filename: 'Hubot-Sans-Bold.woff2'
  }
];

const downloadFont = (url, filename) => {
  const targetPath = path.join(__dirname, '../src/fonts', filename);
  
  https.get(url, (response) => {
    if (response.statusCode === 302) {
      // Follow redirect
      https.get(response.headers.location, (redirectResponse) => {
        const fileStream = fs.createWriteStream(targetPath);
        redirectResponse.pipe(fileStream);
        
        fileStream.on('finish', () => {
          console.log(`Downloaded ${filename}`);
          fileStream.close();
        });
      });
    } else {
      const fileStream = fs.createWriteStream(targetPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        console.log(`Downloaded ${filename}`);
        fileStream.close();
      });
    }
  }).on('error', (err) => {
    console.error(`Error downloading ${filename}:`, err.message);
  });
};

FONTS.forEach(font => downloadFont(font.url, font.filename)); 