const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const pps = html.split('id="pro-profile"');
console.log('Count:', pps.length - 1);
const markets = html.split('id="market"');
console.log('Market Count:', markets.length - 1);
