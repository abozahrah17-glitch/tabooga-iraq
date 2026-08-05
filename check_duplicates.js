const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

console.log('merchant-profile count:', (html.match(/id="merchant-profile"/g) || []).length);
console.log('pros count:', (html.match(/id="pros"/g) || []).length);
console.log('businessPlansContainer count:', (html.match(/id="businessPlansContainer"/g) || []).length);
