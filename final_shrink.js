const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// Force strictly smaller grid for mobile
if (js.includes('minmax(150px, 1fr)')) {
    js = js.replace('minmax(150px, 1fr)', 'repeat(auto-fill, minmax(130px, 1fr))'); // or just change the value
}

// Another attempt to replace accurately since the previous line in script.js might be repeat(auto-fill, minmax(150px, 1fr))
js = js.replace(/repeat\(auto-fill,\s*minmax\(\d+px,\s*1fr\)\)/g, 'repeat(auto-fit, minmax(140px, 1fr))');

// Update openProProfile to add debug logs and fix any potential empty display issues
const targetLog = `const pro = allPros.find(p => p.id === proId);
    if (!pro) {
        console.error("Pro not found: ", proId);
        Swal.fire('خطأ', 'لم يتم العثور على بيانات المحترف', 'error');
        return;
    }
    console.log("Successfully found pro:", pro);`;

js = js.replace(/const pro = allPros\.find\(p => p\.id === proId\);\s*if \(\!pro\) \{\s*console\.error\("Pro not found: ", proId\);\s*return;\s*\}/g, targetLog);

fs.writeFileSync('script.js', js, 'utf8');
console.log("Updated script.js with smaller cards and debug logs");
