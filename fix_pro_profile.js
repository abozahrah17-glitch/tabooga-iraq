const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const regexToMatch = /document\.getElementById\('ppDesc'\)\.innerText\s*=\s*pro\.desc\s*\|\|\s*'[^']+';/;

const newProRender = `
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

if (js.match(regexToMatch) && !js.includes('tabooqa_custom_pro_cvs')) {
    js = js.replace(regexToMatch, match => match + '\n' + newProRender);
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("Updated script.js successfully");
} else {
    console.log("Already updated or match failed");
}
