const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// First, fix any corruption if the file has duplicate `#merchant-profile` tags.
// Let's just restore from a clean state if we can? No, I will just insert the upload button.
const uploadBtnHtml = `                    <!-- Upload Public Blueprint -->
                    <div style="padding: 0 15px 15px;">
                        <button onclick="merchantAction('publicBlueprint')" style="width:100%; background: #f8fafc; color: var(--primary); border: 2px dashed var(--primary); border-radius:12px; padding:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px;">
                            <i class="fa-solid fa-cloud-arrow-up"></i> رفع مخطط من الجهاز
                        </button>
                    </div>`;

if (!html.includes('publicBlueprint')) {
    html = html.replace('<!-- Free Blueprints Gallery (Attraction) -->', uploadBtnHtml + '\n\n                    <!-- Free Blueprints Gallery (Attraction) -->');
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Upload button inserted.");
} else {
    console.log("Upload button already exists.");
}
