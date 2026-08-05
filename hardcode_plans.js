const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const containerStart = html.indexOf('<div id="businessPlansContainer"');
if (containerStart !== -1) {
    const containerEnd = html.indexOf('</div>', containerStart) + 6;
    
    const hardcodedPlans = `<div id="businessPlansContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 25px;">
                            <!-- Hardcoded for 100% reliability -->
                            <div style="background: white; border: 1px solid #6366f130; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #6366f115; color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin: 0 auto 8px;">
                                        <i class="fa-solid fa-compass-drafting"></i>
                                    </div>
                                    <h4 style="margin: 0 0 5px; font-size: 0.85rem; color: #1e293b; font-weight: 800;">شراكة هندسية</h4>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#6366f1; font-size:0.6rem;"></i> ظهور للمقاولين</div>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#6366f1; font-size:0.6rem;"></i> طلبات مباشرة</div>
                                </div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                                    <div style="font-size: 0.9rem; font-weight: 900; color: #6366f1;">50,000 <span style="font-size:0.6rem;">د.ع/سنة</span></div>
                                </div>
                            </div>

                            <div style="background: white; border: 1px solid #f59e0b30; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #f59e0b15; color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin: 0 auto 8px;">
                                        <i class="fa-solid fa-hard-hat"></i>
                                    </div>
                                    <h4 style="margin: 0 0 5px; font-size: 0.85rem; color: #1e293b; font-weight: 800;">المقاول المعتمد</h4>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#f59e0b; font-size:0.6rem;"></i> إدارة مناقصات</div>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#f59e0b; font-size:0.6rem;"></i> بيانات الزبائن</div>
                                </div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                                    <div style="font-size: 0.9rem; font-weight: 900; color: #f59e0b;">35,000 <span style="font-size:0.6rem;">د.ع/سنة</span></div>
                                </div>
                            </div>

                            <div style="background: white; border: 1px solid #10b98130; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #10b98115; color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin: 0 auto 8px;">
                                        <i class="fa-solid fa-cubes"></i>
                                    </div>
                                    <h4 style="margin: 0 0 5px; font-size: 0.85rem; color: #1e293b; font-weight: 800;">وكيل / تاجر</h4>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#10b981; font-size:0.6rem;"></i> متجر متكامل</div>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#10b981; font-size:0.6rem;"></i> طلبات جملة</div>
                                </div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                                    <div style="font-size: 0.9rem; font-weight: 900; color: #10b981;">35,000 <span style="font-size:0.6rem;">د.ع/سنة</span></div>
                                </div>
                            </div>

                            <div style="background: white; border: 1px solid #3b82f630; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div style="width: 40px; height: 40px; border-radius: 10px; background: #3b82f615; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin: 0 auto 8px;">
                                        <i class="fa-solid fa-tools"></i>
                                    </div>
                                    <h4 style="margin: 0 0 5px; font-size: 0.85rem; color: #1e293b; font-weight: 800;">فني محترف</h4>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#3b82f6; font-size:0.6rem;"></i> معرض أعمال</div>
                                    <div style="font-size:0.7rem; color:#64748b; margin-top:4px;"><i class="fa-solid fa-check" style="color:#3b82f6; font-size:0.6rem;"></i> تقييم الزبائن</div>
                                </div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                                    <div style="font-size: 0.9rem; font-weight: 900; color: #3b82f6;">15,000 <span style="font-size:0.6rem;">د.ع/سنة</span></div>
                                </div>
                            </div>
                        </div>`;
    
    html = html.substring(0, containerStart) + hardcodedPlans + html.substring(containerEnd);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Successfully hardcoded business plans.");
} else {
    console.log("Could not find container.");
}
