const fs = require('fs');

// 1. Update index.html for Pro Profile buttons
let html = fs.readFileSync('index.html', 'utf8');

const oldProButtons = `<button onclick="merchantAction('portfolio')" style="background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-plus"></i> إضافة عمل</button>
                            <button onclick="merchantAction('renew')" style="background: #10B981; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-rotate"></i> تجديد الاشتراك</button>`;

const newProButtons = `<button onclick="merchantAction('portfolio')" style="background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-plus"></i> إضافة عمل/صورة</button>
                            <button onclick="merchantAction('service')" style="background: #f59e0b; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-tags"></i> إضافة خدمة/سعر</button>
                            <button onclick="merchantAction('cv')" style="background: #8b5cf6; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-file-lines"></i> تحديث الـ CV</button>
                            <button onclick="merchantAction('renew')" style="background: #10B981; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-rotate"></i> تجديد الاشتراك</button>`;

if (html.includes(oldProButtons)) {
    html = html.replace(oldProButtons, newProButtons);
    
    // Also, we need a container for services and CV in the Pro profile
    const oldPortfoliosHeader = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; color: var(--primary); font-size: 1.1rem;"><i class="fa-solid fa-images"></i> معرض الأعمال</h4>
                        </div>`;
    
    const newContainers = `<div id="ppCvContainer" style="display: none; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px; color: var(--primary); font-size: 1.1rem;"><i class="fa-solid fa-address-card"></i> السيرة الذاتية (CV)</h4>
                            <p id="ppCvText" style="margin: 0; font-size: 0.95rem; color: var(--text-main); line-height: 1.6;"></p>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; color: var(--primary); font-size: 1.1rem;"><i class="fa-solid fa-tags"></i> الخدمات والأسعار</h4>
                        </div>
                        <div class="shop-grid" id="ppServicesGrid" style="margin-bottom: 20px;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; color: var(--primary); font-size: 1.1rem;"><i class="fa-solid fa-images"></i> معرض الأعمال</h4>
                        </div>`;
                        
    html = html.replace(oldPortfoliosHeader, newContainers);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Updated index.html");
}

// 2. Update script.js for new merchantActions and rendering
let js = fs.readFileSync('script.js', 'utf8');

const newActionsCode = `
    else if(actionType === 'service') {
        Swal.fire({
            title: 'إضافة خدمة وتسعيرها',
            html: \`
                <input id="swal-s1" class="swal2-input" placeholder="اسم الخدمة (مثال: تصميم داخلي)">
                <input id="swal-s2" class="swal2-input" placeholder="وصف الخدمة">
                <input id="swal-s3" type="number" class="swal2-input" placeholder="السعر (دينار)">
            \`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'إضافة',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return [
                    document.getElementById('swal-s1').value,
                    document.getElementById('swal-s2').value,
                    document.getElementById('swal-s3').value
                ]
            }
        }).then((result) => {
            if(result.isConfirmed && result.value[0] && result.value[2]) {
                const name = result.value[0];
                const desc = result.value[1];
                const price = parseInt(result.value[2]);
                
                if (window.currentProId) {
                    if (!constructionData.proServices) constructionData.proServices = [];
                    const newService = {
                        id: 'svc_' + Date.now(),
                        proId: window.currentProId,
                        name: name,
                        desc: desc,
                        price: price,
                        isCustom: true
                    };
                    
                    constructionData.proServices.unshift(newService);
                    
                    let savedServices = JSON.parse(localStorage.getItem('tabooqa_custom_pro_services')) || [];
                    savedServices.unshift(newService);
                    localStorage.setItem('tabooqa_custom_pro_services', JSON.stringify(savedServices));
                    
                    window.openProProfile(window.currentProId);
                }
                Swal.fire('تمت الإضافة', 'تمت إضافة الخدمة بنجاح', 'success');
            }
        });
    }
    else if(actionType === 'cv') {
        Swal.fire({
            title: 'تحديث السيرة الذاتية (CV)',
            input: 'textarea',
            inputLabel: 'اكتب نبذة مختصرة عن خبراتك وأعمالك',
            inputPlaceholder: 'الخبرات، الشهادات، سنوات العمل...',
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if(result.isConfirmed && result.value) {
                if (window.currentProId) {
                    let savedCVs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_cvs')) || {};
                    savedCVs[window.currentProId] = result.value;
                    localStorage.setItem('tabooqa_custom_pro_cvs', JSON.stringify(savedCVs));
                    
                    // Update current data object
                    const pro = constructionData.pros.find(p => p.id === window.currentProId);
                    if(pro) pro.cv = result.value;
                    
                    window.openProProfile(window.currentProId);
                }
                Swal.fire('تم الحفظ', 'تم تحديث السيرة الذاتية', 'success');
            }
        });
    }
`;

if (!js.includes("actionType === 'service'")) {
    js = js.replace("else if(actionType === 'blueprint') {", newActionsCode.trim() + "\n    else if(actionType === 'blueprint') {");
}

// Modify openProProfile to render the CV and services
const oldProRender = `document.getElementById('ppDesc').innerText = pro.desc || 'خبير معتمد في طابوقة يقدم أفضل الخدمات.';`;
const newProRender = `document.getElementById('ppDesc').innerText = pro.desc || 'خبير معتمد في طابوقة يقدم أفضل الخدمات.';
        
        // Render CV
        const savedCVs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_cvs')) || {};
        const proCv = savedCVs[pro.id] || pro.cv;
        if (proCv) {
            document.getElementById('ppCvContainer').style.display = 'block';
            document.getElementById('ppCvText').innerText = proCv;
        } else {
            document.getElementById('ppCvContainer').style.display = 'none';
        }
        
        // Render Services
        const ppServicesGrid = document.getElementById('ppServicesGrid');
        if (ppServicesGrid) {
            let services = constructionData.proServices || [];
            let savedServices = JSON.parse(localStorage.getItem('tabooqa_custom_pro_services')) || [];
            let allServices = [...savedServices, ...services].filter(s => s.proId === pro.id);
            
            // Remove duplicates by id
            const uniqueIds = new Set();
            allServices = allServices.filter(s => {
                if(uniqueIds.has(s.id)) return false;
                uniqueIds.add(s.id);
                return true;
            });
            
            if (allServices.length > 0) {
                ppServicesGrid.innerHTML = allServices.map(s => \`
                    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; padding: 15px;">
                        <h4 style="margin: 0 0 5px; color: var(--text-main); font-size: 1rem;">\${s.name}</h4>
                        <p style="margin: 0 0 10px; color: var(--text-light); font-size: 0.85rem;">\${s.desc}</p>
                        <div style="color: var(--primary); font-weight: bold; font-size: 1.1rem;">\${s.price.toLocaleString()} دينار</div>
                    </div>
                \`).join('');
                ppServicesGrid.style.display = 'grid';
            } else {
                ppServicesGrid.style.display = 'none';
            }
        }`;

if (js.includes(oldProRender) && !js.includes('tabooqa_custom_pro_cvs')) {
    js = js.replace(oldProRender, newProRender);
}

fs.writeFileSync('script.js', js, 'utf8');
console.log("Updated script.js");
