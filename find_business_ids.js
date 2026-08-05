const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const pps = html.match(/id="business[^"]*"/g);
console.log('Business IDs:', pps);
