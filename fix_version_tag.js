const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the broken version tag (double ?v=)
html = html.replace(/script\.js\?v=\d+\?v=\d+/g, 'script.js?v=' + Date.now());

// Remove network_sync.js separate script tag if exists (it's now in script.js)
// No need to add it separately

fs.writeFileSync('index.html', html, 'utf8');
console.log("Fixed script.js version tag.");
