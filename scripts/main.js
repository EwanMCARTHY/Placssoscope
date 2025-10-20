// scripts/main.js
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends, updateNotificationDot } from './friends.js';
import { setupProfile } from './profile.js';
import { initializeApp, checkSession, switchView } from './ui.js';
import { initializeNotifications, registerServiceWorker } from './notifications.js';

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
        await registerServiceWorker();
        initializeNotifications();

        setupScores(user);
        setupFriends(user);
        setupProfile(user);
        
        // *** CORRECTION FINALE APPLIQUÉE ICI ***
        // Après que tout est initialisé, on lance la vérification pour la pastille.
        await updateNotificationDot();

        if (action === 'show_friend_requests') {
            const friendsView = document.getElementById('friends-view');
            const requestsTab = document.querySelector('.tab-link[data-tab="tab-requests"]');
            
            if (friendsView && requestsTab) {
                switchView(friendsView);
                requestsTab.click();
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }

    } else {
        setupAuth();
        switchView(document.getElementById('auth-view'));
    }
});