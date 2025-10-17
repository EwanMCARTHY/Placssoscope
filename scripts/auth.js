// scripts/auth.js
import { switchView } from './ui.js';

export function setupAuth() {
    // --- Vues de l'application ---
    const authView = document.getElementById('auth-view');
    const forgotPasswordView = document.getElementById('forgot-password-view');
    const resetPasswordView = document.getElementById('reset-password-view');

    // --- Éléments d'authentification ---
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const usernameInput = document.getElementById('username');
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.className = 'modal-input';
    emailInput.placeholder = 'Adresse e-mail';
    emailInput.required = true;

    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthBtn = document.getElementById('switch-auth-btn');
    const errorMessage = document.getElementById('error-message');
    
    // --- Éléments du mot de passe oublié ---
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    let activeResetToken = null;
    
    // --- État ---
    let isLoginMode = true;

    function switchAuthMode() {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Connexion' : 'Inscription';
        authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
        switchAuthBtn.textContent = isLoginMode ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter';
        errorMessage.style.display = 'none';
        authForm.reset();
        
        if (!isLoginMode && !document.getElementById('email')) {
            usernameInput.after(emailInput);
        } else if (isLoginMode && document.getElementById('email')) {
            emailInput.remove();
        }
    }

    async function handleAuth(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember-me').checked;
        const endpoint = isLoginMode ? 'api/login.php' : 'api/register.php';
        
        const body = { username, password, remember };
        if (!isLoginMode) {
            body.email = emailInput.value;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                window.location.reload();
            } else {
                throw new Error(result.error || 'Une erreur inconnue est survenue.');
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    }
    
    // --- Logique du mot de passe oublié ---

    async function handleRequestReset(e) {
        e.preventDefault();
        const email = document.getElementById('email-forgot').value;
        const messageEl = document.getElementById('forgot-message');
        const submitBtn = e.target.querySelector('button');
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('api/request_password_reset.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            messageEl.style.display = 'block';

            if (response.ok && result.success) {
                messageEl.className = 'message success';
                messageEl.textContent = result.message;
                forgotPasswordForm.reset();
            } else {
                throw new Error(result.error || 'Une erreur est survenue.');
            }
        } catch (error) {
            messageEl.className = 'message error';
            messageEl.textContent = error.message;
        } finally {
            submitBtn.disabled = false;
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password-reset').value;
        const messageEl = document.getElementById('reset-message');
        const submitBtn = e.target.querySelector('button');
        submitBtn.disabled = true;

        if (!activeResetToken) {
            messageEl.className = 'message error';
            messageEl.textContent = "Aucun jeton de réinitialisation trouvé.";
            submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('api/reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: activeResetToken, password: newPassword })
            });
            const result = await response.json();
            messageEl.style.display = 'block';

            if (response.ok && result.success) {
                messageEl.className = 'message success';
                messageEl.textContent = result.message + " Vous allez être redirigé vers la page de connexion.";
                setTimeout(() => {
                    switchView(authView);
                    resetPasswordForm.reset(); // Vider le formulaire
                    messageEl.style.display = 'none'; // Cacher le message
                }, 3000);
            } else {
                throw new Error(result.error || 'La réinitialisation a échoué.');
            }
        } catch (error) {
            messageEl.className = 'message error';
            messageEl.textContent = error.message;
        } finally {
             // On ne réactive pas le bouton en cas de succès pour éviter double soumission
            if (!messageEl.classList.contains('success')) {
                submitBtn.disabled = false;
            }
        }
    }
    
    function checkForResetToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('reset_token');
        if (token) {
            activeResetToken = token;
            switchView(resetPasswordView, true);
            // Nettoie l'URL pour ne pas laisser le jeton visible
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // --- Écouteurs d'événements ---
    switchAuthBtn.addEventListener('click', switchAuthMode);
    authForm.addEventListener('submit', handleAuth);
    forgotPasswordBtn.addEventListener('click', () => switchView(forgotPasswordView));
    backToLoginBtn.addEventListener('click', () => switchView(authView));
    forgotPasswordForm.addEventListener('submit', handleRequestReset);
    resetPasswordForm.addEventListener('submit', handleResetPassword);
    
    // Au chargement initial, vérifier si un jeton est dans l'URL
    checkForResetToken();
}