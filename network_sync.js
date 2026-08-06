// Tabooga Network Sync Module
class NetworkSync {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    async fetchState() {
        if (!this.isOnline) return;
        try {
            const response = await fetch(\`\${this.serverUrl}/api/state\`);
            const data = await response.json();
            
            // Sync to local storage
            for (let key in data) {
                if(data[key]) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                }
            }
            console.log("State synced from server.");
        } catch (error) {
            console.error("Failed to fetch state:", error);
        }
    }

    async syncKey(key, value) {
        if (!this.isOnline) return;
        try {
            await fetch(\`\${this.serverUrl}/api/sync\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            console.log(\`Key \${key} pushed to server.\`);
        } catch (error) {
            console.error("Failed to sync key:", error);
        }
    }
}

// Intercept LocalStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    // Synchronize 100% of platform keys 24/7 for live real-time sync
    const syncKeys = [
        'registeredUsers',
        'public_requests',
        'tabooqa_free_blueprints',
        'business_blueprints',
        'business_directory',
        'business_products',
        'business_portfolio',
        'tabooqa_custom_portfolios',
        'tabooqa_custom_covers',
        'tabooqa_custom_logos',
        'tabooqa_custom_pro_services',
        'tabooqa_custom_pro_desc',
        'tabooqa_custom_pro_cvs',
        'dynamic_ads',
        'tabooga_custom_prices',
        'tabooga_admin_settings'
    ];

    if (syncKeys.includes(key) && window.taboogaSync) {
        try {
            const parsed = JSON.parse(value);
            window.taboogaSync.syncKey(key, parsed);
        } catch(e) {}
    }
};

// Initialize Cloud Server Gateway
const serverIP = 'tabooga-iraq.onrender.com';
window.taboogaSync = new NetworkSync(`https://${serverIP}`);

// 24/7 Live Pulse Sync Engine
document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch & render
    window.taboogaSync.fetchState().then(() => {
        if (typeof renderShop === 'function') renderShop();
        if (typeof renderPros === 'function') renderPros();
        if (typeof renderPlans === 'function') renderPlans();
        if (typeof renderPublicRequests === 'function') renderPublicRequests();
        if (typeof initAllSliders === 'function') initAllSliders();
    });
    
    // Live Pulse Sync Every 10 Seconds for Instant Customer & Admin Updates
    setInterval(() => {
        if (window.taboogaSync && navigator.onLine) {
            window.taboogaSync.fetchState().then(() => {
                const activeShop = document.getElementById('shop') && document.getElementById('shop').classList.contains('active-view');
                const activePros = document.getElementById('pros') && document.getElementById('pros').classList.contains('active-view');
                const activeBlueprints = document.getElementById('blueprints') && document.getElementById('blueprints').classList.contains('active-view');
                const activeRequests = document.getElementById('requests-board') && document.getElementById('requests-board').classList.contains('active-view');

                if (typeof renderShop === 'function' && activeShop) renderShop();
                if (typeof renderPros === 'function' && activePros) renderPros();
                if (typeof renderPlans === 'function' && activeBlueprints) renderPlans();
                if (typeof renderPublicRequests === 'function' && activeRequests) renderPublicRequests();
            });
        }
    }, 10000);
});
