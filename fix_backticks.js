const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

// Fix escaped template literals
js = js.replace(/\\`/g, "`");
js = js.replace(/\\\$/g, "$");

fs.writeFileSync('script.js', js, 'utf8');
console.log("Fixed escaped backticks in script.js");
