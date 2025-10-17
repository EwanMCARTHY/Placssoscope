import { setupAuth } from './auth.js';
import { setupScores } from './scores.js';
import { setupFriends } from './friends.js';
import { setupProfile } from './profile.js';
import { switchView, showLoader } from './ui.js';
import { initializeNotifications } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');

    // On initialise le drapeau à "faux".
    window.isResettingPassword = false;
    
    // setupAuth() va potentiellement passer le drapeau à "vrai".
    setupAuth();
    
    // *** CORRECTION CLÉ ***
    // On vérifie le drapeau au lieu de l'URL.
    if (window.isResettingPassword) {
        showLoader(false);
        // On arrête tout, le formulaire de reset est déjà affiché.
        return; 
    }

    // Le code ci-dessous ne s'exécutera que si on n'est PAS en train de réinitialiser le mot de passe.
    try {
        showLoader(true);
        const response = await fetch('api/check_session.php');
        if (!response.ok) {
            throw new Error('Non authentifié');
        }
        const user = await response.json();

        switchView(mainView);
        initializeNotifications();
        setupScores(user);
        setupFriends(user);
        setupProfile(user);

    } catch (error) {
        switchView(authView);
    } finally {
        showLoader(false);
    }
});