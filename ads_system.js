// ==========================================
// TABOOGA ADS SYSTEM V4
// ==========================================

window._hasInjectedAdsCSS = false;

function injectAdsCSS() {
    if (window._hasInjectedAdsCSS) return;
    window._hasInjectedAdsCSS = true;
    const style = document.createElement('style');
    style.innerHTML = `
        .ad-slide-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: #0f172a; /* Solid dark background to prevent it from looking messy */
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .ad-bg-blur {
            position: absolute;
            top: -20px;
            left: -20px;
            right: -20px;
            bottom: -20px;
            background-size: cover;
            background-position: center;
            filter: blur(15px) brightness(0.4);
            z-index: 0;
            transform: scale(1.1);
        }
        .ad-main-img {
            width: 100%;
            height: 100%;
            object-fit: fill !important;
            position: relative;
            z-index: 1;
        }
        .ad-slide-caption {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            color: #fff;
            padding: 15px 10px 5px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            z-index: 2;
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif;
        }
        .ad-dashboard-modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: #f8fafc;
            z-index: 99999;
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'Cairo', sans-serif;
        }
        .ad-dashboard-modal.active {
            transform: translateY(0);
        }
        .ad-card {
            background: white;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
            display: flex;
            gap: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
            align-items: center;
        }
        .ad-card img {
            width: 80px;
            height: 80px;
            object-fit: fill !important;
            border-radius: 8px;
            background: #f1f5f9;
        }
        .ad-card-info {
            flex: 1;
            text-align: right;
        }
        .ad-card-title {
            margin: 0 0 5px;
            font-weight: bold;
            color: #1e293b;
        }
        .ad-card-meta {
            margin: 0;
            font-size: 0.8rem;
            color: #64748b;
        }
        .ad-card-actions button {
            background: #fee2e2;
            color: #ef4444;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 8px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

// 1. Storage & Sync Logic
window.getAds = function() {
    let ads = [];
    try {
        const stored = localStorage.getItem('app_ads_v4');
        if (stored) {
            ads = JSON.parse(stored);
        }
    } catch(e) {}
    
    // Fallback to default if empty
    if (ads.length === 0 && typeof defaultAdsList !== 'undefined') {
        return defaultAdsList;
    }
    return ads;
};

window.saveAds = async function(ads) {
    localStorage.setItem('app_ads_v4', JSON.stringify(ads));
    window.renderAds(ads);
    
    // Sync with Firebase Background
    if (typeof window.fbSetDoc === 'function') {
        try {
            await window.fbSetDoc('appData', 'adsDoc', {
                adsList: ads,
                lastUpdated: new Date().toISOString()
            });
            console.log("Ads synced to Firebase");
        } catch(e) {
            console.error("Failed to sync ads to Firebase", e);
        }
    }
};

window.fetchAdsFromServer = async function() {
    if (typeof window.fbGetDocs === 'function') {
        try {
            const docs = await window.fbGetDocs('appData');
            const adsDoc = docs.find(d => d.id === 'adsDoc');
            if (adsDoc && adsDoc.adsList) {
                localStorage.setItem('app_ads_v4', JSON.stringify(adsDoc.adsList));
                window.renderAds(adsDoc.adsList);
            }
        } catch(e) {}
    }
};

// 2. Rendering Logic
window.renderAds = function(forcedAds) {
    injectAdsCSS();
    const ads = forcedAds || window.getAds();
    const sections = ['home', 'renovation', 'shop', 'pros', 'plans', 'business'];

    const sliderMap = {
        'home': 'homeAdSlider',
        'renovation': 'renovAdSlider',
        'shop': 'adSlider',
        'pros': 'prosHero',       
        'plans': 'plansHero',     
        'business': 'bizHero'     
    };

    sections.forEach(sec => {
        const sliderId = sliderMap[sec];
        const container = document.getElementById(sliderId);

        if (!container) return;

        const sectionAds = ads.filter(a => a.section === sec);
        
        if (sectionAds.length === 0) {
            // Keep container but empty it or hide it
            container.innerHTML = '';
            return;
        }

        let html = '';
        sectionAds.forEach((ad, idx) => {
            const act = (idx === 0) ? 'active' : '';
            const caption = ad.title ? `<div class="ad-slide-caption">${ad.title}</div>` : '';
            const safeLink = ad.link && ad.link !== '#' ? ad.link : null;
            
            // Generate Ad Slide with Blurred Background
            html += `
            <div class="ad-slide ${act}" style="background:none;" onclick="${safeLink ? `window.open('${safeLink}', '_blank')` : ''}">
                <div class="ad-slide-wrapper">
                    
                    <img class="ad-main-img" src="${ad.image}" alt="${ad.title || ''}">
                    ${caption}
                </div>
            </div>`;
        });

        container.innerHTML = html;
        
        // Restart interval
        if (typeof window.startSliderInterval === 'function') {
            window.startSliderInterval(container, sectionAds.length);
        }
    });
};

// 3. Ad Manager UI
window.showAdDashboard = function() {
    let modal = document.getElementById('adManagerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adManagerModal';
        modal.className = 'ad-dashboard-modal';
        document.body.appendChild(modal);
    }
    
    const ads = window.getAds();
    const sectionNames = {
        'home': 'الرئيسية',
        'renovation': 'الترميم',
        'shop': 'السوق',
        'pros': 'الخبراء',
        'plans': 'المخططات',
        'business': 'الشركات'
    };

    let adsListHtml = ads.length === 0 ? '<p style="text-align:center; color:#94a3b8; margin-top:50px;">لا توجد إعلانات حالياً</p>' : '';
    
    ads.forEach(ad => {
        adsListHtml += `
        <div class="ad-card">
            <img src="${ad.image}" alt="ad">
            <div class="ad-card-info">
                <h4 class="ad-card-title">${ad.title || 'بدون عنوان'}</h4>
                <p class="ad-card-meta">القسم: ${sectionNames[ad.section] || ad.section}</p>
                <p class="ad-card-meta" style="color:#3b82f6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr;">${ad.link || '#'}</p>
            </div>
            <div class="ad-card-actions">
                <button onclick="window.deleteAd('${ad.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });

    modal.innerHTML = `
        <div style="background:linear-gradient(135deg, #0f172a, #1e293b); padding:15px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; color:white;">
            <h3 style="margin:0; font-size:1.1rem;"><i class="fa-solid fa-rectangle-ad"></i> مدير الإعلانات</h3>
            <button onclick="document.getElementById('adManagerModal').classList.remove('active')" style="background:rgba(255,255,255,0.1); border:none; color:white; width:35px; height:35px; border-radius:50%; font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px; padding-bottom:100px;">
            <button onclick="window.addNewAd()" style="width:100%; background:#10b981; color:white; border:none; padding:15px; border-radius:12px; font-weight:bold; font-size:1.1rem; cursor:pointer; margin-bottom:20px; box-shadow:0 4px 10px rgba(16,185,129,0.3);">
                <i class="fa-solid fa-plus"></i> إضافة إعلان جديد
            </button>
            ${adsListHtml}
        </div>
    `;

    // Wait a tick for DOM update, then slide in
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
};

