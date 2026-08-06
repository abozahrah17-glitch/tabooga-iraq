document.addEventListener('DOMContentLoaded', () => {
    window.buildScope = 'full'; // Default scope
    initializeUI();
    initSettings(); // New Settings Init
    renderBusinessPlans(); // Render Dynamic Plans
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'ar');
    changeLanguage(localStorage.getItem('lang'));

    // Force Home View
    switchView('home');

    setupNavigation();
    renderAll();
    checkAppUpdates();
    updateAdminBadge(); // Restore Admin Notification Logic

    // Forms
    document.getElementById('buildForm').addEventListener('submit', (e) => { e.preventDefault(); calculateCost(); });
    const renovForm = document.getElementById('renovForm');
    if (renovForm) {
        renovForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateRenovation();
            // Ensure result is shown (in case it was hidden)
            document.getElementById('renovResult').style.display = 'block';
            document.getElementById('renovResult').classList.remove('hidden');
        });
    }

    // Auto-Calculate for Renovation Form - REMOVED for better UX (Calculate on button click only)
    /*
    const renovInputs = document.querySelectorAll('#renovForm input, #renovForm select');
    renovInputs.forEach(input => {
        input.addEventListener('change', calculateRenovation);
        input.addEventListener('input', calculateRenovation);
    });
    */

    // Check All Logic
    const checkAll = document.getElementById('checkAllRenov');
    const individualChecks = document.querySelectorAll('.renov-opt');

    if (checkAll) {
        // Master toggle
        checkAll.addEventListener('change', (e) => {
            individualChecks.forEach(cb => cb.checked = e.target.checked);
            // Only update if already calculated/visible
            if (isRenovVisible()) calculateRenovation();
        });

        // Individual toggles update Master
        individualChecks.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(individualChecks).every(c => c.checked);
                checkAll.checked = allChecked;
                if (isRenovVisible()) calculateRenovation();
            });
        });
    }
});

// Global State
var currentLang = 'ar';
var registeredUsers = [];
try {
    const stored = localStorage.getItem('registeredUsers');
    if (stored) registeredUsers = JSON.parse(stored);
} catch (e) {
    console.error("Resetting corrupt storage", e);
    localStorage.removeItem('registeredUsers');
}
// Translations are loaded from translations.js


/* --- Navigation & View Logic --- */
function setWCCount(val) {
    const input = document.getElementById('wcCount');
    if (input) input.value = val;

    // Update visual state of icon boxes
    document.querySelectorAll('.icon-selector .icon-box').forEach((box, idx) => {
        if ((idx + 1) === val) box.classList.add('active');
        else box.classList.remove('active');
    });

    calculateCost(); // Auto update
}

// Helper: Check if results are visible
function isRenovVisible() {
    const resBox = document.getElementById('renovResult');
    return resBox && (resBox.style.display === 'block' || !resBox.classList.contains('hidden'));
}

function toggleRenovSanitary(show) {
    const div = document.getElementById('renovSanitaryDetails');
    if (div) div.style.display = show ? 'block' : 'none';
    if (isRenovVisible()) calculateRenovation();
}

/* --- Settings Logic --- */
function initSettings() {
    // 1. Dark Mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }

    // 2. Default Location
    const savedLoc = localStorage.getItem('defaultLocation');
    if (savedLoc) {
        const defSelect = document.getElementById('defaultGovSelect');
        if (defSelect) defSelect.value = savedLoc;

        // Apply to calculators if they exist
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = savedLoc;

        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = savedLoc;
    }
}

function toggleDarkMode() {
    const isChecked = document.getElementById('darkModeToggle').checked;
    if (isChecked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function setDefaultLocation(govCode) {
    if (govCode) {
        localStorage.setItem('defaultLocation', govCode);
        // Update other selects immediately
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = govCode;
        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = govCode;

        // Show feedback
        showToast("تم حفظ المحافظة الافتراضية");
    } else {
        localStorage.removeItem('defaultLocation');
    }
}

window.clearAppData = function() {
    Swal.fire({
        title: '🔒 رمز حماية تصفير المنصة',
        text: 'أدخل رمز حماية الأدمن لتنفيذ إعادة الضبط والتصفير الكامل',
        input: 'password',
        inputAttributes: { maxlength: 6, placeholder: '****', autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'متابعة ⚠️',
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'إلغاء',
        preConfirm: (pin) => {
            if (pin !== '1122' && pin !== '1234') {
                Swal.showValidationMessage('رمز الحماية غير صحيح');
                return false;
            }
            return true;
        }
    }).then((pinResult) => {
        if (pinResult.isConfirmed) {
            Swal.fire({
                title: '⚠️ تصفير وإعادة ضبط المنصة بالكامل',
                html: `
                    <div style="text-align:right; font-size:0.9rem; line-height:1.6; color:#1e293b;">
                        <p style="color:#ef4444; font-weight:bold;">هل أنت متأكد من مسح وتصفير المنصة بالكامل لغرض التهيئة والإطلاق الفعلي؟</p>
                        <ul style="padding-right:20px; color:#475569;">
                            <li>مسح كافة الشركات والمشتركين الحواسب والتجريبية.</li>
                            <li>مسح طلبات الانضمام المعلقة والسابقة.</li>
                            <li>مسح المنتجات والخدمات والمعارض والطلبات العامة.</li>
                            <li>تصفير ذاكرة السيرفر المباشر وتحديث كافة الأجهزة.</li>
                        </ul>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، مسح وتصفير الآن 🚀',
                confirmButtonColor: '#ef4444',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    const keysToPurge = [
                        'registeredUsers',
                        'business_directory',
                        'admin_requests',
                        'business_products',
                        'business_portfolio',
                        'public_requests',
                        'admin_service_requests',
                        'tabooqa_custom_portfolios',
                        'tabooqa_custom_covers',
                        'tabooqa_custom_logos',
                        'tabooqa_custom_pro_services',
                        'tabooqa_custom_pro_desc',
                        'tabooqa_custom_pro_cvs',
                        'tabooqa_free_blueprints'
                    ];

                    keysToPurge.forEach(k => localStorage.removeItem(k));

                    // Send purge request to backend server
                    fetch('/api/purge-all', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                        .then(r => r.json())
                        .then(data => console.log('Backend Purge Result:', data))
                        .catch(e => console.error('Backend Purge Fetch Error:', e));

                    // Refresh UI
                    if (typeof renderShop === 'function') renderShop();
                    if (typeof renderPros === 'function') renderPros();
                    if (typeof renderPlans === 'function') renderPlans();
                    if (typeof renderBusinessPlans === 'function') renderBusinessPlans();
                    if (typeof renderPublicRequests === 'function') renderPublicRequests();
                    if (typeof renderAdminData === 'function') renderAdminData();
                    if (typeof updateAdminBadge === 'function') updateAdminBadge();

                    Swal.fire({
                        icon: 'success',
                        title: 'تم تصفير وإعادة ضبط المنصة بنجاح! 🎉',
                        text: 'التطبيق الآن نظيف وخالي تماماً وجاهز بنسبة 100% للبدء الفعلي واستقبال الزبائن والشركات الحقيقية.'
                    });
                }
            });
        }
    });
};



function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '9999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.getElementById('langSelect').value = lang;
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');

    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Re-render dynamic content
    // renderAll already handles all sections
    renderAll();

    // Re-calc if results open
    if (!document.getElementById('buildResult').classList.contains('hidden')) calculateCost();
    if (!document.getElementById('renovResult').classList.contains('hidden')) calculateRenovation();
}

function renderAll() {
    updateHeroStats();
    renderShop();
    renderPros();
    renderPlans();
    renderBusinessPlans();
}

document.addEventListener('DOMContentLoaded', () => {
    window.buildScope = 'full'; // Default scope
    initializeUI();
    initSettings(); // New Settings Init
    renderBusinessPlans(); // Render Dynamic Plans
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'ar');
    changeLanguage(localStorage.getItem('lang'));

    // Force Home View
    switchView('home');

    setupNavigation();
    renderAll();
    checkAppUpdates();
    updateAdminBadge(); // Restore Admin Notification Logic

    // Forms
    document.getElementById('buildForm').addEventListener('submit', (e) => { e.preventDefault(); calculateCost(); });
    const renovForm = document.getElementById('renovForm');
    if (renovForm) {
        renovForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateRenovation();
            // Ensure result is shown (in case it was hidden)
            document.getElementById('renovResult').style.display = 'block';
            document.getElementById('renovResult').classList.remove('hidden');
        });
    }

    // Auto-Calculate for Renovation Form - REMOVED for better UX (Calculate on button click only)
    /*
    const renovInputs = document.querySelectorAll('#renovForm input, #renovForm select');
    renovInputs.forEach(input => {
        input.addEventListener('change', calculateRenovation);
        input.addEventListener('input', calculateRenovation);
    });
    */

    // Check All Logic
    const checkAll = document.getElementById('checkAllRenov');
    const individualChecks = document.querySelectorAll('.renov-opt');

    if (checkAll) {
        // Master toggle
        checkAll.addEventListener('change', (e) => {
            individualChecks.forEach(cb => cb.checked = e.target.checked);
            // Only update if already calculated/visible
            if (isRenovVisible()) calculateRenovation();
        });

        // Individual toggles update Master
        individualChecks.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(individualChecks).every(c => c.checked);
                checkAll.checked = allChecked;
                if (isRenovVisible()) calculateRenovation();
            });
        });
    }
});

// Global State
var currentLang = 'ar';
var registeredUsers = [];
try {
    const stored = localStorage.getItem('registeredUsers');
    if (stored) registeredUsers = JSON.parse(stored);
} catch (e) {
    console.error("Resetting corrupt storage", e);
    localStorage.removeItem('registeredUsers');
}
// Translations are loaded from translations.js


/* --- Navigation & View Logic --- */
function setWCCount(val) {
    const input = document.getElementById('wcCount');
    if (input) input.value = val;

    // Update visual state of icon boxes
    document.querySelectorAll('.icon-selector .icon-box').forEach((box, idx) => {
        if ((idx + 1) === val) box.classList.add('active');
        else box.classList.remove('active');
    });

    calculateCost(); // Auto update
}

// Helper: Check if results are visible
function isRenovVisible() {
    const resBox = document.getElementById('renovResult');
    return resBox && (resBox.style.display === 'block' || !resBox.classList.contains('hidden'));
}

function toggleRenovSanitary(show) {
    const div = document.getElementById('renovSanitaryDetails');
    if (div) div.style.display = show ? 'block' : 'none';
    if (isRenovVisible()) calculateRenovation();
}

/* --- Settings Logic --- */
function initSettings() {
    // 1. Dark Mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }

    // 2. Default Location
    const savedLoc = localStorage.getItem('defaultLocation');
    if (savedLoc) {
        const defSelect = document.getElementById('defaultGovSelect');
        if (defSelect) defSelect.value = savedLoc;

        // Apply to calculators if they exist
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = savedLoc;

        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = savedLoc;
    }
}

function toggleDarkMode() {
    const isChecked = document.getElementById('darkModeToggle').checked;
    if (isChecked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function setDefaultLocation(govCode) {
    if (govCode) {
        localStorage.setItem('defaultLocation', govCode);
        // Update other selects immediately
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = govCode;
        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = govCode;

        // Show feedback
        showToast("تم حفظ المحافظة الافتراضية");
    } else {
        localStorage.removeItem('defaultLocation');
    }
}

function clearAppData() {
    Swal.fire({
        title: 'أدخل رمز الحماية',
        text: 'هذا الإجراء سيحذف جميع البيانات المحفوظة.',
        input: 'password',
        inputAttributes: {
            autocapitalize: 'off',
            placeholder: '****',
            maxlength: 4
        },
        showCancelButton: true,
        confirmButtonText: 'تأكيد المسح',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        preConfirm: (pin) => {
            if (pin !== '1122') {
                Swal.showValidationMessage('رمز الحماية غير صحيح');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            Swal.fire({
                title: 'تم المسح!',
                text: 'تمت إعادة ضبط التطبيق بنجاح.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        }
    });
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '9999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.getElementById('langSelect').value = lang;
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');

    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Re-render dynamic content
    // renderAll already handles all sections
    renderAll();

    // Re-calc if results open
    if (!document.getElementById('buildResult').classList.contains('hidden')) calculateCost();
    if (!document.getElementById('renovResult').classList.contains('hidden')) calculateRenovation();
}

function renderAll() {
    updateHeroStats();
    renderShop();
    renderPros();
    renderPlans();
    renderBusinessPlans();
}

document.addEventListener('DOMContentLoaded', () => {
    window.buildScope = 'full'; // Default scope
    initializeUI();
    initSettings(); // New Settings Init
    renderBusinessPlans(); // Render Dynamic Plans
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'ar');
    changeLanguage(localStorage.getItem('lang'));

    // Force Home View
    switchView('home');

    setupNavigation();
    renderAll();
    checkAppUpdates();
    updateAdminBadge(); // Restore Admin Notification Logic

    // Forms
    document.getElementById('buildForm').addEventListener('submit', (e) => { e.preventDefault(); calculateCost(); });
    const renovForm = document.getElementById('renovForm');
    if (renovForm) {
        renovForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateRenovation();
            // Ensure result is shown (in case it was hidden)
            document.getElementById('renovResult').style.display = 'block';
            document.getElementById('renovResult').classList.remove('hidden');
        });
    }

    // Auto-Calculate for Renovation Form - REMOVED for better UX (Calculate on button click only)
    /*
    const renovInputs = document.querySelectorAll('#renovForm input, #renovForm select');
    renovInputs.forEach(input => {
        input.addEventListener('change', calculateRenovation);
        input.addEventListener('input', calculateRenovation);
    });
    */

    // Check All Logic
    const checkAll = document.getElementById('checkAllRenov');
    const individualChecks = document.querySelectorAll('.renov-opt');

    if (checkAll) {
        // Master toggle
        checkAll.addEventListener('change', (e) => {
            individualChecks.forEach(cb => cb.checked = e.target.checked);
            // Only update if already calculated/visible
            if (isRenovVisible()) calculateRenovation();
        });

        // Individual toggles update Master
        individualChecks.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(individualChecks).every(c => c.checked);
                checkAll.checked = allChecked;
                if (isRenovVisible()) calculateRenovation();
            });
        });
    }
});

// Global State
var currentLang = 'ar';
var registeredUsers = [];
try {
    const stored = localStorage.getItem('registeredUsers');
    if (stored) registeredUsers = JSON.parse(stored);
} catch (e) {
    console.error("Resetting corrupt storage", e);
    localStorage.removeItem('registeredUsers');
}
// Translations are loaded from translations.js


/* --- Navigation & View Logic --- */
function setWCCount(val) {
    const input = document.getElementById('wcCount');
    if (input) input.value = val;

    // Update visual state of icon boxes
    document.querySelectorAll('.icon-selector .icon-box').forEach((box, idx) => {
        if ((idx + 1) === val) box.classList.add('active');
        else box.classList.remove('active');
    });

    calculateCost(); // Auto update
}

// Helper: Check if results are visible
function isRenovVisible() {
    const resBox = document.getElementById('renovResult');
    return resBox && (resBox.style.display === 'block' || !resBox.classList.contains('hidden'));
}

function toggleRenovSanitary(show) {
    const div = document.getElementById('renovSanitaryDetails');
    if (div) div.style.display = show ? 'block' : 'none';
    if (isRenovVisible()) calculateRenovation();
}

/* --- Settings Logic --- */
function initSettings() {
    // 1. Dark Mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
    }

    // 2. Default Location
    const savedLoc = localStorage.getItem('defaultLocation');
    if (savedLoc) {
        const defSelect = document.getElementById('defaultGovSelect');
        if (defSelect) defSelect.value = savedLoc;

        // Apply to calculators if they exist
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = savedLoc;

        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = savedLoc;
    }
}

function toggleDarkMode() {
    const isChecked = document.getElementById('darkModeToggle').checked;
    if (isChecked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function setDefaultLocation(govCode) {
    if (govCode) {
        localStorage.setItem('defaultLocation', govCode);
        // Update other selects immediately
        const calcSelect = document.getElementById('govSelect');
        if (calcSelect) calcSelect.value = govCode;
        const renovSelect = document.getElementById('renovGovSelect');
        if (renovSelect) renovSelect.value = govCode;

        // Show feedback
        showToast("تم حفظ المحافظة الافتراضية");
    } else {
        localStorage.removeItem('defaultLocation');
    }
}

function clearAppData() {
    Swal.fire({
        title: 'أدخل رمز الحماية',
        text: 'هذا الإجراء سيحذف جميع البيانات المحفوظة.',
        input: 'password',
        inputAttributes: {
            autocapitalize: 'off',
            placeholder: '****',
            maxlength: 4
        },
        showCancelButton: true,
        confirmButtonText: 'تأكيد المسح',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        preConfirm: (pin) => {
            if (pin !== '1122') {
                Swal.showValidationMessage('رمز الحماية غير صحيح');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            Swal.fire({
                title: 'تم المسح!',
                text: 'تمت إعادة ضبط التطبيق بنجاح.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        }
    });
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '9999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.getElementById('langSelect').value = lang;
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');

    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Re-render dynamic content
    // renderAll already handles all sections
    renderAll();

    // Re-calc if results open
    if (!document.getElementById('buildResult').classList.contains('hidden')) calculateCost();
    if (!document.getElementById('renovResult').classList.contains('hidden')) calculateRenovation();
}

function renderAll() {
    updateHeroStats();
    renderShop();
    renderPros();
    renderPlans();
    renderBusinessPlans();
}

function renderBusinessPlans() {
    var container = document.getElementById('businessPlansContainer');
    if (!container) return;

    var pSettings = {};
    try { pSettings = JSON.parse(localStorage.getItem('payment_settings') || '{}'); } catch(e) {}
    var fees = pSettings.fees || {};

    var planPrices = [];
    try { planPrices = JSON.parse(localStorage.getItem('plan_prices') || '[]'); } catch(e) {}

    var proP = (planPrices.find(p => p.id === 'pro') || {}).price;
    var vipP = (planPrices.find(p => p.id === 'vip') || {}).price;

    var plans = [
        { id:'eng',   name:'مكتب هندسي',        price: fees.eng !== undefined ? fees.eng : 50000,    color:'#6366f1', icon:'fa-compass-drafting', badge:'خرائط واستشارات' },
        { id:'con',   name:'مقاول بناء',         price: fees.con !== undefined ? fees.con : 35000,    color:'#f59e0b', icon:'fa-hard-hat',         badge:'مشاريع ومقاولات' },
        { id:'tech',  name:'فني وتجهيز',        price: fees.tech !== undefined ? fees.tech : 15000,   color:'#3b82f6', icon:'fa-wrench',           badge:'صيانة وتجهيزات' },
        { id:'elec',  name:'كهربائي',            price: fees.elec !== undefined ? fees.elec : 15000,   color:'#eab308', icon:'fa-bolt',            badge:'تأسيس وصيانة' },
        { id:'carp',  name:'نجار وتأثيث',       price: fees.carp !== undefined ? fees.carp : 15000,   color:'#8b5cf6', icon:'fa-hammer',          badge:'ديكور وأعمال خشب' },
        { id:'mat',   name:'تاجر مواد بناء',    price: fees.mat !== undefined ? fees.mat : 35000,    color:'#10b981', icon:'fa-cubes',           badge:'متجر وتوريد جملة' },
        { id:'shop',  name:'محل معتمد',          price: fees.shop !== undefined ? fees.shop : 25000,   color:'#ec4899', icon:'fa-store',           badge:'عرض البضائع بالسوق' },
        { id:'pro',   name:'باقة المحترفين Pro',  price: proP !== undefined ? proP : 50000,             color:'#0284c7', icon:'fa-rocket',          badge:'⭐ شارة موثق وأولوية' },
        { id:'vip',   name:'باقة النخبة VIP',    price: vipP !== undefined ? vipP : 100000,            color:'#d97706', icon:'fa-crown',           badge:'👑 تصدر نتائج البحث' }
    ];

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    container.style.gap = '12px';
    container.style.padding = '8px 0';

    container.innerHTML = plans.map(p => `
        <div class="plan-card glass-card" style="background:white; border-radius:16px; padding:14px 10px; text-align:center; border:1px solid ${p.color}40; box-shadow:0 4px 14px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease; cursor:pointer;" onclick="openRegistration('${p.id}')">
            <div>
                <div style="width:40px; height:40px; border-radius:12px; background:${p.color}15; color:${p.color}; display:flex; align-items:center; justify-content:center; font-size:1.25rem; margin:0 auto 8px;">
                    <i class="fa-solid ${p.icon}"></i>
                </div>
                <h4 style="margin:0 0 3px; font-size:0.92rem; color:#1e293b; font-weight:800; line-height:1.2;">${p.name}</h4>
                
                <span style="display:inline-block; font-size:0.68rem; background:${p.color}10; color:${p.color}; padding:2px 6px; border-radius:8px; font-weight:bold; margin-bottom:8px;">
                    ${p.badge}
                </span>

                <div style="font-size:1.05rem; font-weight:900; color:${p.color}; margin-bottom:10px;">
                    ${p.price === 0 ? 'مجاناً' : p.price.toLocaleString() + ' د.ع'}
                </div>
            </div>

            <button onclick="event.stopPropagation(); openRegistration('${p.id}');" style="background:${p.color}; color:white; border:none; width:100%; padding:7px; border-radius:10px; font-weight:bold; font-size:0.78rem; cursor:pointer; box-shadow:0 3px 8px ${p.color}30;">
                انضم الآن
            </button>
        </div>
    `).join('');
}









window.vipContact = function() {
    Swal.fire({
        title: '🌟 تواصل VIP',
        html: `
            <div style="text-align:right;">
                <p style="color:#64748b;margin-bottom:15px;">للاستفسار عن الوكالة أو الإعلانات أو الاستثمار</p>
                <input id="vip-name" class="swal2-input" placeholder="الاسم الكامل" style="margin-bottom:10px;">
                <input id="vip-phone" type="tel" class="swal2-input" placeholder="رقم الهاتف" style="margin-bottom:10px;">
                <select id="vip-interest" class="swal2-input" style="height:auto; padding:10px; margin-bottom:5px;">
                    <option value="invest">استثمار في المنصة</option>
                    <option value="agency">وكالة إعلانية</option>
                    <option value="ads">إعلانات مميزة</option>
                </select>
            </div>
        `,
        focusConfirm: false,
        confirmButtonText: 'إرسال الطلب',
        confirmButtonColor: '#6366f1',
        showCancelButton: true,
        cancelButtonText: 'إلغاء'
    }).then(r => {
        if (r.isConfirmed) {
            const name = document.getElementById('vip-name').value;
            const phone = document.getElementById('vip-phone').value;
            const interest = document.getElementById('vip-interest').value;
            
            if (!name || !phone) {
                Swal.fire('خطأ', 'يرجى كتابة الاسم ورقم الهاتف', 'error');
                return;
            }
            
            const req = {
                id: Date.now(),
                name: name,
                phone: phone,
                category: 'تواصل VIP: ' + interest,
                date: new Date().toLocaleDateString('ar-IQ'),
                status: 'pending'
            };
            
            let requests = [];
            try {
                requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
            } catch (e) { }
            
            requests.push(req);
            localStorage.setItem('admin_requests', JSON.stringify(requests));
            
            Swal.fire({ icon:'success', title:'تم الاستلام', text:'سنتواصل معك خلال 24 ساعة.', confirmButtonColor:'#10b981' });
        }
    });
};


;


function openSubscribe(planId, planPrice, periodType) {
    if (planId === 'starter') {
        Swal.fire({ icon: 'success', title: 'Starter', text: '&#1575;&#1604;&#1576;&#1575;&#1602;&#1577; &#1575;&#1604;&#1605;&#1580;&#1575;&#1606;&#1610;&#1577; &#1605;&#1578;&#1575;&#1581;&#1577; &#1605;&#1576;&#1575;&#1588;&#1585;&#1577;!' });
        return;
    }
    var fee = planPrice || (window.getJoinFee && window.getJoinFee(planId)) || 35000;
    var catLabels = { eng: '&#1605;&#1603;&#1578;&#1576; &#1607;&#1606;&#1583;&#1587;&#1610;', con: '&#1605;&#1602;&#1575;&#1608;&#1604;', mat: '&#1578;&#1575;&#1580;&#1585; &#1605;&#1608;&#1575;&#1583;' };
    var periodLabel = periodType === 'monthly' ? '(&#1588;&#1607;&#1585;&#1610;)' : '(&#1587;&#1606;&#1608;&#1610;)';
    var label = '&#1575;&#1606;&#1590;&#1605;&#1575;&#1605; ' + periodLabel + ' - ' + (catLabels[planId] || planId);
    if (window.openPaymentModal) {
        window.openPaymentModal(fee, 'join_' + planId + '_' + periodType, label, null);
    }
}

window.openProProfile = function(proId) {
    window.currentProId = proId;
    
    let allPros = typeof constructionData !== 'undefined' && constructionData.pros ? [...constructionData.pros] : [];
    const businessDir = JSON.parse(localStorage.getItem('business_directory') || '[]');
    const approvedPros = businessDir.filter(b => ['eng','con','tech','elec','carp','mat','shop'].includes(b.category)).map(b => {
        const catMap = {
            eng:  { label: 'مكتب هندسي', logo: 'fa-compass-drafting' },
            con:  { label: 'مقاول',       logo: 'fa-hard-hat' },
            tech: { label: 'فني',         logo: 'fa-wrench' },
            elec: { label: 'كهربائي',     logo: 'fa-bolt' },
            carp: { label: 'نجار',        logo: 'fa-hammer' },
            mat:  { label: 'تاجر مواد',   logo: 'fa-cubes' },
            shop: { label: 'محل معتمد',   logo: 'fa-store' }
        };
        const info = catMap[b.category] || { label: b.category, logo: 'fa-briefcase' };
        return {
            id: b.id || b.phone,
            name: b.name,
            category: info.label,
            governorate: 'بغداد',
            phone: b.phone,
            subscriptionStart: b.joinedAt ? new Date(b.joinedAt).toISOString() : new Date().toISOString(),
            coverImage: 'assets/images/tabooga_business_office_1766770523672.png',
            logo: info.logo
        };
    });
    allPros = [...allPros, ...approvedPros];
    
    let pro = allPros.find(p => p.id === proId || p.phone === proId);
    if (!pro) {
        pro = {
            id: proId,
            name: 'تاجر معتمد',
            category: 'مورد مواد بناء',
            governorate: 'بغداد',
            phone: proId,
            coverImage: 'assets/images/tabooga_shop_materials_1766770459515.png',
            logo: 'fa-store'
        };
    }

    const ppCover = document.getElementById('ppCover');
    if (ppCover) ppCover.style.backgroundImage = `url('${pro.coverImage || 'assets/images/tabooga_business_office_1766770523672.png'}')`;
    
    const ppLogo = document.getElementById('ppLogo');
    if (ppLogo) ppLogo.innerHTML = `<i class="fa-solid ${pro.logo || 'fa-store'}"></i>`;
    
    const ppName = document.getElementById('ppName');
    if (ppName) ppName.innerText = pro.name;
    
    const ppCat = document.getElementById('ppCategory');
    if (ppCat) ppCat.innerHTML = `<i class="fa-solid fa-tag"></i> ${pro.category}`;
    
    const savedDescs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_desc')) || {};
    const ppDesc = document.getElementById('ppDesc');
    if (ppDesc) ppDesc.innerText = savedDescs[pro.id] || savedDescs[pro.phone] || pro.desc || 'متجر ومعرض معتمد يوفر أفضل المواد والخدمات الإنشائية بأسعار متنافسة وضمان عالي.';

    // Render Gallery / Product Portfolio
    const ppProjectsGrid = document.getElementById('ppPortfoliosGrid');
    if (ppProjectsGrid) {
        const sampleGallery = [
            { title: 'معرض المواد والأعمال', desc: 'صور البضائع والمواد الإنشائية التابعة للمتجر', img: 'assets/images/tabooga_shop_materials_1766770459515.png' },
            { title: 'واجهة المقر والمخازن', desc: 'مخازن التجهيز المباشر للمواد', img: 'assets/images/tabooga_business_office_1766770523672.png' }
        ];

        ppProjectsGrid.innerHTML = sampleGallery.map(g => `
            <div class="shop-item glass-card" style="border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; background:white;" onclick="viewBlueprintImage('${g.img}', '${g.title}')">
                <div style="height: 140px; background: url('${g.img}') center/cover no-repeat; cursor:pointer;"></div>
                <div style="padding: 12px;">
                    <h4 style="margin: 0 0 5px; font-size: 0.95rem; color: #1e293b; font-weight:bold;">${g.title}</h4>
                    <p style="margin: 0; font-size: 0.8rem; color: #64748b;">${g.desc}</p>
                </div>
            </div>
        `).join('');
        ppProjectsGrid.style.display = 'grid';
        ppProjectsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        ppProjectsGrid.style.gap = '15px';
    }
    
    const pContact = document.getElementById('ppContactBtn');
    if (pContact) {
        pContact.innerHTML = `<i class="fa-brands fa-whatsapp"></i> تواصل مع التاجر / المورد`;
        pContact.disabled = false;
        pContact.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        pContact.style.color = 'white';
        pContact.style.cursor = 'pointer';
        pContact.onclick = () => contactPro(pro.phone, 'استفسار عن المواد والأسعار من منصة طابوقة');
    }

    switchView('pro-profile');
};

window.openBusinessProfile = function(phoneOrId) {
    window.openProProfile(phoneOrId);
};

window.uploadAdminBlueprint = function() {
    Swal.fire({
        title: '🌟 رفع خريطة مجانية (الأدمن)',
        html: `
            <div style="text-align:right;">
                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">عنوان الخريطة / الواجهة</label>
                <input id="abTitle" class="swal2-input" placeholder="مثال: خريطة 100م² عراقي حديث" style="margin-bottom:10px;">
                
                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">المساحة (م²)</label>
                <select id="abArea" class="swal2-input" style="height:auto; padding:10px; margin-bottom:10px;">
                    <option value="50">50 م²</option>
                    <option value="100" selected>100 م²</option>
                    <option value="150">150 م²</option>
                    <option value="200">200 م²+</option>
                </select>

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">رابط الصورة أو المسار</label>
                <input id="abImg" class="swal2-input" placeholder="assets/images/blueprint_100m.png" value="assets/images/blueprint_100m.png" style="margin-bottom:10px;">

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">الوصف والتفاصيل</label>
                <textarea id="abDesc" class="swal2-textarea" placeholder="مثال: بيت عراقي مع استقبال ومطبخ حار وبارد" style="margin-top:0;"></textarea>
            </div>
        `,
        focusConfirm: false,
        confirmButtonText: 'نشر الخريطة فوراً',
        confirmButtonColor: '#10b981',
        showCancelButton: true,
        cancelButtonText: 'إلغاء'
    }).then(result => {
        if (result.isConfirmed) {
            const title = document.getElementById('abTitle').value;
            const area = parseInt(document.getElementById('abArea').value, 10) || 100;
            const image = document.getElementById('abImg').value || 'assets/images/blueprint_100m.png';
            const desc = document.getElementById('abDesc').value || 'خريطة هندسية معتمدة جاهزة للتنفيذ';

            if (!title) {
                Swal.fire('خطأ', 'يرجى كتابة عنوان الخريطة', 'error');
                return;
            }

            const newBp = {
                id: 'ab_' + Date.now(),
                name: title,
                area: area,
                image: image,
                desc: desc,
                officeName: 'إدارة طابوقة',
                officeLogo: 'fa-user-shield',
                isSponsored: true,
                phone: '07700000000'
            };

            const existing = JSON.parse(localStorage.getItem('tabooqa_free_blueprints') || '[]');
            existing.unshift(newBp);
            localStorage.setItem('tabooqa_free_blueprints', JSON.stringify(existing));

            renderPlans();
            Swal.fire({ icon:'success', title:'تم النشر', text:'تمت إضافة الخريطة بنجاح وتعرض الآن لجميع الزبائن' });
        }
    });
};

window.merchantAction = function(actionType) {
    const proId = window.currentProId || 'default';

    if (actionType === 'cover') {
        Swal.fire({
            title: '🖼️ تغيير صورة غلاف البروفايل',
            html: `
                <div style="text-align:right;">
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">اختر غلاف جاهز أو أدخل رابط صورة</label>
                    <select id="mcCoverPreset" class="swal2-input" style="height:auto; padding:10px; margin-bottom:10px;" onchange="document.getElementById('mcCoverUrl').value = this.value">
                        <option value="assets/images/tabooga_business_office_1766770523672.png">المقر والمكتب المعماري</option>
                        <option value="assets/images/tabooga_shop_materials_1766770459515.png">معرض المواد والبضائع</option>
                        <option value="assets/images/tabooga_plans_blueprints_1766770505402.png">الخرائط والتصاميم الهندسية</option>
                        <option value="assets/images/tabooga_renovation_modern_1766770443520.png">التشطيبات والديكور الحديث</option>
                    </select>

                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">أو أدخل رابط صورة مخصص (URL)</label>
                    <input id="mcCoverUrl" class="swal2-input" value="assets/images/tabooga_business_office_1766770523672.png" placeholder="assets/images/tabooga_business_office_1766770523672.png">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ الغلاف الجديد',
            confirmButtonColor: '#10b981',
            cancelButtonText: 'إلغاء'
        }).then(result => {
            if (result.isConfirmed) {
                const coverUrl = document.getElementById('mcCoverUrl').value || 'assets/images/tabooga_business_office_1766770523672.png';
                const savedCovers = JSON.parse(localStorage.getItem('tabooqa_custom_covers') || '{}');
                savedCovers[proId] = coverUrl;
                localStorage.setItem('tabooqa_custom_covers', JSON.stringify(savedCovers));

                const ppCover = document.getElementById('ppCover');
                if (ppCover) ppCover.style.backgroundImage = `url('${coverUrl}')`;

                Swal.fire('تم التحديث', 'تم تغيير صورة غلاف البروفايل بنجاح', 'success');
            }
        });
    } else if (actionType === 'logo') {
        Swal.fire({
            title: '🎨 تغيير الشعار / الأيقونة',
            html: `
                <div style="text-align:right;">
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">اختر الشعار</label>
                    <select id="mcLogoIcon" class="swal2-input" style="height:auto; padding:10px; margin-bottom:10px;">
                        <option value="fa-store">متجر / محل معتمد (fa-store)</option>
                        <option value="fa-compass-drafting">مكتب هندسي (fa-compass-drafting)</option>
                        <option value="fa-hard-hat">مقاول بناء (fa-hard-hat)</option>
                        <option value="fa-wrench">فني وتجهيز (fa-wrench)</option>
                        <option value="fa-bolt">تأسيسات كهربائية (fa-bolt)</option>
                        <option value="fa-cubes">مورد مواد إنسائية (fa-cubes)</option>
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ الشعار',
            confirmButtonColor: '#3b82f6',
            cancelButtonText: 'إلغاء'
        }).then(result => {
            if (result.isConfirmed) {
                const logoIcon = document.getElementById('mcLogoIcon').value || 'fa-store';
                const savedLogos = JSON.parse(localStorage.getItem('tabooqa_custom_logos') || '{}');
                savedLogos[proId] = logoIcon;
                localStorage.setItem('tabooqa_custom_logos', JSON.stringify(savedLogos));

                const ppLogo = document.getElementById('ppLogo');
                if (ppLogo) ppLogo.innerHTML = `<i class="fa-solid ${logoIcon}"></i>`;

                Swal.fire('تم التحديث', 'تم تغيير الشعار بنجاح', 'success');
            }
        });
    } else if (actionType === 'product' || actionType === 'add_product') {
        Swal.fire({
            title: '📦 إضافة مادة أو منتج جديد لسوق البناء',
            html: `
                <div style="text-align:right;">
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">اسم المادة أو المنتج</label>
                    <input id="mpName" class="swal2-input" placeholder="مثال: طابوق جمهوري ممتاز" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">السعر بالدينار العراقي (د.ع)</label>
                    <input id="mpPrice" type="number" class="swal2-input" placeholder="180000" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">التصنيف أو وحدة التجهيز</label>
                    <input id="mpCategory" class="swal2-input" placeholder="مثال: ألف طابوقة / طن / لوري" style="margin-bottom:10px;">

                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">صورة المنتج (رابط أو مسار)</label>
                    <input id="mpImg" class="swal2-input" placeholder="assets/images/tabooga_shop_materials_1766770459515.png" value="assets/images/tabooga_shop_materials_1766770459515.png" style="margin-bottom:5px;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة للمتجر والسوق',
            confirmButtonColor: '#10b981',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                const name = document.getElementById('mpName').value;
                const price = parseInt(document.getElementById('mpPrice').value, 10) || 0;
                const category = document.getElementById('mpCategory').value || 'مواد إنشائية';
                const img = document.getElementById('mpImg').value || 'assets/images/tabooga_shop_materials_1766770459515.png';
                const proId = window.currentProId || '07700000000';

                if (!name || !price) {
                    Swal.fire('تنبيه', 'يرجى كتابة اسم المادة والسعر بشكل صحيح', 'warning');
                    return;
                }

                const newProd = {
                    id: 'p_' + Date.now(),
                    name: name,
                    price: price,
                    category: category,
                    unit: category,
                    img: img,
                    phone: proId,
                    is_business: true
                };

                const products = JSON.parse(localStorage.getItem('business_products') || '[]');
                products.unshift(newProd);
                localStorage.setItem('business_products', JSON.stringify(products));

                if (typeof renderShop === 'function') renderShop();
                if (window.currentProId && typeof openProProfile === 'function') openProProfile(window.currentProId);

                Swal.fire({
                    icon: 'success',
                    title: 'تمت الإضافة بنجاح! 🎉',
                    text: 'تم نشر المنتج في متجرك وسوق المواد الإنشائية لجميع الزبائن'
                });
            }
        });
    } else if (actionType === 'service') {
        Swal.fire({
            title: '🏷️ إضافة خدمة أو تسعيرة جديدة',
            html: `
                <div style="text-align:right;">
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">اسم الخدمة</label>
                    <input id="msName" class="swal2-input" placeholder="مثال: تصميم ديكور داخلي للمتر" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">سعر الخدمة (دينار)</label>
                    <input id="msPrice" type="number" class="swal2-input" placeholder="150000" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">وصف الخدمة</label>
                    <textarea id="msDesc" class="swal2-textarea" placeholder="اكتب تفاصيل وميزات الخدمة..." style="margin-top:0;"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة الخدمة',
            confirmButtonColor: '#f59e0b',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                const name = document.getElementById('msName').value;
                const price = parseInt(document.getElementById('msPrice').value, 10) || 0;
                const desc = document.getElementById('msDesc').value || 'خدمة معتمدة وضمان جودة';
                const proId = window.currentProId || '07700000000';

                if (name) {
                    const services = JSON.parse(localStorage.getItem('tabooqa_custom_pro_services') || '[]');
                    services.unshift({ id: 'ps_' + Date.now(), proId: proId, name: name, price: price, desc: desc });
                    localStorage.setItem('tabooqa_custom_pro_services', JSON.stringify(services));

                    if (typeof renderPros === 'function') renderPros();
                    if (window.currentProId && typeof openProProfile === 'function') openProProfile(window.currentProId);

                    Swal.fire('تمت الإضافة', 'تمت إضافة الخدمة بنجاح إلى بروفايلك', 'success');
                }
            }
        });
    } else if (actionType === 'portfolio') {
        Swal.fire({
            title: '🖼️ إضافة صورة/عمل لمعرض الأعمال',
            html: `
                <div style="text-align:right;">
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">عنوان العمل / المشروع</label>
                    <input id="poTitle" class="swal2-input" placeholder="مثال: تنفيذ مخازن البناء في الكرادة" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">رابط الصورة</label>
                    <input id="poImg" class="swal2-input" placeholder="assets/images/tabooga_shop_materials_1766770459515.png" value="assets/images/tabooga_shop_materials_1766770459515.png" style="margin-bottom:10px;">
                    
                    <label style="display:block; font-size:0.85rem; font-weight:bold; margin-bottom:4px;">الوصف</label>
                    <textarea id="poDesc" class="swal2-textarea" placeholder="تفاصيل المشروع أو البضائع المعروضة..." style="margin-top:0;"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة لمعرض الأعمال',
            confirmButtonColor: '#3b82f6',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                const title = document.getElementById('poTitle').value || 'مشروع جديد';
                const img = document.getElementById('poImg').value || 'assets/images/tabooga_shop_materials_1766770459515.png';
                const desc = document.getElementById('poDesc').value || 'تصاوير ومعرض منتجات التاجر';
                const proId = window.currentProId || '07700000000';

                const portfolios = JSON.parse(localStorage.getItem('business_portfolio') || '[]');
                portfolios.unshift({ id: 'pf_' + Date.now(), owner: proId, proId: proId, title: title, img: img, images: [img], desc: desc });
                localStorage.setItem('business_portfolio', JSON.stringify(portfolios));

                if (window.currentProId && typeof openProProfile === 'function') openProProfile(window.currentProId);
                Swal.fire('تمت الإضافة', 'تمت إضافة العمل بنجاح إلى معرضك', 'success');
            }
        });
    } else if (actionType === 'desc') {
        Swal.fire({
            title: 'تعديل النبذة أو الملاحظات',
            input: 'textarea',
            inputLabel: 'اكتب نبذة عن نشاطك وساعات العمل والعنوان',
            inputValue: document.getElementById('ppDesc') ? document.getElementById('ppDesc').innerText : '',
            showCancelButton: true,
            confirmButtonText: 'حفظ النبذة',
            confirmButtonColor: '#3b82f6'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const savedDescs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_desc')) || {};
                savedDescs[proId] = result.value;
                localStorage.setItem('tabooqa_custom_pro_desc', JSON.stringify(savedDescs));
                if (document.getElementById('ppDesc')) document.getElementById('ppDesc').innerText = result.value;
                Swal.fire('تم الحفظ', 'تم تحديث النبذة بنجاح', 'success');
            }
        });
    } else if (actionType === 'cv') {
        Swal.fire({
            title: 'تعديل السيرة الذاتية (CV)',
            input: 'textarea',
            inputLabel: 'أدخل سيرتك الذاتية وخبراتك السابقة',
            showCancelButton: true,
            confirmButtonText: 'حفظ السيرة',
            confirmButtonColor: '#3b82f6'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const savedCVs = JSON.parse(localStorage.getItem('tabooqa_custom_pro_cvs')) || {};
                savedCVs[proId] = result.value;
                localStorage.setItem('tabooqa_custom_pro_cvs', JSON.stringify(savedCVs));
                Swal.fire('تم الحفظ', 'تم تحديث السيرة الذاتية بنجاح', 'success');
            }
        });
    } else if (actionType === 'publicBlueprint') {
        if (typeof uploadAdminBlueprint === 'function') uploadAdminBlueprint();
    }
};

;

;

window.openSubmitRequest = function(serviceCategory) {
    Swal.fire({
        title: '📋 طلب خدمة هندسية أو استشارية',
        html: `
            <div style="text-align:right;">
                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">نوع الخدمة المطلوبة</label>
                <select id="srType" class="swal2-input" style="height:auto; padding:10px; margin-bottom:10px;">
                    <option value="تصميم خارطة متكاملة">تصميم خارطة معمارية وإنشائية</option>
                    <option value="استشارة موقعية">استشارة موقعية وتصحيح أساسات</option>
                    <option value="إشراف على صب السقف">إشراف هندسي يوم صب الخرسانة</option>
                    <option value="تصميم واجهة 3D">تصميم واجهة منزل 3D</option>
                    <option value="توزيع إنارة وديكور">تخطيط ديكور وسقف ثانوي</option>
                </select>

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">المساحة (م²)</label>
                <input id="srArea" type="number" class="swal2-input" placeholder="مثال: 100" value="100" style="margin-bottom:10px;">

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">المحافظة / المنطقة</label>
                <input id="srGov" class="swal2-input" placeholder="مثال: بغداد - الكرادة" style="margin-bottom:10px;">

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">رقم هاتفك للتواصل</label>
                <input id="srPhone" type="tel" class="swal2-input" placeholder="078xxxxxxx" style="margin-bottom:10px;">

                <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:0.85rem;">تفاصيل وملاحظات إضافية</label>
                <textarea id="srDesc" class="swal2-textarea" placeholder="اكتب تفاصيل طلبك ليطلع عليه المهندسون والحرفيون المسجلون..." style="margin-top:0;"></textarea>
            </div>
        `,
        focusConfirm: false,
        confirmButtonText: 'نشر الطلب للمهندسين والحرفيين',
        confirmButtonColor: '#2563eb',
        showCancelButton: true,
        cancelButtonText: 'إلغاء'
    }).then(result => {
        if (result.isConfirmed) {
            const title = document.getElementById('srType').value;
            const area = document.getElementById('srArea').value || '100';
            const gov = document.getElementById('srGov').value || 'بغداد';
            const phone = document.getElementById('srPhone').value;
            const desc = document.getElementById('srDesc').value || 'لا توجد ملاحظات إضافية';

            if (!phone) {
                Swal.fire('خطأ', 'يرجى كتابة رقم هاتفك لتواصل المهندسين معك', 'error');
                return;
            }

            const newReq = {
                id: 'req_' + Date.now(),
                title: title + ' (' + area + ' م²)',
                area: area,
                gov: gov,
                phone: phone,
                desc: desc,
                category: serviceCategory || 'engineering',
                createdAt: new Date().toLocaleDateString('ar-IQ'),
                status: 'open'
            };

            const existing = JSON.parse(localStorage.getItem('public_requests') || '[]');
            existing.unshift(newReq);
            localStorage.setItem('public_requests', JSON.stringify(existing));

            if (typeof renderPublicRequests === 'function') renderPublicRequests();

            Swal.fire({
                icon: 'success',
                title: 'تم نشر طلبك بنجاح! 🚀',
                text: 'سيطلع المهندسون والحرفيون المسجلون على طلبك ويتواصلون معك مباشرة.'
            });
        }
    });
};

window.renderPublicRequests = function() {
    const board = document.getElementById('publicRequestsContainer') || document.getElementById('requests-board');
    if (!board) return;

    const requests = JSON.parse(localStorage.getItem('public_requests') || '[]');
    
    if (requests.length === 0) {
        board.innerHTML = '<div style="padding:30px; text-align:center; color:#64748b; background:white; border-radius:16px;">لا توجد طلبات عامة مفتوحة حالياً.</div>';
        return;
    }

    board.innerHTML = `
        <div style="padding:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#1e293b;"><i class="fa-solid fa-bullhorn" style="color:#2563eb; margin-left:8px;"></i>طلبات الزبائن الهندسية والحرفية</h3>
                <button onclick="openSubmitRequest('engineering')" style="background:#2563eb; color:white; border:none; padding:8px 15px; border-radius:20px; font-weight:bold; cursor:pointer;">+ أضف طلبك</button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
                ${requests.map(r => `
                    <div style="background:white; border-radius:16px; border:1px solid #e2e8f0; padding:15px; box-shadow:0 4px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                                <span style="background:#dbeafe; color:#1e40af; font-size:0.75rem; font-weight:bold; padding:3px 10px; border-radius:10px;">${r.gov || 'بغداد'}</span>
                                <span style="font-size:0.72rem; color:#94a3b8;">${r.createdAt}</span>
                            </div>
                            <h4 style="margin:0 0 6px; font-size:1rem; color:#1e293b; font-weight:bold;">${r.title}</h4>
                            <p style="margin:0 0 12px; font-size:0.85rem; color:#64748b; line-height:1.5;">${r.desc}</p>
                        </div>
                        <div style="padding-top:10px; border-top:1px dashed #f1f5f9;">
                            <button onclick="acceptCustomerRequest('${r.id}', '${r.phone}', '${r.title}')" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:10px; border-radius:10px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px;">
                                <i class="fa-brands fa-whatsapp" style="font-size:1.1rem;"></i> قبول الطلب والتواصل مع الزبون
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

window.acceptCustomerRequest = function(reqId, phone, title) {
    Swal.fire({
        title: 'قبول الطلب والتواصل',
        text: 'هل أنت مسجل كمهندس/حرفي وتريد قبول هذا الطلب والتواصل مع الزبون عبر الواتساب؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، تواصل عبر الواتساب',
        confirmButtonColor: '#25D366',
        cancelButtonText: 'إلغاء'
    }).then(r => {
        if (r.isConfirmed) {
            const msg = encodeURIComponent('مرحباً، أنا مهندس/حرفي معتمد من منصة طابوقة واطلعت على طلبك: ' + title + ' وأود تقديم خدمتي لك.');
            window.open('https://wa.me/' + phone.replace(/[^0-9]/g, '') + '?text=' + msg, '_blank');
        }
    });
};

window.editProductPrice = function(productId, currentPrice) {
    Swal.fire({
        title: '💰 تعديل سعر المنتج',
        input: 'number',
        inputLabel: 'أدخل السعر الجديد بالدينار العراقي',
        inputValue: currentPrice || '',
        showCancelButton: true,
        confirmButtonText: 'حفظ السعر الجديد',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const newPrice = parseInt(result.value, 10);
            const products = JSON.parse(localStorage.getItem('business_products') || '[]');
            const product = products.find(p => p.id === productId);
            if (product) {
                product.price = newPrice;
                localStorage.setItem('business_products', JSON.stringify(products));
                if (typeof renderShop === 'function') renderShop();
                if (window.currentProId && typeof openProProfile === 'function') openProProfile(window.currentProId);
                Swal.fire('تم التعديل', 'تم تحديث سعر المنتج بنجاح', 'success');
            }
        }
    });
};

window.deleteProduct = function(productId) {
    Swal.fire({
        title: 'حذف المنتج',
        text: 'هل أنت تأكد من رغبتك في حذف هذا المنتج من متجرك؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let products = JSON.parse(localStorage.getItem('business_products') || '[]');
            products = products.filter(p => p.id !== productId);
            localStorage.setItem('business_products', JSON.stringify(products));
            if (typeof renderShop === 'function') renderShop();
            if (window.currentProId && typeof openProProfile === 'function') openProProfile(window.currentProId);
            Swal.fire('تم الحذف', 'تم إزالة المنتج من المتجر بنجاح', 'success');
        }
    });
};

