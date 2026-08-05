const fs = require('fs');

let js = fs.readFileSync('script.js', 'utf8');

const targetOld = `    else if(actionType === 'portfolio') {
        Swal.fire({
            title: 'إضافة عمل إلى المعرض',
            html: \`
                <input id="swal-p1" class="swal2-input" placeholder="عنوان العمل">
                <input id="swal-p2" class="swal2-input" placeholder="تفاصيل العمل">
            \`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'نشر',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return [
                    document.getElementById('swal-p1').value,
                    document.getElementById('swal-p2').value
                ]
            }
        }).then((result) => {
            if(result.isConfirmed && result.value[0]) {
                const title = result.value[0];
                const desc = result.value[1];
                
                if (window.currentProId) {
                    if (!constructionData.portfolios) constructionData.portfolios = [];
                    const newPort = {
                        id: 'pf' + Date.now(),
                        proId: window.currentProId,
                        title: title,
                        image: 'assets/images/tabooga_plans_blueprints_1766770505402.png',
                        desc: desc || 'عمل جديد',
                        isCustom: true
                    };
                    
                    constructionData.portfolios.unshift(newPort);
                    
                    // Save to local storage
                    let savedPortfolios = JSON.parse(localStorage.getItem('tabooqa_custom_portfolios')) || [];
                    savedPortfolios.unshift(newPort);
                    localStorage.setItem('tabooqa_custom_portfolios', JSON.stringify(savedPortfolios));
                    
                    window.openProProfile(window.currentProId);
                }
                
                Swal.fire('تم النشر', 'تم إضافة عملك بنجاح', 'success');
            }
        });
    }`;

const newPortfolioCode = `    else if(actionType === 'portfolio') {
        Swal.fire({
            title: 'إضافة عمل إلى المعرض',
            html: \`
                <input id="swal-p1" class="swal2-input" placeholder="عنوان العمل (مثال: تشطيب فيلا)">
                <input id="swal-p2" class="swal2-input" placeholder="تفاصيل العمل أو المساحة">
                <div style="margin-top:15px; text-align:right;">
                    <label style="font-size:0.9rem; color:var(--text-light); margin-bottom:5px; display:block;"><i class="fa-solid fa-camera"></i> إرفاق صورة العمل (رابط URL أو ملف)</label>
                    <input id="swal-p3" class="swal2-input" placeholder="رابط الصورة (URL) إن وجد" style="margin-bottom:10px;">
                    <input type="file" id="swal-p4" accept="image/*" class="swal2-input" style="padding: 10px; height: auto;">
                </div>
            \`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-cloud-arrow-up"></i> نشر العمل',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const title = document.getElementById('swal-p1').value;
                const desc = document.getElementById('swal-p2').value;
                const imgUrl = document.getElementById('swal-p3').value;
                const fileInput = document.getElementById('swal-p4');
                
                if(!title) {
                    Swal.showValidationMessage('الرجاء إدخال عنوان العمل');
                    return false;
                }
                
                return new Promise((resolve) => {
                    if (fileInput.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve([title, desc, e.target.result]);
                        };
                        reader.readAsDataURL(fileInput.files[0]);
                    } else {
                        resolve([title, desc, imgUrl]);
                    }
                });
            }
        }).then((result) => {
            if(result.isConfirmed && result.value) {
                const title = result.value[0];
                const desc = result.value[1];
                let image = result.value[2];
                
                if (!image) image = 'assets/images/tabooga_plans_blueprints_1766770505402.png';
                
                if (window.currentProId) {
                    if (!constructionData.portfolios) constructionData.portfolios = [];
                    const newPort = {
                        id: 'pf' + Date.now(),
                        proId: window.currentProId,
                        title: title,
                        images: [image],
                        desc: desc || 'عمل جديد من تنفيذنا',
                        isCustom: true
                    };
                    
                    constructionData.portfolios.unshift(newPort);
                    
                    let savedPortfolios = JSON.parse(localStorage.getItem('tabooqa_custom_portfolios')) || [];
                    savedPortfolios.unshift(newPort);
                    try {
                        localStorage.setItem('tabooqa_custom_portfolios', JSON.stringify(savedPortfolios));
                    } catch(e) {
                        console.warn("Storage quota exceeded, could not save image permanently");
                    }
                    
                    window.openProProfile(window.currentProId);
                }
                
                Swal.fire('تم النشر بنجاح!', 'تمت إضافة العمل إلى معرض الصور الخاص بك.', 'success');
            }
        });
    }`;

// Use robust replacing by searching for the start of the block and replacing the block.
const startIdx = js.indexOf("else if(actionType === 'portfolio') {");
if (startIdx !== -1) {
    const endIdx = js.indexOf("else if(actionType === 'publicBlueprint') {", startIdx);
    if (endIdx !== -1) {
        js = js.substring(0, startIdx) + newPortfolioCode + '\n    ' + js.substring(endIdx);
        fs.writeFileSync('script.js', js, 'utf8');
        console.log("Successfully updated portfolio button logic.");
    } else {
        console.log("Could not find publicBlueprint block to slice.");
    }
} else {
    console.log("Could not find portfolio block.");
}
