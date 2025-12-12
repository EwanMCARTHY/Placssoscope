// scripts/main.js
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends, updateNotificationDot } from './friends.js';
import { setupProfile } from './profile.js';
import { initializeApp, checkSession, switchView } from './ui.js';
import { initializeNotifications, registerServiceWorker } from './notifications.js';

function startClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;

    function update() {
        const now = new Date();
        // Force l'heure sur le fuseau Paris si besoin, ou locale
        clockEl.textContent = now.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    update(); // Appel immédiat
    setInterval(update, 1000); // Mise à jour chaque seconde
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (urlParams.has('reset_token')) {
        setupAuth();
        return;
    }

    const user = await checkSession();

    if (user) {
        initializeApp(user);
        startClock();
        await registerServiceWorker();
        initializeNotifications();

        setupScores(user);
        setupFriends(user);
        setupProfile(user);
        
        await updateNotificationDot();

        if (action === 'show_friend_requests') {
            const friendsBtn = document.getElementById('friends-btn');
            if (friendsBtn) {
                friendsBtn.click();
                
                // On attend juste un instant que la vue s'affiche, puis on bascule sur l'onglet
                setTimeout(() => {
                    const requestsTab = document.querySelector('.tab-link[data-tab="tab-requests"]');
                    if (requestsTab) requestsTab.click();
                }, 100);
            }
            // Nettoyage de l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

    } else {
        setupAuth();
        switchView(document.getElementById('auth-view'));
    }
});