import { getFirestore, doc, onSnapshot, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ FIX: Don't read window.firebaseDb at load time - it's not ready yet.
// Instead, use a getter function that reads it lazily when each function is called.
function getDb() {
    return window.firebaseDb || null;
}

// Ads sync - real-time listener
window.syncAdsFromDb = function() {
    const db = getDb();
    if (!db) {
        // Retry after Firebase is ready
        setTimeout(() => window.syncAdsFromDb(), 1000);
        return;
    }
    const adsRef = doc(db, "appData", "adsDoc");
    onSnapshot(adsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.adsList && Array.isArray(data.adsList)) {
                originalSetItem.call(localStorage, 'app_ads_v3', JSON.stringify(data.adsList));
                if (window.renderAds) window.renderAds(data.adsList);
            }
        }
    });
};

window.saveAdsToDb = async function(adsList) {
    const db = getDb();
    if (!db) return false;
    const adsRef = doc(db, "appData", "adsDoc");
    try {
        await setDoc(adsRef, { adsList: adsList }, { merge: true });
        return true;
    } catch (error) { console.error("saveAdsToDb error:", error); return false; }
};

// Requests sync
window.syncRequestsFromDb = function() {
    const db = getDb();
    if (!db) { setTimeout(() => window.syncRequestsFromDb(), 1000); return; }
    const ref = doc(db, "appData", "requestsDoc");
    onSnapshot(ref, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.requestsList && Array.isArray(data.requestsList)) {
                originalSetItem.call(localStorage, 'app_requests', JSON.stringify(data.requestsList));
                if (window.renderRequests) window.renderRequests(data.requestsList);
            }
        }
    });
};

window.saveRequestsToDb = async function(requestsList) {
    const db = getDb();
    if (!db) return false;
    try {
        await setDoc(doc(db, "appData", "requestsDoc"), { requestsList: requestsList }, { merge: true });
        return true;
    } catch (e) { console.error("saveRequestsToDb error:", e); return false; }
};

// Settings sync
window.syncSettingsFromDb = function() {
    const db = getDb();
    if (!db) { setTimeout(() => window.syncSettingsFromDb(), 1000); return; }
    const ref = doc(db, "appData", "settingsDoc");
    onSnapshot(ref, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            originalSetItem.call(localStorage, 'app_settings', JSON.stringify(data));
            if (window.onSettingsUpdated) window.onSettingsUpdated(data);
        }
    });
};

window.saveSettingsToDb = async function(settingsData) {
    const db = getDb();
    if (!db) return false;
    try {
        await setDoc(doc(db, "appData", "settingsDoc"), settingsData, { merge: true });
        return true;
    } catch (e) { console.error("saveSettingsToDb error:", e); return false; }
};


// Generic Firestore CRUD operations
window.fbAddDoc = async function(colName, data) {
    const db = getDb();
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, colName), data);
        return docRef.id;
    } catch (e) { console.error("Error adding doc:", e); return null; }
};

window.fbGetDocs = async function(colName) {
    const db = getDb();
    if (!db) return [];
    try {
        const querySnapshot = await getDocs(collection(db, colName));
        return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("Error getting docs:", e); return []; }
};

window.fbGetDocsWhere = async function(colName, field, operator, value) {
    const db = getDb();
    if (!db) return [];
    try {
        const q = query(collection(db, colName), where(field, operator, value));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("Error getting docs:", e); return []; }
};

window.fbUpdateDoc = async function(colName, id, data) {
    const db = getDb();
    if (!db) return false;
    try {
        await updateDoc(doc(db, colName, id), data);
        return true;
    } catch (e) { console.error("Error updating doc:", e); return false; }
};

window.fbSetDoc = async function(colName, id, data) {
    const db = getDb();
    if (!db) return false;
    try {
        await setDoc(doc(db, colName, id), data, { merge: true });
        return true;
    } catch (e) { console.error("Error setting doc:", e); return false; }
};

window.fbDeleteDoc = async function(colName, id) {
    const db = getDb();
    if (!db) return false;
    try {
        await deleteDoc(doc(db, colName, id));
        return true;
    } catch (e) { console.error("Error deleting doc:", e); return false; }
};

// ✅ localStorage interceptor - auto-sync to Firebase on every write
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
    // Always write locally first
    originalSetItem(key, value);
    
    const syncKeys = {
        'admin_requests': 'requests',
        'business_directory': 'businesses',
        'business_portfolio': 'portfolios',
        'business_blueprints': 'blueprints',
        'business_products': 'products',
        'dynamic_ads': 'dynamic_ads',
        'registeredUsers': 'users',
        'plan_prices': 'prices',
        'app_ads_v3': null // handled by saveAdsToDb separately
    };

    if (!syncKeys.hasOwnProperty(key) || !syncKeys[key]) return;
    if (!window.fbSetDoc) return;

    try {
        const items = JSON.parse(value);
        if (!Array.isArray(items)) return;
        const colName = syncKeys[key];
        items.forEach(item => {
            let docId = item.id ? item.id.toString() : null;
            if (!docId && item.phone) docId = item.phone;
            if (docId) {
                window.fbSetDoc(colName, docId, item);
            }
        });
    } catch (e) {
        console.error('Firebase sync error for key ' + key + ':', e);
    }
};

// ✅ Download all data from Firebase on startup
window.downloadAllFirebaseData = async function() {
    const db = getDb();
    if (!db) {
        console.log('Firebase not ready, will retry download...');
        setTimeout(window.downloadAllFirebaseData, 2000);
        return;
    }
    try {
        const syncKeys = {
            'requests': 'admin_requests',
            'businesses': 'business_directory',
            'portfolios': 'business_portfolio',
            'blueprints': 'business_blueprints',
            'products': 'business_products',
            'dynamic_ads': 'dynamic_ads',
            'users': 'registeredUsers',
            'prices': 'plan_prices'
        };

        for (const [colName, locKey] of Object.entries(syncKeys)) {
            const docs = await window.fbGetDocs(colName);
            if (docs && docs.length > 0) {
                originalSetItem(locKey, JSON.stringify(docs));
                console.log('Downloaded ' + docs.length + ' records for ' + locKey);
            }
        }
        console.log('✅ All Firebase data synced to localStorage');
        
        // After download, start ads sync
        window.syncAdsFromDb();
        
        // Trigger UI refresh
        if (window.renderAll) window.renderAll();
        if (window.updateAdminBadge) window.updateAdminBadge();
        
    } catch(e) {
        console.error('Error downloading from Firebase:', e);
    }
};

// 🚀 Wait for Firebase to be ready, then start sync
function waitForFirebase() {
    if (window.firebaseDb) {
        console.log('Firebase ready, starting sync...');
        window.downloadAllFirebaseData();
        if (window.syncAdsFromDb) window.syncAdsFromDb();
        if (window.syncRequestsFromDb) window.syncRequestsFromDb();
        if (window.syncSettingsFromDb) window.syncSettingsFromDb();
    } else {
        setTimeout(waitForFirebase, 500);
    }
}

// Start waiting after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitForFirebase, 500));
} else {
    setTimeout(waitForFirebase, 500);
}
