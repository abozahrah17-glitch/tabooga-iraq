const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<!-- Market Filter -->');
console.log(html.substring(start, start + 2000));
