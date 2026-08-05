
(function() {
    try {
        window.loadPaymentSettings = async function() {
            let paymentSettings = { adminZainCash: '', adminSuperQi: '', priceEng: '25000', priceShop: '35000', priceCon: '50000' };
            try {
                const db = window.getDb && window.getDb();
                if (db) {
                    const docSnap = await window.getDoc(window.doc(db, "appData", "paymentSettings"));
                    if (docSnap.exists()) {
                        paymentSettings = docSnap.data();
                        localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
                    }
                }
            } catch(e) {}
            if(document.getElementById('adminZainCash')) document.getElementById('adminZainCash').value = paymentSettings.adminZainCash || '';
            if(document.getElementById('adminSuperQi')) document.getElementById('adminSuperQi').value = paymentSettings.adminSuperQi || '';
            if(document.getElementById('priceEng')) document.getElementById('priceEng').value = paymentSettings.priceEng || '';
            if(document.getElementById('priceShop')) document.getElementById('priceShop').value = paymentSettings.priceShop || '';
            if(document.getElementById('priceCon')) document.getElementById('priceCon').value = paymentSettings.priceCon || '';
        };

        window.savePaymentSettings = async function() {
            const adminZainCash = document.getElementById('adminZainCash').value;
            const adminSuperQi = document.getElementById('adminSuperQi').value;
            const priceEng = document.getElementById('priceEng').value;
            const priceShop = document.getElementById('priceShop').value;
            const priceCon = document.getElementById('priceCon').value;
            const paymentSettings = { adminZainCash, adminSuperQi, priceEng, priceShop, priceCon };
            localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
            try {
                const db = window.getDb && window.getDb();
                if (db) {
                    Swal.fire({ title: 'جاري الحفظ...', didOpen: () => Swal.showLoading() });
                    await window.setDoc(window.doc(db, "appData", "paymentSettings"), paymentSettings);
                    Swal.fire('تم', 'تم حفظ إعدادات الدفع بنجاح', 'success');
                }
            } catch(e) { console.error(e); Swal.fire('خطأ', 'حدث خطأ أثناء الحفظ', 'error'); }
        };

        function injectPaymentSettings() {
            const adminModal = document.getElementById('adminModal');
            if (!adminModal) return;
            const header = adminModal.querySelector('h2');
            if (header && !document.getElementById('paymentSettingsPanel')) {
                const paymentSettingsHTML = `
                    <div id="paymentSettingsPanel" style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:15px; margin-top:20px; margin-bottom:20px; text-align:right;">
                        <h4 style="margin-top:0; margin-bottom:15px; color:#1e1b4b; border-bottom:2px solid #cbd5e1; padding-bottom:10px;">💳 إعدادات الدفع والاشتراكات</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                            <div><label style="font-size:0.8rem; color:#64748b; font-weight:bold;">رقم زين كاش</label><input type="text" id="adminZainCash" class="swal2-input" style="margin:5px 0; height:36px; width:100%; font-size:0.9rem;" placeholder="078xxxxxxx"></div>
                            <div><label style="font-size:0.8rem; color:#64748b; font-weight:bold;">رقم Qi</label><input type="text" id="adminSuperQi" class="swal2-input" style="margin:5px 0; height:36px; width:100%; font-size:0.9rem;" placeholder="079xxxxxxx"></div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:15px;">
                            <div><label style="font-size:0.8rem; color:#64748b; font-weight:bold;">اشتراك مهندس</label><input type="number" id="priceEng" class="swal2-input" style="margin:5px 0; height:36px; width:100%; font-size:0.9rem;"></div>
                            <div><label style="font-size:0.8rem; color:#64748b; font-weight:bold;">اشتراك محل</label><input type="number" id="priceShop" class="swal2-input" style="margin:5px 0; height:36px; width:100%; font-size:0.9rem;"></div>
                            <div><label style="font-size:0.8rem; color:#64748b; font-weight:bold;">اشتراك مقاول</label><input type="number" id="priceCon" class="swal2-input" style="margin:5px 0; height:36px; width:100%; font-size:0.9rem;"></div>
                        </div>
                        <button onclick="window.savePaymentSettings()" style="width:100%; background:#1e1b4b; color:white; border:none; border-radius:8px; padding:12px; font-weight:bold; cursor:pointer; font-size:1rem;">حفظ إعدادات الدفع في السيرفر</button>
                    </div>
                `;
                header.insertAdjacentHTML('afterend', paymentSettingsHTML);
                window.loadPaymentSettings();
            }
        }

        document.querySelectorAll('div').forEach(p => {
            if (p.innerHTML && p.innerHTML.includes('Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª')) p.remove();
        });

        if (window.openAdminPanel && !window._hookedOpen8) {
            window._hookedOpen8 = true;
            const originalOpen = window.openAdminPanel;
            window.openAdminPanel = function() {
                injectPaymentSettings();
                originalOpen();
            };
        }

        window.registerAsOffice = function() {
            let paymentSettings = { adminZainCash: 'غير محدد', adminSuperQi: 'غير محدد', priceEng: '25000', priceShop: '35000', priceCon: '50000' };
            try { paymentSettings = JSON.parse(localStorage.getItem('paymentSettings')) || paymentSettings; } catch(e) {}
            Swal.fire({
                title: 'طلب انضمام (اشتراك)',
                html: `
                    <input id="swal-office-name" class="swal2-input" placeholder="اسمك / اسم المكتب">
                    <input id="swal-office-phone" class="swal2-input" placeholder="رقم الهاتف (للتواصل)">
                    <select id="swal-office-cat" class="swal2-input">
                        <option value="eng">مهندس (تصميم واشراف)</option>
                        <option value="shop">محل (مواد إنشائية)</option>
                        <option value="con">خلفه/مقاول (تنفيذ عمل)</option>
                    </select>
                    <p style="font-size:0.85rem; color:#64748b; margin-top:10px;">سيتم نقلك لشاشة الدفع في الخطوة التالية.</p>
                `,
                confirmButtonText: 'التالي (الدفع)',
                showCancelButton: true,
                cancelButtonText: 'إلغاء',
                preConfirm: () => {
                    const name = document.getElementById('swal-office-name').value;
                    const phone = document.getElementById('swal-office-phone').value;
                    const cat = document.getElementById('swal-office-cat').value;
                    if (!name || !phone) Swal.showValidationMessage('يرجى ملء جميع الحقول');
                    return { name, phone, cat };
                }
            }).then((result) => {
                if (result.isConfirmed && result.value.name) {
                    const userInfo = result.value;
                    let price = paymentSettings.priceEng;
                    let catName = "مهندس";
                    if (userInfo.cat === 'shop') { price = paymentSettings.priceShop; catName = "محل"; }
                    else if (userInfo.cat === 'con') { price = paymentSettings.priceCon; catName = "مقاول"; }
                    Swal.fire({
                        title: 'إتمام الدفع',
                        html: `
                            <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px; text-align:right;">
                                <h4 style="margin:0 0 10px; color:#1e293b;">مبلغ الاشتراك (${catName}): <span style="color:#ef4444;">${price} دينار</span></h4>
                                <p style="font-size:0.85rem; color:#64748b; margin:0 0 10px;">يرجى تحويل المبلغ إلى أحد الأرقام التالية:</p>
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:8px;">
                                    <span style="font-weight:bold; color:#10b981;">زين كاش:</span><span style="font-family:monospace; font-size:1.1rem;">${paymentSettings.adminZainCash}</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
                                    <span style="font-weight:bold; color:#3b82f6;">سوبر كي:</span><span style="font-family:monospace; font-size:1.1rem;">${paymentSettings.adminSuperQi}</span>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <label style="font-size:0.9rem; font-weight:bold; color:#1e293b; display:block; margin-bottom:5px;">رقم عملية التحويل (رقم الوصل):</label>
                                <input id="swal-tx-id" type="text" class="swal2-input" placeholder="أدخل رقم العملية هنا" style="margin:0; width:100%; box-sizing:border-box;">
                            </div>
                        `,
                        confirmButtonText: 'تأكيد الدفع وإرسال الطلب',
                        confirmButtonColor: '#10b981',
                        showCancelButton: true,
                        cancelButtonText: 'إلغاء',
                        preConfirm: () => {
                            const txId = document.getElementById('swal-tx-id').value;
                            if (!txId) Swal.showValidationMessage('يرجى إدخال رقم عملية التحويل للتحقق منها');
                            return txId;
                        }
                    }).then(async (payResult) => {
                        if (payResult.isConfirmed && payResult.value) {
                            Swal.fire({ title: 'جاري إرسال الطلب...', didOpen: () => Swal.showLoading() });
                            const req = { id: Date.now(), name: userInfo.name, phone: userInfo.phone, category: userInfo.cat, amount: price, transactionId: payResult.value, paymentStatus: 'pending_verification', date: new Date().toLocaleDateString('ar-IQ'), status: 'pending' };
                            try {
                                let requests = JSON.parse(localStorage.getItem('admin_requests')) || [];
                                requests.push(req);
                                localStorage.setItem('admin_requests', JSON.stringify(requests));
                                if(typeof updateAdminBadge === 'function') updateAdminBadge();
                                if (window.fbAddDoc) await window.fbAddDoc('requests', req);
                                Swal.fire('تم الإرسال', 'تم استلام طلبك ورقم الحوالة. سيتم تفعيل حسابك بعد التحقق.', 'success');
                            } catch(e) { console.error(e); Swal.fire('خطأ', 'حدث خطأ أثناء إرسال الطلب', 'error'); }
                        }
                    });
                }
            });
        };

        if (window.renderAdminData && !window._paymentHooked8) {
            window._paymentHooked8 = true;
            const originalRenderAdminData = window.renderAdminData;
            window.renderAdminData = async function() {
                injectPaymentSettings();
                if (originalRenderAdminData) await originalRenderAdminData();
                window.loadPaymentSettings();

                const listPending = document.getElementById('adminRequestsList');
                if (listPending) {
                    let requests = JSON.parse(localStorage.getItem('admin_requests') || '[]');
                    if (requests.length > 0) {
                        const catNames = { eng: 'مكتب هندسي', con: 'مقاول', mat: 'مورد مواد', shop: 'محل تجاري' };
                        listPending.innerHTML = requests.map(r => {
                            const catName = catNames[r.category || r.type] || r.category || 'غير محدد';
                            return `
                            <div style="background:white; padding:15px; border-radius:14px; border-right:4px solid #ef4444; box-shadow:0 2px 8px rgba(0,0,0,0.08); margin-bottom:12px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                    <div style="text-align:right; flex:1;">
                                        <h4 style="margin:0 0 4px; font-size:1rem; color:#1e293b;">${r.name || 'بدون اسم'}</h4>
                                        <p style="margin:0; font-size:0.8rem; color:#64748b;">📞 ${r.phone || '---'} &nbsp;|&nbsp; 🏷️ ${catName}</p>
                                        <p style="margin:4px 0 0; font-size:0.75rem; color:#94a3b8;">📅 ${r.date || ''}</p>
                                        ${r.transactionId ? `
                                        <div style="margin-top:8px; background:#f8fafc; padding:8px; border-radius:6px; border:1px solid #e2e8f0; text-align:right;">
                                            <p style="margin:0; font-size:0.8rem; color:#1e293b;">💰 <b>المبلغ المسدد:</b> <span style="color:#10b981;">${r.amount || 'غير محدد'} دينار</span></p>
                                            <p style="margin:4px 0 0; font-size:0.8rem; color:#1e293b;">🧾 <b>رقم التحويل (الوصل):</b> <span style="font-family:monospace; background:#e2e8f0; padding:2px 4px; border-radius:4px;">${r.transactionId}</span></p>
                                        </div>` : ''}
                                    </div>
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button onclick="window.approveRequest('${r.id}')" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:10px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:0.9rem;">✅ موافقة وقبول</button>
                                    <button onclick="window.rejectRequest('${r.id}')" style="background:#fee2e2; color:#ef4444; border:1px solid #fca5a5; padding:10px 15px; border-radius:10px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>`;
                        }).join('');
                    }
                }
            };
        }
    } catch (e) {
        console.error("Hotfix error:", e);
    }
})();
