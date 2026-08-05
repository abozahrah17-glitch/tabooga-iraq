const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="business"');
const end = html.indexOf('</section>', start);
console.log(html.substring(start, end));
