const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

// Find where the old network sync starts and cut it out, replace with clean version
const networkStart = js.indexOf('// Tabooga Network Sync Module');
if (networkStart === -1) {
    console.log("Not found!");
    process.exit(1);
}

// Keep everything before the sync module
let cleanJs = js.substring(0, networkStart);

// Append the new, clean NetworkSync code
cleanJs += `
// ============================================
// Tabooga Network Sync - Multi-user Real-time
// ============================================
(function() {
    const SERVER = 'http://192.168.1.79:3000';

    // Test connection on load
    async function pingServer() {
        try {
            const res = await fetch(SERVER + '/api/ping', { mode: 'cors' });
            const data = await res.json();
            console.log('[Tabooga] Server connected:', data.server, 'at', data.time);
            showConnectionBadge(true);
            return true;
        } catch(e) {
            console.warn('[Tabooga] Server offline, running in local mode.');
            showConnectionBadge(false);
            return false;
        }
    }

    // Show a small connection indicator in app
    function showConnectionBadge(online) {
        let badge = document.getElementById('_networkBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = '_networkBadge';
            badge.style.cssText = 'position:fixed; top:8px; left:8px; z-index:99999; padding:3px 8px; border-radius:20px; font-size:0.65rem; font-weight:bold; opacity:0.85; pointer-events:none; transition:all 0.3s;';
            document.body.appendChild(badge);
        }
        if (online) {
            badge.style.background = '#10b981';
            badge.style.color = 'white';
            badge.textContent = '🟢 شبكي';
        } else {
            badge.style.background = '#ef4444';
            badge.style.color = 'white';
            badge.textContent = '🔴 محلي';
        }
        // Auto-hide after 4 seconds
        setTimeout(() => { badge.style.opacity = '0'; }, 4000);
        badge.style.opacity = '0.85';
    }

    // Fetch full state from server and apply to localStorage
    async function fetchAndApply() {
        try {
            const res = await fetch(SERVER + '/api/state', { mode: 'cors' });
            const data = await res.json();
            const keys = ['registeredUsers', 'public_requests', 'tabooqa_custom_portfolios', 'tabooqa_custom_covers'];
            keys.forEach(k => {
                if (data[k] !== undefined) {
                    localStorage.setItem(k, JSON.stringify(data[k]));
                }
            });
        } catch(e) { /* offline fallback */ }
    }

    // Intercept localStorage writes and push to server
    const _origSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
        _origSet(key, value);
        const syncKeys = ['registeredUsers', 'public_requests', 'tabooqa_custom_portfolios', 'tabooqa_custom_covers'];
        if (syncKeys.includes(key)) {
            try {
                fetch(SERVER + '/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: key, value: JSON.parse(value) }),
                    mode: 'cors'
                }).catch(() => {});
            } catch(e) {}
        }
    };

    // Expose global
    window.taboogaSync = { fetchAndApply, pingServer };

    // Boot sequence
    document.addEventListener('DOMContentLoaded', function() {
        pingServer();
        fetchAndApply().then(() => {
            if (typeof renderPros === 'function') renderPros();
            if (typeof renderPublicRequests === 'function') renderPublicRequests();
        });

        // Poll every 15 seconds for multi-user sync
        setInterval(() => {
            fetchAndApply().then(() => {
                const active = document.querySelector('.app-view.active-view');
                if (!active) return;
                const id = active.id;
                if (id === 'pros' && typeof renderPros === 'function') renderPros();
                if (id === 'requests-board' && typeof renderPublicRequests === 'function') renderPublicRequests();
                if (id === 'market' && typeof renderMarket === 'function') renderMarket();
            });
        }, 15000);
    });
})();
`;

fs.writeFileSync('script.js', cleanJs, 'utf8');
console.log("Replaced NetworkSync with clean version. Lines:", cleanJs.split('\n').length);
