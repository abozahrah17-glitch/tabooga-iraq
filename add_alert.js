const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const target = "document.addEventListener('DOMContentLoaded', () => {";
const payload = "document.addEventListener('DOMContentLoaded', () => {\n    if(!sessionStorage.getItem('v10_alert')) { alert('تم مسح الكاش والتحديث بنجاح! سترى البطاقات المصغرة الآن.'); sessionStorage.setItem('v10_alert', '1'); }";

if(js.includes(target)) {
    js = js.replace(target, payload);
    fs.writeFileSync('script.js', js, 'utf8');
    console.log('Added alert');
}
