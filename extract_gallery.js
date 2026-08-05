const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="freeBlueprintsGallery"');
console.log(html.substring(start, start + 3000));
