const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Inject default proServices into constructionData
const defaultServicesStr = `
    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
    pros: [
`;

if (!js.includes('proServices:')) {
    js = js.replace('pros: [', defaultServicesStr.trim());
}

// 2. Replace renderPros function
const newRenderPros = `
window.renderPros = function() {
    const prosList = document.getElementById('prosList');
    if (!prosList) return;
    prosList.innerHTML = '';
    
    let allPros = constructionData.pros ? [...constructionData.pros] : [];
    
    // Add approved pros from business_directory
    const businessDir = JSON.parse(localStorage.getItem('business_directory') || '[]');
    const approvedPros = businessDir.filter(b => b.category === 'eng' || b.category === 'con').map(b => ({
        id: b.id,
        name: b.name,
        category: b.category === 'eng' ? 'مكتب هندسي' : 'مقاول',
        governorate: 'بغداد',
        phone: b.phone,
        subscriptionStart: b.joinedAt ? new Date(b.joinedAt).toISOString() : new Date().toISOString(),
        coverImage: '',
        logo: b.category === 'eng' ? 'fa-compass-drafting' : 'fa-hard-hat'
    }));
    
    allPros = [...allPros, ...approvedPros];
    
    const freeTrialDays = (constructionData.prosSettings && constructionData.prosSettings.freeTrialDays) ? constructionData.prosSettings.freeTrialDays : 30;
    
    // Gather all services
    let allServices = constructionData.proServices ? [...constructionData.proServices] : [];
    const savedServices = JSON.parse(localStorage.getItem('tabooqa_custom_pro_services')) || [];
    allServices = [...savedServices, ...allServices];
    
    // Remove duplicate services by ID
    const uniqueIds = new Set();
    allServices = allServices.filter(s => {
        if(uniqueIds.has(s.id)) return false;
        uniqueIds.add(s.id);
        return true;
    });

    if(allServices.length === 0) {
        prosList.innerHTML = '<p style="text-align:center; padding: 20px; width:100%;">لا توجد خدمات هندسية متاحة حالياً.</p>';
        return;
    }
    
    allServices.forEach(service => {
        // Find the pro who offers this service
        const pro = allPros.find(p => p.id === service.proId);
        if (!pro) return; // Skip if pro not found
        
        let isSubExpired = false;
        if (pro.subscriptionStart) {
            const subStart = new Date(pro.subscriptionStart);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - subStart) / (1000 * 60 * 60 * 24));
            if (diffDays > freeTrialDays) isSubExpired = true;
        }

        let contactHtml = '';
        if (isSubExpired) {
            contactHtml = \`<button class="btn btn-secondary" disabled style="width: 100%; opacity: 0.6; cursor: not-allowed; background: #e5e7eb; color: #6b7280; padding: 10px; border-radius: 12px; font-weight: bold;">
                                <i class="fa-solid fa-clock"></i> اشتراك البائع منتهي
                           </button>\`;
        } else {
            contactHtml = \`<button class="btn btn-success" onclick="contactPro('\${pro.phone}', 'طلب خدمة: \${service.name}')" style="width: 100%; background: #25D366; color: white; border: none; padding: 10px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(37,211,102,0.3);">
                                <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> طلب عبر واتساب
                           </button>\`;
        }

        const card = document.createElement('div');
        card.className = 'shop-item glass-card';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';
        card.style.padding = '0';
        card.style.overflow = 'hidden';
        
        card.innerHTML = \`
            <div style="padding: 15px; flex-grow: 1;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <div>
                        <i class="fa-solid fa-tags" style="color:var(--primary); font-size:1.5rem; margin-bottom:5px;"></i>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">\${service.name}</h4>
                    </div>
                </div>
                <p style="margin: 0 0 15px; font-size: 0.85rem; color: var(--text-light); line-height:1.4;">\${service.desc}</p>
                <div style="color: var(--primary); font-weight: bold; font-size: 1.25rem; margin-bottom: 10px;">
                    \${service.price.toLocaleString()} دينار
                </div>
                
                <hr style="border:0; border-top:1px solid #e2e8f0; margin:10px 0;">
                
                <p class="merchant-name" onclick="openProProfile('\${pro.id}')" style="margin:0; font-size:0.9rem; color:#64748b; display:flex; align-items:center; cursor:pointer;">
                    <i class="fa-solid \${pro.logo || 'fa-user-tie'}" style="margin-left:5px; color:#3b82f6;"></i>
                    <span style="text-decoration:underline;">\${pro.name}</span>
                </p>
                <p style="margin: 2px 0 0 20px; font-size: 0.75rem; color: #94a3b8;">\${pro.category}</p>
            </div>
            <div style="padding: 10px 15px 15px;">
                \${contactHtml}
            </div>
        \`;
        prosList.appendChild(card);
    });
};
`;

// Extract existing renderPros body and replace
const startIndex = js.indexOf('window.renderPros = function() {');
if (startIndex !== -1) {
    // Find where the function ends. Looking for the start of the next major section or `switchView('pro-profile');` function, wait, renderPros ends when Request Board logic starts!
    const endIndex = js.indexOf('// REQUESTS BOARD LOGIC', startIndex);
    
    // We will just replace it cleanly
    if (endIndex !== -1) {
        // Find the actual closing brace before REQUESTS BOARD LOGIC. Let's just find `window.openProProfile = function` and replace up to there!
        const openProIndex = js.indexOf('window.openProProfile = function', startIndex);
        if (openProIndex !== -1) {
            const before = js.substring(0, startIndex);
            const after = js.substring(openProIndex);
            js = before + newRenderPros + '\n\n' + after;
            fs.writeFileSync('script.js', js, 'utf8');
            console.log('Successfully updated renderPros');
        }
    }
}
