// scripts/main.js
import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile } from './profile.js';
import { initializeApp, checkSession, switchView, showLoader } from './ui.js';
import { initializeNotifications, registerServiceWorker } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Gère le cas spécial de la réinitialisation du mot de passe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset_token')) {
        setupAuth(); // La fonction setupAuth gère l'affichage de la vue de réinitialisation
        return; // On arrête l'exécution ici
    }

    // Processus de démarrage normal
    const user = await checkSession();

    if (user) {
        // 1. Initialiser l'application principale et les écouteurs globaux
        initializeApp(user);

        // 2. Enregistrer le Service Worker et initialiser les notifications
        await registerServiceWorker();
        initializeNotifications();

        // 3. Configurer les modules spécifiques (scores, amis, profil)
        setupScores(user);
        setupFriends(user);
        setupProfile(user);
    } else {
        // Si aucun utilisateur n'est connecté, configurer et afficher la vue d'authentification
        setupAuth();
        switchView(document.getElementById('auth-view'));
    }
});