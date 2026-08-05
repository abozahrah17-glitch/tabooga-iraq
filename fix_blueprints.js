const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const blueprintsFunction = `
function renderBlueprints(filterSize = 'all') {
    var gallery = document.getElementById('freeBlueprintsGallery');
    var grid = document.getElementById('blueprintsGrid');
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = 'var(--text-main)';
        btn.style.border = '1px solid #cbd5e1';
    });
    const clickedBtn = event ? event.currentTarget : document.querySelector('.filter-btn');
    if(clickedBtn) {
        clickedBtn.style.background = 'var(--primary)';
        clickedBtn.style.color = 'white';
        clickedBtn.style.border = 'none';
    }

    var bData = [
        { id: 1, name: 'مخطط 50م', size: 50, floors: 1, type: 'residential', img: 'blueprint_50m_1785602472052.png' },
        { id: 2, name: 'مخطط 50م عراقي', size: 50, floors: 2, type: 'residential', img: 'blueprint_50m_iraqi_1785602977551.png' },
        { id: 3, name: 'مخطط 100م', size: 100, floors: 1, type: 'residential', img: 'blueprint_100m_1785602488749.png' },
        { id: 4, name: 'مخطط 100م عراقي', size: 100, floors: 2, type: 'residential', img: 'blueprint_100m_iraqi_1785602995571.png' },
        { id: 5, name: 'مخطط 150م', size: 150, floors: 1, type: 'residential', img: 'blueprint_150m_1785602504267.png' },
        { id: 6, name: 'مخطط 150م عراقي', size: 150, floors: 2, type: 'residential', img: 'blueprint_150m_iraqi_1785603011351.png' }
    ];

    var filtered = filterSize === 'all' ? bData : bData.filter(b => b.size == filterSize);

    if (gallery) {
        gallery.innerHTML = '';
        bData.forEach(b => {
            const el = document.createElement('div');
            el.style.cssText = "min-width:140px; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05); border:1px solid #e2e8f0; position:relative; flex-shrink:0;";
            el.innerHTML = \`
                <div style="height:100px; background:url('assets/images/\${b.img}') center/cover;"></div>
                <div style="padding:8px;">
                    <h4 style="margin:0; font-size:0.85rem; color:var(--text-main);">\${b.name}</h4>
                    <p style="margin:0; font-size:0.75rem; color:#64748b;">\${b.floors} طابق</p>
                </div>
            \`;
            gallery.appendChild(el);
        });
    }

    if (grid) {
        grid.innerHTML = '';
        filtered.forEach(b => {
            const el = document.createElement('div');
            el.className = 'shop-card';
            el.innerHTML = \`
                <img src="assets/images/\${b.img}" alt="\${b.name}" class="shop-card-img" style="object-fit:cover; background:#f8fafc;" onerror="this.src='assets/images/placeholder.png'">
                <div class="shop-card-info">
                    <h4 class="shop-card-title">\${b.name}</h4>
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:5px;">\${b.size} متر مربع - \${b.floors} طابق</div>
                    <button class="add-to-cart-btn" onclick="merchantAction('downloadBlueprint')">
                        <i class="fa-solid fa-download"></i> تحميل المخطط
                    </button>
                </div>
            \`;
            grid.appendChild(el);
        });
    }
}
`;

js += '\n' + blueprintsFunction;

// Also add a call to renderBlueprints in DOMContentLoaded if it's not there
const initRegex = /renderAll\(\);/g;
if(js.match(initRegex)) {
    js = js.replace('renderAll();', 'renderAll();\n    renderBlueprints();');
}

fs.writeFileSync('script.js', js, 'utf8');
console.log("Added renderBlueprints function to script.js");
