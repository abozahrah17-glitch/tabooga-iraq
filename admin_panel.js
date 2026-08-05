/**
 * admin_panel.js
 * نظام لوحة الإدارة المحسّن - يدعم تمييز الأدمن والمستخدمين
 * يُحمَّل بعد script.js ويستبدل الدوال القديمة
 */

// ======================================================
// نظام الأدمن - كلمة المرور والتمييز
// ======================================================
let ADMIN_PIN = localStorage.getItem('tabooga_admin_pin') || '1234';
const ADMIN_KEY = 'tabooga_admin_session';

window.isAdminLoggedIn = function() {
    return sessionStorage.getItem(ADMIN_KEY) === 'true';
};

window.loginAdmin = function() {
    Swal.fire({
        title: '🔐 دخول الأدمن',
        html: `
            <div style="text-align:right; padding:10px 0;">
                <p style="color:#64748b; margin-bottom:15px;">أدخل كلمة مرور الإدارة للوصول إلى لوحة التحكم</p>
                <input type="password" id="adminPinInput" class="swal2-input" 
                       placeholder="كلمة المرور" 
                       style="text-align:center; letter-spacing:4px; font-size:1.2rem; width:100%;">
            </div>
        `,
        confirmButtonText: 'دخول',
        confirmButtonColor: '#4f46e5',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const pin = document.getElementById('adminPinInput').value;
            if (pin !== ADMIN_PIN) {
                Swal.showValidationMessage('كلمة المرور غير صحيحة');
                return false;
            }
            return pin;
        }
    }).then(result => {
        if (result.isConfirmed) {
            sessionStorage.setItem(ADMIN_KEY, 'true');
            Swal.fire({
                icon: 'success',
                title: 'مرحباً بك في لوحة الإدارة',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.openAdminPanel();
            });
        }
    });
};

window.logoutAdmin = function() {
    sessionStorage.removeItem(ADMIN_KEY);
    Swal.fire({ icon: 'info', title: 'تم تسجيل الخروج', timer: 1500, showConfirmButton: false });
};

// ======================================================
// استبدال openAdminPanel - مع حماية بكلمة مرور
// ======================================================
window.openAdminPanel = function() {
    if (!window.isAdminLoggedIn()) {
        window.loginAdmin();
        return;
    }
    
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.transform = 'translateY(0)';
    }
    
    window.renderAdminData();
    
    // تحديث تلقائي كل 5 ثوان
    if (window._adminRefreshTimer) clearInterval(window._adminRefreshTimer);
    window._adminRefreshTimer = setInterval(() => {
        if (!document.getElementById('adminModal')?.classList.contains('hidden')) {
            window.renderAdminData();
        } else {
            clearInterval(window._adminRefreshTimer);
        }
    }, 5000);
};