window.formatIraqiPhoneForWhatsApp = function(phone) {
    if (!phone) return '9647700000000';
    let cleaned = String(phone).replace(/[^0-9]/g, '');
    if (cleaned.startsWith('07')) cleaned = '964' + cleaned.substring(1);
    else if (cleaned.startsWith('7')) cleaned = '964' + cleaned;
    else if (!cleaned.startsWith('964')) cleaned = '964' + cleaned;
    return cleaned;
};

window.contactPro = function(phone, defaultMsg) {
    const waNumber = window.formatIraqiPhoneForWhatsApp(phone);
    const msg = encodeURIComponent(defaultMsg || 'مرحباً، أود الاستفسار والتواصل من خلال منصة طابوقة');
    window.open('https://wa.me/' + waNumber + '?text=' + msg, '_blank');
};

window.openLink = function(type, phone) {
    const targetPhone = phone || '07700000000';
    if (type === 'wa') {
        window.contactPro(targetPhone, 'مرحباً، أود التواصل معك من منصة طابوقة');
    } else if (type === 'call') {
        const cleaned = String(targetPhone).replace(/[^0-9+]/g, '');
        window.location.href = 'tel:' + (cleaned.startsWith('0') ? cleaned : '0' + cleaned);
    }
};

window.startChat = function(name, phone) {
    window.contactPro(phone, 'مرحباً ' + (name || '') + '، أود الاستفسار والتواصل من خلال منصة طابوقة');
};

window.selectBlueprint = function(bpId) {
    const staticBps = typeof taboogaStaticBlueprints !== 'undefined' ? taboogaStaticBlueprints : [];
    const bizPlans = JSON.parse(localStorage.getItem('business_blueprints') || '[]');
    const adminUploads = JSON.parse(localStorage.getItem('tabooqa_free_blueprints') || '[]');
    const constructionBps = (typeof constructionData !== 'undefined' && constructionData.blueprints) ? constructionData.blueprints : [];

    const allBps = [...staticBps, ...adminUploads, ...bizPlans, ...constructionBps];
    const found = allBps.find(b => b.id === bpId || 'biz_' + b.id === bpId);

    if (found && found.area) {
        const landAreaInput = document.getElementById('landArea');
        if (landAreaInput) landAreaInput.value = found.area;
        switchView('home');
        if (typeof calculateCost === 'function') calculateCost();
        Swal.fire({
            icon: 'success',
            title: 'تم اختيار الخريطة 📐',
            text: `تم ضبط مساحة البناء على ${found.area}م² واحتساب التكلفة تلقائياً بالحاسبة المباشرة.`
        });
    } else {
        switchView('home');
    }
};

