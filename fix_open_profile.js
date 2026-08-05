const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const startIndex = js.indexOf('window.openProProfile = function(proId)');
// Find the next 'window.' or 'function ' to delimit the function.
const endIndex = js.indexOf('function checkAppUpdates()', startIndex);

const newLogic = `window.openProProfile = function(proId) {
    window.currentProId = proId;
    
    let allPros = typeof constructionData !== 'undefined' && constructionData.pros ? [...constructionData.pros] : [];
    const businessDir = JSON.parse(localStorage.getItem('business_directory') || '[]');
    const approvedPros = businessDir.filter(b => ['eng','con','tech','elec','carp'].includes(b.category)).map(b => {
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
    });
    allPros = [...allPros, ...approvedPros];
    
    const pro = allPros.find(p => p.id === proId);
    if (!pro) {
        console.error("Pro not found: ", proId);
        return;
    }

    if(pro.coverImage) {
        document.getElementById('ppCover').style.backgroundImage = \`url('\${pro.coverImage}')\`;
    } else {
        document.getElementById('ppCover').style.backgroundImage = \`url('assets/images/tabooga_pros_engineer_1766770490376.png')\`;
    }
    document.getElementById('ppLogo').innerHTML = \`<i class="fa-solid \${pro.logo || 'fa-user-tie'}"></i>\`;
    document.getElementById('ppName').innerText = pro.name;
    document.getElementById('ppCategory').innerHTML = \`<i class="fa-solid fa-tag"></i> \${pro.category}\`;
    
    const savedDescs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_desc')) || {};
    document.getElementById('ppDesc').innerText = savedDescs[pro.id] || pro.desc || 'لا توجد نبذة حالياً.';

    // Render CV
    const savedCVs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_cvs')) || {};
    const proCv = savedCVs[pro.id] || pro.cv;
    if (proCv) {
        const cvCont = document.getElementById('ppCvContainer');
        if(cvCont) {
            cvCont.style.display = 'block';
            document.getElementById('ppCvText').innerText = proCv;
        }
    } else {
        const cvCont = document.getElementById('ppCvContainer');
        if(cvCont) cvCont.style.display = 'none';
    }
    
    // Render Services
    const ppServicesGrid = document.getElementById('ppServicesGrid');
    if (ppServicesGrid) {
        let services = typeof constructionData !== 'undefined' && constructionData.proServices ? constructionData.proServices : [];
        let savedServices = JSON.parse(localStorage.getItem('tabooqa_custom_pro_services')) || [];
        let allServices = [...savedServices, ...services].filter(s => s.proId === pro.id);
        
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
    }

    const freeTrialDays = (typeof constructionData !== 'undefined' && constructionData.prosSettings && constructionData.prosSettings.freeTrialDays) ? constructionData.prosSettings.freeTrialDays : 30;
    let isSubExpired = false;
    if (pro.subscriptionStart) {
        const subStart = new Date(pro.subscriptionStart);
        const diffDays = Math.ceil(Math.abs(new Date() - subStart) / (1000 * 60 * 60 * 24));
        if (diffDays > freeTrialDays) isSubExpired = true;
    }

    const pContact = document.getElementById('ppContactBtn');
    if(pContact) {
        if(isSubExpired) {
            pContact.innerHTML = \`<i class="fa-solid fa-clock"></i> اشتراك منتهي\`;
            pContact.disabled = true;
            pContact.style.background = '#e2e8f0';
            pContact.style.color = '#94a3b8';
            pContact.style.cursor = 'not-allowed';
            pContact.onclick = null;
        } else {
            pContact.innerHTML = \`<i class="fa-brands fa-whatsapp"></i> تواصل مع المحترف\`;
            pContact.disabled = false;
            pContact.style.background = 'var(--primary)';
            pContact.style.color = 'white';
            pContact.style.cursor = 'pointer';
            pContact.onclick = () => contactPro(pro.phone, 'طلب تواصل من منصة طابوقة');
        }
    }

    // Load Pro Projects
    const pPortfolios = typeof constructionData !== 'undefined' && constructionData.portfolios ? constructionData.portfolios.filter(p => p.proId === proId) : [];
    const ppProjectsGrid = document.getElementById('ppProjectsGrid');
    if (ppProjectsGrid) {
        if (pPortfolios.length > 0) {
            ppProjectsGrid.innerHTML = pPortfolios.map(p => \`
                <div class="shop-item glass-card" onclick="openGallery('\${p.id}')">
                    <div style="height: 140px; background: url('\${p.images[0]}') center/cover no-repeat;"></div>
                    <div style="padding: 15px;">
                        <h4 style="margin: 0 0 5px; font-size: 1rem; color: var(--text-main);">\${p.title}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-light);">\${p.desc}</p>
                    </div>
                </div>
            \`).join('');
            ppProjectsGrid.style.display = 'grid';
        } else {
            ppProjectsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:var(--text-light);"><i class="fa-solid fa-images" style="font-size:2rem; margin-bottom:10px;"></i><br>لا توجد أعمال سابقة حالياً</div>';
            ppProjectsGrid.style.display = 'block';
        }
    }
    
    switchView('pro-profile');
}

function openRegistration`;

const openRegIndex = js.indexOf('function openRegistration');

if (startIndex !== -1 && openRegIndex !== -1) {
    const before = js.substring(0, startIndex);
    const after = js.substring(openRegIndex + 'function openRegistration'.length);
    js = before + newLogic + after;
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("Fixed openProProfile bounds manually");
} else {
    console.log("Could not find start index or openReg index: ", startIndex, openRegIndex);
}
