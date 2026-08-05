
/* --- Dynamic Business Plans --- */
const defaultPlans = [
    {
        id: 'silver',
        name: 'الباقة الفضية',
        key_name: 'biz_silver',
        desc: 'ظهور في القائمة',
        key_desc: 'biz_feat_list',
        price: 25000,
        period: 'شهرياً',
        key_period: 'biz_month',
        icon: 'fa-medal',
        color: '#64748b',
        bg: '#f1f5f9',
        is_gold: false
    },
    {
        id: 'gold',
        name: 'الباقة الذهبية',
        key_name: 'biz_gold',
        desc: 'مميزات كاملة',
        key_desc: 'biz_feat_full',
        price: 250000,
        period: 'سنوياً',
        key_period: 'biz_year',
        icon: 'fa-crown',
        color: '#f59e0b',
        bg: 'rgba(255,255,255,0.1)',
        is_gold: true
    },
    {
        id: 'pro',
        name: 'باقة المحترفين',
        key_name: 'biz_pro_plan',
        desc: 'استقبال طلبات',
        key_desc: 'biz_feat_pro',
        price: 15000,
        period: 'شهرياً',
        key_period: 'biz_month',
        icon: 'fa-user-gear',
        color: '#10b981',
        bg: '#ecfdf5',
        is_gold: false
    },
    {
        id: 'office',
        name: 'باقة المكاتب',
        key_name: 'biz_office_plan',
        desc: 'بيع مخططات',
        key_desc: 'biz_feat_office',
        price: 50000,
        period: 'شهرياً',
        key_period: 'biz_month',
        icon: 'fa-building-user',
        color: '#3b82f6',
        bg: '#eff6ff',
        is_gold: false
    }
];

function getPlans() {
    const stored = localStorage.getItem('plan_prices');
    if (stored) return JSON.parse(stored);
    return defaultPlans;
}

function renderBusinessPlans() {
    const container = document.getElementById('businessPlansContainer');
    if (!container) return;

    const plans = getPlans();
    const t = translations[currentLang];

    container.innerHTML = plans.map(plan => {
        const name = t[plan.key_name] || plan.name;
        const desc = t[plan.key_desc] || plan.desc;
        const period = t[plan.key_period] || plan.period;

        const style = plan.is_gold
            ? `background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color:white; overflow:hidden; box-shadow:0 4px 15px rgba(15, 23, 42, 0.3);`
            : `background:var(--bg-card); border:1px solid var(--border-color); border-right: 4px solid ${plan.color};`;

        const iconStyle = plan.is_gold
            ? `background:rgba(255,255,255,0.1); color:#f59e0b;`
            : `background:${plan.bg}; color:${plan.color};`;

        return `
            <div class="v-plan-card" onclick="openPayment('${plan.id}', ${plan.price})"
                style="display:flex; align-items:center; padding:15px; border-radius:12px; gap:15px; cursor:pointer; position:relative; ${style}">
                ${plan.is_gold ? '<div style="position:absolute; top:-10px; right:-10px; width:40px; height:40px; background:#f59e0b; filter:blur(20px); opacity:0.5;"></div>' : ''}
                <div style="width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; ${iconStyle}">
                    <i class="fa-solid ${plan.icon}"></i>
                </div>
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px; font-size:1rem; ${plan.is_gold ? 'color:#f59e0b;' : 'color:var(--text-main);'}">${name}</h4>
                    <p style="margin:0; font-size:0.85rem; ${plan.is_gold ? 'opacity:0.8;' : 'color:var(--text-light);'}">${desc}</p>
                </div>
                <div style="text-align:left;">
                    <div style="font-weight:800; ${plan.is_gold ? '' : 'color:var(--text-main);'}">${plan.price.toLocaleString()}</div>
                    <small style="${plan.is_gold ? 'opacity:0.6;' : 'color:var(--text-light);'} font-size:0.75rem;">/ ${period}</small>
                </div>
            </div>
        `;
    }).join('');
}

function openPriceManager() {
    Swal.fire({
        title: 'أدخل رمز الحماية',
        input: 'password',
        inputAttributes: { maxlength: 4, placeholder: '****', autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'دخول',
        cancelButtonText: 'إلغاء',
        preConfirm: (pin) => {
            if (pin !== '1122') Swal.showValidationMessage('رمز الحماية غير صحيح');
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showPriceEditor();
        }
    });
}

function showPriceEditor() {
    const plans = getPlans();

    // Create HTML inputs for each plan
    const inputsHtml = plans.map(p => `
        <div style="margin-bottom:15px; text-align:right;">
            <label style="font-weight:bold; font-size:0.9rem;">${p.name}</label>
            <input type="number" id="price_${p.id}" value="${p.price}" class="swal2-input" style="margin:5px 0;">
        </div>
    `).join('');

    Swal.fire({
        title: 'تعديل الأسعار',
        html: `<div style="text-align:right;">${inputsHtml}</div>`,
        showCancelButton: true,
        confirmButtonText: 'حفظ التعديلات',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            // Update prices
            plans.forEach(p => {
                const val = document.getElementById(`price_${p.id}`).value;
                if (val) p.price = parseInt(val);
            });
            return plans;
        }
    }).then((res) => {
        if (res.isConfirmed) {
            localStorage.setItem('plan_prices', JSON.stringify(res.value));
            renderBusinessPlans();
            Swal.fire('تم الحفظ', 'تم تحديث الأسعار بنجاح', 'success');
        }
    });
}
