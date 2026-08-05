/**
 * Benaa Iraq - Payment System (Manual Verification)
 * Version: 1.0.0-STABLE
 * Supports: ZainCash, SuperCash (Manual Receipt Upload)
 */

(function() {
    'use strict';

    // ─── Default Payment Settings ───────────────────────────────────
    const DEFAULT_PAYMENT_SETTINGS = {
        zaincash_number:   '07800000000',
        supercash_number:  '07900000000',
        zaincash_name:     '\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645',
        supercash_name:    '\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645',
        fees: {
            eng:  50000,
            con:  35000,
            tech: 15000,
            elec: 15000,
            carp: 15000,
            mat:  35000,
            shop: 25000,
            ads:  15000,
            service_commission: 5000
        },
        payment_enabled: true
    };

    function getPaymentSettings() {
        try {
            const raw = localStorage.getItem('payment_settings');
            return raw ? Object.assign({}, DEFAULT_PAYMENT_SETTINGS, JSON.parse(raw)) : DEFAULT_PAYMENT_SETTINGS;
        } catch(e) { return DEFAULT_PAYMENT_SETTINGS; }
    }

    function savePaymentSettings(settings) {
        localStorage.setItem('payment_settings', JSON.stringify(settings));
    }

    function getPaymentRequests() {
        try { return JSON.parse(localStorage.getItem('payment_requests') || '[]'); }
        catch(e) { return []; }
    }

    function savePaymentRequests(reqs) {
        localStorage.setItem('payment_requests', JSON.stringify(reqs));
    }

    // ─── Open Payment Modal ───────────────────────────────────────────
    window.openPaymentModal = function(amount, purposeKey, purposeLabel, onApproved) {
        const settings = getPaymentSettings();
        if (!settings.payment_enabled) {
            if (typeof onApproved === 'function') onApproved();
            return;
        }

        // Guard: if amount is not a valid number, use default fee
        var numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            numAmount = settings.fees[purposeKey] || settings.fees.eng || 50000;
        }

        // Store callback globally for later use
        window._pendingPaymentCallback = onApproved;
        window._pendingPaymentAmount   = numAmount;
        window._pendingPaymentPurpose  = purposeKey;
        window._pendingPaymentLabel    = purposeLabel || purposeKey;

        // Show method selection modal
        const modal = document.getElementById('paymentModal');
        if (!modal) return;

        document.getElementById('pm_amount_display').innerText  = numAmount.toLocaleString() + ' IQD';
        document.getElementById('pm_purpose_display').innerHTML = purposeLabel || purposeKey;

        // Show ZainCash/SuperCash numbers
        document.getElementById('pm_zain_number').innerText  = settings.zaincash_number;
        document.getElementById('pm_super_number').innerText = settings.supercash_number;

        modal.classList.remove('hidden');
        document.getElementById('pm_step_method').style.display   = '';
        document.getElementById('pm_step_receipt').style.display  = 'none';
        document.getElementById('pm_step_success').style.display  = 'none';
    };

    window.closePaymentModal = function() {
        const modal = document.getElementById('paymentModal');
        if (modal) modal.classList.add('hidden');
        window._pendingPaymentCallback = null;
    };

    window.selectPaymentMethod = function(method) {
        const settings = getPaymentSettings();
        const isZain   = method === 'zaincash';
        const number   = isZain ? settings.zaincash_number : settings.supercash_number;
        const name     = isZain ? settings.zaincash_name   : settings.supercash_name;
        const amount   = window._pendingPaymentAmount || 0;
        const label    = window._pendingPaymentLabel  || '';

        window._selectedPaymentMethod = method;

        const methodLabel = isZain ? 'ZainCash' : 'SuperCash';
        document.getElementById('pm_instr_method').innerText  = methodLabel;
        var m2 = document.getElementById('pm_instr_method2');
        if (m2) m2.innerText = methodLabel;
        document.getElementById('pm_instr_number').innerText  = number;
        document.getElementById('pm_instr_amount').innerText  = parseInt(amount).toLocaleString() + ' IQD';

        document.getElementById('pm_step_method').style.display  = 'none';
        document.getElementById('pm_step_receipt').style.display = '';
    };

    window.backToMethodSelect = function() {
        document.getElementById('pm_step_method').style.display  = '';
        document.getElementById('pm_step_receipt').style.display = 'none';
        document.getElementById('pm_receipt_preview').style.display = 'none';
        document.getElementById('pm_receipt_img').src = '';
    };

    window.previewReceipt = function(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('pm_receipt_preview');
            const img     = document.getElementById('pm_receipt_img');
            img.src       = e.target.result;
            preview.style.display = '';
            window._receiptBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    window.submitPaymentProof = function() {
        if (!window._receiptBase64) {
            if (window.Swal) Swal.fire('\u062e\u0637\u0623', '\u064a\u0631\u062c\u0649 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u0625\u064a\u0635\u0627\u0644 \u0623\u0648\u0644\u0627\u064b', 'error');
            return;
        }

        const userPhone = localStorage.getItem('user_phone') || '';
        const userName  = localStorage.getItem('user_name')  || '\u0645\u062c\u0647\u0648\u0644';

        const req = {
            id:           'pay_' + Date.now(),
            phone:        userPhone,
            name:         userName,
            amount:       window._pendingPaymentAmount,
            purpose:      window._pendingPaymentPurpose,
            purposeLabel: window._pendingPaymentLabel,
            method:       window._selectedPaymentMethod,
            receipt:      window._receiptBase64,
            status:       'pending',
            submittedAt:  Date.now()
        };

        const reqs = getPaymentRequests();
        reqs.push(req);
        savePaymentRequests(reqs);

        // Show success step
        document.getElementById('pm_step_receipt').style.display = 'none';
        document.getElementById('pm_step_success').style.display = '';

        window._receiptBase64 = null;

        // Notify admin badge
        if (typeof window.updateAdminBadge === 'function') window.updateAdminBadge();

        // EXECUTE CALLBACK SO THE REQUEST IS ACTUALLY SAVED!
        if (typeof window._pendingPaymentCallback === 'function') {
            window._pendingPaymentCallback();
            window._pendingPaymentCallback = null;
        }
    };

    // ─── Admin: Render Payments Panel ────────────────────────────────
    window.renderPaymentsAdmin = function() {
        const settings = getPaymentSettings();
        const reqs     = getPaymentRequests();
        const pending  = reqs.filter(r => r.status === 'pending');

        const container = document.getElementById('adminPaymentsList');
        if (!container) return;

        if (pending.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:20px;">\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0645\u0639\u0644\u0642\u0629</div>';
            return;
        }

        container.innerHTML = pending.map(r => {
            const methodLabel = r.method === 'zaincash' ? '\ud83d\udcb9 ZainCash' : '\ud83d\udcb3 SuperCash';
            const date = new Date(r.submittedAt).toLocaleString('ar-IQ');
            return `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;margin-bottom:12px;border-right:4px solid #3b82f6;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                    <div>
                        <strong style="color:#1e293b;font-size:1rem;">${r.name}</strong>
                        <p style="margin:3px 0;color:#64748b;font-size:0.85rem;">&#128222; ${r.phone}</p>
                        <p style="margin:3px 0;color:#3b82f6;font-size:0.85rem;">&#127991; ${r.purposeLabel}</p>
                        <p style="margin:3px 0;color:#10b981;font-weight:bold;font-size:0.95rem;">&#128176; ${parseInt(r.amount).toLocaleString()} IQD</p>
                        <p style="margin:3px 0;color:#8b5cf6;font-size:0.85rem;">${methodLabel}</p>
                        <p style="margin:3px 0;color:#94a3b8;font-size:0.75rem;">&#128337; ${date}</p>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <button onclick="viewPaymentReceipt('${r.id}')" style="background:#6366f1;color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.8rem;">&#128444; \u0627\u0644\u0625\u064a\u0635\u0627\u0644</button>
                        <button onclick="approvePayment('${r.id}')" style="background:#10b981;color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.8rem;">&#10003; \u062a\u0623\u0643\u064a\u062f</button>
                        <button onclick="rejectPayment('${r.id}')" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:0.8rem;">&#10007; \u0631\u0641\u0636</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Update pending badge
        const badge = document.getElementById('paymentPendingBadge');
        if (badge) { badge.innerText = pending.length; badge.style.display = pending.length > 0 ? 'inline-block' : 'none'; }
    };

    window.viewPaymentReceipt = function(id) {
        const reqs = getPaymentRequests();
        const req  = reqs.find(r => r.id === id);
        if (!req || !req.receipt) return;
        const win = window.open('', '_blank');
        win.document.write('<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="' + req.receipt + '" style="max-width:100%;max-height:100%;"></body></html>');
    };

    window.approvePayment = function(id) {
        const reqs = getPaymentRequests();
        const idx  = reqs.findIndex(r => r.id === id);
        if (idx === -1) return;
        reqs[idx].status     = 'approved';
        reqs[idx].approvedAt = Date.now();
        savePaymentRequests(reqs);

        // Auto-approve the associated membership/ad request
        const req = reqs[idx];
        if (req.purpose && req.purpose.startsWith('join_')) {
            const adminReqs = JSON.parse(localStorage.getItem('admin_requests') || '[]');
            const aIdx = adminReqs.findIndex(r => r.phone === req.phone && r.status === 'pending');
            if (aIdx > -1) {
                adminReqs[aIdx].status     = 'accepted';
                adminReqs[aIdx].approvedAt = Date.now();
                localStorage.setItem('admin_requests', JSON.stringify(adminReqs));
                // Also add to directory
                const businesses = JSON.parse(localStorage.getItem('business_directory') || '[]');
                businesses.push({
                    id: 'biz_' + Date.now(),
                    name: adminReqs[aIdx].name,
                    phone: adminReqs[aIdx].phone,
                    category: adminReqs[aIdx].category,
                    joinedAt: Date.now()
                });
                localStorage.setItem('business_directory', JSON.stringify(businesses));
            }
        }

        if (window.Swal) Swal.fire('\u062a\u0645 \u0627\u0644\u062a\u0623\u0643\u064a\u062f', '\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062f\u0641\u0639\u0629 \u0628\u0646\u062c\u0627\u062d', 'success');
        if (typeof window.renderPaymentsAdmin === 'function') window.renderPaymentsAdmin();
        if (typeof window.renderAdminData === 'function') window.renderAdminData();
    };

    window.rejectPayment = function(id) {
        if (!window.Swal) return;
        Swal.fire({
            title: '\u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636',
            input: 'text',
            inputPlaceholder: '\u0627\u0643\u062a\u0628 \u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636...',
            showCancelButton: true,
            confirmButtonText: '\u0631\u0641\u0636',
            cancelButtonText:  '\u0625\u0644\u063a\u0627\u0621',
            confirmButtonColor: '#ef4444'
        }).then(result => {
            if (!result.isConfirmed) return;
            const reqs = getPaymentRequests();
            const idx  = reqs.findIndex(r => r.id === id);
            if (idx === -1) return;
            reqs[idx].status     = 'rejected';
            reqs[idx].rejectedAt = Date.now();
            reqs[idx].reason     = result.value;
            savePaymentRequests(reqs);
            Swal.fire('\u062a\u0645 \u0627\u0644\u0631\u0641\u0636', '', 'info');
            if (typeof window.renderPaymentsAdmin === 'function') window.renderPaymentsAdmin();
        });
    };

    // ─── Admin: Price Settings ────────────────────────────────────────
    window.openPriceSettings = function() {
        const s = getPaymentSettings();
        document.getElementById('ps_eng').value          = s.fees.eng;
        document.getElementById('ps_con').value          = s.fees.con;
        document.getElementById('ps_tech').value         = s.fees.tech !== undefined ? s.fees.tech : 15000;
        document.getElementById('ps_elec').value         = s.fees.elec !== undefined ? s.fees.elec : 15000;
        document.getElementById('ps_carp').value         = s.fees.carp !== undefined ? s.fees.carp : 15000;
        document.getElementById('ps_mat').value          = s.fees.mat;
        document.getElementById('ps_shop').value         = s.fees.shop !== undefined ? s.fees.shop : 25000;
        document.getElementById('ps_ads').value          = s.fees.ads;
        document.getElementById('ps_commission').value   = s.fees.service_commission;

        let planPrices = [];
        try { planPrices = JSON.parse(localStorage.getItem('plan_prices') || '[]'); } catch(e) {}
        const proPrice = (planPrices.find(p => p.id === 'pro') || {}).price || 50000;
        const vipPrice = (planPrices.find(p => p.id === 'vip') || {}).price || 100000;
        document.getElementById('ps_pro').value          = proPrice;
        document.getElementById('ps_vip').value          = vipPrice;

        document.getElementById('ps_zain_num').value     = s.zaincash_number;
        document.getElementById('ps_zain_name').value    = s.zaincash_name;
        document.getElementById('ps_super_num').value    = s.supercash_number;
        document.getElementById('ps_super_name').value   = s.supercash_name;
        document.getElementById('priceSettingsModal').classList.remove('hidden');
    };

    window.closePriceSettings = function() {
        document.getElementById('priceSettingsModal').classList.add('hidden');
    };

    window.savePriceSettings = function() {
        const s = getPaymentSettings();
        s.fees.eng              = parseInt(document.getElementById('ps_eng').value)        || 50000;
        s.fees.con              = parseInt(document.getElementById('ps_con').value)        || 35000;
        s.fees.tech             = parseInt(document.getElementById('ps_tech').value)       || 15000;
        s.fees.elec             = parseInt(document.getElementById('ps_elec').value)       || 15000;
        s.fees.carp             = parseInt(document.getElementById('ps_carp').value)       || 15000;
        s.fees.mat              = parseInt(document.getElementById('ps_mat').value)        || 35000;
        s.fees.shop             = parseInt(document.getElementById('ps_shop').value)       || 25000;
        s.fees.ads              = parseInt(document.getElementById('ps_ads').value)        || 15000;
        s.fees.service_commission = parseInt(document.getElementById('ps_commission').value) || 5000;

        const proVal = parseInt(document.getElementById('ps_pro').value, 10) || 50000;
        const vipVal = parseInt(document.getElementById('ps_vip').value, 10) || 100000;
        const newPlanPrices = [
            { id: 'pro', name: 'باقة المحترفين Pro', price: proVal, color: '#0284c7', icon: 'fa-rocket' },
            { id: 'vip', name: 'باقة النخبة VIP', price: vipVal, color: '#d97706', icon: 'fa-crown' }
        ];

        s.zaincash_number       = document.getElementById('ps_zain_num').value.trim();
        s.zaincash_name         = document.getElementById('ps_zain_name').value.trim();
        s.supercash_number      = document.getElementById('ps_super_num').value.trim();
        s.supercash_name        = document.getElementById('ps_super_name').value.trim();

        localStorage.setItem('plan_prices', JSON.stringify(newPlanPrices));
        savePaymentSettings(s);
        closePriceSettings();
        if (typeof renderBusinessPlans === 'function') {
            renderBusinessPlans();
        }
        if (window.Swal) Swal.fire('تم الحفظ', 'تم حفظ الإعدادات بنجاح ويتم تحديثها بالمنصة', 'success');
    };

    window.getJoinFee = function(category) {
        const s = getPaymentSettings();
        return s.fees[category] || s.fees.eng;
    };

    window.isPaymentEnabled = function() {
        return getPaymentSettings().payment_enabled;
    };

})();
