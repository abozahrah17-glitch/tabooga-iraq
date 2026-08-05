const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const startTag = '<!-- Premium AI Market Intelligence Section -->';
const endTag = '<div class="glass-card">';

const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const compactWidget = `<!-- Premium AI Market Intelligence Section (Compact) -->
                    <div class="market-intelligence-box compact-ai-widget" style="padding: 12px 15px; margin-bottom: 20px; border-radius:12px; border: 1px solid #E2E8F0; background: #F8FAFC; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: #4F46E5;">
                                <i class="fa-solid fa-chart-line fa-beat-fade"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0 0 2px; font-size: 0.9rem; font-weight: 700; color: #1e293b;">مؤشر السوق والأسعار</h3>
                                <div style="font-size: 0.75rem; color: #64748b;">
                                    <span id="live-usd-rate" style="font-weight: 800; color: #10B981;">1,530 IQD</span> (استقرار نسبي)
                                </div>
                            </div>
                        </div>
                        
                        <button onclick="refreshMarketData()" style="background: transparent; border: 1px solid #CBD5E1; color: #64748b; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; transition: 0.2s;">
                            <i id="sync-spinner" class="fa-solid fa-arrows-rotate"></i> تحديث
                        </button>
                    </div>

                    <!-- Hidden AI Fields to prevent JS crash -->
                    <div style="display:none;">
                        <div id="usd-trend-icon"></div>
                        <div id="usd-status-text"></div>
                        <div id="market-index"></div>
                        <div id="market-rec-text"></div>
                        <marquee id="stock-marquee"></marquee>
                        <div id="ai-advice-container"></div>
                        <p id="ai-advice-text"></p>
                    </div>

                    `;

    html = html.substring(0, startIdx) + compactWidget + html.substring(endIdx);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Successfully replaced AI section with compact widget.");
} else {
    console.log("Tags not found");
}
