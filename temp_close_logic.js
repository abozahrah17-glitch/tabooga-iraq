
function closeAdminStats() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.style.transition = "transform 0.3s ease";
    modal.style.transform = "translateY(100%)";

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}
