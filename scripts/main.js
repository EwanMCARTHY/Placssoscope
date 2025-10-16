// scripts/main.js
import { switchView, setupCommonEventListeners, updateWelcomeMessage, updateProfilePicture } from './ui.js';
import { setupAuth, logout } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile, updateDescriptionDisplay } from './profile.js';

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
        updateDescriptionDisplay(user.description); // On met à jour la description
        
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        setupScores();
        setupFriends();
        setupProfile();

        switchView(document.getElementById('main-view'));
        document.body.classList.add('app-loaded');

    } else {
        // L'utilisateur n'est pas connecté
        switchView(document.getElementById('auth-view'));
        document.body.classList.add('app-loaded');
    }
}