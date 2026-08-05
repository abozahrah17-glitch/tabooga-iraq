const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const targetFunctionStart = js.indexOf('function renderBusinessPlans() {');
const targetFunctionEnd = js.indexOf('function openRegistration', targetFunctionStart);

if (targetFunctionStart !== -1 && targetFunctionEnd !== -1) {
    const newRenderFunction = `function renderBusinessPlans() {
    var container = document.getElementById('businessPlansContainer');
    if (!container) return;

    var pSettings = {};
    try { pSettings = JSON.parse(localStorage.getItem('payment_settings') || '{}'); } catch(e) {}
    var fees = pSettings.fees || {};

    var plans = [
        {
            id: 'eng',
            name: 'شراكة المكاتب الهندسية',
            price: fees.eng || 50000,
            color: '#6366f1',
            icon: 'fa-compass-drafting',
            features: ['الظهور للمقاولين', 'طلبات مباشرة']
        },
        {
            id: 'con',
            name: 'المقاول المعتمد',
            price: fees.con || 35000,
            color: '#f59e0b',
            icon: 'fa-hard-hat',
            features: ['إدارة المناقصات', 'بيانات الزبائن']
        },
        {
            id: 'mat',
            name: 'الوكيل الحصري (تاجر)',
            price: fees.mat || 35000,
            color: '#10b981',
            icon: 'fa-cubes',
            features: ['متجر متكامل', 'طلبات بالجملة']
        },
        {
            id: 'tech',
            name: 'الفني المحترف',
            price: 15000,
            color: '#3b82f6',
            icon: 'fa-tools',
            features: ['معرض أعمال', 'تقييم الزبائن']
        }
    ];

    container.innerHTML = '';
    
    plans.forEach(plan => {
        const card = document.createElement('div');
        card.style.cssText = \`background: white; border: 1px solid \${plan.color}30; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;\`;
        
        const feats = plan.features.map(f => \`<div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:\${plan.color}; font-size:0.6rem;"></i> \${f}</div>\`).join('');
        
        card.innerHTML = \`
            <div>
                <div style="width: 40px; height: 40px; border-radius: 10px; background: \${plan.color}15; color: \${plan.color}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin: 0 auto 8px;">
                    <i class="fa-solid \${plan.icon}"></i>
                </div>
                <h4 style="margin: 0 0 5px; font-size: 0.85rem; color: #1e293b; font-weight: 800;">\${plan.name}</h4>
                \${feats}
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                <div style="font-size: 0.9rem; font-weight: 900; color: \${plan.color};">\${plan.price.toLocaleString()} <span style="font-size:0.6rem;">د.ع/سنوياً</span></div>
            </div>
        \`;
        container.appendChild(card);
    });
}

window.vipContact = function() {
    Swal.fire({
        title: 'بوابة الشراكات الكبرى',
        html: \`
            <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px;">يسعدنا انضمام كبار التجار والمستثمرين لشبكتنا. يرجى ترك بياناتك وسيقوم مدير العلاقات العامة بالتواصل معك فوراً.</div>
            <input id="vip-name" class="swal2-input" placeholder="اسم الشركة أو المستثمر">
            <input id="vip-phone" type="tel" class="swal2-input" placeholder="رقم الهاتف المباشر">
            <select id="vip-interest" class="swal2-input" style="height: auto; padding: 10px;">
                <option value="invest">الاستثمار في المنصة</option>
                <option value="agency">شراكة / وكالة إقليمية</option>
                <option value="ads">رعاية إعلانية ضخمة</option>
            </select>
        \`,
        focusConfirm: false,
        confirmButtonText: 'إرسال طلب الشراكة',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#1e1b4b',
        preConfirm: () => {
            const name = document.getElementById('vip-name').value;
            const phone = document.getElementById('vip-phone').value;
            if(!name || !phone) {
                Swal.showValidationMessage('الرجاء إدخال الاسم ورقم الهاتف');
                return false;
            }
            return { name, phone };
        }
    }).then((result) => {
        if(result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'تم استلام طلبك باهتمام',
                text: 'تم تحويل طلبك مباشرة للإدارة العليا. سنتواصل معك في أقرب وقت.',
                confirmButtonColor: '#10b981'
            });
        }
    });
};

`;

    js = js.substring(0, targetFunctionStart) + newRenderFunction + js.substring(targetFunctionEnd);
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("Successfully updated renderBusinessPlans and added vipContact.");
} else {
    console.log("Could not find boundaries.");
}
