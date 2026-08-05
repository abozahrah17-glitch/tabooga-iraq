/**
 * Iraq Construction Cost Data
 * Prices are estimated in Iraqi Dinar (IQD)
 * Last Updated: December 2025
 */

const constructionData = {
    prices: {
        // Material Prices
        cement_ton: 140000,         // Cement per ton (Normal)
        cement_resist_ton: 155000,  // Sulfate Resistant cement
        steel_ton: 1150000,         // Rebar steel per ton
        brick_1000: 220000,         // Bricks per 1000 pieces
        sand_load: 250000,          // Sand per truck load (Lorry)
        block_1000: 650000,         // Concrete blocks per 1000
        thermo_m3: 185000,          // Thermostone per cubic meter
        gypsum_bag: 7500,           // Gypsum/Bork per bag (approx 25-40kg)

        // Finishing Materials (Average per m2)
        ceramic_floor_m2: 12000,
        porcelain_floor_m2: 25000,
        paint_m2: 5000,
        sanitary_set_avg: 850000,   // Average Sanitary set

        // Labor Costs (Estimates)
        labor_daily: 25000,    // Unskilled worker
        master_daily: 60000,   // Skilled master (Usta)
        engineer_supervision_percent: 0.03 // 3% of total cost
    },

    // Consumption Rates (Technical Standards)
    rates: {
        bricks_per_m2_wall: 140, // for 24cm wall
        cement_bags_per_m3_concrete: 7, // Structural concrete
        steel_kg_per_m3_concrete: 100, // Average for residential
        sand_per_m2_build: 0.4, // Rough estimate m3
        gravel_per_m2_build: 0.5 // Rough estimate m3
    },

    finish_multipliers: {
        commercial: 1.0,
        average: 1.3,
        premium: 1.8
    },

    governorates: {
        baghdad: { name: "\u0628\u063a\u062f\u0627\u062d", modifier: 1.0 },
        basra: { name: "\u0627\u0644\u0628\u0635\u0631\u0629", modifier: 1.15 },
        erbil: { name: "\u0623\u0631\u0628\u064a\u0644", modifier: 1.2 },
        nineveh: { name: "\u0646\u064a\u0646\u0648\u0649 (\u0627\u0644\u0645\u0648\u0635\u0644)", modifier: 0.95 },
        babylon: { name: "\u0628\u0627\u0628\u0644", modifier: 1.0 },
        najaf: { name: "\u0627\u0644\u0646\u062c\u0641", modifier: 1.05 },
        karbala: { name: "\u0643\u0631\u0628\u0644\u0627\u0621", modifier: 1.05 },
        wasit: { name: "\u0648\u0627\u0633\u0637", modifier: 0.95 },
        thiqar: { name: "\u0630\u064a \u0642\u0627\u0631", modifier: 0.95 },
        missan: { name: "\u0645\u064a\u0633\u0627\u0646", modifier: 1.0 },
        muthanna: { name: "\u0627\u0644\u0645\u062b\u0646\u0649", modifier: 0.85 },
        qadisiya: { name: "\u0627\u0644\u0642\u0627\u062f\u0633\u064a\u0629", modifier: 0.9 },
        diyala: { name: "\u062f\u064a\u0627\u0644\u0649", modifier: 0.95 },
        anbar: { name: "\u0627\u0644\u0623\u0646\u0628\u0627\u0631", modifier: 0.95 },
        kirkuk: { name: "\u0643\u0631\u0643\u0648\u0643", modifier: 1.05 },
        salahaddin: { name: "\u0635\u0644\u0627\u062d \u0627\u0644\u062f\u064a\u0646", modifier: 0.95 },
        dohuk: { name: "\u062f\u0647\u0648\u0643", modifier: 1.1 },
        sulaymaniyah: { name: "\u0627\u0644\u0633\u0644\u064a\u0645\u0627\u0646\u064a\u0629", modifier: 1.1 }
    },

    ads: [
        {
            company: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0631\u0627\u0641\u062f\u064a\u0646 \u0644\u0644\u0645\u0642\u0627\u0648\u0644\u0627\u062a",
            desc: "\u062a\u0635\u0627\u0645\u064a\u0645 \u0647\u0646\u062f\u0633\u064a\u0629 \u0648\u062a\u0646\u0641\u064a\u0630 \u0628\u0623\u062d\u062f\u062b \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062a",
            phone: "07701234567"
        },
        {
            company: "\u0645\u0643\u062a\u0628 \u0628\u063a\u062f\u0627\u062f \u0627\u0644\u0647\u0646\u062f\u0633\u064a",
            desc: "\u062e\u0631\u0627\u0626\u0637 \u0628\u0646\u0627\u0621 \u0648\u0625\u0634\u0631\u0627\u0641 \u0647\u0646\u062f\u0633\u064a \u0645\u062a\u0643\u0627\u0645\u0644",
            phone: "07901234567"
        },
        {
            company: "\u0645\u062c\u0645\u0639 \u0627\u0644\u0628\u0646\u0627\u0621 \u0627\u0644\u062d\u062f\u064a\u062b",
            desc: "\u062a\u062c\u0647\u064a\u0632 \u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0625\u0646\u0634\u0627\u0626\u064a\u0629 \u0648\u0627\u0635\u0644 \u0644\u0644\u0645\u0648\u0642\u0639",
            phone: "07801234567"
        }
    ],

    notifications: [
        {
            id: 1,
            title: "تحديث جديد (نسخة 2.0)",
            desc: "تم تفعيل نظام التسجيل الموحد وربط الفئات بخطط الاشتراك الجديدة. شكراً لاستخدامكم طابوقة!"
        },
        {
            id: 2,
            title: "معايرة البصرة والعراق 2026",
            desc: "تمت إعادة معايرة الحاسبة لتطابق كلف البناء الحقيقية (200-250 ألف للمتر هيكل) و (450-550 ألف تسليم مفتاح). شكراً لملاحظاتكم!"
        }
    ],

    // Real-time Market Data
    market: {
        usd_iqd: 1530, // Market rate
        last_sync: "2026-01-05T09:00:00Z",
        status: "stable"
    },

    // Historical price trends (for AI Prediction)
    historical: {
        steel: [1100000, 1120000, 1150000, 1180000, 1150000], // Last 5 weeks
        cement: [135000, 138000, 140000, 140000, 142000],
        brick: [210000, 215000, 220000, 220000, 225000]
    },

    // Engineering Section Data
    engineeringSettings: {
        freeTrialDays: 30
    },
    requests: [
        {
            id: 'req1',
            customerName: 'أحمد جاسم',
            customerPhone: '07712345678',
            type: 'تصميم خارطة',
            details: 'لدي قطعة أرض 150م واجهة 7.5م وأحتاج تصميم مودرن بـ 3 غرف نوم.',
            date: '2026-07-13T09:00:00Z',
            status: 'open'
        },
        {
            id: 'req2',
            customerName: 'مصطفى العراقي',
            customerPhone: '07812345678',
            type: 'تنفيذ أعمال',
            details: 'أبحث عن مقاول سيراميك محترف لتنفيذ حمامات ومطابخ بمساحة 100م.',
            date: '2026-07-12T15:30:00Z',
            status: 'open'
        }
    ],
    offices: [
        {
            id: 'off1',
            name: 'مكتب العمارة الحديثة',
            governorate: 'baghdad',
            desc: 'مكتب استشاري متخصص في التصاميم المودرن والكلاسيك مع إشراف هندسي مباشر.',
            phone: '07701234567',
            logo: 'fa-building-columns',
            coverImage: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            subscriptionStart: '2026-06-01T00:00:00Z' // Active
        },
        {
            id: 'off2',
            name: 'مجموعة المهندس علي',
            governorate: 'basra',
            desc: 'نصمم لك بيت أحلامك بأرقى المواصفات ونوفر لك كافة المخططات المعمارية والإنشائية.',
            phone: '07801234567',
            logo: 'fa-compass-drafting',
            coverImage: 'assets/images/tabooga_pros_engineer_1766770490376.png',
            subscriptionStart: '2025-01-01T00:00:00Z' // Expired
        }
    ],
    blueprints: [
        {
            id: 'plan_50',
            officeId: 'off1',
            name: 'دار 50م اقتصادي',
            area: 50,
            dims: '5m x 10m',
            rooms: 1,
            style: 'اقتصادي',
            image: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            desc: 'استغلال أمثل للمساحات الصغيرة، غرف واسعة قياساً بالمساحة وتصميم عصري.'
        },
        {
            id: 'plan_100',
            officeId: 'off1',
            name: 'دار 100م كلاسيك',
            area: 100,
            dims: '10m x 10m',
            rooms: 2,
            style: 'Classic',
            image: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            desc: 'تصميم اقتصادي مميز لعائلة صغيرة مع واجهة كلاسيكية راقية.'
        },
        {
            id: 'plan_150',
            officeId: 'off2',
            name: 'فيلا 150م مودرن',
            area: 150,
            dims: '7.5m x 20m',
            rooms: 3,
            style: 'Modern',
            image: 'assets/images/tabooga_pros_engineer_1766770490376.png',
            desc: 'واجهة عصرية مع استغلال أمثل للإضاءة وتوزيع مريح للغرف.'
        },
        {
            id: 'plan_200',
            officeId: 'off1',
            name: 'منزل 200م طابقين',
            area: 200,
            dims: '10m x 20m',
            rooms: 4,
            style: 'Duplex',
            image: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            desc: 'مناسب للعائلات الكبيرة مع خصوصية عالية وحديقة أمامية.'
        }
    ],

    // Market Section Data
    marketSettings: {
        freeTrialDays: 30
    },
    merchants: [
        {
            id: 'm1',
            name: 'شركة النور للمواد الإنشائية',
            governorate: 'baghdad',
            desc: 'تجهيز كافة أنواع الحديد والاسمنت',
            phone: '07701234567',
            logo: 'fa-store',
            coverImage: 'assets/images/tabooga_shop_materials_1766770459515.png',
            subscriptionStart: '2026-05-01T00:00:00Z' // Older date, might be expired depending on current date
        },
        {
            id: 'm2',
            name: 'معمل طابوق الفيحاء',
            governorate: 'basra',
            desc: 'طابوق عالي الجودة للبناء الحديث',
            phone: '07801234567',
            logo: 'fa-industry',
            coverImage: 'assets/images/tabooga_shop_materials_1766770459515.png',
            subscriptionStart: new Date().toISOString() // Active
        }
    ],
    products: [
        {
            id: 'p1',
            merchantId: 'm1',
            name: 'اسمنت مقاوم',
            category: 'cement',
            price: 155000,
            unit: 'طن',
            image: 'fa-sack-xmark'
        },
        {
            id: 'p2',
            merchantId: 'm2',
            name: 'طابوق مثقب',
            category: 'brick',
            price: 220000,
            unit: 'ألف طابوقة',
            image: 'fa-cubes'
        }
    ],
    // Pros Section Data
    prosSettings: {
        freeTrialDays: 30
    },
    proServices: [
        { id: 'ps1', proId: 'pro1', name: 'تصميم خارطة 100م متكاملة', desc: 'تصميم معماري وإنشائي واجهات 3D لقطعة 100 متر.', price: 150000, isCustom: false },
        { id: 'ps2', proId: 'pro1', name: 'استشارة هندسية في الموقع', desc: 'زيارة موقع العمل وإعطاء استشارات لتقوية الأساسات وتعديل المسارات.', price: 50000, isCustom: false },
        { id: 'ps3', proId: 'pro2', name: 'تصميم ديكور داخلي للمتر', desc: 'تصميم داخلي مع توزيع إنارة وخرائط سقف ثانوي.', price: 6000, isCustom: false },
        { id: 'ps4', proId: 'pro3', name: 'إشراف على صب السقف', desc: 'إشراف هندسي يوم الصب لضمان جودة الخرسانة والحدادة.', price: 100000, isCustom: false }
    ],
    pros: [
        {
            id: 'pro1',
            name: 'المهندس علي كريم',
            category: 'تصميم معماري',
            governorate: 'baghdad',
            desc: 'خبرة 10 سنوات في تصميم الفلل والمجمعات السكنية الحديثة، متخصص بالواجهات المودرن.',
            phone: '07712345678',
            logo: 'fa-user-tie',
            coverImage: 'assets/images/tabooga_pros_engineer_1766770490376.png',
            subscriptionStart: '2026-06-01T00:00:00Z'
        },
        {
            id: 'pro2',
            name: 'مكتب الإبداع الهندسي',
            category: 'مقاولات عامة',
            governorate: 'basra',
            desc: 'تنفيذ كافة أعمال البناء والتسليم مفتاح بجودة عالية وبإشراف هندسي مباشر.',
            phone: '07812345678',
            logo: 'fa-hard-hat',
            coverImage: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            subscriptionStart: '2025-01-01T00:00:00Z'
        }
    ],
    portfolios: [
        {
            id: 'pf1',
            proId: 'pro1',
            title: 'فيلا مودرن 200م',
            image: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
            desc: 'تصميم واجهة وتنفيذ داخلي.'
        },
        {
            id: 'pf2',
            proId: 'pro2',
            title: 'مجمع تجاري',
            image: 'assets/images/tabooga_shop_materials_1766770459515.png',
            desc: 'إشراف وتنفيذ كامل.'
        }
    ]
};
