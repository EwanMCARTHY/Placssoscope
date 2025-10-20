// scripts/main.js
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile } from './profile.js';
import { initializeApp, checkSession, switchView } from './ui.js';
import { initializeNotifications, registerServiceWorker } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    // Gère le cas de la réinitialisation du mot de passe
    if (urlParams.has('reset_token')) {
        setupAuth();
        return;
    }

    // Processus de démarrage normal
    const user = await checkSession();

    if (user) {
        initializeApp(user);
        await registerServiceWorker();
        initializeNotifications();

        // *** CORRECTION APPLIQUÉE ICI ***
        // L'appel à setupFriends est simplifié, sans paramètre superflu.
        setupScores(user);
        setupFriends(user);
        setupProfile(user);

        // Si l'URL contient l'action de la notification...
        if (action === 'show_friend_requests') {
            const friendsView = document.getElementById('friends-view');
            const requestsTab = document.querySelector('.tab-link[data-tab="tab-requests"]');
            
            // On s'assure que les éléments existent bien
            if (friendsView && requestsTab) {
                // 1. On affiche la page "Amis"
                switchView(friendsView);
                
                // 2. On simule un clic sur l'onglet "Demandes"
                requestsTab.click();
            }

            // On nettoie l'URL pour éviter que l'action se répète si l'utilisateur recharge la page
            window.history.replaceState({}, document.title, window.location.pathname);
        }

    } else {
        setupAuth();
        switchView(document.getElementById('auth-view'));
    }
});