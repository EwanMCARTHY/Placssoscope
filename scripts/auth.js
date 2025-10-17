// scripts/auth.js
import { switchView } from './ui.js';

// --- Fonctions internes ---

async function checkSession() {
    try {
        const response = await fetch('api/check_session.php');
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
        console.error("Aucune session active.");
        return null;
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember-me').checked;
    const endpoint = isLoginMode ? 'api/login.php' : 'api/register.php';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, remember })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            document.location.reload();
        } else {
            throw new Error(result.error || 'Une erreur est survenue.');
        }
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
    }
}

let isLoginMode = true;
function switchAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? 'Connexion' : 'Inscription';
    document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
    document.getElementById('switch-auth-btn').textContent = isLoginMode ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('auth-form').reset();
}

// --- Fonctions exportées ---

export function setupAuth() {
    // Configure uniquement les écouteurs du formulaire de connexion
    document.getElementById('switch-auth-btn').addEventListener('click', switchAuthMode);
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    // Renvoie la promesse de vérification de session
    return checkSession();
}