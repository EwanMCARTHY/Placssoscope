// scripts/main.js
import { checkSession, initializeApp } from './ui.js';
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupProfile } from './profile.js';
import { setupFriends } from './friends.js';
import { registerServiceWorker, initializePushNotifications } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Configure la logique d'authentification (gère les vues de connexion/reset)
    setupAuth();

    // Vérifie si une session utilisateur est active
    const isSessionActive = await checkSession();

    // Si une session est active, configure le reste de l'application
    if (isSessionActive) {
        initializeApp();
        setupScores();
        setupProfile();
        setupFriends();
        
        // Configuration des notifications
        await registerServiceWorker();
        initializePushNotifications();
    }
});