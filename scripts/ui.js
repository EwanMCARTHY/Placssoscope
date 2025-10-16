// scripts/ui.js

// --- Vues de l'application ---
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const historyView = document.getElementById('history-view');
const profileView = document.getElementById('profile-view');
const friendsView = document.getElementById('friends-view');
const friendProfileView = document.getElementById('friend-profile-view');
const sharedEveningView = document.getElementById('shared-evening-view');

// --- Modales ---
const infoModal = document.getElementById('info-modal');
const editModal = document.getElementById('edit-modal');
const renameDayModal = document.getElementById('rename-day-modal');

export function switchView(viewToShow) {
    [authView, mainView, historyView, profileView, friendsView, friendProfileView, sharedEveningView].forEach(v => {
        if (v) v.classList.remove('active-view');
    });
    if (viewToShow) viewToShow.classList.add('active-view');
}

export function showModal(modal) {
    modal.classList.add('visible');
}

export function hideModal(modal) {
    modal.classList.remove('visible');
}

export function updateWelcomeMessage(username) {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bienvenue, ${username} !`;
    }
}

export function updateProfilePicture(picUrl) {
    const profilePicDisplay = document.getElementById('profile-pic-display');
    let headerIcon = document.querySelector('.header-actions .profile-picture-icon');

    const finalPicUrl = picUrl || 'assets/default-avatar.png';

    if (profilePicDisplay) profilePicDisplay.src = finalPicUrl;

    if (!headerIcon) {
        headerIcon = document.createElement('img');
        headerIcon.className = 'profile-picture-icon';
        headerIcon.title = 'Mon Profil';
        headerIcon.addEventListener('click', () => switchView(profileView));
        document.querySelector('.header-actions').prepend(headerIcon);
    }
    headerIcon.src = finalPicUrl;
}

export function setupCommonEventListeners() {
    // Écouteurs pour les modales
    document.getElementById('info-btn').addEventListener('click', () => showModal(infoModal));
    document.getElementById('close-info-modal-btn').addEventListener('click', () => hideModal(infoModal));
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) hideModal(infoModal); });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => hideModal(editModal));
    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideModal(editModal); });

    document.getElementById('cancel-rename-btn').addEventListener('click', () => hideModal(renameDayModal));
    renameDayModal.addEventListener('click', (e) => { if (e.target === renameDayModal) hideModal(renameDayModal); });

    // Navigation de base
    document.getElementById('back-to-main-btn').addEventListener('click', () => switchView(mainView));
    document.getElementById('back-to-main-from-profile-btn').addEventListener('click', () => switchView(mainView));
    document.getElementById('back-to-main-from-friends-btn').addEventListener('click', () => switchView(mainView));
    document.getElementById('profile-btn').addEventListener('click', () => switchView(profileView));

    // Accordéon
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            document.querySelectorAll('.accordion-header').forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                }
            });
            header.classList.toggle('active');
            const panel = header.nextElementSibling;
            panel.style.maxHeight = panel.style.maxHeight ? null : `${panel.scrollHeight}px`;
        });
    });
}