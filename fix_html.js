const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const insertHTML = `
                        </div>
                        
                        <p id="ppDesc" style="margin: 0 0 20px; font-size: 0.95rem; color: var(--text-main); line-height: 1.5; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;"></p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; color: var(--primary); font-size: 1.1rem;"><i class="fa-solid fa-images"></i> معرض الأعمال</h4>
                        </div>
                        <div class="shop-grid" id="ppPortfoliosGrid"></div>
                    </div>
                </section>

                <!-- View: Plans (Engineering Center) -->
                <section id="plans" class="app-view">
                    <!-- Engineering Ad Slider -->`;

let lines = html.split('\n');
let newLines = [];
let didInsert = false;
for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    if (!didInsert && lines[i].includes("merchantAction('renew')")) {
        if (lines[i+1] && lines[i+1].includes('hero-banner')) {
           newLines.push(insertHTML);
           didInsert = true;
        }
    }
}
fs.writeFileSync('index.html', newLines.join('\n'), 'utf8');
console.log("Success: " + didInsert);
