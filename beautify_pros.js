const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const newRenderPros = `
window.renderPros = function() {
    const prosList = document.getElementById('prosList');
    if (!prosList) return;
    prosList.innerHTML = '';
    
    // Change grid layout for better service cards
    prosList.style.display = 'grid';
    prosList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    prosList.style.gap = '20px';
    prosList.style.padding = '10px';
    
    let allPros = typeof constructionData !== 'undefined' && constructionData.pros ? [...constructionData.pros] : [];
    
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
    
    const freeTrialDays = (typeof constructionData !== 'undefined' && constructionData.prosSettings && constructionData.prosSettings.freeTrialDays) ? constructionData.prosSettings.freeTrialDays : 30;
    
    // Gather all services
    let allServices = typeof constructionData !== 'undefined' && constructionData.proServices ? [...constructionData.proServices] : [];
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
        prosList.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);"><i class="fa-solid fa-box-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom:15px;"></i><h3 style="color:#64748b;">لا توجد خدمات هندسية متاحة حالياً</h3></div>';
        return;
    }
    
    // Gradients array for beautiful headers
    const gradients = [
        'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Blue
        'linear-gradient(135deg, #10b981, #047857)', // Green
        'linear-gradient(135deg, #f59e0b, #b45309)', // Orange
        'linear-gradient(135deg, #8b5cf6, #5b21b6)', // Purple
        'linear-gradient(135deg, #ef4444, #b91c1c)'  // Red
    ];

    allServices.forEach((service, index) => {
        const pro = allPros.find(p => p.id === service.proId);
        if (!pro) return;
        
        let isSubExpired = false;
        if (pro.subscriptionStart) {
            const subStart = new Date(pro.subscriptionStart);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - subStart) / (1000 * 60 * 60 * 24));
            if (diffDays > freeTrialDays) isSubExpired = true;
        }

        let contactHtml = '';
        if (isSubExpired) {
            contactHtml = \`<button disabled style="width: 100%; background: #f1f5f9; color: #94a3b8; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: not-allowed; display:flex; justify-content:center; align-items:center; gap:8px;">
                                <i class="fa-solid fa-clock"></i> اشتراك منتهي
                           </button>\`;
        } else {
            contactHtml = \`<button onclick="contactPro('\${pro.phone}', 'طلب خدمة: \${service.name}')" style="width: 100%; background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(37,211,102,0.3); transition: all 0.3s ease; display:flex; justify-content:center; align-items:center; gap:8px;">
                                <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> اطلب الخدمة الآن
                           </button>\`;
        }

        const gradient = gradients[index % gradients.length];
        const icon = service.name.includes('تصميم') ? 'fa-pen-ruler' : (service.name.includes('إشراف') ? 'fa-hard-hat' : 'fa-handshake-angle');

        const card = document.createElement('div');
        card.style.background = 'white';
        card.style.borderRadius = '20px';
        card.style.overflow = 'hidden';
        card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        
        // Add hover effect
        card.onmouseover = () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)'; };
        card.onmouseout = () => { card.style.transform = 'none'; card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)'; };

        card.innerHTML = \`
            <div style="background: \${gradient}; height: 110px; position: relative; display: flex; justify-content: center; align-items: center;">
                <div style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                    \${service.price.toLocaleString()} دينار
                </div>
                <i class="fa-solid \${icon}" style="font-size: 3.5rem; color: rgba(255,255,255,0.9); text-shadow: 0 4px 10px rgba(0,0,0,0.2);"></i>
                <div style="position:absolute; bottom:-1px; left:0; right:0; height:20px; background:white; border-radius: 20px 20px 0 0;"></div>
            </div>
            
            <div style="padding: 0 20px 15px; flex-grow: 1; display: flex; flexDirection: column;">
                <h4 style="margin: 5px 0 10px; font-size: 1.25rem; color: #1e293b; font-weight: 800;">\${service.name}</h4>
                <p style="margin: 0 0 15px; font-size: 0.9rem; color: #64748b; line-height: 1.6; flex-grow: 1;">\${service.desc}</p>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 10px 15px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; cursor: pointer; transition: background 0.2s;" onclick="openProProfile('\${pro.id}')" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; justify-content: center; align-items: center; color: var(--primary);">
                            <i class="fa-solid \${pro.logo || 'fa-user-tie'}"></i>
                        </div>
                        <div>
                            <h5 style="margin: 0; font-size: 0.95rem; color: #334155;">\${pro.name}</h5>
                            <span style="font-size: 0.75rem; color: #94a3b8;">\${pro.category}</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-left" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                </div>
                
                \${contactHtml}
            </div>
        \`;
        prosList.appendChild(card);
    });
};
`;

const startIndex = js.indexOf('window.renderPros = function() {');
if (startIndex !== -1) {
    const endIndex = js.indexOf('window.openProProfile = function', startIndex);
    if (endIndex !== -1) {
        const before = js.substring(0, startIndex);
        const after = js.substring(endIndex);
        js = before + newRenderPros + '\n\n' + after;
        fs.writeFileSync('script.js', js, 'utf8');
        console.log('Successfully updated renderPros UI');
    }
}
