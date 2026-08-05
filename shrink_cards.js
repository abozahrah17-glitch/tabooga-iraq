const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Force smaller grid for mobile
if (js.includes('minmax(200px, 1fr)')) {
    js = js.replace('minmax(200px, 1fr)', 'minmax(150px, 1fr)');
}

// 2. Reduce header height
if (js.includes('height: 85px;')) {
    js = js.replace('height: 85px;', 'height: 65px;');
}

// 3. Reduce icon size in header
if (js.includes('font-size: 2.5rem;')) {
    js = js.replace('font-size: 2.5rem;', 'font-size: 2rem;');
}

// 4. Reduce title font size
if (js.includes('font-size: 1.25rem;')) {
    js = js.replace('font-size: 1.25rem;', 'font-size: 1rem;');
}

// 5. Reduce description font size
if (js.includes('font-size: 0.9rem; color: #64748b; line-height: 1.6;')) {
    js = js.replace('font-size: 0.9rem; color: #64748b; line-height: 1.6;', 'font-size: 0.8rem; color: #64748b; line-height: 1.4;');
}

fs.writeFileSync('script.js', js, 'utf8');
console.log("Forced cards to be even smaller");
