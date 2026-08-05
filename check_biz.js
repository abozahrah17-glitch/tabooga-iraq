const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="business"');
console.log(html.substring(start, start + 1000));
