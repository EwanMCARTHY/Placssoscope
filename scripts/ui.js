// scripts/ui.js

let currentView = null;

/**
 * Affiche une vue spécifique et masque les autres.
 * @param {HTMLElement} viewToShow - L'élément de la vue à afficher.
 */
export function switchView(viewToShow) {
    if (currentView) {
        currentView.classList.remove('active-view');
    }
    if (viewToShow) {
        viewToShow.classList.add('active-view');
    }
    currentView = viewToShow;
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

/**
 * Vérifie la session et retourne les données de l'utilisateur si connecté.
 * @returns {Promise<object|null>} - Un objet utilisateur ou null.
 */
export async function checkSession() {
    try {
        // *** CORRECTION APPLIQUÉE ICI ***
        // On ajoute un paramètre unique pour forcer le navigateur à ne pas utiliser
        // une réponse mise en cache et à toujours demander les données à jour.
        const response = await fetch('api/check_session.php?t=' + new Date().getTime());
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                return {
                    username: result.username,
                    profile_picture: result.profile_picture,
                    description: result.description
                };
            }
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        return null;
    }
}

/**
 * Met à jour les éléments de l'interface utilisateur avec les données de l'utilisateur.
 * @param {object} user - L'objet contenant les données de l'utilisateur.
 */
function updateUserDataInUI(user) {
    if (!user) return;

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Bienvenue, ${user.username} !`;
    }

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        const picUrl = (user.profile_picture || 'assets/default-avatar.png') + '?t=' + new Date().getTime();
        profileBtn.innerHTML = `<img src="${picUrl}" alt="Mon Profil" class="profile-picture-icon">`;
    }

    const profilePicDisplay = document.getElementById('profile-pic-display');
    if (profilePicDisplay) {
        profilePicDisplay.src = (user.profile_picture || 'assets/default-avatar.png') + '?t=' + new Date().getTime();
    }
    const profileDescriptionText = document.getElementById('profile-description-text');
    if (profileDescriptionText) {
        profileDescriptionText.textContent = user.description || 'Aucune description.';
    }
}


/**
 * Initialise l'interface principale et tous les écouteurs d'événements globaux.
 * @param {object} user - L'objet utilisateur provenant de checkSession.
 */
export function initializeApp(user) {
    updateUserDataInUI(user);
    setupGlobalEventListeners();
    switchView(document.getElementById('main-view'));
}

/**
 * Configure tous les écouteurs d'événements globaux.
 */
function setupGlobalEventListeners() {
    const mainView = document.getElementById('main-view');
    const infoModal = document.getElementById('info-modal');

    document.getElementById('profile-btn')?.addEventListener('click', () => switchView(document.getElementById('profile-view')));
    document.getElementById('friends-btn')?.addEventListener('click', () => switchView(document.getElementById('friends-view')));

    document.getElementById('info-btn')?.addEventListener('click', () => showModal(infoModal));
    document.getElementById('close-info-modal-btn')?.addEventListener('click', () => hideModal(infoModal));
    
    document.getElementById('back-to-main-btn')?.addEventListener('click', () => switchView(mainView));
    document.getElementById('back-to-main-from-profile-btn')?.addEventListener('click', () => switchView(mainView));
    document.getElementById('back-to-main-from-friends-btn')?.addEventListener('click', () => switchView(mainView));

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try {
            await fetch('api/logout.php');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            window.location.reload();
        }
    });
}

/**
 * Affiche ou masque l'indicateur de chargement.
 * @param {boolean} isLoading - Si vrai, affiche le loader, sinon le masque.
 */
export function showLoader(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = isLoading ? 'flex' : 'none';
    }
}

export function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}