window.openAIScanner = function() {
    Swal.fire({
        title: '📷 ماسح المخططات والخرائط الذكي (AI)',
        html: `
            <div style="text-align:center; padding:10px;">
                <div style="width:100%; height:180px; background:#1e293b; border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; position:relative; overflow:hidden; border:2px dashed #10b981;">
                    <i class="fa-solid fa-camera-retro" style="font-size:2.8rem; color:#10b981; margin-bottom:8px;"></i>
                    <p style="margin:0; font-size:0.9rem; font-weight:bold;">وجه كاميرا الموبايل نحو صورة المخطط</p>
                    <span style="font-size:0.75rem; color:#94a3b8; margin-top:4px;">سيقوم الذكاء الاصطناعي بتحليل الأبعاد وحساب التكاليف تلقائياً</span>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'التقاط وتحليل المخطط 🚀',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء'
    }).then(r => {
        if (r.isConfirmed) {
            Swal.fire({
                title: 'جاري تحليل الخريطة بالذكاء الاصطناعي...',
                html: '<i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem; color:#10b981; margin:15px;"></i><p>يتم الآن قراءة أبعاد البناء واستخراج كميات المواد...</p>',
                showConfirmButton: false,
                timer: 1800
            }).then(() => {
                const landAreaInput = document.getElementById('landArea');
                if (landAreaInput) landAreaInput.value = 120;
                switchView('home');
                if (typeof calculateCost === 'function') calculateCost();
                Swal.fire({
                    icon: 'success',
                    title: 'تم التحليل بنجاح! 🎉',
                    text: 'تم اكتشاف المساحة (120م²) واحتساب كافة التكاليف والمواد بالحاسبة المباشرة.'
                });
            });
        }
    });
};

window.getUniqueBusinessDirectory = function() {
    let raw = [];
    try {
        raw = JSON.parse(localStorage.getItem('business_directory') || '[]');
    } catch(e) {}
    
    const seen = new Set();
    const unique = [];

    raw.forEach(item => {
        if (!item || !item.name) return;
        const key = (item.phone || item.name).trim().toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
        }
    });

    // Save back cleaned unique list
    if (unique.length !== raw.length) {
        localStorage.setItem('business_directory', JSON.stringify(unique));
    }
    return unique;
};

window.openPriceSettings = function() {
    // Security check: Only Admin can open with 1011
    Swal.fire({
        title: '🔒 رمز الحماية لإعدادات الأسعار',
        input: 'password',
        inputAttributes: { maxlength: 6, placeholder: '****', autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'دخول الإعدادات',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء',
        preConfirm: (pin) => {
            if (pin !== '1011') {
                Swal.showValidationMessage('رمز الحماية غير صحيح (1011)');
                return false;
            }
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.showPriceEditorModal();
        }
    });
};

window.openPriceManager = function() {
    window.openPriceSettings();
};

window.showPriceEditorModal = function() {
    let pSettings = {};
    try { pSettings = JSON.parse(localStorage.getItem('payment_settings') || '{}'); } catch(e) {}
    const fees = pSettings.fees || {};
    const wallet = pSettings.wallet || '07700000000';

    let planPrices = [];
    try { planPrices = JSON.parse(localStorage.getItem('plan_prices') || '[]'); } catch(e) {}
    
    const proPrice = (planPrices.find(p => p.id === 'pro') || {}).price || 50000;
    const vipPrice = (planPrices.find(p => p.id === 'vip') || {}).price || 100000;

    Swal.fire({
        title: '⚙️ إعدادات أسعار كافة الباقات والأنشطة (للأدمن)',
        html: `
            <div style="text-align:right; max-height:420px; overflow-y:auto; padding:5px;">
                <h4 style="color:#6366f1; margin:0 0 10px; border-bottom:2px solid #e2e8f0; padding-bottom:5px;">
                    <i class="fa-solid fa-briefcase"></i> أسعار الأنشطة والمهن (د.ع)
                </h4>
                
                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">📐 اشتراك المكتب الهندسي:</label>
                    <input type="number" id="pe_eng" value="${fees.eng !== undefined ? fees.eng : 50000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">🏗️ اشتراك مقاول البناء:</label>
                    <input type="number" id="pe_con" value="${fees.con !== undefined ? fees.con : 35000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">🛠️ اشتراك الفني والتجهيز:</label>
                    <input type="number" id="pe_tech" value="${fees.tech !== undefined ? fees.tech : 15000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">⚡ اشتراك الكهربائي:</label>
                    <input type="number" id="pe_elec" value="${fees.elec !== undefined ? fees.elec : 15000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">و اشتراك النجار والتأثيث:</label>
                    <input type="number" id="pe_carp" value="${fees.carp !== undefined ? fees.carp : 15000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">🧱 اشتراك تاجر مواد البناء:</label>
                    <input type="number" id="pe_mat" value="${fees.mat !== undefined ? fees.mat : 35000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="font-weight:bold; font-size:0.85rem;">🏪 اشتراك المحل المعتمد:</label>
                    <input type="number" id="pe_shop" value="${fees.shop !== undefined ? fees.shop : 25000}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <h4 style="color:#d97706; margin:15px 0 10px; border-bottom:2px solid #e2e8f0; padding-bottom:5px;">
                    <i class="fa-solid fa-crown"></i> أسعار باقات التمييز الرئيسية (د.ع)
                </h4>

                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">⭐ باقة المحترفين Pro:</label>
                    <input type="number" id="pe_pro" value="${proPrice}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="font-weight:bold; font-size:0.85rem;">👑 باقة النخبة VIP:</label>
                    <input type="number" id="pe_vip" value="${vipPrice}" class="swal2-input" style="margin:4px 0; height:38px;">
                </div>

                <h4 style="color:#8b5cf6; margin:15px 0 10px; border-bottom:2px solid #e2e8f0; padding-bottom:5px;">
                    <i class="fa-solid fa-wallet"></i> محفظة التحويل (زين كاش / الطيف)
                </h4>
                <div style="margin-bottom:10px;">
                    <label style="font-weight:bold; font-size:0.85rem;">رقم المحفظة لاستلام الدفعات:</label>
                    <input type="text" id="pe_wallet" value="${wallet}" class="swal2-input" style="margin:4px 0; height:38px;" dir="ltr">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'حفظ وتحديث كافة الأسعار 💾',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            const proVal = parseInt(document.getElementById('pe_pro').value, 10) || 50000;
            const vipVal = parseInt(document.getElementById('pe_vip').value, 10) || 100000;

            const newPlanPrices = [
                { id: 'pro', name: 'باقة المحترفين Pro', price: proVal, color: '#0284c7', icon: 'fa-rocket' },
                { id: 'vip', name: 'باقة النخبة VIP', price: vipVal, color: '#d97706', icon: 'fa-crown' }
            ];

            const newFees = {
                eng:  parseInt(document.getElementById('pe_eng').value, 10)  || 50000,
                con:  parseInt(document.getElementById('pe_con').value, 10)  || 35000,
                tech: parseInt(document.getElementById('pe_tech').value, 10) || 15000,
                elec: parseInt(document.getElementById('pe_elec').value, 10) || 15000,
                carp: parseInt(document.getElementById('pe_carp').value, 10) || 15000,
                mat:  parseInt(document.getElementById('pe_mat').value, 10)  || 35000,
                shop: parseInt(document.getElementById('pe_shop').value, 10) || 25000
            };

            const newWallet = document.getElementById('pe_wallet').value || '07700000000';

            const newPaymentSettings = {
                fees: newFees,
                wallet: newWallet,
                enabled: true
            };

            localStorage.setItem('plan_prices', JSON.stringify(newPlanPrices));
            localStorage.setItem('payment_settings', JSON.stringify(newPaymentSettings));

            if (typeof renderBusinessPlans === 'function') renderBusinessPlans();
            if (typeof renderShop === 'function') renderShop();
            if (typeof renderPros === 'function') renderPros();
            if (typeof syncWithServer === 'function') syncWithServer();

            Swal.fire({
                icon: 'success',
                title: 'تم حفظ وتحديث الأسعار بنجاح! 🎉',
                text: 'تم تحديث جميع أسعار الباقات والرسوم التسعة بنجاح في مركز الأعمال والتطبيق.'
            });
        }
    });
};

;

window.updateNotificationBadges = function() {
    let pendingAdminCount = 0;
    try {
        const adminReqs = JSON.parse(localStorage.getItem('admin_requests') || '[]');
        pendingAdminCount = adminReqs.filter(r => r.status === 'pending').length;
    } catch(e) {}

    let publicReqCount = 0;
    try {
        const publicReqs = JSON.parse(localStorage.getItem('public_requests') || '[]');
        const seenCount = parseInt(localStorage.getItem('seen_public_requests_count') || '0', 10);
        if (publicReqs.length > seenCount) {
            publicReqCount = publicReqs.length - seenCount;
        }
    } catch(e) {}

    const totalCount = pendingAdminCount + publicReqCount;

    const badge = document.getElementById('headerNotifBadge');
    if (badge) {
        if (totalCount > 0) {
            badge.innerText = totalCount > 99 ? '99+' : totalCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    const adminBadge = document.getElementById('adminPendingBadge');
    if (adminBadge) {
        adminBadge.innerText = pendingAdminCount;
        adminBadge.style.display = pendingAdminCount > 0 ? 'inline-block' : 'none';
    }
};

window.handleNotificationClick = function() {
    const adminReqs = JSON.parse(localStorage.getItem('admin_requests') || '[]');
    const pendingAdminCount = adminReqs.filter(r => r.status === 'pending').length;

    const publicReqs = JSON.parse(localStorage.getItem('public_requests') || '[]');
    localStorage.setItem('seen_public_requests_count', String(publicReqs.length));
    
    if (typeof window.updateNotificationBadges === 'function') window.updateNotificationBadges();

    if (pendingAdminCount > 0) {
        if (typeof openAdminPanel === 'function') openAdminPanel();
    } else {
        if (typeof openSubmitRequest === 'function') openSubmitRequest();
    }
};

function switchView(viewId) {
    if (viewId.startsWith('#')) viewId = viewId.substring(1);

    // Hide all views
    document.querySelectorAll('.app-view').forEach(v => {
        v.classList.remove('active-view');
        v.classList.add('hidden');
    });

    // Show target view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active-view'), 10);
    }

    // Update nav state
    document.querySelectorAll('.nav-item').forEach(l => {
        const href = l.getAttribute('href');
        if (href === '#' + viewId) l.classList.add('active');
        else l.classList.remove('active');
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) switchView(href);
        });
    });
}

function formatMoney(amount) {
    const currency = currentLang === 'en' ? 'IQD' : 'د.ع';
    // Round to ensure integer, remove all decimals
    return new Intl.NumberFormat(currentLang === 'en' ? 'en-IQ' : 'ar-IQ', { maximumFractionDigits: 0 }).format(Math.round(amount)) + ' ' + currency;
}

function updateHeroStats() {
    const ticker = document.getElementById('liveTickerMove');
    if (!ticker) return;

    const t = translations[currentLang] || translations['ar'];
    const p = constructionData.prices;

    // Create smart news items
    const newsItems = [
        { icon: 'fa-layer-group', label: (t.mat_brick || 'طابوق') + ' (1000)', val: formatMoney(p.brick_1000) },
        { icon: 'fa-cubes', label: (t.mat_cement || 'سمنت') + ' (عادي)', val: formatMoney(p.cement_ton) },
        { icon: 'fa-cubes', label: (t.mat_cement || 'سمنت') + ' (مقاوم)', val: formatMoney(p.cement_resist_ton) },
        { icon: 'fa-bars', label: t.mat_steel || 'حديد', val: formatMoney(p.steel_ton) },
        { icon: 'fa-truck-pickup', label: t.shop_sand || 'رمل (لوري)', val: formatMoney(p.sand_load || p.sand_16m3) },
        { icon: 'fa-square', label: t.mat_block || 'بلوك (1000)', val: formatMoney(p.block_1000) },
        { icon: 'fa-box', label: t.mat_thermo || 'ثرمستون (م3)', val: formatMoney(p.thermo_m3) },
        { icon: 'fa-fill-drip', label: (t.mat_ceramic || 'سيراميك') + ' (م2)', val: formatMoney(p.ceramic_floor_m2) },
        { icon: 'fa-toilet-paper', label: 'طقم صحيات (وسط)', val: formatMoney(p.sanitary_set_avg) },
        { icon: 'fa-brush', label: 'بورك (كيس)', val: formatMoney(p.gypsum_bag) },
        { icon: 'fa-money-bill-trend-up', label: 'صرف الدولار', val: '1,530 د.ع' }
    ];

    // Build the ticker content (Repeat for smooth scroll)
    const content = newsItems.map(item => `
        <div class="ticker-item">
            <i class="fa-solid ${item.icon}"></i> ${item.label}: <b class="ticker-val">${item.val}</b>
        </div>
    `).join('');

    ticker.innerHTML = content + content; // Double for seamless loop
}

function initializeUI() {
    renderAll();
}

/* --- Renderers (now localized) --- */
function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    try {
        const t = translations[currentLang] || translations['ar'];

        let defaultProducts = [
            { id: "p1", name: "طابوق جمهوري ممتاز (1000 طابوقة)", price: 180000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "مواد بناء", unit: "ألف طابوقة", phone: "07700000000" },
            { id: "p2", name: "أسمنت مقاوم عراقي (طن)", price: 110000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "مواد بناء", unit: "طن", phone: "07700000000" },
            { id: "p3", name: "حديد مبروم عراقي 12 ملم (طن)", price: 950000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "حديد وحصى", unit: "طن", phone: "07700000000" },
            { id: "p4", name: "رمل مغسول بدرة (لوري كبيسة)", price: 250000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "حديد وحصى", unit: "لوري 24م³", phone: "07700000000" },
            { id: "p5", name: "حصو خابط مغسول (لوري)", price: 220000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "حديد وحصى", unit: "لوري", phone: "07700000000" },
            { id: "p6", name: "بلوك مفرغ 20×40×20 (1000 بلوكة)", price: 650000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "مواد بناء", unit: "ألف بلوكة", phone: "07700000000" },
            { id: "p7", name: "سيراميك أرضيات 60×60 (م²)", price: 12500, img: "assets/images/tabooga_renovation_modern_1766770443520.png", category: "إنهاءات وديكور", unit: "م²", phone: "07700000000" },
            { id: "p8", name: "كيبلات كهربائية عراقي (لفة 100م)", price: 85000, img: "assets/images/tabooga_shop_materials_1766770459515.png", category: "تأسيسات كهربائية", unit: "لفة", phone: "07700000000" }
        ];

        const userProducts = JSON.parse(localStorage.getItem('business_products') || '[]');
        const businessDirectory = typeof window.getUniqueBusinessDirectory === 'function' ? window.getUniqueBusinessDirectory() : JSON.parse(localStorage.getItem('business_directory') || '[]');

        // Scope Market strictly to material suppliers, building stores & shops (category === 'mat' || category === 'shop')
        const approvedMerchants = businessDirectory.filter(b => b.name && (b.category === 'mat' || b.category === 'shop'));

        let html = '';

        // SECTION 1: FEATURED APPROVED COMPANIES & MERCHANTS WITH PRODUCTS GROUPED UNDERNEATH
        if (approvedMerchants.length > 0) {
            html += `
                <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="margin:0; font-size:1.15rem; color:#1e293b; font-weight:800;">
                            <i class="fa-solid fa-store" style="color:#10b981; margin-left:6px;"></i> الشركات والمتاجر الإنشائية المعتمدة
                        </h3>
                        <span style="font-size:0.75rem; background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:12px; font-weight:bold;">${approvedMerchants.length} شركة معتمدة</span>
                    </div>
                </div>
            `;

            approvedMerchants.forEach((m) => {
                const proId = m.id || m.phone || '07700000000';
                
                // Find products owned by this merchant
                const mProducts = userProducts.filter(p => p.phone === m.phone || p.owner === m.phone || p.proId === m.phone);
                
                // Fallback default products if merchant hasn't added custom ones yet
                const displayProds = mProducts.length > 0 ? mProducts : [
                    { id: 'm_p1_' + proId, name: 'طابوق وتوريد مواد بناء معتمدة', price: 'أسعار التوريد بالجملة', img: 'assets/images/tabooga_shop_materials_1766770459515.png', unit: 'حسب الطلب', phone: m.phone },
                    { id: 'm_p2_' + proId, name: 'أسمنت ومواد إنشائية', price: 'تجهيز مباشر للموقع', img: 'assets/images/tabooga_shop_materials_1766770459515.png', unit: 'لوري / طن', phone: m.phone }
                ];

                html += `
                    <div style="grid-column: 1 / -1; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 20px; border: 2px solid #10b981; padding: 18px; margin-bottom: 25px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.12); position: relative; overflow: hidden;">
                        
                        <!-- Company Header Card -->
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-bottom:14px; border-bottom:2px dashed #e2e8f0; margin-bottom:15px;">
                            <div style="display:flex; align-items:center; gap:14px;">
                                <div style="width:54px; height:54px; border-radius:14px; background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:white; display:flex; justify-content:center; align-items:center; font-size:1.6rem; box-shadow:0 6px 15px rgba(16, 185, 129, 0.3);">
                                    <i class="fa-solid ${m.category === 'mat' ? 'fa-cubes' : 'fa-store'}"></i>
                                </div>
                                <div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <h3 style="margin:0; font-size:1.2rem; color:#0f172a; font-weight:900;">${m.name}</h3>
                                        <span style="background:#dcfce7; color:#166534; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;"><i class="fa-solid fa-circle-check"></i> شركة معتمدة</span>
                                    </div>
                                    <div style="font-size:0.8rem; color:#64748b; margin-top:3px;">
                                        <i class="fa-solid fa-location-dot" style="color:#ef4444; margin-left:4px;"></i> بغداد وكافة المحافظات | ${m.category === 'mat' ? 'تجارة وتوريد مواد بناء' : 'محل إنشائي موثق'}
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex; gap:8px;">
                                <button onclick="openProProfile('${proId}')" style="background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; padding:9px 16px; border-radius:12px; font-size:0.85rem; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                    <i class="fa-solid fa-id-card"></i> بروفايل الشركة
                                </button>
                                <button onclick="contactPro('${m.phone}', 'مرحباً شركة ${m.name}، أود الاستفسار عن توريد مواد البناء من منصة طابوقة');" style="background:linear-gradient(135deg,#25D366,#128C7E); color:white; border:none; padding:9px 16px; border-radius:12px; font-size:0.85rem; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(37,211,102,0.3);">
                                    <i class="fa-brands fa-whatsapp"></i> تواصل مع الشركة
                                </button>
                            </div>
                        </div>

                        <!-- Products Grouped Under Company -->
                        <div style="margin-bottom:6px; font-size:0.88rem; font-weight:800; color:#334155; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-boxes-packing" style="color:#10b981;"></i> المواد والبضائع المعروضة باسم (${m.name}):
                        </div>

                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:10px; margin-top:10px;">
                            ${displayProds.map(p => {
                                const priceDisplay = typeof p.price === 'number' ? p.price.toLocaleString() + ' د.ع' : p.price;
                                const isUserProd = p.id && String(p.id).startsWith('p_');

                                return `
                                    <div style="background:white; border-radius:14px; border:1px solid #cbd5e1; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 3px 10px rgba(0,0,0,0.03);">
                                        <div style="height:100px; background:url('${p.img || 'assets/images/tabooga_shop_materials_1766770459515.png'}') center/cover no-repeat; position:relative;">
                                            ${isUserProd ? `
                                                <button onclick="event.stopPropagation(); editProductPrice('${p.id}', ${p.price});" style="position:absolute; top:6px; left:6px; background:#f59e0b; color:white; border:none; padding:3px 6px; border-radius:6px; font-size:0.65rem; font-weight:bold; cursor:pointer;">
                                                    <i class="fa-solid fa-pen"></i> تعديل
                                                </button>
                                            ` : ''}
                                        </div>
                                        <div style="padding:10px; flex-grow:1;">
                                            <h5 style="margin:0 0 4px; font-size:0.85rem; color:#1e293b; font-weight:800; line-height:1.35; word-break:break-word;">${p.name}</h5>
                                            <div style="font-size:0.7rem; color:#64748b;">${p.unit ? 'الوحدة: ' + p.unit : 'تجهيز مباشر'}</div>
                                            <div style="font-size:0.95rem; font-weight:900; color:#10b981; margin-top:4px;">${priceDisplay}</div>
                                        </div>
                                        <div style="padding:8px; border-top:1px dashed #f1f5f9;">
                                            <button onclick="contactPro('${p.phone || m.phone}', 'طلب مادة (${p.name}) من شركة ${m.name}');" style="width:100%; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:6px; border-radius:8px; font-size:0.75rem; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:4px;">
                                                <i class="fa-brands fa-whatsapp"></i> طلب المادة
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            });
        }

        // SECTION 2: GENERAL COMPARATIVE MATERIALS MARKET
        // Deduplicate general materials list
        const seenNames = new Set();
        const combinedGen = [...userProducts, ...defaultProducts];
        const generalProducts = [];
        combinedGen.forEach(p => {
            if (!p || !p.name) return;
            const key = p.name.trim().toLowerCase();
            if (!seenNames.has(key)) {
                seenNames.add(key);
                generalProducts.push(p);
            }
        });

        html += `
            <div style="grid-column: 1 / -1; margin: 15px 0 10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="margin:0; font-size:1.1rem; color:#1e293b; font-weight:800; display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-cubes" style="color:#2563eb;"></i> مؤشر أسعار المواد الإنشائية العامة
                    </h3>
                    <span style="font-size:0.72rem; background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:10px; font-weight:bold;">أسعار اليوم</span>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${generalProducts.map((p) => {
                        const priceDisplay = typeof p.price === 'number' ? p.price.toLocaleString() + ' د.ع' : p.price;
                        const proId = p.id || p.phone || '07700000000';
                        const isUserProd = p.id && String(p.id).startsWith('p_');

                        return `
                            <div style="background:white; border-radius:14px; border:1px solid #e2e8f0; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,0.03); transition:transform 0.2s ease; cursor:pointer;" onclick="openProProfile('${proId}')">
                                
                                <!-- Compact Image Thumbnail -->
                                <div style="width:58px; height:58px; border-radius:12px; background:url('${p.img}') center/cover no-repeat; flex-shrink:0; position:relative; border:1px solid #f1f5f9;">
                                    ${isUserProd ? `
                                        <button onclick="event.stopPropagation(); editProductPrice('${p.id}', ${p.price});" style="position:absolute; bottom:2px; right:2px; background:#f59e0b; color:white; border:none; padding:2px 4px; border-radius:4px; font-size:0.58rem; font-weight:bold; cursor:pointer;">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                    ` : ''}
                                </div>

                                <!-- Middle: Title, Category & Unit -->
                                <div style="flex-grow:1; min-width:0;">
                                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                                        <span style="background:#e0f2fe; color:#0369a1; font-size:0.65rem; font-weight:800; padding:1px 6px; border-radius:6px; flex-shrink:0;">${p.category || 'مواد بناء'}</span>
                                        ${p.unit ? `<span style="font-size:0.68rem; color:#64748b; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${p.unit}</span>` : ''}
                                    </div>
                                    <h4 style="margin:0; font-size:0.86rem; color:#0f172a; font-weight:800; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</h4>
                                    <div style="font-size:0.92rem; font-weight:900; color:#059669; margin-top:2px;">${priceDisplay}</div>
                                </div>

                                <!-- Right: Quick Contact Actions -->
                                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                    <button onclick="event.stopPropagation(); openProProfile('${proId}');" style="background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; width:34px; height:34px; border-radius:10px; font-size:0.85rem; cursor:pointer; display:flex; justify-content:center; align-items:center;" title="المعرض">
                                        <i class="fa-solid fa-id-card"></i>
                                    </button>
                                    <button onclick="event.stopPropagation(); contactPro('${p.phone}', 'طلب مادة (${p.name}) من منصة طابوقة');" style="background:linear-gradient(135deg,#25D366,#128C7E); color:white; border:none; padding:7px 12px; border-radius:10px; font-size:0.75rem; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 3px 8px rgba(37,211,102,0.25);">
                                        <i class="fa-brands fa-whatsapp"></i> تواصل
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        grid.className = 'shop-grid';
        grid.style.display = 'block';
        grid.style.gridTemplateColumns = '';
        grid.style.gap = '';
        grid.style.padding = '';
        grid.innerHTML = html;

        initAdSlider();
    } catch (e) {
        console.error("RenderShop Error", e);
        grid.innerHTML = `<div style="color:red; padding:20px;">حدث خطأ أثناء تحميل السوق: ${e.message}</div>`;
    }
}













// --- Interaction Helpers ---
function openRegistration(type) {
    const t = translations[currentLang];

    // Step 1: Info and Category
    Swal.fire({
        title: t.reg_title || 'تسجيل حساب جديد',
        html: `
            <div style="text-align:right;">
                <div class="input-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">${t.reg_lbl_name || 'الاسم الكامل'}</label>
                    <input type="text" id="regName" class="swal2-input" style="width:100%; margin:0;" placeholder="${t.reg_ph_name || 'اسمك أو اسم الشركة'}">
                </div>
                <div class="input-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">${t.reg_lbl_phone || 'رقم الهاتف'}</label>
                    <input type="tel" id="regPhone" class="swal2-input" style="width:100%; margin:0;" placeholder="07xxxxxxxxx" dir="ltr">
                </div>
                <div class="input-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">${t.reg_lbl_cat || 'نوع النشاط'}</label>
                    <select id="regType" class="swal2-select" style="width:100%; margin:0; padding:10px; border-radius:10px;">
                        <option value="eng" ${type === 'eng' ? 'selected' : ''}>${t.reg_type_eng}</option>
                        <option value="con" ${type === 'con' ? 'selected' : ''}>${t.reg_type_con}</option>
                        
                        <option value="tech" ${type === 'tech' ? 'selected' : ''}>فني</option>
                        <option value="elec" ${type === 'elec' ? 'selected' : ''}>كهربائي</option>
                        <option value="carp" ${type === 'carp' ? 'selected' : ''}>نجار</option>
                        <option value="mat" ${type === 'mat' ? 'selected' : ''}>${t.reg_type_mat}</option>
                        <option value="shop" ${type === 'shop' ? 'selected' : ''}>${t.reg_type_shop}</option>
                    </select>
                </div>
                <div class="input-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">كلمة المرور (لحماية وتعديل صفحتك)</label>
                    <input type="password" id="regPass" class="swal2-input" style="width:100%; margin:0;" placeholder="اكتب 4 أرقام أو حروف على الأقل">
                </div>
                <div style="margin-top:20px; font-size:0.85rem; color:#64748b; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; display:flex; align-items:flex-start; gap:10px;">
                    <input type="checkbox" id="regLegal" style="margin-top:2px; transform:scale(1.2);">
                    <label for="regLegal" style="line-height:1.5; padding-right:5px;">أتعهد بموجب هذا بالتزامي التام بالقوانين والآداب العامة، وأتحمل كافة التبعات القانونية والمالية عن كل خدماتي أو بضائعي التي أعرضها، مع إخلاء طرف مشغل التطبيق والمنصة تماماً من أي مسؤولية تتعلق بأعمالي أو تعاملاتي مع الزبائن.</label>
                </div>
            </div>
        `,
        confirmButtonText: t.reg_btn_next || 'التالي',
        showCancelButton: true,
        cancelButtonText: t.cancel || 'إلغاء',
        didOpen: () => {
            const check = document.getElementById('regLegal');
            const confirmBtn = Swal.getConfirmButton();
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
            confirmBtn.style.cursor = 'not-allowed';

            check.addEventListener('change', (e) => {
                confirmBtn.disabled = !e.target.checked;
                confirmBtn.style.opacity = e.target.checked ? '1' : '0.5';
                confirmBtn.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
            });
        },
        preConfirm: () => {
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const category = document.getElementById('regType').value;
            const pass = document.getElementById('regPass').value;
            const legal = document.getElementById('regLegal').checked;

            if (!name || !phone) {
                Swal.showValidationMessage(t.reg_err_req || 'يرجى ملء كافة الحقول الأساسية');
                return false;
            }
            if (!pass || pass.length < 4) {
                Swal.showValidationMessage('يرجى تعيين كلمة مرور مكونة من 4 رموز على الأقل لحماية صفحتك');
                return false;
            }
            if (!/^07[0-9]{8,9}$/.test(phone)) {
                Swal.showValidationMessage('يرجى إدخال رقم هاتف عراقي صحيح (يبدأ بـ 07)');
                return false;
            }
            if (!legal) {
                Swal.showValidationMessage('يجب الموافقة على الإقرار والتعهد القانوني للمتابعة');
                return false;
            }
            return { name, phone, category, password: pass };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            openPlanSelection(result.value);
        }
    });
}

