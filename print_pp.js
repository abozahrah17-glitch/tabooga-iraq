const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="pro-profile"');
// just print the tag
console.log(html.substring(start - 20, start + 3000));
