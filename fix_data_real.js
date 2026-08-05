const fs = require('fs');

// 1. Fix defaultAds in script.js AGAIN (to undo the mess)
let js = fs.readFileSync('script.js', 'utf8');
const badDefaultAds = `    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
    pros: [`;

if (js.includes(badDefaultAds)) {
    js = js.replace(badDefaultAds, 'pros: [');
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("Fixed script.js defaultAds again.");
} else {
    // maybe it is the goodProServices that was injected?
    const goodProServices = `
const constructionData = {
    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
`;
    if (js.includes(goodProServices.trim())) {
        js = js.replace(goodProServices.trim(), 'const constructionData = {');
        fs.writeFileSync('script.js', js, 'utf8');
        console.log("Removed rogue constructionData from script.js.");
    }
}

// 2. Add proServices to data.js
let dataJs = fs.readFileSync('data.js', 'utf8');
const servicesStr = `
    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
    pros: [`;

if (!dataJs.includes('proServices:')) {
    dataJs = dataJs.replace('pros: [', servicesStr.trim());
    fs.writeFileSync('data.js', dataJs, 'utf8');
    console.log("Successfully injected proServices into data.js.");
}

