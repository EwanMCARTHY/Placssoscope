// scripts/ui.js

let currentUser = null;

/**
 * Affiche une vue spécifique et masque les autres.
 * @param {HTMLElement} viewToShow - L'élément de la vue à afficher.
 * @param {boolean} [force=false] - Si vrai, force l'affichage même si une autre vue est active.
 */
export function switchView(viewToShow, force = false) {
    const views = document.querySelectorAll('.view');
    if (!force) {
        let alreadyActive = false;
        views.forEach(v => {
            if (v === viewToShow && v.classList.contains('active-view')) {
                alreadyActive = true;
            }
        });
        if (alreadyActive) return;
    }
    views.forEach(v => v.classList.remove('active-view'));
    if (viewToShow) {
        viewToShow.classList.add('active-view');
    }
}

/**
 * Vérifie la session PHP pour voir si un utilisateur est connecté.
 * @returns {Promise<boolean>} - Vrai si une session est active, sinon faux.
 */
export async function checkSession() {
    try {
        const response = await fetch('api/check_session.php');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentUser = {
                    username: result.username,
                    profile_picture: result.profile_picture
                };
                return true; // Session active
            }
        }
        // Afficher la vue de connexion si la session n'est pas valide
        switchView(document.getElementById('auth-view'), true);
        return false;
    } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        switchView(document.getElementById('auth-view'), true);
        return false; // Pas de session active
    }
}

/**
 * Initialise l'interface principale de l'application une fois l'utilisateur connecté.
 */
export function initializeApp() {
    if (currentUser) {
        document.getElementById('welcome-message').textContent = `Bienvenue, ${currentUser.username} !`;
        const picUrl = currentUser.profile_picture || 'assets/default-avatar.png';
        
        // Mettre à jour la photo de profil dans la vue de profil
        const profilePicDisplay = document.getElementById('profile-pic-display');
        if(profilePicDisplay) profilePicDisplay.src = picUrl;
        
        let headerIcon = document.querySelector('.header-actions .profile-picture-icon');
        if (!headerIcon) {
            headerIcon = document.createElement('img');
            headerIcon.className = 'profile-picture-icon';
            headerIcon.title = 'Mon Profil';
            headerIcon.addEventListener('click', () => switchView(document.getElementById('profile-view')));
            document.querySelector('.header-actions').prepend(headerIcon);
        }
        headerIcon.src = picUrl;
    }
    switchView(document.getElementById('main-view'));

    // Écouteurs d'événements généraux de l'UI
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api/logout.php');
        window.location.reload();
    });

    // Navigation principale
    document.getElementById('back-to-main-btn')?.addEventListener('click', () => switchView(document.getElementById('main-view')));
    document.getElementById('back-to-main-from-profile-btn')?.addEventListener('click', () => switchView(document.getElementById('main-view')));
    document.getElementById('back-to-main-from-friends-btn')?.addEventListener('click', () => switchView(document.getElementById('main-view')));
}


/**
 * Affiche une modale.
 * @param {HTMLElement} modal - L'élément de la modale à afficher.
 */
export function showModal(modal) {
    if (modal) modal.classList.add('visible');
}

/**
 * Masque une modale.
 * @param {HTMLElement} modal - L'élément de la modale à masquer.
 */
export function hideModal(modal) {
    if (modal) modal.classList.remove('visible');
}