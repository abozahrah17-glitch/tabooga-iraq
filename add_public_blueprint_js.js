const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const publicBlueprintCode = `
    else if(actionType === 'publicBlueprint') {
        Swal.fire({
            title: 'رفع مخطط جديد',
            html: \`
                <div style="text-align: right; margin-bottom: 10px; font-size: 0.9rem;">اسم المخطط (مثال: دار 100م)</div>
                <input id="swal-b1" class="swal2-input" placeholder="اسم المخطط" style="margin-top:0;">
                
                <div style="text-align: right; margin-bottom: 10px; margin-top: 15px; font-size: 0.9rem;">المساحة (متر مربع)</div>
                <input id="swal-b2" type="number" class="swal2-input" placeholder="المساحة" style="margin-top:0;">
                
                <div style="text-align: right; margin-bottom: 10px; margin-top: 15px; font-size: 0.9rem;">اختر صورة المخطط</div>
                <input id="swal-b-file" type="file" accept="image/*" class="swal2-input" style="margin-top:0; padding: 10px;">
            \`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'رفع ونشر',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const b1 = document.getElementById('swal-b1').value;
                const b2 = document.getElementById('swal-b2').value;
                const fileInput = document.getElementById('swal-b-file');
                
                if (!b1 || !b2 || !fileInput.files || fileInput.files.length === 0) {
                    Swal.showValidationMessage('يرجى ملء جميع الحقول واختيار صورة');
                    return false;
                }
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve([b1, b2, e.target.result]);
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                });
            }
        }).then((result) => {
            if(result.isConfirmed && result.value) {
                const name = result.value[0];
                const area = parseInt(result.value[1]);
                const imgDataUrl = result.value[2];
                
                if (!constructionData.blueprints) constructionData.blueprints = [];
                const newPlan = {
                    id: 'plan_' + Date.now(),
                    officeId: 'off1', // Assign to an existing office or general
                    name: name,
                    area: area,
                    dims: '',
                    rooms: 3,
                    style: 'جديد',
                    image: imgDataUrl,
                    desc: 'خارطة جديدة تم رفعها بواسطة المستخدم.',
                    isCustom: true
                };
                
                // Add to start of blueprints
                constructionData.blueprints.unshift(newPlan);
                
                // Save to local storage
                let savedBlueprints = JSON.parse(localStorage.getItem('tabooqa_custom_blueprints')) || [];
                savedBlueprints.unshift(newPlan);
                localStorage.setItem('tabooqa_custom_blueprints', JSON.stringify(savedBlueprints));
                
                // Re-render blueprints view if active
                if(typeof renderBlueprints === 'function') {
                    renderBlueprints('all');
                }
                
                Swal.fire('تم الرفع', 'تم نشر المخطط بنجاح في قسم الهندسية', 'success');
            }
        });
    }
`;

if (!js.includes("actionType === 'publicBlueprint'")) {
    // find 'else if(actionType === 'blueprint') {'
    js = js.replace("else if(actionType === 'blueprint') {", publicBlueprintCode.trim() + "\n    else if(actionType === 'blueprint') {");
    fs.writeFileSync('script.js', js, 'utf8');
    console.log("publicBlueprint injected in script.js");
} else {
    console.log("Already has publicBlueprint");
}
