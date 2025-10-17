// scripts/auth.js
import { switchView } from './ui.js';

export function setupAuth() {
    const authView = document.getElementById('auth-view');
    const forgotPasswordView = document.getElementById('forgot-password-view');
    const resetPasswordView = document.getElementById('reset-password-view');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const usernameInput = document.getElementById('username');
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.className = 'modal-input';
    emailInput.placeholder = 'Adresse e-mail';
    emailInput.required = true;
    emailInput.autocomplete = 'email';
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthBtn = document.getElementById('switch-auth-btn');
    const errorMessage = document.getElementById('error-message');
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    let activeResetToken = null;
    let isLoginMode = true;

    function switchAuthMode() {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Connexion' : 'Inscription';
        authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
        switchAuthBtn.textContent = isLoginMode ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter';
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
                throw new Error(result.error || 'Une erreur est survenue.');
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    }

    async function handleRequestReset(e) {
        e.preventDefault();
        const email = document.getElementById('email-forgot').value;
        const messageEl = document.getElementById('forgot-message');
        messageEl.style.display = 'block';
        messageEl.className = 'message';
        messageEl.textContent = 'Envoi en cours...';
        try {
            const response = await fetch('api/request_password_reset.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erreur du serveur.');
            messageEl.className = 'message success';
            messageEl.textContent = result.message;
        } catch (error) {
            messageEl.className = 'message error';
            messageEl.textContent = error.message;
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password-reset').value;
        const messageEl = document.getElementById('reset-message');
        messageEl.style.display = 'block';
        messageEl.className = 'message';
        messageEl.textContent = 'Enregistrement...';
        try {
            const response = await fetch('api/reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: activeResetToken, password: newPassword })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erreur du serveur.');
            messageEl.className = 'message success';
            messageEl.textContent = result.message + " Vous pouvez maintenant vous connecter.";
            setTimeout(() => {
                switchView(authView);
                messageEl.style.display = 'none';
                resetPasswordForm.reset();
            }, 3000);
        } catch (error) {
            messageEl.className = 'message error';
            messageEl.textContent = error.message;
        }
    }

    function checkForResetToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('reset_token');
        if (token) {
            // *** CORRECTION CLÉ ***
            // On lève un "drapeau" pour que main.js soit au courant.
            window.isResettingPassword = true;

            activeResetToken = token;
            switchView(resetPasswordView, true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    switchAuthBtn.addEventListener('click', switchAuthMode);
    authForm.addEventListener('submit', handleAuth);
    forgotPasswordBtn.addEventListener('click', () => switchView(forgotPasswordView));
    backToLoginBtn.addEventListener('click', () => switchView(authView));
    forgotPasswordForm.addEventListener('submit', handleRequestReset);
    resetPasswordForm.addEventListener('submit', handleResetPassword);
    
    checkForResetToken();
}