// scripts/main.js
import { switchView, setupCommonEventListeners, updateWelcomeMessage, updateProfilePicture } from './ui.js';
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile, updateDescriptionDisplay } from './profile.js';
import { registerServiceWorker, initializePushNotifications } from './notifications.js';


async function logout() {
    await fetch('api/logout.php');
    document.location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. On attache les écouteurs qui sont toujours présents
    setupCommonEventListeners();
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // 2. On enregistre le Service Worker
    await registerServiceWorker();

    // 3. On gère la session et on initialise l'application
    const currentUser = await setupAuth();
    initializeApp(currentUser);
});

function initializeApp(user) {
    if (user) {
        // L'utilisateur est connecté
        updateWelcomeMessage(user.username);
        updateProfilePicture(user.profile_picture);
        updateDescriptionDisplay(user.description);
        
        // Initialise les modules restants
        setupScores();
        setupFriends();
        setupProfile();
        initializePushNotifications();

        // Affiche la vue principale
        switchView(document.getElementById('main-view'));

    } else {
        // L'utilisateur n'est pas connecté
        switchView(document.getElementById('auth-view'));
    }

    document.body.classList.add('app-loaded');
}