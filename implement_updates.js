const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
const descButtonHtml = `<button onclick="merchantAction('desc')" style="background: #3b82f6; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-pen"></i> تعديل النبذة</button>`;

// Find where to insert the button in index.html (next to CV button)
if (!html.includes('merchantAction(\'desc\')')) {
    html = html.replace(`<button onclick="merchantAction('cv')"`, `${descButtonHtml}\n                            <button onclick="merchantAction('cv')"`);
}

// Update cache buster in index.html
const now = Date.now();
html = html.replace(/script\.js(\?v=\d+)?/, 'script.js?v=' + now);
fs.writeFileSync('index.html', html, 'utf8');
console.log("Updated index.html");

// 2. Update script.js
let js = fs.readFileSync('script.js', 'utf8');

// A. Add professions to openRegistration
const oldOptions = `<option value="con" \${type === 'con' ? 'selected' : ''}>مقاول</option>
                        <option value="mat" \${type === 'mat' ? 'selected' : ''}>تاجر مواد</option>
                        <option value="shop" \${type === 'shop' ? 'selected' : ''}>محل</option>`;
const newOptions = `<option value="con" \${type === 'con' ? 'selected' : ''}>مقاول</option>
                        <option value="tech" \${type === 'tech' ? 'selected' : ''}>فني</option>
                        <option value="elec" \${type === 'elec' ? 'selected' : ''}>كهربائي</option>
                        <option value="carp" \${type === 'carp' ? 'selected' : ''}>نجار</option>
                        <option value="mat" \${type === 'mat' ? 'selected' : ''}>تاجر مواد</option>
                        <option value="shop" \${type === 'shop' ? 'selected' : ''}>محل</option>`;
if (js.includes(oldOptions)) {
    js = js.replace(oldOptions, newOptions);
}

// B. Update renderPros
// 1. Shrink cards: minmax(280px, 1fr) -> minmax(200px, 1fr) and height: 110px -> 80px, 3.5rem -> 2.5rem
if (js.includes('minmax(280px, 1fr)')) {
    js = js.replace('minmax(280px, 1fr)', 'minmax(200px, 1fr)');
}
if (js.includes('height: 110px;')) {
    js = js.replace('height: 110px;', 'height: 85px;');
}
if (js.includes('font-size: 3.5rem;')) {
    js = js.replace('font-size: 3.5rem;', 'font-size: 2.5rem;');
}

// 2. Add categories logic in renderPros
const oldFilter = `const approvedPros = businessDir.filter(b => b.category === 'eng' || b.category === 'con').map(b => ({
        id: b.id,
        name: b.name,
        category: b.category === 'eng' ? 'مكتب هندسي' : 'مقاول',
        governorate: 'بغداد',
        phone: b.phone,
        subscriptionStart: b.joinedAt ? new Date(b.joinedAt).toISOString() : new Date().toISOString(),
        coverImage: '',
        logo: b.category === 'eng' ? 'fa-compass-drafting' : 'fa-hard-hat'
    }));`;

const newFilter = `const approvedPros = businessDir.filter(b => ['eng','con','tech','elec','carp'].includes(b.category)).map(b => {
        let catStr = 'مكتب هندسي';
        let logoStr = 'fa-compass-drafting';
        if(b.category === 'con') { catStr = 'مقاول'; logoStr = 'fa-hard-hat'; }
        else if(b.category === 'tech') { catStr = 'فني'; logoStr = 'fa-wrench'; }
        else if(b.category === 'elec') { catStr = 'كهربائي'; logoStr = 'fa-bolt'; }
        else if(b.category === 'carp') { catStr = 'نجار'; logoStr = 'fa-hammer'; }
        
        return {
            id: b.id,
            name: b.name,
            category: catStr,
            governorate: 'بغداد',
            phone: b.phone,
            subscriptionStart: b.joinedAt ? new Date(b.joinedAt).toISOString() : new Date().toISOString(),
            coverImage: '',
            logo: logoStr
        };
    });`;
if (js.includes(oldFilter)) {
    js = js.replace(oldFilter, newFilter);
}

// C. Update merchantAction in script.js to handle 'desc'
const descAction = `
    else if(actionType === 'desc') {
        Swal.fire({
            title: 'تعديل النبذة أو الملاحظات',
            input: 'textarea',
            inputLabel: 'اكتب نبذة عنك أو عن طبيعة عملك',
            inputValue: document.getElementById('ppDesc').innerText !== 'لا توجد نبذة حالياً.' ? document.getElementById('ppDesc').innerText : '',
            inputPlaceholder: 'أدخل الملاحظات هنا...',
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if(result.isConfirmed) {
                const savedDescs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_desc')) || {};
                savedDescs[window.currentProId] = result.value;
                localStorage.setItem('tabooqa_custom_pro_desc', JSON.stringify(savedDescs));
                document.getElementById('ppDesc').innerText = result.value;
                Swal.fire('تم الحفظ', 'تم تحديث النبذة بنجاح', 'success');
            }
        });
    }
`;
// Insert before "else if(actionType === 'cv')"
if (js.includes("else if(actionType === 'cv')") && !js.includes("actionType === 'desc'")) {
    js = js.replace("else if(actionType === 'cv')", descAction.trim() + "\n    else if(actionType === 'cv')");
}

// D. Update openProProfile to load 'tabooqa_custom_pro_desc'
const oldDescLoad = `document.getElementById('ppDesc').innerText = pro.desc || 'لا توجد نبذة حالياً.';`;
const newDescLoad = `const savedDescs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_desc')) || {};
    document.getElementById('ppDesc').innerText = savedDescs[pro.id] || pro.desc || 'لا توجد نبذة حالياً.';`;
if (js.includes(oldDescLoad)) {
    js = js.replace(oldDescLoad, newDescLoad);
}

fs.writeFileSync('script.js', js, 'utf8');
console.log("Updated script.js");
