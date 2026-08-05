const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const now = Date.now();
html = html.replace(/script\.js(\?v=\d+)?/, 'script.js?v=' + now);
html = html.replace(/data\.js(\?v=\d+)?/, 'data.js?v=' + now);
fs.writeFileSync('index.html', html, 'utf8');
console.log("Updated cache busters");
