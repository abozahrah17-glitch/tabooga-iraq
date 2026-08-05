const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const insertHTML = `                    <!-- Free Blueprints Gallery (Attraction) -->
                    <div style="padding: 5px 15px 15px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="margin:0; font-size:1.15rem; color:var(--text-main);">
                                <i class="fa-solid fa-gift" style="color:#f59e0b; margin-left:5px;"></i> مخططات مجانية 
                            </h3>
                            <span style="font-size:0.8rem; background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:10px; font-weight:bold;">خدمة عامة</span>
                        </div>
                        <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:10px;" class="hide-scrollbar">
                            <!-- 50m Free -->
                            <div style="min-width:140px; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; position:relative;">
                                <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px 6px; border-radius:6px;">50 متر</div>
                                <img src="assets/images/blueprint_50m.png" alt="50m" style="width:100%; height:90px; object-fit:cover; border-bottom:1px solid #e2e8f0;">
                                <div style="padding:8px; text-align:center;">
                                    <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:4px;">دار اقتصادي</div>
                                    <button onclick="window.open('assets/images/blueprint_50m.png', '_blank')" style="width:100%; padding:4px 0; background:#f1f5f9; color:var(--primary); border:none; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;">
                                        <i class="fa-solid fa-download"></i> تحميل مجاني
                                    </button>
                                </div>
                            </div>
                            <!-- 100m Free -->
                            <div style="min-width:140px; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; position:relative;">
                                <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px 6px; border-radius:6px;">100 متر</div>
                                <img src="assets/images/blueprint_100m.png" alt="100m" style="width:100%; height:90px; object-fit:cover; border-bottom:1px solid #e2e8f0;">
                                <div style="padding:8px; text-align:center;">
                                    <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:4px;">كلاسيك مريح</div>
                                    <button onclick="window.open('assets/images/blueprint_100m.png', '_blank')" style="width:100%; padding:4px 0; background:#f1f5f9; color:var(--primary); border:none; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;">
                                        <i class="fa-solid fa-download"></i> تحميل مجاني
                                    </button>
                                </div>
                            </div>
                            <!-- 150m Free -->
                            <div style="min-width:140px; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; position:relative;">
                                <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:2px 6px; border-radius:6px;">150 متر</div>
                                <img src="assets/images/blueprint_150m.png" alt="150m" style="width:100%; height:90px; object-fit:cover; border-bottom:1px solid #e2e8f0;">
                                <div style="padding:8px; text-align:center;">
                                    <div style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:4px;">فيلا مودرن</div>
                                    <button onclick="window.open('assets/images/blueprint_150m.png', '_blank')" style="width:100%; padding:4px 0; background:#f1f5f9; color:var(--primary); border:none; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;">
                                        <i class="fa-solid fa-download"></i> تحميل مجاني
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;

let lines = html.split('\n');
let newLines = [];
let didInsert = false;
for (let i = 0; i < lines.length; i++) {
    if (!didInsert && lines[i].includes('<!-- Filter Area Sizes -->')) {
        newLines.push(insertHTML);
        didInsert = true;
    }
    newLines.push(lines[i]);
}
fs.writeFileSync('index.html', newLines.join('\n'), 'utf8');
console.log("Success Insert Free Blueprints: " + didInsert);