function openPlanSelection(userData) {
    const t = translations[currentLang];

    const allPlans = getPlans();

    const plansHtml = allPlans.map(p => `
        <div class="plan-select-card" onclick="selectRegPlan('${p.id}')" id="regPlan_${p.id}" 
             style="border:2px solid #eee; padding:15px; border-radius:12px; margin-bottom:10px; cursor:pointer; text-align:right; transition:all 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:${p.color};">${p.name}</span>
                <span style="font-weight:700;">${p.price === 0 ? 'مجاناً' : formatMoney(p.price)}</span>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: t.reg_lbl_plan || 'اختر باقة الاشتراك',
        html: `
            <div id="planContainer">${plansHtml}</div>
            <input type="hidden" id="selectedPlan" value="starter">
            <div style="margin-top:15px; font-size:0.85rem; color:#64748b; text-align:right;">
                <i class="fa-solid fa-info-circle"></i> ${t.reg_note}
            </div>
        `,
        confirmButtonText: t.reg_btn_submit || 'إكمال التسجيل',
        showCancelButton: true,
        cancelButtonText: t.cancel || 'إلغاء',
        didOpen: () => {
            window.selectRegPlan = (id) => {
                document.querySelectorAll('.plan-select-card').forEach(c => {
                    c.style.borderColor = '#eee';
                    c.style.background = 'none';
                });
                document.getElementById('regPlan_' + id).style.borderColor = '#3b82f6';
                document.getElementById('regPlan_' + id).style.background = '#f0f7ff';
                document.getElementById('selectedPlan').value = id;
            };
            selectRegPlan('starter');
        },
        preConfirm: () => {
            return document.getElementById('selectedPlan').value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            userData.plan = result.value;

            // Save Request to Admin Panel
            const req = {
                id: Date.now(),
                name: userData.name,
                phone: userData.phone,
                category: userData.category,
                password: userData.password,
                plan: userData.plan, // Requested Plan
                date: new Date().toLocaleDateString('ar-IQ'),
                status: 'pending'
            };

            let requests = [];
            try {
                requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
            } catch (e) { }

            requests.push(req);
            localStorage.setItem('admin_requests', JSON.stringify(requests));

            localStorage.setItem('user_phone', userData.phone);
            localStorage.setItem('user_name', userData.name);

            if (typeof updateAdminBadge === 'function') updateAdminBadge();

            // Show payment modal with correct fee
            var _fee = (window.getJoinFee && window.getJoinFee(userData.category)) || 35000;
            if (window.openPaymentModal) {
                setTimeout(function() {
                    window.openPaymentModal(_fee, 'join_' + userData.category, userData.category, null);
                }, 300);
            }
        }
    });
}

function openCombinedRegistration() {
    openRegistration();
}

function checkAppUpdates() {
    if (!constructionData.notifications || constructionData.notifications.length === 0) return;

    const lastNotif = constructionData.notifications[0];
    const seenId = localStorage.getItem('last_seen_update');

    if (seenId != lastNotif.id) {
        const t = translations[currentLang];
        Swal.fire({
            title: `<span style="color:var(--primary);"><i class="fa-solid fa-bullhorn"></i> ${t.txt_latest_updates}</span>`,
            html: `
                <div style="text-align:right; padding:10px;">
                    <h4 style="margin-bottom:10px;">${lastNotif.title}</h4>
                    <p style="color:#64748b; line-height:1.6;">${lastNotif.desc}</p>
                </div>
            `,
            confirmButtonText: t.btn_close || 'إغلاق',
            confirmButtonColor: 'var(--primary)',
            timer: 10000,
            timerProgressBar: true
        }).then(() => {
            localStorage.setItem('last_seen_update', lastNotif.id);
        });
    }
}

function startChat(name) {
    const t = translations[currentLang];
    const msg = `${t.msg_chat_start} ${name}...`;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<i class="fa-solid fa-lock"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = "translateY(-100px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function openLink(type) {
    if (type === 'wa') window.open('https://wa.me/9647700000000', '_blank');
    if (type === 'call') window.location.href = 'tel:07700000000';
}

function initAdSlider() {
    startSlider('adSlider', [
        "https://placehold.co/600x200/4F46E5/FFF?text=Material+Supplier+Ads",
        "https://placehold.co/600x200/10B981/FFF?text=Best+Prices+Iraq"
    ]);
}

// Fixed Ad Sliders
function initEngAdSlider() {
    startSlider('engAdSlider', getAdsForSection('plans'));
}

function initRenovAdSlider() {
    startSlider('renovAdSlider', [
        "https://placehold.co/600x200/8B5CF6/FFF?text=Paints+&+Finishes",
        "https://placehold.co/600x200/EC4899/FFF?text=Flooring+Specialists"
    ]);
}

/* --- Ad System --- */
const defaultAds = {
    shop: ["https://placehold.co/600x200/F59E0B/FFF?text=Shop+Ad+1", "https://placehold.co/600x200/10B981/FFF?text=Shop+Ad+2"],
    pros: ["https://placehold.co/600x200/2563EB/FFF?text=Pros+Ad+1", "https://placehold.co/600x200/DB2777/FFF?text=Pros+Ad+2"],
    plans: ["https://placehold.co/600x200/8B5CF6/FFF?text=Plans+Ad+1", "https://placehold.co/600x200/F43F5E/FFF?text=Plans+Ad+2"],
    business: ["https://placehold.co/600x200/0F172A/FFF?text=Business+Ad+1", "https://placehold.co/600x200/3B82F6/FFF?text=Business+Ad+2"]
};

function getAdsForSection(section) {
    const stored = localStorage.getItem('dynamic_ads');
    let allAds = stored ? JSON.parse(stored) : [];

    // Filter for this section
    const sectionAds = allAds.filter(a => a.section === section);

    // If no custom ads, use defaults
    if (sectionAds.length === 0) {
        return defaultAds[section] || [];
    }

    return sectionAds.map(a => a.url);
}

function initShopAdSlider() {
    startSlider('adSlider', getAdsForSection('shop'));
}

function initProsAdSlider() {
    startSlider('prosAdSlider', getAdsForSection('pros'));
}

function initEngAdSlider() {
    startSlider('engAdSlider', getAdsForSection('plans'));
}

function initBizAdSlider() {
    startSlider('bizAdSlider', getAdsForSection('business'));
}

function startSlider(elementId, images) {
    const slider = document.getElementById(elementId);
    if (!slider) return;

    // Clear prev content if any (to avoid simple append issues on re-render)
    slider.innerHTML = '';

    slider.innerHTML = images.map((src, i) =>
        `<div class="ad-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${src}')"></div>`
    ).join('');

    let current = 0;
    const slides = slider.querySelectorAll('.ad-slide');
    if (slides.length < 2) return; // No need to slide if 1 or 0

    // Unique interval key based on ID to avoid conflict
    const intervalKey = elementId + 'Interval';
    if (window[intervalKey]) clearInterval(window[intervalKey]);

    window[intervalKey] = setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }, 5000);
}

/* --- Ad Manager UI --- */
function openAdManager() {
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
            showAdManagerMain();
        }
    });
}

function showAdManagerMain() {
    Swal.fire({
        title: 'إدارة الإعلانات',
        html: `
            <button class="cta-button" onclick="promptAddAd()" style="margin-bottom:10px; width:100%">إضافة إعلان جديد</button>
            <button class="cta-button secondary" onclick="promptDeleteAd()" style="width:100%">حذف إعلان</button>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

function promptAddAd() {
    Swal.fire({
        title: 'إضافة إعلان جديد',
        html: `
            <select id="newAdSection" class="swal2-input">
                <option value="shop">سوق المواد</option>
                <option value="pros">الخبراء</option>
                <option value="plans">الخرائط الهندسية</option>
                <option value="business">مركز الأعمال</option>
            </select>
            <input id="newAdUrl" class="swal2-input" placeholder="رابط الصورة (URL)">
            <p style="font-size:0.8rem; color:#666;">يمكنك استخدام روابط من Google Drive أو مواقع الصور.</p>
        `,
        confirmButtonText: 'حفظ',
        showCancelButton: true,
        preConfirm: () => {
            const section = document.getElementById('newAdSection').value;
            const url = document.getElementById('newAdUrl').value;
            if (!url) Swal.showValidationMessage('الرابط مطلوب');
            return { section, url };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            const stored = localStorage.getItem('dynamic_ads');
            let ads = stored ? JSON.parse(stored) : [];
            ads.push({ id: Date.now(), section: res.value.section, url: res.value.url });
            localStorage.setItem('dynamic_ads', JSON.stringify(ads));

            // Reload Sliders
            initAllSliders();
            Swal.fire('تم!', 'تم إضافة الإعلان بنجاح', 'success');
        }
    });
}

function promptDeleteAd() {
    const stored = localStorage.getItem('dynamic_ads');
    let ads = stored ? JSON.parse(stored) : [];

    if (ads.length === 0) {
        Swal.fire('تنبيه', 'لا توجد إعلانات مضافة يدوياً للحذف. الإعلانات الظاهرة حالياً هي الافتراضية.', 'info');
        return;
    }

    // Create list HTML
    const listHtml = ads.map(ad => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:5px;">
            <img src="${ad.url}" style="width:50px; height:30px; object-fit:cover; border-radius:4px;">
            <span style="font-size:0.8rem;">${translateSection(ad.section)}</span>
            <button onclick="deleteAd(${ad.id})" style="background:#ef4444; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer;">X</button>
        </div>
    `).join('');

    Swal.fire({
        title: 'حذف الإعلانات',
        html: `<div style="max-height:300px; overflow-y:auto; text-align:right;">${listHtml}</div>`,
        showConfirmButton: false,
        showCloseButton: true
    });
}

// Global function for DELETE onclick
window.deleteAd = function (id) {
    const stored = localStorage.getItem('dynamic_ads');
    let ads = stored ? JSON.parse(stored) : [];
    ads = ads.filter(a => a.id !== id);
    localStorage.setItem('dynamic_ads', JSON.stringify(ads));

    initAllSliders();
    Swal.close();
    Swal.fire('تم الحذف', 'تم حذف الإعلان بنجاح', 'success').then(() => promptDeleteAd());
};

function translateSection(sec) {
    const map = { 'shop': 'السوق', 'pros': 'الخبراء', 'plans': 'الخرائط', 'business': 'الأعمال' };
    return map[sec] || sec;
}

function initAllSliders() {
    initShopAdSlider();
    initProsAdSlider();
    initEngAdSlider();
    initBizAdSlider();
}


window.renderPros = function() {
    const prosList = document.getElementById('prosList');
    if (!prosList) return;
    prosList.innerHTML = '';

    prosList.style.display = 'grid';
    prosList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(270px, 1fr))';
    prosList.style.gap = '18px';
    prosList.style.padding = '10px 0';

    let allPros = typeof constructionData !== 'undefined' && constructionData.pros ? [...constructionData.pros] : [];

    const businessDir = typeof window.getUniqueBusinessDirectory === 'function' ? window.getUniqueBusinessDirectory() : JSON.parse(localStorage.getItem('business_directory') || '[]');
    
    // Scope Pros section strictly to professional service providers (category: eng, con, tech, elec, carp)
    const approvedPros = businessDir
        .filter(b => b.name && ['eng','con','tech','elec','carp'].includes(b.category))
        .map(b => {
            const catMap = {
                eng:  { label: 'مكتب هندسي', logo: 'fa-compass-drafting', color: '#6366f1' },
                con:  { label: 'مقاول بناء',  logo: 'fa-hard-hat',         color: '#f59e0b' },
                tech: { label: 'فني وتجهيز', logo: 'fa-wrench',           color: '#3b82f6' },
                elec: { label: 'كهربائي',     logo: 'fa-bolt',            color: '#eab308' },
                carp: { label: 'نجار',        logo: 'fa-hammer',          color: '#8b5cf6' }
            };
            const info = catMap[b.category] || { label: 'محترف معتمد', logo: 'fa-user-tie', color: '#3b82f6' };
            return {
                id: b.id || b.phone,
                name: b.name,
                category: info.label,
                governorate: 'بغداد والمحافظات',
                phone: b.phone,
                logo: info.logo,
                color: info.color
            };
        });

    // Deduplicate combined pros list strictly by name/phone
    const seenPros = new Set();
    const combined = [...approvedPros, ...allPros];
    const combinedPros = [];
    combined.forEach(p => {
        if (!p || !p.name) return;
        const key = (p.phone || p.name).trim().toLowerCase();
        if (!seenPros.has(key)) {
            seenPros.add(key);
            combinedPros.push(p);
        }
    });

    if (combinedPros.length === 0) {
        prosList.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; background:white; border-radius:18px; box-shadow:0 4px 15px rgba(0,0,0,0.04);"><i class="fa-solid fa-users" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i><h3 style="color:#64748b;">لا يوجد محترفون أو مهندسون معروضون حالياً</h3></div>';
        return;
    }

    combinedPros.forEach((pro) => {
        const proId = pro.id || pro.phone || '07700000000';
        const card = document.createElement('div');
        card.style.cssText = 'background:white; border-radius:18px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 6px 18px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.3s ease; position:relative;';
        card.onmouseover = () => { card.style.transform = 'translateY(-4px)'; };
        card.onmouseout = () => { card.style.transform = 'none'; };

        card.innerHTML = `
            <div style="padding:16px; flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:48px; height:48px; border-radius:12px; background:${pro.color || '#10b981'}15; color:${pro.color || '#10b981'}; display:flex; justify-content:center; align-items:center; font-size:1.4rem;">
                            <i class="fa-solid ${pro.logo || 'fa-user-tie'}"></i>
                        </div>
                        <div>
                            <h4 style="margin:0 0 3px; font-size:1.05rem; color:#1e293b; font-weight:800;">${pro.name}</h4>
                            <span style="font-size:0.75rem; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:8px; font-weight:bold;">${pro.category}</span>
                        </div>
                    </div>
                    <span style="background:#dcfce7; color:#15803d; font-size:0.68rem; font-weight:bold; padding:3px 8px; border-radius:10px;"><i class="fa-solid fa-circle-check"></i> موثق</span>
                </div>
                <p style="margin:0 0 12px; font-size:0.82rem; color:#64748b; line-height:1.5;">تخصص معتمد ومستعد لاستقبال طلبات الزبائن وتوفير الاستشارات والخدمات.</p>
            </div>

            <div style="padding:10px 16px 14px; border-top:1px dashed #f1f5f9; display:flex; gap:8px;">
                <button onclick="openProProfile('${proId}')" style="flex:1; background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; padding:9px; border-radius:10px; font-size:0.8rem; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:4px;">
                    <i class="fa-solid fa-id-card"></i> البروفايل المعرض
                </button>
                <button onclick="contactPro('${pro.phone}', 'طلب خدمة واستفسار من منصة طابوقة');" style="flex:1; background:linear-gradient(135deg,#25D366,#128C7E); color:white; border:none; padding:9px; border-radius:10px; font-size:0.8rem; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:4px; box-shadow:0 3px 8px rgba(37,211,102,0.25);">
                    <i class="fa-brands fa-whatsapp"></i> تواصل مباشر
                </button>
            </div>
        `;
        prosList.appendChild(card);
    });
};

;

;





// Static Blueprints (always available)
// Static High Quality Admin Blueprints
const taboogaStaticBlueprints = [
    { id:'sb1', name:'خريطة 50م² - تصميم عراقي',   area:50,  desc:'بيت عراقي كلاسيكي لمساحة صغيرة مع توزيع استغلالي', image:'assets/images/blueprint_50m.png',   officeName:'المكتب الهندسي المعتمد', officeLogo:'fa-compass-drafting', isSponsored:true, phone:'07700000000' },
    { id:'sb2', name:'خريطة 100م² - بيت عراقي',  area:100, desc:'تصميم مع استقبال مستقل ومطبخ حار وبارد',   image:'assets/images/blueprint_100m.png',  officeName:'مركز التصاميم العراقية', officeLogo:'fa-building', isSponsored:true, phone:'07700000000' },
    { id:'sb3', name:'خريطة 150م² - فيلا واسعة', area:150, desc:'منزل عراقي 3 غرف نوم مع كراج وجناح ماستر', image:'assets/images/blueprint_150m.png',  officeName:'دار الهندسة الحديثة', officeLogo:'fa-compass-drafting', isSponsored:true, phone:'07700000000' },
    { id:'sb4', name:'واجهة منزل كلاسيك 3D',    area:100, desc:'تصميم واجهة حجر وترافيرتين كلاسيكي فخم',     image:'assets/images/facade_classic.png',  officeName:'مكتب الإبداع المعماري', officeLogo:'fa-paint-roller', isSponsored:false, phone:'07700000000' },
    { id:'sb5', name:'واجهة مودرن ألمنيوم وخشب', area:150, desc:'واجهة فيلا مودرن مع إنارة مخفية وزجاج دبل',   image:'assets/images/facade_modern.png',   officeName:'استوديو الديكور الهندسي', officeLogo:'fa-house-chimney-window', isSponsored:false, phone:'07700000000' },
    { id:'sb6', name:'مخطط توزيع غرف متكامل',   area:120, desc:'خريطة معمارية تفصيلية جاهزة للتنفيذ',        image:'assets/images/floorplan.png',       officeName:'طابوقة الهندسية', officeLogo:'fa-ruler-combined', isSponsored:false, phone:'07700000000' },
];
window.currentBlueprintFilter = 'all';

window.renderBlueprints = function(areaFilter) {
    if (areaFilter !== undefined) window.currentBlueprintFilter = areaFilter;
    renderPlans();
};

window.currentBlueprintFilter = 'all';

window.renderBlueprints = function(areaFilter) {
    if (areaFilter !== undefined) window.currentBlueprintFilter = areaFilter;
    renderPlans();
};

window.currentBlueprintFilter = 'all';

window.renderBlueprints = function(areaFilter) {
    if (areaFilter !== undefined) window.currentBlueprintFilter = areaFilter;
    renderPlans();
};

function renderPlans() {
    const grid = document.getElementById('plansGrid');
    const gallery = document.getElementById('freeBlueprintsGallery') || document.getElementById('blueprintsGallery');
    const t = translations[currentLang] || translations['ar'];

    const currentFilter = window.currentBlueprintFilter || 'all';

    // Highlight active filter button
    const filterContainer = document.getElementById('blueprintFilters');
    if (filterContainer) {
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
            const btnOnClick = btn.getAttribute('onclick') || '';
            const isAll = (currentFilter === 'all' && btnOnClick.includes("'all'"));
            const isMatch = btnOnClick.includes('(' + currentFilter + ')');
            if (isAll || isMatch) {
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
                btn.style.border = 'none';
            } else {
                btn.style.background = 'white';
                btn.style.color = 'var(--text-main)';
                btn.style.border = '1px solid #cbd5e1';
            }
        });
    }

    if (gallery) {
        const constructionBps = (typeof constructionData !== 'undefined' && constructionData.blueprints) ? constructionData.blueprints : [];
        const bizPlans = JSON.parse(localStorage.getItem('business_blueprints') || '[]');
        const adminUploads = JSON.parse(localStorage.getItem('tabooqa_free_blueprints') || '[]');
        const directory = JSON.parse(localStorage.getItem('business_directory') || '[]');

        const mappedBizPlans = bizPlans.map(p => {
            const owner = directory.find(b => b.phone === p.owner);
            return {
                id: 'biz_' + p.id,
                name: p.title,
                image: p.img || p.image,
                area: p.area || 100,
                desc: `مخطط مقدم من: ${owner ? owner.name : 'مكتب هندسي'}`,
                officeName: owner ? owner.name : 'مكتب معتمد',
                officeLogo: 'fa-compass-drafting',
                isSponsored: true,
                phone: owner ? owner.phone : ''
            };
        });

        const staticBps = typeof taboogaStaticBlueprints !== 'undefined' ? taboogaStaticBlueprints : [];
        let allPlans = [...adminUploads, ...staticBps, ...mappedBizPlans, ...constructionBps];

        // Apply Area Filter
        if (currentFilter !== 'all') {
            const filterNum = parseInt(currentFilter, 10);
            allPlans = allPlans.filter(p => {
                const area = parseInt(p.area, 10);
                if (isNaN(area)) return true;
                if (filterNum >= 200) return area >= 200;
                return area === filterNum || Math.abs(area - filterNum) <= 15;
            });
        }

        // Compact Responsive Grid Layout
        gallery.style.display = 'grid';
        gallery.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        gallery.style.gap = '12px';
        gallery.style.padding = '10px 0';
        gallery.style.overflowX = 'visible';

        if (allPlans.length === 0) {
            gallery.innerHTML = '<div style="grid-column:1/-1; padding:20px; color:#64748b; font-size:0.9rem; text-align:center; background:white; border-radius:14px; border:1px solid #e2e8f0;">لا توجد خرائط متاحة لهذه المساحة حالياً</div>';
        } else {
            gallery.innerHTML = allPlans.map(p => `
                <div class="glass-card blueprint-card" style="padding:0; border:1px solid #e2e8f0; background:white; border-radius:16px; overflow:hidden; position:relative; box-shadow:0 4px 14px rgba(0,0,0,0.05); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s;">
                    <div style="width:100%; height:135px; background:#f1f5f9; position:relative; overflow:hidden;">
                        <img src="${p.image || p.img}" onerror="this.onerror=null; this.src='assets/images/default_plan.png'" onclick="viewBlueprintImage('${p.image || p.img}', '${p.name}')" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" title="انقر لتكبير ومعاينة الصورة">
                        
                        <!-- Top Badges Overlay -->
                        <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); color:white; font-size:0.7rem; font-weight:bold; padding:2px 8px; border-radius:10px;">${p.area} م²</div>
                        <button onclick="viewBlueprintImage('${p.image || p.img}', '${p.name}')" style="position:absolute; top:8px; left:8px; background:rgba(255,255,255,0.9); color:#1e293b; border:none; padding:3px 8px; border-radius:10px; font-size:0.68rem; font-weight:bold; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2);">
                            <i class="fa-solid fa-eye" style="color:#2563eb;"></i> معاينة
                        </button>
                    </div>

                    <div style="padding:10px; flex-grow:1; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                                <i class="fa-solid ${p.officeLogo || 'fa-building'}" style="color:#64748b; font-size:0.72rem;"></i>
                                <span style="font-size:0.72rem; color:#64748b; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${p.officeName || 'المكتب الهندسي'}</span>
                            </div>

                            <h4 style="margin:0 0 4px; font-size:0.88rem; color:#1e1b4b; font-weight:800; line-height:1.3;">${p.name}</h4>
                        </div>
                        
                        <!-- Integrated Action Buttons Inside Card -->
                        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; padding-top:8px; border-top:1px dashed #f1f5f9;">
                            <div style="display:flex; gap:6px;">
                                <button class="cta-button" style="flex:1; padding:6px; font-size:0.72rem; background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; border-radius:6px; font-weight:bold; cursor:pointer;" onclick="selectBlueprint('${p.id}')">
                                    <i class="fa-solid fa-calculator"></i> احسب
                                </button>
                                <button class="cta-button" style="flex:1; padding:6px; font-size:0.72rem; background:linear-gradient(135deg,#25D366,#128C7E); color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer;" onclick="contactPro('${p.phone || '07700000000'}', 'استفسار عن خريطة: ${p.name}')">
                                    <i class="fa-brands fa-whatsapp"></i> تواصل
                                </button>
                            </div>
                            <button onclick="openSubmitRequest('engineering')" style="width:100%; padding:5px; font-size:0.7rem; background:#f8fafc; color:#3b82f6; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold; cursor:pointer;">
                                <i class="fa-solid fa-pen-ruler"></i> طلب استشارة / تعديل
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    if (grid) {
        initEngAdSlider();
        const businessDirectory = JSON.parse(localStorage.getItem('business_directory') || '[]');
        const engBusinesses = businessDirectory.filter(b => b.category === 'eng');
        const portfolio = JSON.parse(localStorage.getItem('business_portfolio') || '[]');

        let engHtml = engBusinesses.map(p => {
            const dName = p.name;
            const dRole = 'مكتب هندسي';
            const myWork = p.phone ? portfolio.filter(w => w.owner === p.phone) : [];
            const hasWork = myWork.length > 0;

            return `
                <div class="service-card" style="display:flex; flex-direction:column; background:white; padding:12px; border-radius:14px; border:1px solid #e5e7eb; gap:8px; box-shadow:0 2px 5px rgba(0,0,0,0.04); position:relative; margin-bottom:10px; border-left:4px solid #10B981;">
                    <div style="position:absolute; top:10px; left:10px; background:#10B981; color:white; font-size:0.7rem; padding:2px 8px; border-radius:8px; font-weight:bold;">موثق</div>
                    <div style="display:flex; align-items:center; gap:12px; width:100%;">
                        <div style="width:44px; height:44px; background:#10B98115; color:#10B981; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                            <i class="fa-solid fa-compass-drafting"></i>
                        </div>
                        <div style="flex:1;">
                            <h4 style="margin:0 0 3px; font-size:0.95rem;">${dName}</h4>
                            <p style="margin:0; font-size:0.8rem; color:#6b7280;">${dRole}</p>
                        </div>
                    </div>
                    ${hasWork ? `
                    <div style="width:100%; display:flex; gap:6px; overflow-x:auto; padding-bottom:5px; margin-top:5px;">
                        ${myWork.map(w => `
                            <div style="min-width:70px; height:50px; border-radius:6px; overflow:hidden; border:1px solid #eee;">
                                <img src="${w.img}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    <div class="action-row" style="width:100%; justify-content:flex-end;">
                        <button class="act-btn" style="flex:1; background:#f0f9ff; color:#3b82f6; border:1px solid #bae6fd; font-weight:700;" onclick="openProProfile('${p.phone}')"><i class="fa-solid fa-id-card"></i> الصفحة</button>
                        <button class="act-btn whatsapp" onclick="contactPro('${p.phone}', 'طلب تواصل معك')"><i class="fa-brands fa-whatsapp"></i></button>
                    </div>
                </div>`;
        }).join('');

        grid.innerHTML = engHtml;
    }
}







function selectBlueprint(id) {
    const plan = constructionData.blueprints.find(p => p.id === id);
    if (!plan) return;

    // 1. Pre-fill calculator
    const areaInput = document.getElementById('buildArea');
    if (areaInput) {
        areaInput.value = plan.area;
        // Trigger calc if we are on build page
        calculateCost();
    }

    // 2. Switch to build view
    switchView('home');

    // 3. User feedback
    showToast(`تم اختيار ${plan.name} - ${plan.area}م²`);
}

let activeServiceId = null;

function requestService(id) {
    if (id === 'free_plans' || id === 'facades') {
        // Special case for browsing content (Simulated for now)
        const t = translations[currentLang];
        alert(t.srv_desc_facades + ` (${t.txt_soon} - ${currentLang === 'en' ? 'Design browser' : 'متصفح التصاميم'})`);
        return;
    }

    activeServiceId = id;
    const modal = document.getElementById('serviceModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        document.getElementById('reqName').value = '';
        document.getElementById('reqPhone').value = '';
        document.getElementById('reqNotes').value = '';
    }
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.add('hidden');
}

function submitServiceRequest() {
    const t = translations[currentLang];
    const name = document.getElementById('reqName').value;
    const phone = document.getElementById('reqPhone').value;
    const notes = document.getElementById('reqNotes') ? document.getElementById('reqNotes').value : '';

    if (!name || !phone) {
        alert(t.msg_fill_fields || "Please fill in name and phone number");
        return;
    }

    const settingsRaw = localStorage.getItem('app_settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    
    if (settings.feeEnabled && settings.feeAmount > 0) {
        // Show payment modal first
        closeServiceModal();
        const payModal = document.getElementById('paymentModal');
        if (payModal) {
            payModal.classList.remove('hidden');
            const display = document.getElementById('payAmountDisplay');
            if (display) display.textContent = formatMoney(settings.feeAmount) + " IQD";
            
            const confirmBtn = document.querySelector('#paymentModal .cta-button');
            confirmBtn.onclick = () => {
                // Simulate payment processing then save request
                const originalText = confirmBtn.innerHTML;
                confirmBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ...';
                confirmBtn.disabled = true;
                setTimeout(() => {
                    confirmBtn.innerHTML = '<i class="fa-solid fa-check"></i> OK';
                    confirmBtn.style.background = '#10B981';
                    setTimeout(() => {
                        closePayment();
                        confirmBtn.innerHTML = originalText;
                        confirmBtn.style.background = '';
                        confirmBtn.disabled = false;
                        saveRealServiceRequest(name, phone, notes);
                    }, 1000);
                }, 1500);
            };
        }
    } else {
        closeServiceModal();
        saveRealServiceRequest(name, phone, notes);
    }
}

function saveRealServiceRequest(name, phone, notes) {
    localStorage.setItem('my_last_phone', phone);
    const t = translations[currentLang];
    const reqListRaw = localStorage.getItem('app_requests');
    let requests = reqListRaw ? JSON.parse(reqListRaw) : [];
    
    const newReq = {
        id: 'req_' + Date.now(),
        customerName: name,
        customerPhone: phone,
        notes: notes,
        serviceId: activeServiceId || 'general',
        status: 'pending', // pending, accepted, completed
        createdAt: Date.now(),
        acceptedBy: null,
        acceptedAt: null,
        rating: null
    };
    
    requests.push(newReq);
    if (window.saveRequestsToDb) {
        window.saveRequestsToDb(requests);
    } else {
        localStorage.setItem('app_requests', JSON.stringify(requests));
    }

    // Toast Success
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${t.msg_req_sent || "Request sent successfully"}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = "translateY(-100px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/* --- Detailed Logic --- */
function calculateRenovation() {
    const t = translations[currentLang] || translations['ar'];
    const len = parseFloat(document.getElementById('roomLen').value) || 0;
    const wid = parseFloat(document.getElementById('roomWid').value) || 0;
    const walls = parseInt(document.querySelector('input[name="walls"]:checked')?.value || 4);
    const finish = document.querySelector('input[name="renov_finish"]:checked')?.value || 'average';
    const renovMat = document.querySelector('input[name="renov_mat"]:checked')?.value || 'brick';
    const roomCount = parseInt(document.getElementById('renovRoomCount').value) || 1;

    // Get Selected Work Types (Re-query to be safe)
    const workTypes = Array.from(document.querySelectorAll('.renov-opt:checked')).map(cb => cb.value);

    // Validation: If no works checked, show alert and return
    if (!workTypes.length) {
        const totalEl = document.getElementById('renovTotalDisplay');
        if (totalEl) totalEl.textContent = formatMoney(0);

        const listEl = document.getElementById('renovationDetailsList');
        if (listEl) listEl.innerHTML = '<div style="text-align:center; color:#999; padding:10px;">\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0648\u0639 \u0639\u0645\u0644 \u0648\u0627\u062d\u062f \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644</div>';

        // Show box so they see the message
        const resBox = document.getElementById('renovResult');
        if (resBox) {
            resBox.style.display = 'block';
            resBox.classList.remove('hidden');
        }
        return;
    }

    // Validation: Dimensions required for sensitive works
    const needsDimensions = workTypes.some(t => t !== 'sanitary'); // If any type other than sanitary is chosen, we need dims

    if (needsDimensions && (!len || !wid)) {
        const totalEl = document.getElementById('renovTotalDisplay');
        if (totalEl) totalEl.textContent = formatMoney(0);

        const listEl = document.getElementById('renovationDetailsList');
        if (listEl) listEl.innerHTML = '<div style="text-align:center; color:#ef4444; padding:10px;">\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0637\u0648\u0644 \u0648\u0627\u0644\u0639\u0631\u0636</div>';

        // Show box so they see the error
        const resBox = document.getElementById('renovResult');
        if (resBox) {
            resBox.style.display = 'block';
            resBox.classList.remove('hidden');
        }
        return;
    }

    // Base Dimensions
    const perimeter = (len + wid) * 2;
    const wallHeight = 3.0; // Standard
    let wallArea = perimeter * wallHeight;
    if (walls === 3) wallArea = wallArea * 0.75;
    if (walls === 2) wallArea = wallArea * 0.5;

    const floorArea = (len * wid) || 0; // Prevent NaN

    // Modifiers
    let rMod = 1.0;
    if (typeof constructionData !== 'undefined') {
        const gov = document.getElementById('renovGovSelect')?.value;
        if (gov && constructionData.governorates[gov]) rMod = constructionData.governorates[gov].modifier;
    }

    let totalCost = 0;
    let wastageTotalCost = 0;
    let details = [];

    // Material Estimation Logic
    let materials = {
        brick: 0,
        block: 0,
        thermo: 0,
        cement: 0, // In bags
        sand: 0, // In m3
        ceramic: 0,
        wall_ceramic: 0
    };

    let wastage = {
        brick: 0,
        ceramic: 0,
        cement: 0,
        sand: 0
    };

    // 1. Build Room (Full Structure)
    if (workTypes.includes('build_room')) {
        let baseRate = MarketSync.getLivePrice(220000, 'brick'); // Brick Default
        if (renovMat === 'block') baseRate = MarketSync.getLivePrice(180000, 'block');
        else if (renovMat === 'thermo') baseRate = MarketSync.getLivePrice(195000, 'thermo');

        const structRate = baseRate * rMod;
        const coreCost = floorArea * structRate * roomCount;

        // 5% Wastage for structure materials
        const wastageCost = coreCost * 0.05;
        wastageTotalCost += wastageCost;
        totalCost += coreCost + wastageCost;

        let matLabel = t.mat_brick || 'طابوق';
        if (renovMat === 'block') matLabel = t.mat_block || 'بلوك';
        if (renovMat === 'thermo') matLabel = t.mat_thermo || 'ثرمستون';

        details.push({ item: `${t.opt_new_room} (${matLabel})`, q: `${Math.ceil(floorArea * roomCount)} m²`, unit: structRate, total: coreCost });

        // Mat Calc (Net)
        const netBrick = floorArea * 180 * roomCount;
        if (renovMat === 'brick') { materials.brick += netBrick; wastage.brick += netBrick * 0.05; }
        if (renovMat === 'block') { materials.block += floorArea * 18 * roomCount; }
        if (renovMat === 'thermo') { materials.thermo += floorArea * 10 * roomCount; }

        const netCement = floorArea * 2 * roomCount;
        const netSand = floorArea * 0.5 * roomCount;
        materials.cement += netCement; wastage.cement += netCement * 0.07;
        materials.sand += netSand; wastage.sand += netSand * 0.07;
    }

    // 2. Floors (Tiling)
    if (workTypes.includes('floors')) {
        let rate = finish === 'commercial' ? 25000 : (finish === 'premium' ? 45000 : 35000);
        rate = rate * rMod;
        const coreCost = floorArea * rate * roomCount;

        // 10% Wastage for Ceramic/Tiles
        const wastageCost = coreCost * 0.10;
        wastageTotalCost += wastageCost;
        totalCost += coreCost + wastageCost;

        details.push({ item: t.opt_floors, q: `${Math.ceil(floorArea * roomCount)} m²`, unit: rate, total: coreCost });

        const netCeramic = floorArea * roomCount;
        materials.ceramic += netCeramic;
        wastage.ceramic += netCeramic * 0.10;

        const netCement = floorArea * 0.4 * roomCount;
        const netSand = floorArea * 0.1 * roomCount;
        materials.cement += netCement; wastage.cement += netCement * 0.07;
        materials.sand += netSand; wastage.sand += netSand * 0.07;
    }

    // 3. Wall Ceramics
    if (workTypes.includes('wall_ceramic')) {
        let rate = finish === 'commercial' ? 30000 : (finish === 'premium' ? 50000 : 40000);
        rate = rate * rMod;
        const coreCost = wallArea * rate * roomCount;

        // 10% Wastage
        const wastageCost = coreCost * 0.10;
        wastageTotalCost += wastageCost;
        totalCost += coreCost + wastageCost;

        details.push({ item: t.opt_wall_cer, q: `${Math.ceil(wallArea * roomCount)} m²`, unit: rate, total: coreCost });

        const netWC = wallArea * roomCount;
        materials.wall_ceramic += netWC;
        wastage.ceramic += netWC * 0.10;

        const netCement = wallArea * 0.4 * roomCount;
        materials.cement += netCement; wastage.cement += netCement * 0.07;
    }

    // 4. Plaster (Labakh)
    if (workTypes.includes('plaster')) {
        let rate = 12000 * rMod;
        const coreCost = wallArea * rate * roomCount;

        // 7% Wastage for plaster materials
        const wastageCost = coreCost * 0.07;
        wastageTotalCost += wastageCost;
        totalCost += coreCost + wastageCost;

        details.push({ item: t.opt_plaster, q: `${Math.ceil(wallArea * roomCount)} m²`, unit: rate, total: coreCost });

        const netCement = wallArea * 0.4 * roomCount;
        const netSand = wallArea * 0.04 * roomCount;
        materials.cement += netCement; wastage.cement += netCement * 0.07;
        materials.sand += netSand; wastage.sand += netSand * 0.07;
    }

    // 5. Paint/Gypsum
    if (workTypes.includes('paint')) {
        let rate = finish === 'commercial' ? 8000 : (finish === 'premium' ? 18000 : 12000);
        rate = rate * rMod;
        // Walls + Ceiling
        const paintArea = (wallArea + floorArea) * roomCount;
        const coreCost = paintArea * rate;

        const wastageCost = coreCost * 0.05;
        wastageTotalCost += wastageCost;
        totalCost += coreCost + wastageCost;

        details.push({ item: t.opt_paint, q: `${Math.ceil(paintArea)} m²`, unit: rate, total: coreCost });
    }

    // 6. Electric
    if (workTypes.includes('electric')) {
        let baseElec = finish === 'commercial' ? 12000 : (finish === 'premium' ? 50000 : 25000);
        let rate = baseElec * rMod; // Per m2 of floor estimation
        const coreCost = floorArea * rate * roomCount;
        totalCost += coreCost;
        details.push({ item: t.opt_elec, q: `${Math.ceil(floorArea * roomCount)} m²`, unit: rate, total: coreCost });
    }

    // 7. Sanitary
    if (workTypes.includes('sanitary')) {
        let baseRate = finish === 'commercial' ? 550000 : (finish === 'premium' ? 1800000 : 850000);

        // Adjust for plumbing system quality in renovation
        const renovPlumbing = document.querySelector('input[name="renov_plumbing"]:checked')?.value || 'ppr';
        if (renovPlumbing === 'pex') baseRate = baseRate * 1.6;

        let totalResort = baseRate * roomCount;

        // Extra Roof Station in Renovation
        if (document.getElementById('renov_roof_extra')?.checked) {
            totalResort += 650000;
        }

        const cost = totalResort * rMod;
        totalCost += cost;
        details.push({ item: t.opt_sanitary, q: `${roomCount} Rooms`, unit: cost / roomCount, total: cost });
    }

    // Add wastage as a clear item if it exists
    if (wastageTotalCost > 0) {
        details.push({
            item: "تقدير الهالك والفاقد (المواد)",
            q: "نسبة متغيرة",
            unit: "",
            total: wastageTotalCost,
            isWastage: true
        });
    }


    // Update UI
    const totalEl = document.getElementById('renovTotalDisplay');
    if (totalEl) {
        if (typeof animateValue === 'function') {
            animateValue(totalEl, 0, totalCost, 1000);
        } else {
            totalEl.textContent = formatMoney(totalCost);
        }
    }

    // Render Detail List
    const list = document.getElementById('renovationDetailsList');
    if (list) {
        let html = details.map(d => `
            <div class="receipt-row" ${d.isWastage ? 'style="background:rgba(245, 158, 11, 0.05); border:1px dashed #f59e0b; border-radius:8px; padding:10px; margin-top:10px;"' : ''}>
                <div class="receipt-label">
                    <span ${d.isWastage ? 'style="color:#d97706; font-weight:700;"' : ''}>${d.item || 'Item'}</span>
                    <small style="color:var(--text-light); margin-right:5px; font-size:0.75rem;">(${d.q})</small>
                </div>
                <div class="receipt-value" style="font-size:0.9rem; ${d.isWastage ? 'color:#d97706; font-weight:800;' : ''}">${formatMoney(d.total)}</div>
            </div>
        `).join('');

        // Add Material Section to UI
        if (materials.cement > 0 || materials.sand > 0 || materials.brick > 0 || (materials.ceramic + materials.wall_ceramic) > 0) {
            html += `
                <div style="margin-top:20px; padding:15px; background:rgba(16, 185, 129, 0.05); border-radius:12px; border:1px solid rgba(16, 185, 129, 0.1);">
                    <div style="margin-bottom:10px; font-weight:700; color:#059669; font-size:0.85rem; border-bottom:1px solid rgba(16, 185, 129, 0.1); padding-bottom:5px;">تحليل المواد (الصافي + الهالك)</div>
            `;

            const renderMat = (label, net, waste, icon) => {
                if (net <= 0) return '';
                const total = Math.ceil(net + waste);
                return `
                    <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:6px;">
                        <span><i class="${icon}" style="margin-left:5px; width:15px;"></i> ${label}</span>
                        <div style="text-align:left;">
                            <b style="color:var(--text-main);">${total.toLocaleString()}</b>
                            <small style="color:#64748b; font-size:0.65rem; margin-right:4px;">(${Math.ceil(net).toLocaleString()} + ${Math.ceil(waste).toLocaleString()})</small>
                        </div>
                    </div>
                `;
            };

            html += renderMat(t.mat_brick || 'الطابوق', materials.brick, wastage.brick, 'fa-solid fa-cube');
            html += renderMat(t.mat_block || 'البلوك', materials.block, 0, 'fa-solid fa-cube');
            html += renderMat(t.mat_thermo || 'الثرمستون', materials.thermo, 0, 'fa-solid fa-cube');
            html += renderMat('سيراميك (م٢)', materials.ceramic + materials.wall_ceramic, wastage.ceramic, 'fa-solid fa-border-none');
            html += renderMat(t.mat_cement || 'السمنت (كيس)', materials.cement, wastage.cement, 'fa-solid fa-bag-shopping');
            html += renderMat(t.mat_sand || 'الرمل (م٣)', materials.sand, wastage.sand, 'fa-solid fa-truck-ramp-box');

            html += `</div>`;
        }

        list.innerHTML = html;
    }

    // Auto-Show Result Box if we have a cost or details
    const resBox = document.getElementById('renovResult');
    if (resBox && (totalCost > 0 || details.length > 0)) {
        resBox.style.display = 'block';
        resBox.classList.remove('hidden');
        resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Update Total with animation
        const renovTotalEl = document.getElementById('renovTotalDisplay');
        if (renovTotalEl) animateValue(renovTotalEl, 0, totalCost, 1000);

        // Update Buy Button
        const btnContainer = document.getElementById('renovPdfBtnContainer');
        if (btnContainer) {
            const isTrial = typeof isFreeTrialActive === 'function' && isFreeTrialActive();
            const btnText = isTrial ? `<i class="fa-solid fa-download"></i> ${t.btn_download_now || "تحميل التقرير"}` : `<i class="fa-solid fa-file-pdf"></i> شراء جدول الكميات (1,500 د.ع)`;
            const btnBg = isTrial ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#64748b';

            btnContainer.innerHTML = `
                <button onclick="buyRenovationPDF()" class="cta-button" style="background:${btnBg}; width:100%; border-radius:12px; margin-top:10px;">
                    ${btnText}
                </button>
            `;
        }
    }

    // Push Materials to Details for PDF
    if (materials.brick > 0) details.push({ item: t.mat_brick || 'Brick', q: Math.ceil(materials.brick), unit: 'Piece', unit_price: 0, total: 0 });
    if (materials.block > 0) details.push({ item: t.mat_block || 'Block', q: Math.ceil(materials.block), unit: 'Piece', unit_price: 0, total: 0 });
    if (materials.thermo > 0) details.push({ item: t.mat_thermo || 'Thermostone', q: Math.ceil(materials.thermo), unit: 'Piece', unit_price: 0, total: 0 });
    if (materials.cement > 0) details.push({ item: t.mat_cement || 'Cement', q: Math.ceil(materials.cement), unit: 'Bag', unit_price: 0, total: 0 });
    if (materials.sand > 0) details.push({ item: t.mat_sand || 'Sand', q: Math.ceil(materials.sand), unit: 'm³', unit_price: 0, total: 0 });

    // Save for PDF
    const gov = document.getElementById('renovGovSelect')?.value || 'baghdad';
    window.lastRenovCalc = { total: totalCost, details: details, gov: gov, type: 'renovation' };
}

// --- PDF & Payment System ---
function buyRenovationPDF() {
    if (!window.lastRenovCalc || window.lastRenovCalc.total === 0) {
        alert("\u064a\u0631\u062c\u0649 \u062d\u0633\u0627\u0628 \u0627\u0644\u0643\u0644\u0641\u0629 \u0623\u0648\u0644\u0627\u064b");
        return;
    }

    // Check Free Trial
    if (typeof isFreeTrialActive === 'function' && isFreeTrialActive()) {
        const remainingDays = 60 - Math.ceil(Math.abs(new Date() - new Date(localStorage.getItem('app_install_date'))) / (1000 * 60 * 60 * 24));
        Swal.fire({
            icon: 'success',
            title: '\u0641\u062a\u0631\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0645\u062c\u0627\u0646\u064a\u0629!',
            text: `\u0627\u0633\u062a\u0645\u062a\u0631 \u0628\u062a\u062d\u0645\u064a\u0644 \u062a\u0646\u062f\u0631 \u0627\u0644\u062a\u0631\u0645\u064a\u0645 \u0645\u062c\u0627\u0646\u0627\u064b. (\u0645\u062a\u0628\u0642\u064a ${remainingDays} \u064a\u0648\u0645 \u0644\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u062c\u0627\u0646\u064a)`,
            confirmButtonText: '\u062a\u062d\u0645\u064a\u0644 PDF \u0627\u0644\u0622\u0646',
            confirmButtonColor: '#10B981'
        }).then(() => {
            generateTenderPDF(window.lastRenovCalc);
        });
        return;
    }

    // Open Payment Modal (Simulated)
    document.getElementById('paymentModal').classList.remove('hidden');
    document.getElementById('payAmountDisplay').textContent = "1,500 IQD";

    // Hook the confirm button to PDF generation
    const confirmBtn = document.querySelector('#paymentModal .cta-button');
    confirmBtn.onclick = () => processPdfPayment('renovation');
}

function processPdfPayment(type) {
    const btn = document.querySelector('#paymentModal .cta-button');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang].pay_processing;
    btn.disabled = true;

    // Simulate Payment Delay
    setTimeout(() => {
        // Payment Success
        btn.textContent = "\u0639\u0631\u0636 \u0648\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u062a\u0646\u062f\u0631"; // Show "View & Print"
        btn.style.background = "#10B981"; // Green color
        btn.disabled = false;

        // Change onclick to trigger download immediately (User Gesture preserved)
        btn.onclick = () => {
            if (type === 'construction' && window.lastBuildCalc) {
                generateTenderPDF(window.lastBuildCalc);
            } else if (window.lastRenovCalc) {
                generateTenderPDF(window.lastRenovCalc);
            }

            // Close modal after opening PDF
            setTimeout(() => {
                document.getElementById('paymentModal').classList.add('hidden');
                // Reset button for next time (optional, but good practice)
                btn.textContent = originalText;
                btn.style.background = "";
                btn.onclick = () => processPdfPayment(type);
            }, 500);
        };

        Swal.fire({
            icon: 'success',
            title: '\u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d!',
            text: '\u064a\u0631\u062c\u0649 \u0627\u0644\u0636\u063a\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0627\u0644\u0639\u0631\u0636 \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641.',
            timer: 2000,
            showConfirmButton: false
        });

    }, 2000);
}

function generateTenderPDF(data) {
    const t = translations[currentLang];
    const isRtl = currentLang !== 'en';
    const align = isRtl ? 'right' : 'left';
    const dir = isRtl ? 'rtl' : 'ltr';

    // Tender HTML Structure
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="${currentLang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <title>Renovation Tender - ${data.gov}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Cairo', sans-serif; margin: 0; padding: 40px; background: white; color: #000; font-size: 16px; width: 210mm; min-height: 297mm; box-sizing: border-box; }
            .header { display: flex; flex-direction: column; align-items: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header-top { display: flex; justify-content: space-between; width: 100%; margin-bottom: 15px; font-weight: bold; font-size: 1.2rem; }
            .logo-placeholder { width: 80px; height: 80px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 3rem; color: #000; margin-bottom:10px; }
            .title-block { text-align: center; }
            .title-block h1 { margin: 0; font-size: 2.2rem; font-weight: 900; }
            .title-block h2 { margin: 5px 0 0; font-size: 1.4rem; font-weight: 700; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; border: 2px solid #000; padding: 20px; background:#f9fafb; }
            .info-item { display: flex; gap: 10px; align-items:center; font-size:1.1rem; }
            .info-label { font-weight: bold; width: 140px; }
            .boq-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size:1.1rem; }
            .boq-table th, .boq-table td { border: 1px solid #000; padding: 12px; text-align: center; }
            .boq-table th { background-color: #e5e7eb; font-weight: 800; font-size:1.2rem; }
            .text-start { text-align: ${isRtl ? 'right' : 'left'} !important; font-weight:600; }
            .footer-section { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
            .sign-box { text-align: center; width: 200px; }
            .sign-line { margin-top: 50px; border-bottom: 2px solid #000; width: 100%; }
        </style>
    </head>
    <body style="width: 210mm;">
        <div class="header">
            <div class="header-top">
                <span>${t.pdf_header_iq || 'Republic of Iraq<br>Construction Est.'}</span>
            </div>
            <div class="logo-placeholder">IQ</div>
            <div class="title-block">
                <h1>${t.pdf_title_tender || 'Bill of Quantities'}</h1>
                <h2>${t.pdf_title_boq || 'Report'}</h2>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">${t.res_site || 'Location'}:</span>
                <span>${window.constructionData?.governorates[data.gov]?.name || data.gov}</span>
            </div>
            <!-- Split Costs -->
            <div class="info-item">
                <span class="info-label" style="color:#d97706;">Structure:</span>
                <span>${formatMoney(data.structureCost || 0)}</span>
            </div>
            <div class="info-item">
                <span class="info-label" style="color:#2563eb;">Finishing:</span>
                <span>${formatMoney(data.finishingCost || 0)}</span>
            </div>
            <div class="info-item" style="grid-column: span 2; border-top:1px dashed #000; padding-top:5px; margin-top:5px;">
                <span class="info-label">TOTAL / \u0627\u0644\u0645\u062c\u0645\u0648\u0639:</span>
                <span style="font-weight:900; font-size:1.1rem;">${formatMoney(data.total)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date / \u0627\u0644\u062a\u0627\u0631\u064a\u062e:</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
             <div class="info-item">
                <span class="info-label">Ref / \u0627\u0644\u0645\u0631\u062c\u0639:</span>
                <span>IRQ-${Math.floor(Math.random() * 10000)}</span>
            </div>
        </div>

        <table class="boq-table">
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="40%">${t.tbl_item || 'Item'}</th>
                    <th width="10%">${t.tbl_unit || 'Unit'}</th>
                    <th width="10%">${t.tbl_qty || 'Qty'}</th>
                    <th width="15%">${t.tbl_price || 'Price'}</th>
                    <th width="20%">${t.tbl_total || 'Total'}</th>
                </tr>
                <tr>
                    <th width="10%"></th>
                    <th width="10%"></th>
                    <th width="15%"></th>
                </tr>
            </thead>
            <tbody>
                ${data.details.map((item, index) => {
        let qty = item.q || '';
        let unit = item.unit || 'L.S';
        // Cleanup formatting mixed with units if necessary
        if (typeof qty === 'string' && qty.includes('m\u00b2')) { unit = 'm\u00b2'; qty = qty.replace('m\u00b2', '').trim(); }
        if (typeof qty === 'string' && qty.includes('Rooms')) { unit = 'Room'; qty = qty.replace('Rooms', '').trim(); }

        return `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="text-start">${item.item}</td>
                        <td>${unit}</td>
                        <td>${qty}</td>
                        <td>${item.unit_price ? formatMoney(item.unit_price) : '-'}</td>
                        <td>${formatMoney(item.total)}</td>
                    </tr>
                    `;
    }).join('')}
            </tbody>
            <tfoot>
                 <tr>
                    <td colspan="5" style="text-align:${isRtl ? 'left' : 'right'}; font-weight:bold; background:#f9f9f9;">
                        ${isRtl ? '\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a \u0627\u0644\u0646\u0647\u0627\u0626\u064a' : 'Grand Total'}
                    </td>
                    <td style="font-weight:900; background:#eee;">${formatMoney(data.total)}</td>
                </tr>
            </tfoot>
        </table>

        <div class="footer-section">
            <div class="sign-box">
                <div>${isRtl ? '\u0627\u0644\u0645\u062f\u0642\u0642' : 'Auditor'}</div>
                <div class="sign-line"></div>
            </div>
            <div class="sign-box">
                <div>${isRtl ? '\u0627\u0644\u0645\u0647\u0646\u062f\u0633 \u0627\u0644\u0645\u0634\u0631\u0641' : 'Supervising Engineer'}</div>
                <div class="sign-line"></div>
            </div>
            <div class="sign-box">
                <div>${isRtl ? '\u0627\u0644\u0645\u0635\u0627\u062f\u0642\u0629' : 'Approved By'}</div>
                <div class="sign-line"></div>
            </div>
        </div>
        
        <div style="text-align:center; margin-top:50px; font-size:0.8rem; color:#666;">
            Generated by Main Platform | \u0645\u0646\u0635\u0629 \u0627\u0644\u0628\u0646\u0627\u0621
        </div>
    </body>
    </html>`;

    // Create a temporary container for PDF generation
    // IMPORTANT: Must be visible (z-index wise) but can be covered by a loading overlay
    let container = document.createElement('div');
    container.id = 'pdf-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-9999';
    container.style.opacity = '1';
    container.style.width = '210mm';
    container.style.background = 'white';

    // Better: Just use a div with the content.
    container.innerHTML = htmlContent;

    document.body.appendChild(container);

    // Show loading
    Swal.fire({
        title: '\u062d\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641 PDF...',
        didOpen: () => Swal.showLoading()
    });

    // Wait for fonts/images
    setTimeout(() => {
        const { jsPDF } = window.jspdf;

        html2canvas(container.querySelector('body') || container, {
            scale: 2, // High quality
            useCORS: true,
            logging: false,
            allowTaint: true,
            windowWidth: 210 * 3.7795, // mm to px approx
            windowHeight: 297 * 3.7795
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Tender_${data.gov}_${Date.now()}.pdf`);

            // Cleanup
            document.body.removeChild(container);
            Swal.close();

            Swal.fire({
                icon: 'success',
                title: '\u062a\u0645 \u0627\u0644\u062a\u0646\u0632\u064a\u0644!',
                text: '\u062a\u0645 \u062d\u0641\u0638 \u0645\u0644\u0641 \u0627\u0644\u062a\u0646\u062f\u0631 \u0628\u0646\u062c\u0627\u062d.',
                timer: 2000,
                showConfirmButton: false
            });
        }).catch(err => {
            console.error(err);
            Swal.fire('\u062e\u0637\u0623', '\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0644\u0641: ' + err.message, 'error');
            if (document.body.contains(container)) document.body.removeChild(container);
        });
    }, 1500);
}

/* --- Old Cost logic --- */
/* --- Advanced Cost Logic 2.0 --- */
function calculateCost() {
    const t = translations[currentLang];
    const buildArea = parseFloat(document.getElementById('buildArea').value);
    const floors = parseInt(document.getElementById('floors').value) || 1;
    const finish = document.querySelector('input[name="finish"]:checked')?.value || 'average';
    // --- UI Logic: Ensure UI reflects scope ---
    // Note: scope listeners are now global
    const gov = document.getElementById('govSelect')?.value || 'baghdad';
    const material = document.querySelector('input[name="build_mat"]:checked')?.value || 'brick';
    const scope = document.querySelector('input[name="build_scope"]:checked')?.value || 'full';

    updateScopeUI(); // Helper to sync UI visibility

    // NOW check for area. UI updates must happen regardless of area present
    if (!buildArea) return;

    // --- Calculation ---



    const totalArea = buildArea * floors;

    const regionData = constructionData.governorates[gov] || { modifier: 1.0, name: "\u0628\u063a\u062f\u0627\u062d" };
    const rMod = regionData.modifier;

    // --- 1. Structure Costs (Haikal) ---
    // User calibrated rates: 180k-250k+ per m2 total
    let structureRate = MarketSync.getLivePrice(220000, 'brick'); // Base Brick
    if (material === 'block') structureRate = MarketSync.getLivePrice(180000, 'block');
    else if (material === 'thermo') structureRate = MarketSync.getLivePrice(195000, 'thermo');

    structureRate = structureRate * rMod;
    const roofType = document.querySelector('input[name="build_roof"]:checked')?.value || 'normal';
    
    let baseTotalStructure = totalArea * structureRate;
    let costExcavation = baseTotalStructure * 0.05;
    let costFoundation = baseTotalStructure * 0.25;
    let costSkeleton = baseTotalStructure * 0.30;
    let costRoof = baseTotalStructure * 0.40;
    
    if (roofType === 'hurdi') {
        costRoof *= 1.15;
    } else if (roofType === 'akada') {
        costRoof *= 0.75;
    }
    
    const totalStructure = costExcavation + costFoundation + costSkeleton + costRoof;
    structureRate = totalStructure / totalArea; // Update average structure rate

    // --- 2. Finishing Costs ---
    let finishRate = 0;
    let elecRateM2 = 0;
    let sanitaryPipingRate = 0;
    let sanitaryUnitCost = 0;
    let decorCost = 0;

    if (scope === 'full') {
        if (finish === 'commercial') {
            finishRate = MarketSync.getLivePrice(200000, 'finish');
            elecRateM2 = 12000;
            sanitaryUnitCost = 550000;
        } else if (finish === 'average') {
            finishRate = MarketSync.getLivePrice(320000, 'finish');
            elecRateM2 = 25000;
            sanitaryUnitCost = 850000;
        } else if (finish === 'premium') {
            finishRate = MarketSync.getLivePrice(550000, 'finish');
            elecRateM2 = 50000;
            sanitaryUnitCost = 1800000;
        }

        // Adjust for plumbing system quality
        const plumbingSys = document.querySelector('input[name="plumbing_system"]:checked')?.value || 'ppr';
        if (plumbingSys === 'pex') {
            sanitaryUnitCost = sanitaryUnitCost * 1.6; // ~60% premium for PEX/Manifold system
        }

        finishRate = finishRate * rMod;
        sanitaryPipingRate = 12000; // Base network
    }

    const totalFinish = totalArea * finishRate;
    const electrical = totalArea * elecRateM2;

    const wcCount = parseInt(document.getElementById('wcCount').value) || 3;
    let sanitaryTotal = (totalArea * sanitaryPipingRate) + (scope === 'full' ? (wcCount * sanitaryUnitCost) : 0);

    // Add extras
    if (scope === 'full') {
        if (document.getElementById('extra_ext_wc')?.checked) sanitaryTotal += 1200000 * rMod; // External WC unit
        if (document.getElementById('extra_roof_station')?.checked) sanitaryTotal += 650000 * rMod; // Pump + Heater + Tank setup
    }

    const sanitary = sanitaryTotal;

    // --- Split Cost Analysis ---
    const totalStructureCost = totalStructure;
    const totalFinishingCost = totalFinish + electrical + sanitary;

    // grandTotal should only include finishing if scope is 'full'
    const grandTotal = (scope === 'full') ? (totalStructureCost + totalFinishingCost) : totalStructureCost;

    // --- Detailed Structure Breakdown (Approximate Ratios) ---
    // Breakdown already calculated above to account for roof type differences

    // --- 3. Material Quantity Analysis ---
    // Estimates based on Iraqi construction standards per m2 floor area
    let mainMatCount = 0;
    let mainMatName = "";

    // Cement (Bags) - Approx 5 bags/m2
    const cementBags = Math.ceil(totalArea * 6.5);
    // Sand (Lorry 16m3)
    const sandLoads = (totalArea * 0.45) / 16;
    // Rebar (Tons) - 55kg/m2
    const steelTons = (totalArea * 55) / 1000;

    if (material === 'brick') {
        const brickPerM2 = 180;
        mainMatCount = totalArea * brickPerM2;
        mainMatName = t.lbl_qty_brick;
    } else if (material === 'block') {
        const blockPerM2 = 18;
        mainMatCount = totalArea * blockPerM2;
        mainMatName = t.lbl_qty_block;
    } else if (material === 'thermo') {
        const thermoPerM2 = 9.5;
        mainMatCount = totalArea * thermoPerM2;
        mainMatName = t.mat_thermo || "ثرمستون (قطعة)";
    }

    // --- Update Display ---
    const resultBox = document.getElementById('buildResult');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.classList.remove('hidden');

        // Structure
        const elStruct = document.getElementById('resStructure');
        if (elStruct) animateValue(elStruct, 0, totalStructureCost, 1000);

        // Finishing
        const elFinish = document.getElementById('resFinishing');
        const rowFinish = document.getElementById('finishReceiptRow');

        if (scope === 'full') {
            if (rowFinish) rowFinish.style.display = 'flex';
            if (elFinish) animateValue(elFinish, 0, totalFinishingCost, 1000);
        } else {
            if (rowFinish) rowFinish.style.display = 'none';
        }

        // Detailed Breakdown
        const breakdownList = document.getElementById('structBreakdownList');
        if (breakdownList) {
            breakdownList.innerHTML = `
                <!-- Stage Breakdown -->
                <div style="margin-top:20px; border:1px solid var(--border-color); border-radius:12px; overflow:hidden;">
                    <div style="padding:10px; background:#f8fafc; border-bottom:1px solid var(--border-color); font-weight:700; font-size:0.8rem; color:var(--text-light); text-align:center;">مراحل الهيكل (تقديري)</div>
                    <div class="receipt-row" style="padding:10px; border-bottom:1px solid #f1f5f9;">
                        <span style="font-size:0.85rem;"><i class="fa-solid fa-shapes" style="color:#f97316; margin-left:8px;"></i>الأساسات والبتلو</span>
                        <b style="font-size:0.85rem;">${formatMoney(costFoundation)}</b>
                    </div>
                    <div class="receipt-row" style="padding:10px; border-bottom:1px solid #f1f5f9;">
                        <span style="font-size:0.85rem;"><i class="fa-solid fa-border-all" style="color:#f97316; margin-left:8px;"></i>الأعمدة والجدران</span>
                        <b style="font-size:0.85rem;">${formatMoney(costSkeleton)}</b>
                    </div>
                    <div class="receipt-row" style="padding:10px;">
                        <span style="font-size:0.85rem;"><i class="fa-solid fa-layer-group" style="color:#f97316; margin-left:8px;"></i>قالب وتسليح السقف</span>
                        <b style="font-size:0.85rem;">${formatMoney(costRoof)}</b>
                    </div>
                </div>

                <!-- Quantity Analysis -->
                <div style="padding:15px; background:rgba(79, 70, 229, 0.05); border-radius:12px; margin-top:15px;">
                    <div style="margin-bottom:10px; font-weight:700; color:var(--primary); font-size:0.85rem; border-bottom:1px solid rgba(79, 70, 229, 0.1); padding-bottom:5px;">تحليل الكميات (تقديري)</div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
                        <span style="color:var(--text-light);"><i class="fa-solid fa-cube" style="margin-left:5px;"></i> ${mainMatName}</span>
                        <b style="color:var(--text-main);">${Math.ceil(mainMatCount).toLocaleString()}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
                        <span style="color:var(--text-light);"><i class="fa-solid fa-bag-shopping" style="margin-left:5px;"></i> سمنت (كيس)</span>
                        <b style="color:var(--text-main);">${cementBags.toLocaleString()}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
                        <span style="color:var(--text-light);"><i class="fa-solid fa-truck-ramp-box" style="margin-left:5px;"></i> رمل (لوري)</span>
                        <b style="color:var(--text-main);">${sandLoads.toFixed(1)}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                        <span style="color:var(--text-light);"><i class="fa-solid fa-mound" style="margin-left:5px;"></i> حديد تسليح (طن)</span>
                        <b style="color:var(--text-main);">${steelTons.toFixed(2)}</b>
                    </div>
                </div>
            `;
        }

        // Total
        const elTotal = document.getElementById('buildTotalDisplay');
        if (elTotal) animateValue(elTotal, 0, grandTotal, 1000);

        // Buy Button
        const btnContainer = document.getElementById('pdfBtnContainer');
        if (btnContainer) {
            const isTrial = typeof isFreeTrialActive === 'function' && isFreeTrialActive();
            const btnText = isTrial
                ? `<i class="fa-solid fa-download"></i> ${t.btn_download_now || "تحميل التقرير الكامل"}`
                : `<i class="fa-solid fa-file-pdf"></i> ${t.btn_buy_boq || "شراء جدول الكميات"} - 2,000 د.ع`;

            const btnBg = isTrial
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)';

            btnContainer.innerHTML = `
                <button onclick="buyConstructionPDF()" class="cta-button" style="margin-top:20px; background:${btnBg}; width:100%; box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    ${btnText}
                </button>
            `;
        }
    }

    // Save for PDF
    window.lastBuildCalc = {
        total: grandTotal,
        structureCost: totalStructureCost,
        finishingCost: totalFinishingCost,
        gov: gov,
        details: [
            { item: 'حفر، تعديل، فرش سبيس', unit: 'm2', q: totalArea, unit_price: structureRate * 0.05, total: costExcavation },
            { item: 'صب الأسس (البتلو)', unit: 'm2', q: totalArea, unit_price: structureRate * 0.25, total: costFoundation },
            { item: 'الهيكل (أعمدة وجدران)', unit: 'm2', q: totalArea, unit_price: structureRate * 0.30, total: costSkeleton },
            { item: 'السقف (قالب وصب وتسليح)', unit: 'm2', q: totalArea, unit_price: structureRate * 0.40, total: costRoof },
            { item: t.res_finish || 'Finishing', unit: 'm2', q: totalArea, unit_price: finishRate, total: totalFinish },
            { item: t.res_elec || 'Electrical', unit: 'm2', q: totalArea, unit_price: elecRateM2, total: electrical },
            { item: t.res_sanitary || 'Sanitary', unit: 'L.S', q: wcCount, unit_price: sanitaryUnitCost, total: sanitary },
            { item: 'Cement (Bag)', unit: 'Bag', q: cementBags, unit_price: 0, total: 0 },
            { item: 'Sand (m3)', unit: 'm3', q: (sandLoads * 16).toFixed(1), unit_price: 0, total: 0 },
            { item: 'Steel (Ton)', unit: 'Ton', q: steelTons.toFixed(2), unit_price: 0, total: 0 },
        ]
    };
}

// --- Free Trial Logic ---
const TRIAL_DURATION_DAYS = 60; // 2 Months

function initFreeTrial() {
    if (!localStorage.getItem('app_install_date')) {
        localStorage.setItem('app_install_date', new Date().toISOString());
    }
}

function isFreeTrialActive() {
    const installDateStr = localStorage.getItem('app_install_date');
    if (!installDateStr) return true; // Should be set, but default free if missing

    const installDate = new Date(installDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - installDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= TRIAL_DURATION_DAYS;
}

// Initialize on load
initFreeTrial();

function buyConstructionPDF() {
    if (!window.lastBuildCalc) return;

    // Check Free Trial
    if (isFreeTrialActive()) {
        const remainingDays = 60 - Math.ceil(Math.abs(new Date() - new Date(localStorage.getItem('app_install_date'))) / (1000 * 60 * 60 * 24));
        Swal.fire({
            icon: 'success',
            title: '\u0641\u062a\u0631\u0629 \u062a\u062c\u0631\u064a\u0628\u064a\u0629 \u0645\u062c\u0627\u0646\u064a\u0629!',
            text: `\u0627\u0633\u062a\u0645\u062a\u0631 \u0628\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0645\u062c\u0627\u0646\u0627\u064b. (\u0645\u062a\u0628\u0642\u064a ${remainingDays} \u064a\u0648\u0645 \u0644\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0645\u062c\u0627\u0646\u064a)`,
            confirmButtonText: '\u062a\u062d\u0645\u064a\u0644 PDF \u0627\u0644\u0622\u0646',
            confirmButtonColor: '#10B981'
        }).then(() => {
            generateTenderPDF(window.lastBuildCalc);
        });
        return;
    }

    // Open Payment Modal
    document.getElementById('paymentModal').classList.remove('hidden');
    document.getElementById('payAmountDisplay').textContent = "2,000 IQD";

    // Hook confirm
    const confirmBtn = document.querySelector('#paymentModal .cta-button');
    confirmBtn.onclick = () => {
        processPdfPayment('construction'); // Pass type
    };
}



/* --- Payment Logic --- */
/* --- Payment Logic (Gateways) --- */

// Mock DB/Storage for Auto-Publish
// registeredUsers is now global at top




/* --- Payment Logic (Gateways) --- */
async function openPayment(pkg, amount) {
    if (amount === 0) return; // Skip for free actions if mistakenly called

    const t = translations[currentLang];

    // Payment Method Selection
    const result = await Swal.fire({
        title: t.pay_title || 'Ø§Ø®ØªØ± Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹',
        html: `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
                <button class="pay-option" onclick="Swal.clickConfirm()" data-method="zain" style="padding:15px; border:1px solid #ddd; border-radius:10px; background:white; cursor:pointer; display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; background:#ef4444; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-wallet"></i></div>
                    <div style="text-align:left; flex:1;">
                        <div style="font-weight:bold;">ZainCash</div>
                        <div style="font-size:0.8rem; color:gray;">${t.pay_zain || 'Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± Ø§Ù„Ù…Ø­ÙØ¸Ø©'}</div>
                    </div>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button class="pay-option" onclick="Swal.clickConfirm()" data-method="qi" style="padding:15px; border:1px solid #ddd; border-radius:10px; background:white; cursor:pointer; display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; background:#f59e0b; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-credit-card"></i></div>
                    <div style="text-align:left; flex:1;">
                        <div style="font-weight:bold;">Qi Card / Rafidain</div>
                        <div style="font-size:0.8rem; color:gray;">${t.pay_qi || '\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0630\u0643\u064a\u0629'}</div>
                    </div>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button class="pay-option" onclick="Swal.clickConfirm()" data-method="card" style="padding:15px; border:1px solid #ddd; border-radius:10px; background:white; cursor:pointer; display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; background:#2563eb; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fa-brands fa-cc-mastercard"></i></div>
                    <div style="text-align:left; flex:1;">
                        <div style="font-weight:bold;">Mastercard / Visa</div>
                        <div style="font-size:0.8rem; color:gray;">${t.pay_card || '\u0628\u0637\u0627\u0642\u0627\u062a \u0639\u0627\u0644\u0645\u064a\u0629'}</div>
                    </div>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: t.btn_cancel || '\u0625\u0644\u063a\u0627\u0621'
    });

    // Handle Result: Only proceed if confirmed (User selected a method)
    if (result.isConfirmed) {
        Swal.fire({
            title: t.pay_processing || '\u062c\u0627\u0631\u064a \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629...',
            timer: 2000,
            didOpen: () => {
                Swal.showLoading()
            }
        }).then(() => {
            Swal.fire({
                icon: 'success',
                title: t.pay_success || '\u062a\u0645 \u0627\u0644\u062f\u0641\u0639 \u0628\u0646\u062c\u0627\u062d!',
                text: t.msg_sub_success || '\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643.',
                confirmButtonColor: '#10B981'
            });
        });
    }
}

function closePayment() {
    const modal = document.getElementById('paymentModal');
    modal.style.transform = "translateY(100%)";
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function processPayment() {
    const btn = document.querySelector('#paymentModal .cta-button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> OK';
        btn.style.background = '#10B981';
        setTimeout(() => {
            closePayment();
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 1500);
    }, 2000);
}

/* --- Analytics Logic --- */
function initAnalytics() {
    let visits = localStorage.getItem('app_visits');
    if (!visits) visits = 1250000;
    else visits = parseInt(visits) + 1;
    localStorage.setItem('app_visits', visits);
}


initAnalytics();

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = formatMoney(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
// End of Script - (Previous end)

/* --- Ad Management System --- */
const defaultAdsList = [
    { id: 'ad_def_1', section: 'home', image: 'assets/images/tabooga_hero_modern_house_1766770330726.png', title: '\u062d\u0627\u0633\u0628\u0629 \u0627\u0644\u0628\u0646\u0627\u0621', link: '#' },
    { id: 'ad_def_2', section: 'renovation', image: 'assets/images/tabooga_renovation_modern_1766770443520.png', title: '\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u062a\u0631\u0645\u064a\u0645', link: '#' },
    { id: 'ad_def_3', section: 'shop', image: 'assets/images/tabooga_shop_materials_1766770459515.png', title: '\u0633\u0648\u0642 \u0627\u0644\u0645\u0648\u0627\u062f', link: '#' },
    { id: 'ad_def_4', section: 'pros', image: 'assets/images/tabooga_pros_engineer_1766770490376.png', title: '\u062d\u0644\u064a\u0644 \u0627\u0644\u062e\u0628\u0631\u0627\u0621', link: '#' },
    { id: 'ad_def_5', section: 'plans', image: 'assets/images/tabooga_plans_blueprints_1766770505402.png', title: '\u0627\u0644\u0645\u062e\u0637\u0637\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u064a\u0629', link: '#' },
    { id: 'ad_def_6', section: 'business', image: 'assets/images/tabooga_business_office_1766770523672.png', title: '\u0645\u0631\u0643\u0632 \u0627\u0644\u0623\u0639\u0645\u0627\u0644', link: '#' }
];

function getAds() {
    // Always force defaults for now to guarantee image loading
    // Once verified, we can switch back to local storage
    return defaultAdsList;
}

function saveAds(ads) {
    localStorage.setItem('app_ads_v3', JSON.stringify(ads));
    renderAds();
}

function renderAds() {
    const ads = defaultAdsList; // FORCE DEFAULTS directly
    const sections = ['home', 'renovation', 'shop', 'pros', 'plans', 'business'];

    const sliderMap = {
        'home': 'homeAdSlider',
        'renovation': 'renovAdSlider',
        'shop': 'adSlider',
        'pros': 'prosAdSlider',
        'plans': 'engAdSlider',
        'business': 'bizAdSlider'
    };

    console.log("Starting Ad Rendering...");

    sections.forEach(sec => {
        const sliderId = sliderMap[sec];
        const container = document.getElementById(sliderId);

        if (!container) {
            console.error(`Ad Container missing for section: ${sec} (ID: ${sliderId})`);
            return;
        }

        const sectionAds = ads.filter(a => a.section === sec);
        console.log(`Rendering ${sec}: Found ${sectionAds.length} ads.`);

        if (sectionAds.length === 0) {
            console.warn(`No ads found for ${sec}`);
            return;
        }

        // GENERATE HTML
        const html = sectionAds.map((ad, idx) => `
            <div class="ad-slide ${idx === 0 ? 'active' : ''}" 
                 style="background-image: url('${ad.image}'); opacity: 0.8;" onclick="if('${ad.link}' !== '#') window.open('${ad.link}', '_blank')">
                ${ad.title ? `<div class="slide-caption">${ad.title}</div>` : ''}
            </div>
        `).join('');

        container.innerHTML = html;
        console.log(`Injected HTML into ${sliderId}`);

        // Start Auto-Slide (CSS Animation handled by keyframes, or simple JS switch)
        // For simplicity, we stick to the first one or implement a concise interval
        startSliderInterval(container, sectionAds.length);
    });
}

const sliderIntervals = {};

function startSliderInterval(container, count) {
    if (count <= 1) return;
    const cwId = container.id;
    if (sliderIntervals[cwId]) clearInterval(sliderIntervals[cwId]);

    let current = 0;
    const slides = container.querySelectorAll('.ad-slide');

    sliderIntervals[cwId] = setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % count;
        slides[current].classList.add('active');
    }, 5000);
}

function openAdManager() {
    Swal.fire({
        title: 'مدير الإعلانات',
        input: 'password',
        inputAttributes: { maxlength: 4, placeholder: '****', autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'دخول',
        cancelButtonText: 'إلغاء',
        preConfirm: (pin) => {
            if (pin !== '1122') Swal.showValidationMessage('رمز خاطئ');
        }
    }).then((res) => {
        if (res.isConfirmed) showAdDashboard();
    });
}

function showAdDashboard() {
    const ads = getAds();
    const adsListHtml = ads.map(ad => `
        <div style="display:flex; gap:10px; align-items:center; border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:8px;">
            <img src="${ad.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
            <div style="flex:1; text-align:right;">
                <div style="font-weight:bold; font-size:0.9rem;">${ad.title || 'بدون عنوان'}</div>
                <div style="font-size:0.8rem; color:#888;">${ad.section}</div>
            </div>
            <button onclick="deleteAd('${ad.id}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px;"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    Swal.fire({
        title: 'إدارة الإعلانات',
        html: `
            <div style="max-height:300px; overflow-y:auto; margin-bottom:15px;">${adsListHtml || '<p>لا توجد إعلانات</p>'}</div>
            <button onclick="addNewAd()" class="swal2-confirm swal2-styled" style="width:100%; background:#3b82f6;">+ إضافة إعلان جديد</button>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

function addNewAd() {
    Swal.fire({
        title: 'إعلان جديد',
        html: `
            <select id="newAdSection" class="swal2-input">
                <option value="home">الرئيسية</option>
                <option value="renovation">الترميم</option>
                <option value="shop">السوق</option>
                <option value="pros">الخبراء</option>
                <option value="plans">الهندسية</option>
                <option value="business">الأعمال</option>
                <option value="all">كل الأقسام</option>
            </select>
            <input id="newAdTitle" class="swal2-input" placeholder="عنوان الإعلان (اختياري)">
            <input id="newAdImg" class="swal2-input" placeholder="رابط الصورة (URL)">
            <input id="newAdLink" class="swal2-input" placeholder="رابط التوجيه (URL)">
        `,
        confirmButtonText: 'حفظ',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            return {
                id: 'ad_' + Date.now(),
                section: document.getElementById('newAdSection').value,
                title: document.getElementById('newAdTitle').value,
                image: document.getElementById('newAdImg').value,
                link: document.getElementById('newAdLink').value || '#'
            };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            if (!res.value.image) {
                Swal.fire('خطأ', 'يرجى وضع رابط صورة', 'error').then(addNewAd);
                return;
            }
            const ads = getAds();
            ads.push(res.value);
            saveAds(ads);
            Swal.fire('تم', 'تمت إضافة الإعلان', 'success').then(showAdDashboard);
        } else {
            showAdDashboard();
        }
    });
}

function deleteAd(id) {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'حذف هذا الإعلان؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    }).then((res) => {
        if (res.isConfirmed) {
            const ads = getAds().filter(a => a.id !== id);
            saveAds(ads);
            showAdDashboard(); // Refresh list
        }
    });
}

// Global Init
document.addEventListener('DOMContentLoaded', () => {
    // ... existing init code checked previously ...
    renderAds();
});
// End of Script

function closeAdminStats() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.style.transition = "transform 0.3s ease";
    modal.style.transform = "translateY(100%)";

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

/* --- Dynamic Business Plans --- */
const defaultPlans = [
    {
        id: 'starter',
        name: 'الباقة الأساسية',
        price: 0,
        period: 'شهر',
        features: ['ظهور في القائمة العامة', 'ملف تعريفي بسيط', 'تلقي طلبات محدودة'],
        icon: 'fa-seedling',
        color: '#10b981',
        btnText: 'اشترك مجاناً'
    },
    {
        id: 'pro',
        name: 'باقة المحترفين',
        price: 50000,
        period: 'شهر',
        features: ['ظهور مميز في الأعلى', 'معرض أعمال (5 صور)', 'إحصائيات ظهور', 'شارة "موصى به"'],
        icon: 'fa-rocket',
        color: '#3b82f6',
        btnText: 'اشترك الآن'
    },
    {
        id: 'vip',
        name: 'باقة النخبة (VIP)',
        price: 100000,
        period: 'شهر',
        features: ['تثبيت في الصفحة الرئيسية', 'معرض أعمال لا محدود', 'دعم فني مباشر', 'شارة "VIP" ذهبية'],
        icon: 'fa-crown',
        color: '#f59e0b',
        btnText: 'اشترك الآن'
    }
];

function getPlans() {
    const stored = localStorage.getItem('plan_prices');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const hasStarter = parsed.some(p => p.id === 'starter');
                if (hasStarter) return parsed;
                return [
                    {
                        id: 'starter',
                        name: 'الباقة الأساسية',
                        price: 0,
                        period: 'شهر',
                        features: ['ظهور في القائمة العامة', 'ملف تعريفي بسيط', 'تلقي طلبات محدودة'],
                        icon: 'fa-seedling',
                        color: '#10b981',
                        btnText: 'اشترك مجاناً'
                    },
                    ...parsed
                ];
            }
        } catch (e) { }
    }
    return defaultPlans;
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

// --- Helper: Update UI based on Build Scope ---
function updateScopeUI() {
    const scopeInput = document.querySelector('input[name="build_scope"]:checked');
    const scope = scopeInput ? scopeInput.value : 'full';

    const wcGroup = document.getElementById('wcGroup');
    if (wcGroup) {
        wcGroup.style.display = (scope === 'structure') ? 'none' : 'block';
    }

    const finishGroup = document.querySelector('.finish-options')?.closest('.input-group');
    if (finishGroup) {
        finishGroup.style.display = (scope === 'structure') ? 'none' : 'block';
    }
}

// Global Listener for Scope Change
document.addEventListener('DOMContentLoaded', () => {
    const scopeInputs = document.querySelectorAll('input[name="build_scope"]');
    scopeInputs.forEach(input => {
        input.addEventListener('change', () => {
            updateScopeUI();
            calculateCost();
        });
    });

    // Listeners for Finish and Material changes
    document.querySelectorAll('input[name="finish"], input[name="build_mat"]').forEach(input => {
        input.addEventListener('change', calculateCost);
    });

    // Initial State
    updateScopeUI();
});


// --- RESTORED UTILITY ---
function setFloors(n) { const el = document.getElementById('floors'); if (el) { el.value = n; calculateCost(); } }

// --- Market Intelligence Integration ---
function syncMarketUI() {
    const usdEl = document.getElementById('live-usd-rate');
    const indexEl = document.getElementById('market-index');
    const adviceText = document.getElementById('ai-advice-text');
    const statusEl = document.getElementById('market-sync-status');
    const tickerBrick = document.getElementById('price-brick');
    const tickerBrick2 = document.getElementById('price-brick-2');

    if (usdEl) usdEl.textContent = MarketSync.getLivePrice(1, 'currency') === 1 ? constructionData.market.usd_iqd.toLocaleString() + ' IQD' : (constructionData.market.usd_iqd).toLocaleString() + ' IQD';

    if (indexEl) {
        indexEl.textContent = constructionData.market.status === 'stable' ? 'مستقر' : (constructionData.market.status === 'rising' ? 'صعود ↗' : 'هبوط ↘');
        indexEl.style.color = constructionData.market.status === 'rising' ? '#EF4444' : (constructionData.market.status === 'falling' ? '#10B981' : '#4F46E5');
    }

    if (statusEl) {
        statusEl.textContent = 'محدث: ' + new Date(constructionData.market.last_sync).toLocaleTimeString('ar-IQ');
    }

    // Update Advice
    const advice = MarketSync.getAIAdvice();
    if (adviceText && advice.length > 0) {
        adviceText.textContent = advice[0].msg; // Show top advice
        adviceText.parentElement.style.background = advice[0].danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
        adviceText.style.color = advice[0].danger ? '#991B1B' : '#065F46';
    }

    // Refresh Ticker Prices
    if (tickerBrick) tickerBrick.textContent = (MarketSync.getLivePrice(constructionData.prices.brick_1000, 'brick')).toLocaleString();
    if (tickerBrick2) tickerBrick2.textContent = (MarketSync.getLivePrice(constructionData.prices.brick_1000, 'brick')).toLocaleString();

    // Recalculate if results are visible
    if (!document.getElementById('buildResult')?.classList.contains('hidden')) {
        calculateCost();
    }
}

// Global Market Update Listener
window.addEventListener('marketUpdate', (e) => {
    syncMarketUI();
});

// Run initial sync
setTimeout(syncMarketUI, 1000);

// --- AI Blueprint Scanner Logic ---
let scannerStream = null;

async function openAIScanner() {
    const overlay = document.getElementById('scannerOverlay');
    const video = document.getElementById('scannerVideo');
    if (!overlay || !video) return;

    try {
        overlay.classList.remove('hidden');
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        video.srcObject = scannerStream;
    } catch (err) {
        console.error("Camera Error:", err);
        Swal.fire('خطأ في الكاميرا', 'يرجى السماح بالوصول للكاميرا لاستخدام هذه الميزة.', 'error');
        overlay.classList.add('hidden');
    }
}

function closeAIScanner() {
    const overlay = document.getElementById('scannerOverlay');
    if (overlay) overlay.classList.add('hidden');
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
}

function captureBlueprint() {
    const video = document.getElementById('scannerVideo');
    const canvas = document.getElementById('scannerCanvas');
    if (!video || !canvas) return;

    // Visual feedback
    video.style.filter = 'brightness(2) contrast(1.5)';
    setTimeout(() => video.style.filter = '', 100);

    // Simulate AI Processing
    Swal.fire({
        title: 'جاري تحليل المخطط...',
        html: '<div style="margin-top:10px;"><i class="fa-solid fa-microchip fa-fade" style="font-size:2rem; color:#10b981;"></i><p style="margin-top:10px;">معالجة البيانات الهندسية وكشف المساحات</p></div>',
        timer: 3000,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    }).then(() => {
        // Mock Extracted Data
        const possibleAreas = [100, 120, 125, 150, 200, 250];
        const extractedArea = possibleAreas[Math.floor(Math.random() * possibleAreas.length)];

        Swal.fire({
            icon: 'success',
            title: 'اكتشاف المخطط بنجاح!',
            html: `
                <div style="text-align:right; background:#f8fafc; padding:15px; border-radius:12px;">
                    <p><b>المساحة المقدرة:</b> ${extractedArea} متر مربع</p>
                    <p><b>نوع المخطط:</b> سكني / كلاسيك</p>
                    <p style="font-size:0.8rem; color:#64748b;">تم الكشف عن الأبعاد الخارجية والجدران الرئيسية.</p>
                </div>
            `,
            confirmButtonText: 'احسب التكلفة الآن',
            confirmButtonColor: '#10b981',
            showCancelButton: true,
            cancelButtonText: 'إعادة المحاولة'
        }).then((result) => {
            if (result.isConfirmed) {
                applyScannerResults(extractedArea);
            }
        });
        closeAIScanner();
    });
}

function applyScannerResults(area) {
    const areaInput = document.getElementById('buildArea');
    if (areaInput) {
        areaInput.value = area;
        calculateCost();
    }
    switchView('home');
    showToast(`تم استيراد المساحة: ${area}م²`);
}

function toggleCameraFlash() {
    if (scannerStream) {
        const track = scannerStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
            const current = track.getConstraints().torch || false;
            track.applyConstraints({ advanced: [{ torch: !current }] });
        } else {
            showToast("الفلاش غير مدعوم على هذا المتصفح");
        }
    }
}

// --- Engineering Marketplace Logic ---
function contactOffice(phone, name) {
    if (!phone) return;
    const msg = encodeURIComponent(`مرحباً ${name}، رأيت مخططكم على تطبيق طابوقة وأرغب بالاستفسار عنه.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

function registerAsOffice() {
    Swal.fire({
        title: 'طلب انضمام شريك',
        html: `
            <input id="swal-office-name" class="swal2-input" placeholder="اسم النشاط التجاري">
            <input id="swal-office-phone" class="swal2-input" placeholder="رقم الهاتف (واتساب)">
            <select id="swal-office-cat" class="swal2-input">
                <option value="eng">مكتب هندسي (نشر خرائط)</option>
                <option value="shop">مورِّد مواد (نشر منتجات)</option>
                <option value="con">شركة/خبير (معرض أعمال)</option>
            </select>
            <p style="font-size:0.85rem; color:#64748b; margin-top:10px;">انضم لشبكة طابوقة وابدأ باستقبال الزبائن.</p>
        `,
        confirmButtonText: 'إرسال الطلب',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const name = document.getElementById('swal-office-name').value;
            const phone = document.getElementById('swal-office-phone').value;
            const cat = document.getElementById('swal-office-cat').value;
            if (!name || !phone) Swal.showValidationMessage('يرجى ملء كافة الحقول');
            return { name, phone, cat };
        }
    }).then((result) => {
        if (result.isConfirmed && result.value.name) {
            // Save Request Logic
            const req = {
                id: Date.now(),
                name: result.value.name,
                phone: result.value.phone,
                category: result.value.cat, // critical fix
                date: new Date().toLocaleDateString('ar-IQ'),
                status: 'pending'
            };

            let requests = [];
            try {
                requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
            } catch (e) { requests = []; }

            requests.push(req);
            localStorage.setItem('admin_requests', JSON.stringify(requests));

            // Visual feedback update (if admin panel is open or badge exists)
            updateAdminBadge();

            Swal.fire('تم إرسال الطلب', 'سيتواصل معك فريق الإدارة قريباً للتفعيل.', 'success');
        }
    });
}

function updateAdminBadge() {
    // Update the external badge on the settings icon
    try {
        const requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
        const badge = document.getElementById('settingsAdminBadge');
        if (badge) {
            badge.innerText = requests.length;
            badge.style.display = requests.length > 0 ? 'inline-block' : 'none';
        }
    } catch (e) { }
}

// --- Admin Panel Logic ---
function openAdminPanel() {
    Swal.fire({
        title: '🔒 رمز حماية لوحة الإدارة',
        input: 'password',
        inputAttributes: { maxlength: 6, placeholder: '****', autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'دخول لوحة التحكم',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'إلغاء',
        preConfirm: (pin) => {
            if (pin !== '1122' && pin !== '1234') {
                Swal.showValidationMessage('رمز الحماية غير صحيح');
                return false;
            }
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('adminModal').classList.remove('hidden');
            renderAdminData();
        }
    });
}

function renderAdminData() {
    if(window.renderRequests) window.renderRequests();
    const listPending = document.getElementById('adminRequestsList');
    const listActive = document.getElementById('adminSubscribersList');

    let requests = [], businesses = [];
    try {
        requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
        businesses = JSON.parse(localStorage.getItem('business_directory')) || [];
    } catch (e) {
        console.error("Error parsing admin data", e);
        requests = [];
        businesses = [];
    }

    // Filter valid data
    requests = requests.filter(r => r && r.id);
    businesses = businesses.filter(b => b && b.name);

    // Update Stats
    try {
        const stats = {
            total: document.getElementById('totalUsersStat'),
            pending: document.getElementById('pendingReqStat'),
            badge: document.getElementById('pendingBadge')
        };
        if (stats.total) stats.total.innerText = businesses.length;
        if (stats.pending) stats.pending.innerText = requests.length;
        if (stats.badge) stats.badge.innerText = requests.length;
    } catch (e) { }


    // Render Pending
    if (listPending) {
        // Force visibility
        listPending.style.display = 'flex';
        listPending.style.flexDirection = 'column';

        if (requests.length === 0) {
            listPending.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:10px;">لا توجد طلبات جديدة</div>';
        } else {
            // Build HTML string explicitly
            let html = '';
            requests.forEach(r => {
                const name = r.name || 'مكتب هندسي';
                const phone = r.phone || '---';
                const date = r.date || '';

                html += `
                <div style="background:white; padding:12px; border-radius:12px; border-left:4px solid #ef4444; box-shadow:0 1px 3px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="text-align:right;">
                        <h4 style="margin:0; font-size:0.95rem; color:#1e293b;">${name}</h4>
                        <p style="margin:2px 0 0; font-size:0.8rem; color:#64748b;">${phone} <span style="margin:0 5px;">|</span> ${date}</p>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button onclick="approveRequest(${r.id})" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">قبول</button>
                        <button onclick="rejectRequest(${r.id})" style="background:#fee2e2; color:#ef4444; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
            });
            listPending.innerHTML = html;
        }
    }

    // Render Active
    if (listActive) {
        listActive.style.display = 'flex';
        listActive.style.flexDirection = 'column';

        if (businesses.length === 0) {
            listActive.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:10px;">لا يوجد مشتركين جدد بعد</div>';
        } else {
            let html = '';
            businesses.forEach(b => {
                const name = b.name || 'مكتب';
                const planName = b.plan === 'vip' ? 'باقة النخبة VIP' : (b.plan === 'pro' ? 'باقة المحترفين' : (b.plan === 'starter' ? 'الباقة الأساسية' : 'مشترك'));
                html += `
                <div style="background:white; padding:12px; border-radius:12px; border-left:4px solid #10b981; box-shadow:0 1px 3px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="text-align:right;">
                        <h4 style="margin:0; font-size:0.95rem; color:#1e293b;">${name}</h4>
                        <p style="margin:2px 0 0; font-size:0.8rem; color:#64748b;">${b.phone} • ${planName}</p>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:10px; font-size:0.7rem;">نشط</div>
                        <button onclick="removeBusiness(${b.id})" style="background:#fee2e2; color:#ef4444; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;" title="إزالة المشترك"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
            });
            listActive.innerHTML = html;
        }
    }
}


function approveRequest(id) {
    let requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
    let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');

    const reqIndex = requests.findIndex(r => r.id === id);
    if (reqIndex > -1) {
        const req = requests[reqIndex];

        const plansHtml = `
            <select id="swal-assign-plan" class="swal2-input">
                <option value="starter" ${req.plan === 'starter' ? 'selected' : ''}>الباقة الأساسية</option>
                <option value="pro" ${req.plan === 'pro' ? 'selected' : ''}>باقة المحترفين</option>
                <option value="vip" ${req.plan === 'vip' ? 'selected' : ''}>باقة النخبة (VIP)</option>
            </select>
        `;

        Swal.fire({
            title: 'تفعيل اشتراك المكتب',
            html: `اختر الباقة الخاصة بـ <b>${req.name}</b>:` + plansHtml,
            showCancelButton: true,
            confirmButtonText: 'تفعيل الآن',
            cancelButtonText: 'إلغاء',
            preConfirm: () => document.getElementById('swal-assign-plan').value
        }).then(res => {
            if (res.isConfirmed) {
                req.plan = res.value;
                businesses.push(req);
                requests.splice(reqIndex, 1);

                localStorage.setItem('admin_requests', JSON.stringify(requests));
                localStorage.setItem('business_directory', JSON.stringify(businesses));
                if (typeof renderShop === 'function') renderShop();
                if (typeof renderPros === 'function') renderPros();
                if (typeof renderPlans === 'function') renderPlans();
                if (typeof syncWithServer === 'function') syncWithServer();

                renderAdminData();
                updateAdminBadge(); // FIX BADGE BUG
                Swal.fire('تم التفعيل', `تم تفعيل اشتراك ${req.name} في الباقة المختارة`, 'success');
            }
        });
    }
}

function rejectRequest(id) {
    Swal.fire({
        title: 'رفض الطلب',
        text: 'هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444'
    }).then(res => {
        if (res.isConfirmed) {
            let requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
            const reqIndex = requests.findIndex(r => r.id === id);
            if (reqIndex > -1) {
                requests.splice(reqIndex, 1);
                localStorage.setItem('admin_requests', JSON.stringify(requests));
                renderAdminData();
                updateAdminBadge(); // FIX BADGE BUG
                Swal.fire('تم الحذف', 'تم مسح طلب الاشتراك بنجاح', 'success');
            }
        }
    });
}

function removeBusiness(id) {
    Swal.fire({
        title: 'إزالة مشترك',
        text: 'سيتم حذف هذا المشترك نهائياً من قائمة المشتركين الفعالين.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، إزالة',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444'
    }).then(res => {
        if (res.isConfirmed) {
            let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
            const busIndex = businesses.findIndex(b => b.id === id);
            if (busIndex > -1) {
                businesses.splice(busIndex, 1);
                localStorage.setItem('business_directory', JSON.stringify(businesses));
                renderAdminData();
                Swal.fire('تم الإزالة', 'تم إزالة المشترك من المنصة بنجاح.', 'success');
            }
        }
    });
}


/* --- Business Portal Logic --- */

function loginAsBusiness() {
    Swal.fire({
        title: 'دخول أصحاب العمل',
        html: `
            <div style="text-align:right;">
                <label style="display:block; margin-bottom:5px; font-size:0.85rem; font-weight:bold;">رقم الهاتف</label>
                <input type="tel" id="loginPhone" class="swal2-input" style="width:100%; margin:0 0 15px;" placeholder="07xxxxxxxxx" dir="ltr">
                <label style="display:block; margin-bottom:5px; font-size:0.85rem; font-weight:bold;">كلمة المرور (أمان وحماية)</label>
                <input type="password" id="loginPass" class="swal2-input" style="width:100%; margin:0;" placeholder="أدخل كلمة مرورك">
                <div style="font-size:0.75rem; color:#64748b; margin-top:10px; line-height:1.4;">ملاحظة: إذا كنت تملك حساباً قديماً ولم تضع كلمة مرور، اترك الحقل فارغاً، وسيتم سؤالك لوضع كلمة مرور فوراً لحماية صفحتك.</div>
            </div>
        `,
        confirmButtonText: 'دخول وتعديل',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const phone = document.getElementById('loginPhone').value;
            const pass = document.getElementById('loginPass').value;
            if (!phone) {
                Swal.showValidationMessage('يرجى إدخال رقم الهاتف المسجل');
                return false;
            }
            return { phone, pass };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { phone, pass } = result.value;
            let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
            const userIndex = businesses.findIndex(b => b.phone === phone);

            if (userIndex !== -1) {
                const user = businesses[userIndex];

                // Secure Legacy Mode (if the account predates passwords)
                if (!user.password) {
                    if (!pass || pass.length < 4) {
                        Swal.fire('حماية حسابك 🛡️', 'حسابك يحتاج إلى كلمة مرور، يرجى كتابة كلمة مرور جديدة (4 رموز على الأقل) في حقل الدخول لحمايته.', 'info').then(() => loginAsBusiness());
                        return;
                    } else {
                        businesses[userIndex].password = pass;
                        localStorage.setItem('business_directory', JSON.stringify(businesses));
                        Swal.fire({
                            icon: 'success',
                            title: 'تم الحفظ',
                            text: 'تم إنشاء كلمة مرور الحماية لحسابك بنجاح!',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } else if (user.password !== pass) {
                    Swal.fire('مرفوض', 'كلمة المرور غير صحيحة، حاول مجدداً.', 'error');
                    return;
                }

                // Logged in
                renderBusinessDashboard(businesses[userIndex]);
                document.getElementById('businessDashboardModal').classList.remove('hidden');
            } else {
                Swal.fire('خطأ غير متوقع', 'رقم الهاتف غير مسجل بالنظام أو قيد المراجعة الإدارية.', 'error');
            }
        }
    });
}

function renderBusinessDashboard(user) {
    const container = document.getElementById('bizDashContent');
    const categoryName = {
        'eng': 'مكتب هندسي',
        'shop': 'موارد إنشائية',
        'con': 'خبير/تنفيذ',
        'mat': 'مواد بناء'
    }[user.category] || 'صاحب عمل';

    let dashboardHtml = `
        <div style="text-align:center; margin-bottom:20px;">
            <div style="width:80px; height:80px; background:#eff6ff; color:#3b82f6; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; font-size:2rem; overflow:hidden; border:2px solid #e2e8f0; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                ${user.avatar ? `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-user-tie"></i>`}
            </div>
            <h3 style="margin:0; font-size:1.4rem; color:#1e293b;">${user.name}</h3>
            <p style="color:#64748b; margin:5px 0; font-weight:bold;">${categoryName} • ${user.phone}</p>
        </div>
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;">
        
        <div class="glass-card" style="padding:15px; margin-bottom:25px; text-align:right; border-right:4px solid #3b82f6;">
            <h4 style="margin-bottom:15px; color:#1e293b;"><i class="fa-solid fa-palette" style="color:#3b82f6; margin-left:8px;"></i>تخصيص الواجهة والبيانات</h4>
            
            <label style="font-size:0.85rem; color:#64748b; margin-bottom:5px; display:block; font-weight:700;">صورة الغلاف (Cover)</label>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input id="bizCoverInput" class="swal2-input" style="margin:0; flex:1; font-size:0.85rem;" placeholder="رابط صورة أفقية..." value="${user.cover || ''}">
                <input type="file" id="covFile" style="display:none" accept="image/*" onchange="handleImageUpload(this, 'bizCoverInput')">
                <button onclick="document.getElementById('covFile').click()" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:0 15px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-image"></i></button>
            </div>

            <label style="font-size:0.85rem; color:#64748b; margin-bottom:5px; display:block; font-weight:700;">الصورة الشخصية أو الشعار</label>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input id="bizAvatarInput" class="swal2-input" style="margin:0; flex:1; font-size:0.85rem;" placeholder="رابط صورة مربعة..." value="${user.avatar || ''}">
                <input type="file" id="avaFile" style="display:none" accept="image/*" onchange="handleImageUpload(this, 'bizAvatarInput')">
                <button onclick="document.getElementById('avaFile').click()" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:0 15px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-camera"></i></button>
            </div>

            <label style="font-size:0.85rem; color:#64748b; margin-bottom:5px; display:block; font-weight:700;">نبذة عن الخدمات (الرسالة الترحيبية)</label>
            <textarea id="bizDescInput" class="swal2-textarea" style="width:100%; margin:0 0 15px; height:80px; padding:10px; font-size:0.9rem; resize:vertical; border:1px solid #cbd5e1; border-radius:8px;" placeholder="اكتب وصفاً مختصراً لخدماتك ليظهر للزوار...">${user.desc || ''}</textarea>
            
            <button onclick="saveBusinessProfileInfo('${user.phone}')" class="cta-button" style="width:100%; background:linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius:12px; font-weight:800;"><i class="fa-solid fa-floppy-disk" style="margin-left:5px;"></i> تحديث البيانات</button>
            <button onclick="resetBusinessProfileInfo('${user.phone}')" class="cta-button" style="width:100%; background:#f1f5f9; color:#e11d48; border:1px solid #fecdd3; border-radius:12px; font-weight:700; margin-top:10px;"><i class="fa-solid fa-rotate-left" style="margin-left:5px;"></i> استعادة الواجهة الافتراضية</button>
        </div>
    `;

    // Role-Based Content
    if (user.category === 'shop' || user.category === 'mat') {
        dashboardHtml += `
            <h4 style="margin-bottom:15px;">إضافة منتج للسوق</h4>
            <div class="glass-card" style="padding:15px; margin-bottom:20px;">
                <input id="bizProdName" class="swal2-input" style="margin:0 0 10px; width:100%;" placeholder="اسم المنتج (مثلاً: طابوق أحمر)">
                <input id="bizProdPrice" type="number" class="swal2-input" style="margin:0 0 10px; width:100%;" placeholder="السعر (د.ع)">
                
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input id="bizProdImg" class="swal2-input" style="margin:0; flex:1;" placeholder="رابط الصورة أو اختر ملف...">
                    <input type="file" id="prodFile" style="display:none" accept="image/*" onchange="handleImageUpload(this, 'bizProdImg')">
                    <button onclick="document.getElementById('prodFile').click()" style="background:#e2e8f0; border:none; padding:0 15px; border-radius:4px; cursor:pointer;">📸</button>
                </div>

                <button onclick="saveBusinessProduct('${user.phone}', '${user.category}')" class="cta-button" style="width:100%;">نشر المنتج</button>
            </div>
            <h4 style="margin-bottom:10px;">منتجاتي الحالية</h4>
            <div id="myProductsList" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;
        // Load items later
        setTimeout(() => loadMyItems(user.phone, 'products'), 100);

    } else if (user.category === 'eng') {
        dashboardHtml += `
            <h4 style="margin-bottom:15px;">نشر مخطط هندسي</h4>
            <div class="glass-card" style="padding:15px; margin-bottom:20px;">
                <input id="bizPlanTitle" class="swal2-input" style="margin:0 0 10px; width:100%;" placeholder="عنوان المخطط (مثلاً: تصميم مودرن 200م)">
                <input id="bizPlanPrice" type="number" class="swal2-input" style="margin:0 0 10px; width:100%;" placeholder="السعر التقديري للتصميم">
                
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input id="bizPlanImg" class="swal2-input" style="margin:0; flex:1;" placeholder="رابط الصورة أو اختر ملف...">
                    <input type="file" id="planFile" style="display:none" accept="image/*" onchange="handleImageUpload(this, 'bizPlanImg')">
                    <button onclick="document.getElementById('planFile').click()" style="background:#e2e8f0; border:none; padding:0 15px; border-radius:4px; cursor:pointer;">📸</button>
                </div>

                <button onclick="saveBusinessBlueprint('${user.phone}')" class="cta-button" style="width:100%;">نشر المخطط</button>
            </div>
            <h4 style="margin-bottom:10px;">مخططاتي المنشورة</h4>
            <div id="myPlansList" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;
        setTimeout(() => loadMyItems(user.phone, 'plans'), 100);

    } else if (user.category === 'con') {
        dashboardHtml += `
            <h4 style="margin-bottom:15px;">تحديث معرض الأعمال</h4>
            <div class="glass-card" style="padding:15px; margin-bottom:20px;">
                <input id="bizWorkTitle" class="swal2-input" style="margin:0 0 10px; width:100%;" placeholder="عنوان المشروع">
                
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input id="bizWorkImg" class="swal2-input" style="margin:0; flex:1;" placeholder="رابط الصورة أو اختر ملف...">
                    <input type="file" id="workFile" style="display:none" accept="image/*" onchange="handleImageUpload(this, 'bizWorkImg')">
                    <button onclick="document.getElementById('workFile').click()" style="background:#e2e8f0; border:none; padding:0 15px; border-radius:4px; cursor:pointer;">📸</button>
                </div>

                <button onclick="saveBusinessPortfolio('${user.phone}')" class="cta-button" style="width:100%;">إضافة للمعرض</button>
            </div>
            <h4 style="margin-bottom:10px;">أعمالي السابقة</h4>
            <div id="myWorksList" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;
        setTimeout(() => loadMyItems(user.phone, 'works'), 100);
    }
    
    // Add Requests Section for Eng and Con
    if (user.category === 'eng' || user.category === 'con' || user.category === 'shop') {
        dashboardHtml += `
            <h4 style="margin-top:20px; margin-bottom:10px; color:#3b82f6;"><i class="fa-solid fa-bell"></i> الطلبات المتاحة للتنافس</h4>
            <div id="bizRequestsList" style="display:flex; flex-direction:column; gap:10px;"></div>
            
            <h4 style="margin-top:20px; margin-bottom:10px; color:#10b981;"><i class="fa-solid fa-check-double"></i> طلباتي المقبولة</h4>
            <div id="bizMyRequestsList" style="display:flex; flex-direction:column; gap:10px;"></div>
        `;
        setTimeout(() => renderBizRequests(user.phone, user.name), 200);
    }

    container.innerHTML = dashboardHtml;
}

// --- Image Compression Helper ---
window.handleImageUpload = function (input, targetId) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxW = 500; // Resize to max 500px width

            if (width > maxW) {
                height *= maxW / width;
                width = maxW;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Output Base64 Jpeg
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById(targetId).value = dataUrl;
            showToast('تم رفع وضغط الصورة بنجاح 📸');
        }
    }
    reader.readAsDataURL(file);
};

// --- Data Saving Logic ---

function saveBusinessProduct(ownerPhone, category) {
    const name = document.getElementById('bizProdName').value;
    const price = document.getElementById('bizProdPrice').value;
    const img = document.getElementById('bizProdImg').value || 'assets/images/default_product.png';

    if (!name || !price) { Swal.showValidationMessage('الاسم والسعر مطلوبان'); return; }

    const product = { id: Date.now(), owner: ownerPhone, type: category, name, price, img, date: new Date().toLocaleDateString('ar-IQ') };

    let products = JSON.parse(localStorage.getItem('business_products') || '[]');
    products.push(product);
    localStorage.setItem('business_products', JSON.stringify(products));

    Swal.fire('تم النشر', 'تم إضافة المنتج للسوق بنجاح', 'success');
    loadMyItems(ownerPhone, 'products');

    // Refresh Shop View if open
    if (typeof renderShop === 'function') renderShop();
}

function saveBusinessBlueprint(ownerPhone) {
    const title = document.getElementById('bizPlanTitle').value;
    const price = document.getElementById('bizPlanPrice').value;
    const img = document.getElementById('bizPlanImg').value || 'assets/images/default_plan.png';

    if (!title) return;

    const plan = { id: Date.now(), owner: ownerPhone, title, price, img };
    let plans = JSON.parse(localStorage.getItem('business_blueprints') || '[]');
    plans.push(plan);
    localStorage.setItem('business_blueprints', JSON.stringify(plans));

    Swal.fire('تم النشر', 'تم إضافة المخطط للمعرض', 'success');
    loadMyItems(ownerPhone, 'plans');
    // renderPlans(); // If exists
}

function saveBusinessPortfolio(ownerPhone) {
    const title = document.getElementById('bizWorkTitle').value;
    const img = document.getElementById('bizWorkImg').value;

    if (!title || !img) return;

    const work = { id: Date.now(), owner: ownerPhone, title, img };
    let works = JSON.parse(localStorage.getItem('business_portfolio') || '[]');
    works.push(work);
    localStorage.setItem('business_portfolio', JSON.stringify(works));

    Swal.fire('تم الإضافة', 'تم تحديث معرض الأعمال', 'success');
    loadMyItems(ownerPhone, 'works');
    // renderPros(); // If exists
}

function loadMyItems(phone, type) {
    let items = [];
    let listId = '';

    if (type === 'products') {
        items = JSON.parse(localStorage.getItem('business_products') || '[]').filter(i => i.owner === phone);
        listId = 'myProductsList';
    } else if (type === 'plans') {
        items = JSON.parse(localStorage.getItem('business_blueprints') || '[]').filter(i => i.owner === phone);
        listId = 'myPlansList';
    } else if (type === 'works') {
        items = JSON.parse(localStorage.getItem('business_portfolio') || '[]').filter(i => i.owner === phone);
        listId = 'myWorksList';
    }

    const container = document.getElementById(listId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<div style="color:#cbd5e1; text-align:center;">لا توجد عناصر مضافة بعد</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div style="display:flex; align-items:center; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
            <img src="${item.img ? item.img : item.url ? item.url : 'assets/images/placeholder.png'}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; margin-left:10px;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:0.9rem;">${item.name || item.title}</div>
                <div style="font-size:0.8rem; color:#64748b;">${item.price ? formatMoney(item.price) : ''}</div>
            </div>
            <button onclick="deleteBusinessItem(${item.id}, '${type}', '${phone}')" style="color:#ef4444; border:none; background:none;"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

window.deleteBusinessItem = function (id, type, phone) {
    let key = '';
    if (type === 'products') key = 'business_products';
    if (type === 'plans') key = 'business_blueprints';
    if (type === 'works') key = 'business_portfolio';

    let items = JSON.parse(localStorage.getItem(key) || '[]');
    items = items.filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(items));
    loadMyItems(phone, type);

    if (type === 'products' && typeof renderShop === 'function') renderShop();
};

function saveBusinessProfileInfo(phone) {
    const desc = document.getElementById('bizDescInput').value;
    const avatar = document.getElementById('bizAvatarInput').value;
    const cover = document.getElementById('bizCoverInput').value;

    let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
    let user = businesses.find(b => b.phone === phone);
    if (user) {
        user.desc = desc;
        user.avatar = avatar;
        user.cover = cover;
        localStorage.setItem('business_directory', JSON.stringify(businesses));
        Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: 'تم تحديث بيانات ملفك الشخصي بنجاح',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            renderBusinessDashboard(user);
            if (typeof renderPros === 'function') renderPros();
        });
    }
}

function resetBusinessProfileInfo(phone) {
    Swal.fire({
        title: 'تأكيد عملية الاستعادة',
        text: 'بموافقتك، سيتم حذف (صورة الغلاف،صورتك الرمزية أو الشعار، والنبذة) للعودة لشكل النظام الأصلي الأساسي، هل أنت متأكد؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'نعم، قم بالحذف والاستعادة',
        cancelButtonText: 'إلغاء',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
            let userIndex = businesses.findIndex(b => b.phone === phone);
            if (userIndex !== -1) {
                businesses[userIndex].desc = '';
                businesses[userIndex].avatar = '';
                businesses[userIndex].cover = '';
                localStorage.setItem('business_directory', JSON.stringify(businesses));
                Swal.fire({ icon: 'success', title: 'تم بنجاح', text: 'عادت صفحتك الافتراضية بنجاح!', timer: 1500, showConfirmButton: false }).then(() => {
                    renderBusinessDashboard(businesses[userIndex]);
                    if (typeof renderPros === 'function') renderPros();
                });
            }
        }
    });
}

function openBusinessProfile(phone) {
    const businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
    const user = businesses.find(b => b.phone === phone);
    if (!user) return;

    const portfolio = JSON.parse(localStorage.getItem('business_portfolio') || '[]');
    const myWork = portfolio.filter(w => w.owner === phone);

    const products = JSON.parse(localStorage.getItem('business_products') || '[]');
    const myProducts = products.filter(p => p.owner === phone);

    const plans = JSON.parse(localStorage.getItem('business_blueprints') || '[]');
    const myPlans = plans.filter(p => p.owner === phone);

    let galleryHtml = '';

    if (myWork.length > 0) {
        galleryHtml += `<h4 style="text-align:right; margin:15px 15px 10px; font-size:1.1rem; color:#1e293b; font-weight:800;">معرض الأعمال والمشاريع</h4><div style="display:flex; gap:12px; overflow-x:auto; padding:0 15px 15px; -webkit-overflow-scrolling:touch; scroll-snap-type: x mandatory;">` +
            myWork.map(w => `<img src="${w.img}" style="height:140px; min-width:180px; width:180px; border-radius:16px; object-fit:cover; box-shadow:0 4px 10px rgba(0,0,0,0.08); scroll-snap-align: start; flex-shrink:0;">`).join('') + `</div>`;
    }

    if (myProducts.length > 0) {
        galleryHtml += `<h4 style="text-align:right; margin:15px 15px 10px; font-size:1.1rem; color:#1e293b; font-weight:800;">أبرز المنتجات </h4><div style="display:flex; gap:12px; overflow-x:auto; padding:0 15px 15px; -webkit-overflow-scrolling:touch; scroll-snap-type: x mandatory;">` +
            myProducts.map(w => `
                <div style="min-width:140px; border:1px solid #f1f5f9; border-radius:16px; padding:10px; flex-shrink:0; background:white; scroll-snap-align: start; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <img src="${w.img}" style="width:100%; height:90px; object-fit:cover; border-radius:12px;">
                    <div style="font-size:0.9rem; font-weight:700; margin-top:8px; text-align:center; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${w.name}</div>
                    <div style="font-size:0.85rem; color:#10b981; text-align:center; font-weight:800; margin-top:4px;">${formatMoney(w.price)}</div>
                </div>
            `).join('') + `</div>`;
    }

    if (myPlans.length > 0) {
        galleryHtml += `<h4 style="text-align:right; margin:15px 15px 10px; font-size:1.1rem; color:#1e293b; font-weight:800;">مخططات وتصاميم هندسية</h4><div style="display:flex; gap:12px; overflow-x:auto; padding:0 15px 15px; -webkit-overflow-scrolling:touch; scroll-snap-type: x mandatory;">` +
            myPlans.map(w => `
                <div style="min-width:160px; border:1px solid #f1f5f9; border-radius:16px; padding:10px; flex-shrink:0; background:white; scroll-snap-align: start; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <img src="${w.img}" style="width:100%; height:110px; object-fit:cover; border-radius:12px;">
                    <div style="font-size:0.95rem; font-weight:700; margin-top:8px; text-align:center; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${w.title}</div>
                </div>
            `).join('') + `</div>`;
    }

    const avIcon = user.category === 'eng' ? 'fa-compass-drafting' : user.category === 'con' ? 'fa-hard-hat' : 'fa-store';
    const catLabel = user.category === 'eng' ? 'مكتب هندسي وتصميم' : user.category === 'con' ? 'خبير ومقاولات' : 'مورد ومواد بناء';

    Swal.fire({
        html: `
            <!-- Top Cover Photo -->
            <div style="position:relative; background: ${user.cover ? `url('${user.cover}') center/cover` : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}; height: 160px; margin: -20px -20px 0; border-radius: 24px 24px 0 0;">
                
                <!-- Edit Cover Button for Owner -->
                <button onclick="loginAsBusiness()" style="position:absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); color: white; border: none; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; cursor: pointer; z-index: 10;">
                    <i class="fa-solid fa-gear"></i> إدارة الصفحة
                </button>

                <!-- Trust Badge -->
                <div style="position:absolute; top: 15px; left: 15px; background: rgba(255,255,255,0.25); backdrop-filter: blur(8px); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border:1px solid rgba(255,255,255,0.3);">
                    <i class="fa-solid fa-check-circle"></i> حساب موثق
                </div>
                
                <!-- Center Avatar -->
                <div style="position:absolute; bottom: -45px; right: 25px; width: 90px; height: 90px; background: white; border-radius: 50%; display:flex; justify-content:center; align-items:center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 4px solid white; overflow:hidden;">
                    ${user.avatar ? `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid ${avIcon}" style="font-size: 2.2rem; color: #10b981;"></i>`}
                </div>
            </div>

            <!-- Profile Info Body -->
            <div style="text-align: right; padding: 60px 15px 15px; position:relative;">
                <h2 style="margin:0; font-size:1.6rem; color: #1e293b; font-weight: 800;">${user.name}</h2>
                <div style="color: #64748b; font-size: 0.95rem; margin-top:5px; display:flex; align-items:center; gap:6px; justify-content:flex-end;">
                    <span>${catLabel}</span> <i class="fa-solid fa-briefcase"></i>
                </div>

                <!-- Professional Quote/Description -->
                <div style="margin-top: 25px; padding: 0 15px 0 5px; border-right: 4px solid #10b981; text-align:right;">
                    <i class="fa-solid fa-quote-right" style="color:#cbd5e1; font-size:1.2rem; margin-bottom:8px; display:block;"></i>
                    <div style="color: #475569; font-size: 1rem; line-height: 1.8; font-weight: 500;">
                        ${user.desc ? user.desc.replace(/\\n/g, '<br>') : 'نسعد بتقديم أفضل الخدمات لعملائنا الكرام بأسعار تنافسية وجودة متميزة في العمل وتلبية كافة متطلباتكم.'}
                    </div>
                </div>
            </div>

            <!-- Full Width Gallery Container -->
            <div style="margin-top:10px; background:#f8fafc; padding-top:15px; margin-left:-20px; margin-right:-20px;">
                ${galleryHtml}
            </div>

            <!-- Floating Bottom Action Buttons -->
            <div style="display:flex; gap: 12px; margin-top: 25px; padding: 0 10px;">
                <button onclick="openLink('wa')" style="flex:1; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 14px; border-radius: 16px; font-weight: 800; font-size: 1.1rem; display:flex; align-items:center; justify-content:center; gap: 8px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.35); cursor:pointer;">
                    <i class="fa-brands fa-whatsapp" style="font-size: 1.3rem;"></i> واتساب
                </button>
                <button onclick="openLink('call')" style="flex:1; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 14px; border-radius: 16px; font-weight: 800; font-size: 1.1rem; display:flex; align-items:center; justify-content:center; gap: 8px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35); cursor:pointer;">
                    <i class="fa-solid fa-phone" style="font-size: 1.2rem;"></i> اتصال
                </button>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '95%',
        padding: '20px 20px 30px',
        didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.borderRadius = '24px';
            popup.style.padding = '0';
            popup.style.overflow = 'hidden';

            const closeBtn = Swal.getCloseButton();
            if (closeBtn) {
                closeBtn.style.color = '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                closeBtn.style.borderRadius = '50%';
                closeBtn.style.width = '32px';
                closeBtn.style.height = '32px';
                closeBtn.style.display = 'flex';
                closeBtn.style.alignItems = 'center';
                closeBtn.style.justifyContent = 'center';
                closeBtn.style.border = 'none';
                closeBtn.style.top = '15px';
                closeBtn.style.right = '15px';
                closeBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                closeBtn.style.zIndex = '10';
            }
        }
    });
}

// ==== Market Intelligence & Stock Exchange AI ====
function refreshMarketData() {
    const spinner = document.getElementById('sync-spinner');
    if (spinner) spinner.classList.add('fa-spin');

    const adviceText = document.getElementById('ai-advice-text');
    if (adviceText) {
        adviceText.innerHTML = 'جاري الاتصال بقواعد بيانات البورصة المركزية لسحب الأسعار اللحظية... <i class="fa-solid fa-spinner fa-spin" style="margin-right:5px; color:#4338ca;"></i>';
    }

    // Simulate Network Request
    setTimeout(() => {
        if (spinner) spinner.classList.remove('fa-spin');

        // Randomize mock USD Rate
        const usdRates = [1490, 1500, 1515, 1525, 1530, 1545];
        const currentUsd = usdRates[Math.floor(Math.random() * usdRates.length)];

        const isUp = Math.random() > 0.5;

        const rateEl = document.getElementById('live-usd-rate');
        if (rateEl) {
            rateEl.style.opacity = '0';
            setTimeout(() => {
                rateEl.innerText = currentUsd.toLocaleString() + ' IQD';
                rateEl.style.opacity = '1';

                // Colors and Trends
                if (isUp) {
                    document.getElementById('usd-trend-icon').innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i>';
                    document.getElementById('usd-trend-icon').style.color = '#ef4444';
                    document.getElementById('usd-status-text').innerText = 'ارتفاع في الطلب';
                    document.getElementById('usd-status-text').style.color = '#ef4444';

                    document.getElementById('index-trend-icon').innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i>';
                    document.getElementById('index-trend-icon').style.color = '#ef4444';
                    document.getElementById('market-index').innerText = 'صعود %' + (Math.random() * 2).toFixed(1);
                    document.getElementById('market-rec-text').innerText = 'ارتفاع تكاليف الاستيراد';
                    document.getElementById('market-rec-text').style.color = '#ef4444';

                    document.getElementById('ai-advice-text').innerHTML = `<b>توصية النظام:</b> نتيجة لارتفاع سعر الصرف الاستثماري إلى <b>${currentUsd} دينار</b>، ننصح بتأجيل شراء المواد المستوردة (الحديد والصحيات) والتركيز على إكمال الهيكل بالمواد المحلية (الطابوق، الأسمنت) حالياً لتجنب الخسارة.`;
                } else {
                    document.getElementById('usd-trend-icon').innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i>';
                    document.getElementById('usd-trend-icon').style.color = '#10b981';
                    document.getElementById('usd-status-text').innerText = 'استقرار ونزول';
                    document.getElementById('usd-status-text').style.color = '#10b981';

                    document.getElementById('index-trend-icon').innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i>';
                    document.getElementById('index-trend-icon').style.color = '#10b981';
                    document.getElementById('market-index').innerText = 'نزول %' + (Math.random() * 2).toFixed(1);
                    document.getElementById('market-rec-text').innerText = 'فرصة ممتازة للشراء';
                    document.getElementById('market-rec-text').style.color = '#10b981';

                    document.getElementById('ai-advice-text').innerHTML = `<b>توصية النظام:</b> بناءً على استقرار البورصة ونزول المؤشر، يعتبر هذا الأسبوع <b style="color:#10b981;">فرصة استراتيجية ذهبية</b> لشراء وتخزين حديد التسليح والمواد الكهربائية المستوردة لمشروعك.`;
                }
            }, 300);
        }

        // Update Stock Marquee
        const marquee = document.getElementById('stock-marquee');
        if (marquee) {
            marquee.innerHTML = `طن حديد كوردستان: $${(530 + Math.random() * 20).toFixed(0)} ${isUp ? '▲' : '▼'} | طن أسمنت ماس: ${(100 + Math.random() * 10).toFixed(0)} ألف ${isUp ? '▲' : '▼'} | 1000 طابوقة: ${(160 + Math.random() * 15).toFixed(0)} ألف ${!isUp ? '▲' : '▼'} | رمل و حصو: مستقر ◼ | كيبل 4 ملم: 35 ألف ${isUp ? '▲' : '▼'}`;
        }
    }, 1500);
}

// Auto sync on load if present
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('market-index')) {
        setTimeout(refreshMarketData, 1000);
    }
});


// --- Service Requests & Bidding Logic ---

function renderBizRequests(bizPhone, bizName) {
    const listAvailable = document.getElementById('bizRequestsList');
    const listMine = document.getElementById('bizMyRequestsList');
    if (!listAvailable || !listMine) return;

    const reqListRaw = localStorage.getItem('app_requests');
    const requests = reqListRaw ? JSON.parse(reqListRaw) : [];

    // Filter available (pending)
    const available = requests.filter(r => r.status === 'pending');
    // Filter mine (accepted by me)
    const mine = requests.filter(r => r.acceptedBy === bizPhone);

    listAvailable.innerHTML = available.length === 0 ? '<div style="padding:10px; text-align:center; color:#64748b; font-size:0.9rem;">لا توجد طلبات متاحة حالياً</div>' : available.map(r => `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; text-align:right;">
            <h5 style="margin:0 0 5px; color:#1e293b;">طلب من: ${r.customerName}</h5>
            <p style="margin:0 0 10px; font-size:0.85rem; color:#64748b;">الخدمة: ${r.serviceId} | التفاصيل: ${r.notes || 'لا يوجد'}</p>
            <p style="margin:0 0 10px; font-size:0.75rem; color:#94a3b8;">وقت الطلب: ${new Date(r.createdAt).toLocaleString()}</p>
            <button onclick="acceptServiceRequest('${r.id}', '${bizPhone}', '${bizName}')" class="cta-button" style="width:100%; font-size:0.9rem; padding:8px;"><i class="fa-solid fa-handshake"></i> قبول الطلب</button>
        </div>
    `).join('');

    listMine.innerHTML = mine.length === 0 ? '<div style="padding:10px; text-align:center; color:#64748b; font-size:0.9rem;">لم تقبل أي طلبات بعد</div>' : mine.map(r => `
        <div style="background:#fff; border:1px solid #10b981; border-radius:8px; padding:15px; text-align:right;">
            <h5 style="margin:0 0 5px; color:#10b981;"><i class="fa-solid fa-check-circle"></i> طلب مقبول</h5>
            <p style="margin:0 0 5px; font-size:0.9rem; font-weight:bold;">اسم الزبون: ${r.customerName}</p>
            <p style="margin:0 0 5px; font-size:1.1rem; font-weight:bold; color:#3b82f6;"><a href="tel:${r.customerPhone}" style="text-decoration:none; color:inherit;"><i class="fa-solid fa-phone"></i> ${r.customerPhone}</a></p>
            <p style="margin:0 0 10px; font-size:0.85rem; color:#64748b;">التفاصيل: ${r.notes || 'لا يوجد'}</p>
            ${r.rating ? `<p style="margin:0; font-size:0.9rem; color:#f59e0b;"><i class="fa-solid fa-star"></i> التقييم: ${r.rating} نجوم</p>` : `<p style="margin:0; font-size:0.8rem; color:#94a3b8;">في انتظار التقييم من الجمهور...</p>`}
        </div>
    `).join('');
}

function acceptServiceRequest(reqId, bizPhone, bizName) {
    const reqListRaw = localStorage.getItem('app_requests');
    let requests = reqListRaw ? JSON.parse(reqListRaw) : [];

    const idx = requests.findIndex(r => r.id === reqId);
    if (idx > -1) {
        if (requests[idx].status !== 'pending') {
            Swal.fire('عذراً', 'تم قبول هذا الطلب من قبل مكتب آخر!', 'error');
            return;
        }
        requests[idx].status = 'accepted';
        requests[idx].acceptedBy = bizPhone;
        requests[idx].acceptedByName = bizName;
        requests[idx].acceptedAt = Date.now();

        if (window.saveRequestsToDb) {
            window.saveRequestsToDb(requests);
        } else {
            localStorage.setItem('app_requests', JSON.stringify(requests));
        }

        Swal.fire('تم القبول بنجاح', 'يمكنك الآن رؤية رقم هاتف الزبون للتواصل معه.', 'success').then(() => {
            renderBizRequests(bizPhone, bizName);
        });
    }
}


// --- Admin Dashboard Additions ---
function renderAdminRequests() {
    const list = document.getElementById('adminServiceRequestsList');
    if (!list) return;

    const reqListRaw = localStorage.getItem('app_requests');
    const requests = reqListRaw ? JSON.parse(reqListRaw) : [];

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('pendingSrvBadge');
    if (badge) badge.innerText = pendingCount;

    list.innerHTML = requests.length === 0 ? '<div style="text-align:center; color:#94a3b8; padding:20px;">لا توجد طلبات</div>' : requests.map(r => {
        let statusHtml = '';
        let timeDiff = '';
        if (r.status === 'pending') {
            statusHtml = '<span style="color:#f59e0b; font-weight:bold;">قيد الانتظار</span>';
        } else if (r.status === 'accepted') {
            statusHtml = `<span style="color:#10b981; font-weight:bold;">تم القبول بواسطة: ${r.acceptedByName || r.acceptedBy}</span>`;
            if (r.acceptedAt && r.createdAt) {
                const diffMins = Math.round((r.acceptedAt - r.createdAt) / 60000);
                timeDiff = `<br><span style="font-size:0.8rem; color:#64748b;">زمن الاستجابة: ${diffMins} دقيقة</span>`;
            }
        }
        
        const ratingHtml = (r.status === 'accepted' && !r.rating) ? 
            `<button onclick="rateServiceRequest('${r.id}')" style="margin-top:10px; background:#f59e0b; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-star"></i> تقييم المكتب</button>` 
            : (r.rating ? `<div style="margin-top:10px; color:#f59e0b;"><i class="fa-solid fa-star"></i> التقييم: ${r.rating} نجوم</div>` : '');

        return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; text-align:right;">
            <h5 style="margin:0 0 5px; color:#1e293b;">طلب من: ${r.customerName} (${r.customerPhone})</h5>
            <p style="margin:0 0 5px; font-size:0.85rem; color:#64748b;">الخدمة: ${r.serviceId} | التفاصيل: ${r.notes || 'لا يوجد'}</p>
            <p style="margin:0 0 5px; font-size:0.85rem;">الحالة: ${statusHtml} ${timeDiff}</p>
            ${ratingHtml}
        </div>
        `;
    }).join('');
}

function rateServiceRequest(reqId) {
    Swal.fire({
        title: 'تقييم المكتب (من الجمهور)',
        input: 'select',
        inputOptions: { '1': '1 نجمة', '2': 'نجمتان', '3': '3 نجوم', '4': '4 نجوم', '5': '5 نجوم' },
        inputPlaceholder: 'اختر التقييم',
        showCancelButton: true
    }).then(result => {
        if (result.isConfirmed) {
            const reqListRaw = localStorage.getItem('app_requests');
            let requests = reqListRaw ? JSON.parse(reqListRaw) : [];
            const req = requests.find(r => r.id === reqId);
            if (req) {
                req.rating = parseInt(result.value);
                if (window.saveRequestsToDb) window.saveRequestsToDb(requests);
                else localStorage.setItem('app_requests', JSON.stringify(requests));
                
                // Add rating to business profile
                const bizRaw = localStorage.getItem('business_directory');
                if (bizRaw) {
                    let businesses = JSON.parse(bizRaw);
                    const biz = businesses.find(b => b.phone === req.acceptedBy);
                    if (biz) {
                        biz.ratingCount = (biz.ratingCount || 0) + 1;
                        biz.ratingTotal = (biz.ratingTotal || 0) + req.rating;
                        biz.rating = (biz.ratingTotal / biz.ratingCount).toFixed(1);
                        if (window.saveBusinessToDb) window.saveBusinessToDb(businesses);
                        else localStorage.setItem('business_directory', JSON.stringify(businesses));
                    }
                }
                
                renderAdminRequests();
                Swal.fire('تم التقييم', '', 'success');
            }
        }
    });
}

window.renderRequests = renderAdminRequests;

// Inject Admin Settings
document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = document.querySelector('#adminDashboardModal .sheet-content');
    if (adminPanel) {
        const settingsRaw = localStorage.getItem('app_settings');
        const settings = settingsRaw ? JSON.parse(settingsRaw) : { feeEnabled: false, feeAmount: 5000 };
        
        const settingsHtml = `
            <h4 style="margin-top:20px; margin-bottom:15px; color:#1e1b4b;"><i class="fa-solid fa-cog"></i> إعدادات رسوم الطلبات</h4>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; display:flex; flex-direction:column; gap:10px; margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-weight:bold;">تفعيل الرسوم:</label>
                    <input type="checkbox" id="adminFeeToggle" ${settings.feeEnabled ? 'checked' : ''} onchange="updateAdminSettings()" style="width:20px; height:20px;">
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-weight:bold;">مبلغ الرسوم (دينار):</label>
                    <input type="number" id="adminFeeAmount" value="${settings.feeAmount || 5000}" onchange="updateAdminSettings()" style="padding:5px; border-radius:5px; border:1px solid #ccc; width:100px;">
                </div>
            </div>
        `;
        
        const firstHeader = adminPanel.querySelector('h4');
        if (firstHeader) {
            firstHeader.insertAdjacentHTML('beforebegin', settingsHtml);
        }
    }
});

window.updateAdminSettings = function() {
    const enabled = document.getElementById('adminFeeToggle').checked;
    const amount = document.getElementById('adminFeeAmount').value;
    const settings = { feeEnabled: enabled, feeAmount: parseInt(amount) || 0 };
    if (window.saveSettingsToDb) {
        window.saveSettingsToDb(settings);
    } else {
        localStorage.setItem('app_settings', JSON.stringify(settings));
    }
};

window.onSettingsUpdated = function(newSettings) {
    const toggle = document.getElementById('adminFeeToggle');
    const amt = document.getElementById('adminFeeAmount');
    if (toggle) toggle.checked = newSettings.feeEnabled;
    if (amt) amt.value = newSettings.feeAmount;
};

// --- Customer Requests Tracking ---
function openCustomerRequests() {
    const modal = document.getElementById('customerRequestsModal');
    if (modal) {
        modal.classList.remove('hidden');
        const savedPhone = localStorage.getItem('my_last_phone') || '';
        document.getElementById('myTrackPhone').value = savedPhone;
        if (savedPhone) {
            checkCustomerRequests(savedPhone);
        } else {
            document.getElementById('customerRequestsResults').innerHTML = '';
        }
    }
}

function checkCustomerRequests(forcePhone = null) {
    const phoneInput = forcePhone || document.getElementById('myTrackPhone').value.trim();
    if (!phoneInput) {
        Swal.fire('تنبيه', 'يرجى إدخال رقم الهاتف أولاً', 'warning');
        return;
    }
    
    localStorage.setItem('my_last_phone', phoneInput);
    
    const reqListRaw = localStorage.getItem('app_requests');
    const requests = reqListRaw ? JSON.parse(reqListRaw) : [];
    
    const myReqs = requests.filter(r => r.customerPhone === phoneInput);
    const container = document.getElementById('customerRequestsResults');
    
    if (myReqs.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b; background:#f8fafc; border-radius:10px;">لا توجد طلبات مسجلة بهذا الرقم.</div>';
        return;
    }
    
    container.innerHTML = myReqs.map(r => {
        let statusBadge = '';
        let answerDetails = '';
        
        if (r.status === 'pending') {
            statusBadge = '<span style="color:#f59e0b; font-weight:bold; background:#fef3c7; padding:5px 10px; border-radius:8px;"><i class="fa-solid fa-hourglass-half"></i> طلبات متوقفة (قيد الانتظار)</span>';
        } else if (r.status === 'accepted') {
            statusBadge = '<span style="color:#10b981; font-weight:bold; background:#d1fae5; padding:5px 10px; border-radius:8px;"><i class="fa-solid fa-check-double"></i> طلبات مُجابة</span>';
            answerDetails = `
            <div style="margin-top:15px; background:#f0fdf4; border:1px solid #86efac; padding:12px; border-radius:8px;">
                <p style="margin:0 0 5px; font-weight:bold; color:#166534;">تفاصيل الاستجابة:</p>
                <p style="margin:0 0 5px; font-size:0.9rem; color:#15803d;">اسم المكتب: ${r.acceptedByName || r.acceptedBy}</p>
                <a href="tel:${r.acceptedBy}" class="cta-button" style="display:block; text-align:center; text-decoration:none; background:#22c55e; color:white; padding:8px; border-radius:8px; margin-top:10px;"><i class="fa-solid fa-phone-flip"></i> اتصال بالمكتب</a>
            </div>`;
        }
        
        return `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05); text-align:right; margin-bottom:15px; border-right: 4px solid ${r.status === 'pending' ? '#f59e0b' : '#10b981'};">
            <div style="margin-bottom:15px;">${statusBadge}</div>
            <h4 style="margin:0 0 8px; font-size:1.1rem; color:#1e293b;"><i class="fa-solid fa-user"></i> الاسم الكامل: ${r.customerName}</h4>
            <p style="margin:0 0 8px; font-size:1rem; color:#334155;"><i class="fa-solid fa-mobile-screen"></i> رقم الهاتف: ${r.customerPhone}</p>
            <p style="margin:0 0 8px; font-size:1rem; color:#3b82f6;"><i class="fa-solid fa-tag"></i> نوع الطلب: ${r.serviceId}</p>
            ${r.notes ? '<p style="margin:0 0 10px; font-size:0.9rem; color:#64748b;"><i class="fa-solid fa-comment-dots"></i> التفاصيل: ' + r.notes + '</p>' : ''}
            <p style="margin:0; font-size:0.8rem; color:#94a3b8;"><i class="fa-regular fa-clock"></i> وقت الطلب: ${new Date(r.createdAt).toLocaleString()}</p>
            ${answerDetails}
        </div>
        `;
    }).join('');
}

window.openAdminStats = function() {
    const modal = document.getElementById('statsModal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const reqListRaw = localStorage.getItem('app_requests');
    const requests = reqListRaw ? JSON.parse(reqListRaw) : [];
    
    const settingsRaw = localStorage.getItem('app_settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : { feeEnabled: false, feeAmount: 5000 };
    const fee = settings.feeAmount || 0;

    const businessesRaw = localStorage.getItem('business_directory');
    const businesses = businessesRaw ? JSON.parse(businessesRaw) : [];

    const acceptedReqs = requests.filter(r => r.status === 'accepted').length;
    const pendingReqs = requests.filter(r => r.status === 'pending').length;
    const totalRevenue = acceptedReqs * fee;

    const engOffices = businesses.filter(b => b.category === 'eng').length;
    const contractors = businesses.filter(b => b.category === 'con').length;
    const materials = businesses.filter(b => b.category === 'mat').length;

    document.getElementById('statTotalRevenue').innerText = totalRevenue.toLocaleString() + ' IQD';
    document.getElementById('statAcceptedReqs').innerText = acceptedReqs;
    document.getElementById('statPendingReqs').innerText = pendingReqs;
    document.getElementById('statEngOffices').innerText = engOffices;
    document.getElementById('statContractors').innerText = contractors;
    document.getElementById('statMaterials').innerText = materials;
};


//     Hook Registration to Payment Flow                          
(function() {
    const origJoin = window.openCombinedRegistration;
    if (typeof origJoin !== 'function') return;
    window.openCombinedRegistration = function(categoryOverride) {
        if (!window.isPaymentEnabled || !window.isPaymentEnabled()) {
            return origJoin(categoryOverride);
        }
        // First show registration form via original, then payment
        // We hook after admin_request is saved to trigger payment
        origJoin(categoryOverride);
    };
})();

window.viewBlueprintImage = function(src) {
    if(!window.Swal) return;
    Swal.fire({
        imageUrl: src,
        imageAlt: 'Blueprint',
        showConfirmButton: false,
        showCloseButton: true,
        width: '95%',
        padding: '1em',
        background: '#fff'
    });
};

// ============================================
// Tabooga Network Sync - Multi-user Real-time
// ============================================
(function initNetworkSync() {
    var SERVER = 'https://7e6f4616e8185e.lhr.life';
    var SYNC_KEYS = [
        'registeredUsers','public_requests','app_requests','admin_requests',
        'business_directory','tabooqa_custom_portfolios','tabooqa_custom_covers',
        'tabooqa_custom_products','tabooqa_free_blueprints','tabooqa_custom_pro_services',
        'tabooqa_custom_pro_desc','tabooqa_custom_pro_cvs','tabooqa_custom_blueprints',
        'tabooqa_custom_requests','dynamic_ads','plan_prices',
        'business_products','business_blueprints','business_portfolio','payment_settings'
    ];

    function showBadge(online) {
        try {
            var badge = document.getElementById('_netBadge');
            if (!badge) {
                badge = document.createElement('div');
                badge.id = '_netBadge';
                badge.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;padding:3px 10px;border-radius:20px;font-size:0.65rem;font-weight:bold;opacity:0;transition:opacity 0.5s;pointer-events:none;';
                document.body.appendChild(badge);
            }
            badge.style.background = online ? '#10b981' : '#ef4444';
            badge.style.color = 'white';
            badge.textContent = online ? '🟢 شبكي' : '🔴 محلي';
            badge.style.opacity = '1';
            setTimeout(function() { if(badge) badge.style.opacity = '0'; }, 4000);
        } catch(e) {}
    }

    var _origSet = localStorage.setItem.bind(localStorage);

    function pushKey(key, value) {
        try {
            fetch(SERVER + '/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key, value: value }),
                mode: 'cors'
            }).catch(function(){});
        } catch(e) {}
    }

    function fetchAndApply() {
        return fetch(SERVER + '/api/state', { cache: 'no-store', mode: 'cors' })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var changed = false;
                SYNC_KEYS.forEach(function(k) {
                    if (data[k] !== undefined) {
                        var remote = JSON.stringify(data[k]);
                        var local = localStorage.getItem(k);
                        if (local !== remote) { _origSet(k, remote); changed = true; }
                    }
                });
                return changed;
            })
            .catch(function() { return false; });
    }

    localStorage.setItem = function(key, value) {
        _origSet(key, value);
        if (SYNC_KEYS.indexOf(key) !== -1) {
            try { pushKey(key, JSON.parse(value)); } catch(e) {}
        }
    };

    window.addEventListener('load', function() {
        setTimeout(function() {
            fetch(SERVER + '/api/ping', { cache: 'no-store', mode: 'cors' })
                .then(function(r) { if(r.ok) showBadge(true); })
                .catch(function() { showBadge(false); });

            fetchAndApply();

            SYNC_KEYS.forEach(function(k) {
                var val = localStorage.getItem(k);
                if (val) { try { pushKey(k, JSON.parse(val)); } catch(e) {} }
            });

            setInterval(function() { fetchAndApply(); }, 5000);
        }, 2000);
    });

    window.taboogaSync = { fetchAndApply: fetchAndApply };
})();
