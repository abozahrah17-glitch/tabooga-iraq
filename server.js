const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || null;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Resilient static path resolution
const appStablePath = fs.existsSync(path.join(__dirname, '../app_stable'))
    ? path.join(__dirname, '../app_stable')
    : (fs.existsSync(path.join(__dirname, 'app_stable'))
        ? path.join(__dirname, 'app_stable')
        : path.join(process.cwd(), 'app_stable'));

// Serve light APK
app.get('/tabooga.apk', (req, res) => {
    const apkPath = fs.existsSync(path.join(__dirname, '../tabooga.apk'))
        ? path.join(__dirname, '../tabooga.apk')
        : path.join(process.cwd(), 'tabooga.apk');
    if (fs.existsSync(apkPath)) {
        res.download(apkPath, 'Benaa_Iraq_Tabooga.apk');
    } else {
        res.status(404).send('APK file not found');
    }
});

// Serve static frontend files
app.use(express.static(appStablePath));

// Explicit homepage route
app.get('/', (req, res) => {
    const possibleIndexPaths = [
        path.join(appStablePath, 'index.html'),
        path.join(__dirname, 'app_stable/index.html'),
        path.join(__dirname, '../app_stable/index.html'),
        path.join(process.cwd(), 'app_stable/index.html'),
        path.join(process.cwd(), 'index.html')
    ];
    for (const indexPath of possibleIndexPaths) {
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    res.status(404).send('Tabooga App Frontend files not found');
});

// ==========================================
// DATABASE LAYER (MongoDB OR local JSON)
// ==========================================

let db_mongo = null;
const DB_COLLECTION = 'tabooga_state';

// Fallback: local JSON file
const DB_FILE = fs.existsSync(path.join(__dirname, 'database.json'))
    ? path.join(__dirname, 'database.json')
    : (fs.existsSync(path.join(__dirname, 'backend/database.json'))
        ? path.join(__dirname, 'backend/database.json')
        : path.join(process.cwd(), 'database.json'));

function readLocalDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {}
    return {
        registeredUsers: [],
        public_requests: [],
        admin_requests: [],
        business_directory: [],
        business_products: [],
        business_portfolio: [],
        tabooqa_custom_portfolios: {},
        tabooqa_custom_covers: {},
        tabooqa_custom_logos: {},
        tabooqa_free_blueprints: [],
        dynamic_ads: [],
        payment_settings: {}
    };
}

function writeLocalDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch(e) {}
}

async function readDB() {
    if (db_mongo) {
        const col = db_mongo.collection(DB_COLLECTION);
        const doc = await col.findOne({ _id: 'main' });
        if (doc) {
            const { _id, ...data } = doc;
            return data;
        }
        return {};
    }
    return readLocalDB();
}

async function writeDB(data) {
    if (db_mongo) {
        const col = db_mongo.collection(DB_COLLECTION);
        await col.replaceOne({ _id: 'main' }, { _id: 'main', ...data }, { upsert: true });
    } else {
        writeLocalDB(data);
    }
}

// ==========================================
// CONNECT TO MONGODB THEN START SERVER
// ==========================================

async function startServer() {
    if (MONGO_URI) {
        try {
            const client = new MongoClient(MONGO_URI);
            await client.connect();
            db_mongo = client.db('tabooga_db');
            console.log('✅ Connected to MongoDB Atlas');

            // Seed initial data if empty
            const col = db_mongo.collection(DB_COLLECTION);
            const existing = await col.findOne({ _id: 'main' });
            if (!existing) {
                await col.insertOne({
                    _id: 'main',
                    registeredUsers: [],
                    public_requests: [],
                    admin_requests: [],
                    business_directory: [],
                    business_products: [],
                    business_portfolio: [],
                    tabooqa_custom_portfolios: {},
                    tabooqa_custom_covers: {},
                    tabooqa_custom_logos: {},
                    tabooqa_free_blueprints: [],
                    dynamic_ads: [],
                    payment_settings: {}
                });
                console.log('✅ Initial DB state created');
            }
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
            console.log('⚠️ Falling back to local JSON file...');
            db_mongo = null;
        }
    } else {
        console.log('ℹ️ No MONGO_URI found, using local JSON file');
    }

    // ==========================================
    // API ROUTES
    // ==========================================

    // Health check + connection test
    app.get('/api/ping', (req, res) => {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[PING] from ${clientIP} at ${new Date().toLocaleTimeString('ar-IQ')}`);
        res.json({ ok: true, time: new Date().toISOString(), server: 'Tabooga v1.0', db: db_mongo ? 'MongoDB' : 'LocalJSON' });
    });

    // Get full state
    app.get('/api/state', async (req, res) => {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[GET /state] from ${clientIP}`);
        const data = await readDB();
        res.json(data);
    });

    // Update specific key in state
    app.post('/api/sync', async (req, res) => {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Key required' });

        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[SYNC] key=${key} from ${clientIP}`);

        const db = await readDB();
        db[key] = value;
        await writeDB(db);

        res.json({ success: true });
    });

    // Register user (dedicated)
    app.post('/api/register', async (req, res) => {
        const user = req.body;
        if (!user || !user.phone) return res.status(400).json({ error: 'Invalid user data' });

        const db = await readDB();
        if (!Array.isArray(db.registeredUsers)) db.registeredUsers = [];

        const exists = db.registeredUsers.find(u => u.phone === user.phone);
        if (exists) return res.status(409).json({ error: 'User already exists' });

        user.registeredAt = new Date().toISOString();
        db.registeredUsers.push(user);
        await writeDB(db);

        console.log(`[REGISTER] New user: ${user.phone}`);
        res.json({ success: true, user });
    });

    // Get all users
    app.get('/api/users', async (req, res) => {
        const db = await readDB();
        res.json(db.registeredUsers || []);
    });

    // Post public request
    app.post('/api/requests', async (req, res) => {
        const request = req.body;
        const db = await readDB();
        if (!Array.isArray(db.public_requests)) db.public_requests = [];

        request.id = Date.now();
        request.createdAt = new Date().toISOString();
        db.public_requests.unshift(request);
        await writeDB(db);

        console.log(`[NEW REQUEST] ${request.title || 'Untitled'}`);
        res.json({ success: true, request });
    });

    // Get public requests
    app.get('/api/requests', async (req, res) => {
        const db = await readDB();
        res.json(db.public_requests || []);
    });

    // Purge full state (Factory Reset by Admin)
    app.post('/api/purge-all', async (req, res) => {
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log(`[PURGE ALL] Full Factory Reset triggered from ${clientIP}`);
        const emptyDB = {
            registeredUsers: [],
            public_requests: [],
            admin_requests: [],
            business_directory: [],
            business_products: [],
            business_portfolio: [],
            tabooqa_custom_portfolios: {},
            tabooqa_custom_covers: {},
            tabooqa_custom_logos: {},
            tabooqa_free_blueprints: [],
            dynamic_ads: [],
            payment_settings: {}
        };
        await writeDB(emptyDB);
        res.json({ success: true, message: 'Platform Database Purged Successfully' });
    });

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('=======================================');
        console.log('  🚀 Tabooga Backend Server is LIVE!');
        console.log(`  📡 Listening on port: ${PORT}`);
        console.log('=======================================');
        console.log('');
    });
}

startServer();
