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
    
    // Only sync specific keys to avoid spam
    const syncKeys = ['registeredUsers', 'public_requests', 'tabooqa_custom_portfolios', 'tabooqa_custom_covers'];
    if (syncKeys.includes(key) && window.taboogaSync) {
        try {
            const parsed = JSON.parse(value);
            window.taboogaSync.syncKey(key, parsed);
        } catch(e) {}
    }
};

// Initialize
const serverIP = 'tabooga-iraq.onrender.com';
window.taboogaSync = new NetworkSync(`https://${serverIP}`);

// Initial fetch & Periodic polling
document.addEventListener('DOMContentLoaded', () => {
    window.taboogaSync.fetchState().then(() => {
        // Refresh UI if needed
        if(typeof renderPros === 'function') renderPros();
        if(typeof renderPublicRequests === 'function') renderPublicRequests();
    });
    
    // Poll every 10 seconds for real-time multiplayer feel
    setInterval(() => {
        window.taboogaSync.fetchState().then(() => {
            if(typeof renderPros === 'function' && document.getElementById('pros').classList.contains('active-view')) renderPros();
            if(typeof renderPublicRequests === 'function' && document.getElementById('requests-board').classList.contains('active-view')) renderPublicRequests();
        });
    }, 10000);
});
