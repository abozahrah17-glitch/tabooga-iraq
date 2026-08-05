const fs = require('fs');

// 1. Modify index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace the hardcoded gallery with a dynamic one and give the button an ID
const oldUploadBtn = `<div style="padding: 0 15px 5px;">
                        <button onclick="merchantAction('publicBlueprint')"`;
const newUploadBtn = `<div id="adminBlueprintUploadBtn" style="padding: 0 15px 5px; display: none;">
                        <button onclick="merchantAction('publicBlueprint')"`;
html = html.replace(oldUploadBtn, newUploadBtn);

const oldGalleryRegex = /\<div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:10px;" class="hide-scrollbar"\>[\s\S]*?\<\!-- Filter Area Sizes --\>/;
const newGalleryHTML = `<div id="freeBlueprintsGallery" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:10px;" class="hide-scrollbar">
                            <!-- Dynamic Content -->
                        </div>
                    </div>

                    <!-- Filter Area Sizes -->`;
html = html.replace(oldGalleryRegex, newGalleryHTML);
fs.writeFileSync('index.html', html, 'utf8');
console.log("Updated index.html");

// 2. Modify script.js
let js = fs.readFileSync('script.js', 'utf8');

const renderFreeBlueprintsFunc = `
window.renderFreeBlueprints = function() {
    const gallery = document.getElementById('freeBlueprintsGallery');
    if(!gallery) return;
    
    // Default AI images
    let freePlans = [
        { id: 'free1', area: 50, name: 'دار اقتصادي', image: 'assets/images/blueprint_50m.png' },
        { id: 'free2', area: 100, name: 'كلاسيك مريح', image: 'assets/images/blueprint_100m.png' },
        { id: 'free3', area: 150, name: 'فيلا مودرن', image: 'assets/images/blueprint_150m.png' }
    ];
    
    // Add admin uploaded ones
    const adminUploads = JSON.parse(localStorage.getItem('tabooqa_free_blueprints') || '[]');
    freePlans = [...adminUploads, ...freePlans];
    
    gallery.innerHTML = freePlans.map(plan => \`
        <div style="min-width:140px; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; position:relative;">
            <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px 6px; border-radius:6px;">\${plan.area} متر</div>
            <img src="\${plan.image}" alt="\${plan.area}m" style="width:100%; height:90px; object-fit:cover; border-bottom:1px solid #e2e8f0;">
            <div style="padding:8px; text-align:center;">
                <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${plan.name}</div>
                <button onclick="window.open('\${plan.image}', '_blank')" style="width:100%; padding:4px 0; background:#f1f5f9; color:var(--primary); border:none; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;">
                    <i class="fa-solid fa-download"></i> تحميل مجاني
                </button>
            </div>
        </div>
    \`).join('');
};
`;

// Inject renderFreeBlueprints if not exists
if(!js.includes('window.renderFreeBlueprints')) {
    js += '\n' + renderFreeBlueprintsFunc + '\n';
    js += 'document.addEventListener("DOMContentLoaded", () => { setTimeout(() => { if(window.renderFreeBlueprints) renderFreeBlueprints(); }, 1000); });\n';
}

// Modify switchView to show/hide the admin button
const checkAdminCode = `
    const uploadBtn = document.getElementById('adminBlueprintUploadBtn');
    if (uploadBtn) {
        if (typeof window.isAdminLoggedIn === 'function' && window.isAdminLoggedIn()) {
            uploadBtn.style.display = 'block';
        } else {
            uploadBtn.style.display = 'none';
        }
    }
`;
if(!js.includes("document.getElementById('adminBlueprintUploadBtn')")) {
    js = js.replace(/function switchView\(viewId\)\s*\{/, "function switchView(viewId) {\n" + checkAdminCode);
}

// Modify publicBlueprint to push to 'tabooqa_free_blueprints' instead of constructionData.blueprints
const oldSaveLogic = `// Add to start of blueprints
                constructionData.blueprints.unshift(newPlan);
                
                // Save to local storage
                let savedBlueprints = JSON.parse(localStorage.getItem('tabooqa_custom_blueprints')) || [];
                savedBlueprints.unshift(newPlan);
                localStorage.setItem('tabooqa_custom_blueprints', JSON.stringify(savedBlueprints));
                
                // Re-render blueprints view if active
                if(typeof renderBlueprints === 'function') {
                    renderBlueprints('all');
                }`;
                
const newSaveLogic = `// Add to free blueprints gallery (Public Service)
                let savedFree = JSON.parse(localStorage.getItem('tabooqa_free_blueprints')) || [];
                savedFree.unshift({ id: newPlan.id, name: newPlan.name, area: newPlan.area, image: newPlan.image });
                localStorage.setItem('tabooqa_free_blueprints', JSON.stringify(savedFree));
                
                if(typeof renderFreeBlueprints === 'function') {
                    renderFreeBlueprints();
                }`;

if(js.includes('tabooqa_custom_blueprints') && js.includes('publicBlueprint')) {
    // Only replace inside publicBlueprint block
    const pbIndex = js.indexOf("actionType === 'publicBlueprint'");
    const beforePb = js.substring(0, pbIndex);
    let afterPb = js.substring(pbIndex);
    afterPb = afterPb.replace(oldSaveLogic, newSaveLogic);
    js = beforePb + afterPb;
}

fs.writeFileSync('script.js', js, 'utf8');
console.log("Updated script.js");
