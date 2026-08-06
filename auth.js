// Tabooga Auth & Admin Handler
window.openAdminPanel = async function() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) adminModal.classList.remove('hidden');
    
    try {
        if (typeof renderAdminData === 'function') {
            renderAdminData();
        }
    } catch(e) {
        console.error("Error in admin panel:", e);
    }
};

window.toggleUserStatus = async function(uid, currentStatus) {
    try {
        let users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        users = users.map(u => {
            if (u.id === uid || u.phone === uid) {
                u.status = currentStatus === 'blocked' ? 'active' : 'blocked';
            }
            return u;
        });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        if (window.taboogaSync && typeof window.taboogaSync.syncKey === 'function') {
            window.taboogaSync.syncKey('registeredUsers', users);
        }
        Swal.fire('تم', 'تم تغيير حالة المستخدم بنجاح', 'success');
        if (typeof renderAdminData === 'function') renderAdminData();
    } catch(e) {
        console.error(e);
        Swal.fire('خطأ', 'حدث خطأ أثناء تعديل الحالة', 'error');
    }
};
