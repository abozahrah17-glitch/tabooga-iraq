const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
console.log('market', html.indexOf('id="market"'));
console.log('pro-profile', html.indexOf('id="pro-profile"'));