// 4. Delete Logic
window.deleteAd = function(id) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا الإعلان؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            let ads = window.getAds();
            ads = ads.filter(a => a.id !== id);
            window.saveAds(ads);
            window.showAdDashboard(); // Refresh
            Swal.fire('تم', 'تم حذف الإعلان بنجاح', 'success');
        }
    });
};

// 5. Image Compression Helper (Canvas)
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Target width: max 1200px for good quality banners
                
                let width = img.width;
                let height = img.height;
                if (width > 800) {
                    height = height * (800 / width);
                    width = 800;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Lower quality to 0.6 ensures extremely small size (30-50KB)
                resolve(canvas.toDataURL('image/webp', 0.6));

            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// 6. Add New Ad Logic
window.addNewAd = function() {
    Swal.fire({
        title: 'إضافة إعلان جديد',
        html: `
            <div style="text-align:right;">
                <label style="font-size:0.9rem; font-weight:bold; color:#1e293b; display:block; margin-bottom:5px;">عنوان الشركة / الإعلان:</label>
                <input id="swal-ad-title" class="swal2-input" placeholder="مثال: شركة الأمل للمقاولات" style="margin:0 0 15px; width:100%; box-sizing:border-box;">
                
                <label style="font-size:0.9rem; font-weight:bold; color:#1e293b; display:block; margin-bottom:5px;">رابط التوجيه (اختياري):</label>
                <input id="swal-ad-link" class="swal2-input" placeholder="رابط الموقع أو واتساب" dir="ltr" style="margin:0 0 15px; width:100%; box-sizing:border-box; text-align:left;">
                
                <label style="font-size:0.9rem; font-weight:bold; color:#1e293b; display:block; margin-bottom:5px;">قسم العرض:</label>
                <select id="swal-ad-section" class="swal2-input" style="margin:0 0 15px; width:100%; box-sizing:border-box; height:auto; padding:10px;">
                    <option value="home">الرئيسية</option>
                    <option value="renovation">الترميم</option>
                    <option value="shop">السوق الإنشائي</option>
                    <option value="pros">الخبراء والخلفات</option>
                    <option value="plans">المخططات</option>
                    <option value="business">مركز الشركات</option>
                </select>

                <label style="font-size:0.9rem; font-weight:bold; color:#1e293b; display:block; margin-bottom:5px;">صورة الإعلان:</label>
                <div style="border:2px dashed #cbd5e1; padding:20px; border-radius:10px; text-align:center;">
                    <input type="file" id="swal-ad-file" accept="image/*" style="display:none;">
                    <button id="swal-ad-file-btn" style="background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;" onclick="document.getElementById('swal-ad-file').click(); return false;">
                        <i class="fa-solid fa-image"></i> اختر صورة من الهاتف
                    </button>
                    <p id="swal-ad-filename" style="font-size:0.8rem; margin-top:10px; color:#64748b; margin-bottom:0;"></p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'حفظ ورفع الإعلان',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#10b981',
        didOpen: () => {
            document.getElementById('swal-ad-file').addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    document.getElementById('swal-ad-filename').innerText = "تم اختيار: " + e.target.files[0].name;
                    document.getElementById('swal-ad-file-btn').style.background = '#10b981';
                }
            });
        },
        preConfirm: async () => {
            const title = document.getElementById('swal-ad-title').value;
            const link = document.getElementById('swal-ad-link').value || '#';
            const section = document.getElementById('swal-ad-section').value;
            const fileInput = document.getElementById('swal-ad-file');

            if (!fileInput.files || fileInput.files.length === 0) {
                Swal.showValidationMessage('الرجاء اختيار صورة الإعلان');
                return false;
            }

            Swal.fire({ title: 'جاري رفع الإعلان...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            try {
                // Compress locally
                const base64Image = await compressImage(fileInput.files[0]);

                // Upload to Cloudinary
                
                // Save base64 string directly! No external API needed, no CORS, no limits.
                return {
                    id: 'ad_' + Date.now(),
                    title: title,
                    link: link,
                    section: section,
                    image: base64Image
                };

            } catch (error) {
                console.error(error);
                Swal.showValidationMessage('حدث خطأ أثناء رفع الصورة');
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            let ads = window.getAds();
            ads.push(result.value);
            window.saveAds(ads);
            Swal.fire('تم بنجاح', 'تم إضافة الإعلان ونشره', 'success').then(() => {
                window.showAdDashboard();
            });
        }
    });
};

// Background sync on boot
setTimeout(() => {
    window.fetchAdsFromServer();
}, 2000);