// ======================================================
// استبدال renderAdminData - مع جلب البيانات من Firebase
// ======================================================
window.renderAdminData = async function() {
    const listPending = document.getElementById('adminRequestsList');
    const listActive = document.getElementById('adminSubscribersList');
    
    // جلب البيانات من Firebase أولاً ثم من localStorage
    let requests = [], businesses = [];
    
    try {
        // جلب الطلبات من Firebase
        if (window.fbGetDocs) {
            const fbRequests = await window.fbGetDocs('requests');
            if (fbRequests && fbRequests.length > 0) {
                requests = fbRequests;
                // تحديث localStorage
                localStorage.setItem('admin_requests', JSON.stringify(requests));
            } else {
                requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
            }
            
            const fbBiz = await window.fbGetDocs('businesses');
            if (fbBiz && fbBiz.length > 0) {
                businesses = fbBiz;
                localStorage.setItem('business_directory', JSON.stringify(businesses));
            } else {
                businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
            }
        } else {
            requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
            businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
        }
    } catch (e) {
        console.error('Error fetching admin data:', e);
        requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
        businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
    }
    
    requests = requests.filter(r => r && r.id);
    businesses = businesses.filter(b => b && b.name);
    
    // تحديث الإحصائيات
    const totalEl = document.getElementById('totalUsersStat');
    const pendingEl = document.getElementById('pendingReqStat');
    const badge = document.getElementById('pendingBadge');
    const settingsBadge = document.getElementById('settingsAdminBadge');
    
    if (totalEl) totalEl.innerText = businesses.length;
    if (pendingEl) pendingEl.innerText = requests.length;
    if (badge) {
        badge.innerText = requests.length;
        badge.style.display = requests.length > 0 ? 'inline-block' : 'none';
    }
    if (settingsBadge) {
        settingsBadge.innerText = requests.length;
        settingsBadge.style.display = requests.length > 0 ? 'inline-block' : 'none';
    }
    
    // عرض الطلبات المعلّقة
    if (listPending) {
        listPending.style.display = 'flex';
        listPending.style.flexDirection = 'column';
        
        if (requests.length === 0) {
            listPending.innerHTML = `
                <div style="text-align:center; color:#94a3b8; padding:30px;">
                    <i class="fa-solid fa-inbox" style="font-size:2rem; margin-bottom:10px; display:block;"></i>
                    لا توجد طلبات معلقة حالياً
                </div>`;
        } else {
            const catNames = { eng: 'مكتب هندسي', con: 'مقاول', mat: 'مورد مواد', shop: 'محل تجاري' };
            const planNames = { starter: 'ستارتر', pro: 'برو احترافي', vip: 'VIP ذهبي', '': 'غير محدد' };
            
            listPending.innerHTML = requests.map(r => {
                const catName = catNames[r.category || r.type] || r.category || 'غير محدد';
                const planName = planNames[r.plan] || r.plan || '';
                return `
                <div style="background:white; padding:15px; border-radius:14px; border-right:4px solid #ef4444; 
                     box-shadow:0 2px 8px rgba(0,0,0,0.08); margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div style="text-align:right; flex:1;">
                            <h4 style="margin:0 0 4px; font-size:1rem; color:#1e293b;">${r.name || 'بدون اسم'}</h4>
                            <p style="margin:0; font-size:0.8rem; color:#64748b;">
                                📞 ${r.phone || '---'} &nbsp;|&nbsp; 🏷️ ${catName}
                                ${planName ? `&nbsp;|&nbsp; ⭐ ${planName}` : ''}
                            </p>
                            <p style="margin:4px 0 0; font-size:0.75rem; color:#94a3b8;">📅 ${r.date || ''}</p>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.approveRequest('${r.id}')" 
                                style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; 
                                       padding:10px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:0.9rem;">
                            ✅ موافقة وقبول
                        </button>
                        <button onclick="window.rejectRequest('${r.id}')" 
                                style="background:#fee2e2; color:#ef4444; border:1px solid #fca5a5; 
                                       padding:10px 15px; border-radius:10px; cursor:pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    // عرض الأعضاء النشطين
    if (listActive) {
        listActive.style.display = 'flex';
        listActive.style.flexDirection = 'column';
        
        if (businesses.length === 0) {
            listActive.innerHTML = `
                <div style="text-align:center; color:#94a3b8; padding:30px;">
                    <i class="fa-solid fa-users" style="font-size:2rem; margin-bottom:10px; display:block;"></i>
                    لا يوجد أعضاء نشطون بعد
                </div>`;
        } else {
            const planColors = { starter: '#6b7280', pro: '#3b82f6', vip: '#f59e0b' };
            const planNames = { starter: 'ستارتر', pro: 'برو احترافي', vip: 'VIP ذهبي' };
            
            listActive.innerHTML = businesses.map(b => {
                const planColor = planColors[b.plan] || '#6b7280';
                const planName = planNames[b.plan] || b.plan || 'غير محدد';
                return `
                <div style="background:white; padding:15px; border-radius:14px; border-right:4px solid #10b981; 
                     box-shadow:0 2px 8px rgba(0,0,0,0.08); margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="text-align:right; flex:1;">
                            <h4 style="margin:0 0 4px; font-size:1rem; color:#1e293b;">${b.name || 'بدون اسم'}</h4>
                            <p style="margin:0; font-size:0.8rem; color:#64748b;">📞 ${b.phone || '---'}</p>
                            <span style="display:inline-block; margin-top:5px; background:${planColor}20; color:${planColor}; 
                                         padding:2px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold; 
                                         border:1px solid ${planColor}40;">
                                ${planName}
                            </span>
                        </div>
                        <button onclick="window.removeBusinessMember('${b.id || b.phone}')" 
                                style="background:#fee2e2; color:#ef4444; border:none; padding:8px; 
                                       border-radius:8px; cursor:pointer; margin-right:10px;">
                            <i class="fa-solid fa-user-xmark"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
    }
};

// ======================================================
// استبدال approveRequest
// ======================================================
window.approveRequest = function(id) {
    let requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
    let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
    
    // البحث بأنواع مختلفة للـ ID
    const reqIndex = requests.findIndex(r => String(r.id) === String(id));
    
    if (reqIndex === -1) {
        Swal.fire('خطأ', 'لم يتم العثور على الطلب', 'error');
        return;
    }
    
    const req = requests[reqIndex];
    const planOptions = `
        <select id="swal-plan" style="width:100%; padding:10px; border-radius:10px; border:1px solid #e5e7eb; 
                                       margin-top:10px; font-size:1rem; direction:rtl;">
            <option value="starter">⭐ ستارتر - مجاني</option>
            <option value="pro" ${req.plan === 'pro' ? 'selected' : ''}>🔥 برو احترافي</option>
            <option value="vip" ${req.plan === 'vip' ? 'selected' : ''}>👑 VIP ذهبي</option>
        </select>
    `;
    
    Swal.fire({
        title: `قبول طلب: ${req.name}`,
        html: `
            <div style="text-align:right;">
                <p style="color:#64748b;">📞 ${req.phone} &nbsp;|&nbsp; تاريخ: ${req.date || '---'}</p>
                <label style="display:block; margin-top:15px; font-weight:bold;">اختر الباقة:</label>
                ${planOptions}
            </div>
        `,
        confirmButtonText: '✅ تأكيد القبول',
        confirmButtonColor: '#10b981',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        preConfirm: () => document.getElementById('swal-plan').value
    }).then(async res => {
        if (res.isConfirmed) {
            req.plan = res.value;
            req.status = 'approved';
            businesses.push(req);
            requests.splice(reqIndex, 1);
            
            localStorage.setItem('admin_requests', JSON.stringify(requests));
            localStorage.setItem('business_directory', JSON.stringify(businesses));
            
            // حفظ في Firebase
            if (window.fbSetDoc) {
                await window.fbSetDoc('businesses', String(req.id || req.phone), req);
                await window.fbDeleteDoc('requests', String(req.id));
            }
            
            window.renderAdminData();
            Swal.fire('✅ تم القبول', `تم قبول ${req.name} وإضافته للأعضاء النشطين`, 'success');
        }
    });
};

// ======================================================
// استبدال rejectRequest
// ======================================================
window.rejectRequest = function(id) {
    let requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
    const reqIndex = requests.findIndex(r => String(r.id) === String(id));
    const req = reqIndex >= 0 ? requests[reqIndex] : null;
    
    Swal.fire({
        title: 'رفض الطلب',
        text: req ? `هل تريد رفض طلب ${req.name}؟` : 'هل تريد رفض هذا الطلب؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، رفض',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444'
    }).then(async res => {
        if (res.isConfirmed) {
            if (reqIndex > -1) {
                requests.splice(reqIndex, 1);
                localStorage.setItem('admin_requests', JSON.stringify(requests));
                
                // حذف من Firebase
                if (window.fbDeleteDoc) {
                    await window.fbDeleteDoc('requests', String(id));
                }
            }
            window.renderAdminData();
            Swal.fire('تم الرفض', 'تم حذف الطلب بنجاح', 'success');
        }
    });
};

// ======================================================
// حذف عضو نشط
// ======================================================
window.removeBusinessMember = function(id) {
    Swal.fire({
        title: 'إزالة العضو',
        text: 'هل أنت متأكد من إزالة هذا العضو؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، إزالة',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#ef4444'
    }).then(async res => {
        if (res.isConfirmed) {
            let businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
            businesses = businesses.filter(b => String(b.id) !== String(id) && String(b.phone) !== String(id));
            localStorage.setItem('business_directory', JSON.stringify(businesses));
            
            if (window.fbDeleteDoc) {
                await window.fbDeleteDoc('businesses', String(id));
            }
            
            window.renderAdminData();
            Swal.fire('تمت الإزالة', 'تم إزالة العضو بنجاح', 'success');
        }
    });
};

// ======================================================
// مزامنة تلقائية لوجود طلبات جديدة مع إشعار الأدمن
// ======================================================
window._lastRequestCount = parseInt(localStorage.getItem('admin_requests_count') || '0');

async function checkForNewRequests() {
    try {
        if (!window.fbGetDocs) return;
        const fbRequests = await window.fbGetDocs('requests');
        const count = fbRequests ? fbRequests.length : 0;
        
        if (count > window._lastRequestCount) {
            // طلبات جديدة!
            const newCount = count - window._lastRequestCount;
            window._lastRequestCount = count;
            localStorage.setItem('admin_requests_count', String(count));
            
            // تحديث الشارات
            const badge = document.getElementById('settingsAdminBadge');
            if (badge) {
                badge.innerText = count;
                badge.style.display = count > 0 ? 'inline-block' : 'none';
            }
            
            // حفظ البيانات محلياً
            if (fbRequests) {
                localStorage.setItem('admin_requests', JSON.stringify(fbRequests));
            }
            
            // إشعار مرئي
            if (newCount > 0) {
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 9999;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white; padding: 15px 20px; border-radius: 16px;
                    box-shadow: 0 8px 25px rgba(79,70,229,0.4);
                    display: flex; align-items: center; gap: 12px;
                    animation: slideInRight 0.4s ease;
                    font-family: Cairo, sans-serif; font-weight: 700; direction: rtl;
                `;
                notif.innerHTML = `
                    <i class="fa-solid fa-bell fa-bounce" style="font-size:1.4rem;"></i>
                    <div>
                        <div style="font-size:1rem;">طلب انضمام جديد!</div>
                        <div style="font-size:0.8rem; opacity:0.8;">${newCount} طلب جديد بانتظار موافقتك</div>
                    </div>
                    <button onclick="window.openAdminPanel(); this.parentElement.remove();" 
                            style="background:white; color:#4f46e5; border:none; padding:6px 14px; 
                                   border-radius:8px; cursor:pointer; font-weight:bold; font-family:Cairo;">
                        عرض
                    </button>
                `;
                document.body.appendChild(notif);
                
                setTimeout(() => {
                    notif.style.opacity = '0';
                    notif.style.transform = 'translateX(100px)';
                    notif.style.transition = 'all 0.4s';
                    setTimeout(() => notif.remove(), 400);
                }, 8000);
            }
        } else if (count < window._lastRequestCount) {
            window._lastRequestCount = count;
            localStorage.setItem('admin_requests_count', String(count));
            const badge = document.getElementById('settingsAdminBadge');
            if (badge) {
                badge.innerText = count;
                badge.style.display = count > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (e) {
        console.log('Admin sync check:', e.message);
    }
}

// تحقق كل 10 ثواني من طلبات جديدة
setInterval(checkForNewRequests, 10000);
setTimeout(checkForNewRequests, 3000); // تحقق أول مرة بعد 3 ثواني

// ======================================================
// إضافة style للإشعارات
// ======================================================
const adminStyle = document.createElement('style');
adminStyle.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
#settingsAdminBadge {
    display: inline-block;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
    font-weight: bold;
    text-align: center;
    line-height: 20px;
    position: absolute;
    top: -5px;
    left: -5px;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}
`;
document.head.appendChild(adminStyle);

console.log('✅ Admin panel system loaded successfully');


//     Payment Admin Extension                                     
(function() {
    const origRender = window.renderAdminData;
    window.renderAdminData = function() {
        if (typeof origRender === 'function') origRender();
        // Inject payments tab UI if not already there
        const modal = document.getElementById('adminModal');
        if (!modal) return;
        if (!document.getElementById('adminPaymentsSection')) {
            const section = document.createElement('div');
            section.id = 'adminPaymentsSection';
            section.style.cssText = 'padding:0 20px 20px;';
            section.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;border-top:1px solid #e2e8f0;padding-top:20px;">
                    <h4 style="margin:0;color:#1e1b4b;">&#128176; &#1573;&#1583;&#1575;&#1585;&#1577; &#1575;&#1604;&#1605;&#1583;&#1601;&#1608;&#1593;&#1575;&#1578; <span id="paymentPendingBadge" style="background:#ef4444;color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;display:none;">0</span></h4>
                    <button onclick="openPriceSettings()" style="background:#6366f1;color:white;border:none;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:0.8rem;">
                        <i class="fa-solid fa-sliders"></i> &#1575;&#1604;&#1571;&#1587;&#1593;&#1575;&#1585;
                    </button>
                </div>
                <div id="adminPaymentsList"><div style="text-align:center;color:#94a3b8;padding:20px;">&#1604;&#1575; &#1578;&#1608;&#1580;&#1583; &#1605;&#1583;&#1601;&#1608;&#1593;&#1575;&#1578; &#1605;&#1593;&#1604;&#1602;&#1577;</div></div>
            `;
            modal.querySelector('div[style*="padding:20px"]').appendChild(section);
        }
        if (typeof window.renderPaymentsAdmin === 'function') window.renderPaymentsAdmin();

        // Inject Market settings UI if not already there
        if (!document.getElementById('adminMarketSection')) {
            const mSection = document.createElement('div');
            mSection.id = 'adminMarketSection';
            mSection.style.cssText = 'padding:0 20px 20px;';
            mSection.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;border-top:1px solid #e2e8f0;padding-top:20px;">
                    <h4 style="margin:0;color:#1e1b4b;"><i class="fa-solid fa-store"></i> إعدادات السوق</h4>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <label style="display:block; font-weight:bold; margin-bottom:10px;">مدة الاشتراك المجاني للسوق (بالأيام)</label>
                    <input type="number" id="marketTrialInput" value="${constructionData.marketSettings ? constructionData.marketSettings.freeTrialDays : 30}" 
                           style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:10px;" />
                    <button onclick="saveMarketSettings()" style="width:100%; background:#10b981; color:white; border:none; border-radius:8px; padding:10px; cursor:pointer; font-weight:bold;">حفظ إعدادات السوق</button>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-top:15px;">
                    <label style="display:block; font-weight:bold; margin-bottom:10px;">مدة الاشتراك المجاني للخبراء (بالأيام)</label>
                    <input type="number" id="prosTrialInput" value="${(constructionData.prosSettings && constructionData.prosSettings.freeTrialDays) ? constructionData.prosSettings.freeTrialDays : 30}" 
                           style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:10px;" />
                    <button onclick="saveProsSettings()" style="width:100%; background:#3b82f6; color:white; border:none; border-radius:8px; padding:10px; cursor:pointer; font-weight:bold;">حفظ إعدادات الخبراء</button>
                </div>
                <div style="background:#fff1f2; padding:15px; border-radius:12px; border:1px solid #fecdd3; margin-top:15px;">
                    <label style="display:block; font-weight:bold; margin-bottom:10px; color:#be123c;">أمان وحماية المنصة</label>
                    <button onclick="window.changeAdminPin()" style="width:100%; background:#e11d48; color:white; border:none; border-radius:8px; padding:10px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-lock"></i> تغيير كلمة مرور الإدارة</button>
                </div>
            `;
            modal.querySelector('div[style*="padding:20px"]').appendChild(mSection);
        }
    };
})();

window.changeAdminPin = function() {
    Swal.fire({
        title: 'تغيير كلمة مرور الإدارة',
        html: `
            <input type="password" id="oldPin" class="swal2-input" placeholder="كلمة المرور الحالية" style="text-align:center;">
            <input type="password" id="newPin" class="swal2-input" placeholder="كلمة المرور الجديدة" style="text-align:center;">
        `,
        confirmButtonText: 'تغيير وحفظ',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#e11d48',
        preConfirm: () => {
            const oldP = document.getElementById('oldPin').value;
            const newP = document.getElementById('newPin').value;
            if (oldP !== ADMIN_PIN) {
                Swal.showValidationMessage('كلمة المرور الحالية غير صحيحة');
                return false;
            }
            if (!newP || newP.length < 4) {
                Swal.showValidationMessage('يجب أن تكون كلمة المرور الجديدة 4 رموز على الأقل');
                return false;
            }
            return newP;
        }
    }).then(res => {
        if (res.isConfirmed) {
            ADMIN_PIN = res.value;
            localStorage.setItem('tabooga_admin_pin', ADMIN_PIN);
            Swal.fire('تم الحفظ!', 'تم تغيير كلمة مرور لوحة الإدارة بنجاح.', 'success');
        }
    });
};

window.saveMarketSettings = function() {
    const days = parseInt(document.getElementById('marketTrialInput').value);
    if (isNaN(days) || days < 0) {
        Swal.fire('خطأ', 'الرجاء إدخال عدد أيام صحيح', 'error');
        return;
    }
    
    if (!constructionData.marketSettings) {
        constructionData.marketSettings = {};
    }
    constructionData.marketSettings.freeTrialDays = days;
    
    Swal.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: 'تم تحديث مدة الاشتراك المجاني للتجار',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        if (window.renderMarket && document.getElementById('shop').classList.contains('active-view')) {
            window.renderMarket(document.getElementById('marketGovFilter') ? document.getElementById('marketGovFilter').value : 'all');
        }
    });
};

window.saveProsSettings = function() {
    const days = parseInt(document.getElementById('prosTrialInput').value);
    if (isNaN(days) || days < 0) {
        Swal.fire('خطأ', 'الرجاء إدخال عدد أيام صحيح', 'error');
        return;
    }
    
    if (!constructionData.prosSettings) {
        constructionData.prosSettings = {};
    }
    constructionData.prosSettings.freeTrialDays = days;
    
    Swal.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: 'تم تحديث مدة الاشتراك المجاني للخبراء',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        if (window.renderPros && document.getElementById('pros').classList.contains('active-view')) {
            window.renderPros();
        }
    });
};
