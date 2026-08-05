const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const startTag = '<section id="business" class="app-view">';
const endTag = '</section>';

const startIdx = html.indexOf(startTag);
if (startIdx !== -1) {
    // Find the NEXT closing section tag after startIdx
    const endIdx = html.indexOf(endTag, startIdx) + endTag.length;
    
    const premiumBusinessSection = `<section id="business" class="app-view">
                    <!-- VIP Investor Hero Banner -->
                    <div class="hero-banner" style="height: 220px; border-radius: 0 0 30px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <div id="bizHero" class="ad-background-slider">
                            <div class="ad-slide active"
                                style="background-image: url('assets/images/tabooga_business_office_1766770523672.png'); filter: brightness(0.4);">
                            </div>
                        </div>
                        <div class="hero-overlay" style="background: linear-gradient(0deg, #1e1b4b 0%, transparent 100%);"></div>
                        <div class="hero-content" style="bottom: 20px;">
                            <div style="background: rgba(255,215,0,0.2); border: 1px solid rgba(255,215,0,0.5); color: #FFD700; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; display: inline-block; margin-bottom: 8px;">
                                <i class="fa-solid fa-crown"></i> B2B & Investors Hub
                            </div>
                            <h2 class="hero-title" style="font-size: 1.6rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">منصة الشركاء الاستراتيجيين</h2>
                            <p class="hero-subtitle" style="font-size: 0.9rem; color: #e2e8f0;">استثمر، ضاعف مبيعاتك، وسيطر على سوق البناء العراقي</p>
                        </div>
                    </div>

                    <!-- Market KPIs (Why Invest) -->
                    <div style="margin: -20px 15px 20px; background: white; border-radius: 16px; padding: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.06); position: relative; z-index: 10; display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: #4F46E5;">+50K</div>
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">طلب شهرياً</div>
                        </div>
                        <div style="border-right: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; padding: 0 15px;">
                            <div style="font-size: 1.2rem; font-weight: 900; color: #10B981;">100%</div>
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">تغطية للسوق</div>
                        </div>
                        <div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: #F59E0B;">VIP</div>
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">بيانات ضخمة</div>
                        </div>
                    </div>

                    <div style="padding: 0 15px;">
                        <!-- VIP Partnership CTA -->
                        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 20px; color: white; margin-bottom: 25px; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 6rem; color: rgba(255,255,255,0.03); transform: rotate(15deg);">
                                <i class="fa-solid fa-chart-line"></i>
                            </div>
                            <h3 style="margin: 0 0 8px; font-size: 1.1rem; position: relative; z-index: 2;">للمستثمرين والشركات الكبرى</h3>
                            <p style="margin: 0 0 15px; font-size: 0.8rem; color: #94a3b8; position: relative; z-index: 2;">احصل على صلاحيات حصرية، بيانات تحليلية، وإدارة كاملة لطلبات المحافظات.</p>
                            <button onclick="vipContact()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 0.9rem; width: 100%; cursor: pointer; position: relative; z-index: 2; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">
                                <i class="fa-solid fa-handshake"></i> تواصل مع الإدارة للشراكة
                            </button>
                        </div>

                        <div class="section-title" style="margin-bottom: 15px;">
                            <h3 style="font-size: 1.1rem; color: #1e293b;"><i class="fa-solid fa-layer-group" style="color:#4F46E5; margin-left:8px;"></i> باقات الاشتراك التجارية</h3>
                            <p style="font-size:0.8rem; color:#64748b; margin-top:2px;">اختر الباقة المناسبة لتوسيع نشاطك التجاري</p>
                        </div>

                        <!-- Compact Grid Plans List -->
                        <div id="businessPlansContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 25px;">
                            <!-- Injected by script -->
                        </div>

                        <!-- Unified Registration Button -->
                        <button class="cta-button" onclick="openRegistration()"
                            style="width:100%; border-radius:14px; padding:12px; font-size:1rem; justify-content:center; box-shadow:0 4px 15px rgba(37, 99, 235, 0.2); background: white; color: var(--primary); border: 2px solid var(--primary); margin-bottom: 20px;">
                            <i class="fa-solid fa-user-plus"></i> <span data-i18n="reg_title">تسجيل حساب قياسي</span>
                        </button>
                    </div>
                </section>`;

    html = html.substring(0, startIdx) + premiumBusinessSection + html.substring(endIdx);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Successfully rebuilt the Business Center HTML.");
} else {
    console.log("Section business not found.");
}
