const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Fix defaultAds
const badDefaultAds = `    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
    pros: [`;
js = js.replace(badDefaultAds, 'pros: [');

// 2. Add proServices to constructionData
const goodProServices = `
const constructionData = {
    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
`;
js = js.replace('const constructionData = {', goodProServices.trim());

fs.writeFileSync('script.js', js, 'utf8');
console.log("Fixed data injection.");
