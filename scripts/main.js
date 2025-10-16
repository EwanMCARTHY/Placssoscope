// scripts/main.js
import { switchView, setupCommonEventListeners, updateWelcomeMessage, updateProfilePicture } from './ui.js';
import { setupAuth, logout } from './auth.js'; // On importe la fonction logout
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile } from './profile.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupCommonEventListeners();
    const currentUser = await setupAuth();
    initializeApp(currentUser);
});

function initializeApp(user) {
    if (user) {
        // L'utilisateur est connecté
        updateWelcomeMessage(user.username);
        updateProfilePicture(user.profile_picture);
        
        // LA CORRECTION EST ICI :
        // On attache l'écouteur pour le bouton de déconnexion ici,
        // garantissant qu'il est prêt et visible.
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        // On initialise tous les autres modules de l'application
        setupScores();
        setupFriends();
        setupProfile();

        // On affiche la vue principale
        switchView(document.getElementById('main-view'));
        document.body.classList.add('app-loaded');

    } else {
        // L'utilisateur n'est pas connecté
        switchView(document.getElementById('auth-view'));
        document.body.classList.add('app-loaded');
    }
}