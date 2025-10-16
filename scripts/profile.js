// scripts/profile.js
import { updateProfilePicture, updateWelcomeMessage } from './ui.js';

export function setupProfile() {

    // Gestion de la photo de profil
    const pictureInput = document.getElementById('picture-input');
    const uploadSubmitBtn = document.getElementById('upload-submit-btn');
    const profilePicDisplay = document.getElementById('profile-pic-display');

    pictureInput.addEventListener('change', () => {
        if (pictureInput.files.length > 0) {
            profilePicDisplay.src = URL.createObjectURL(pictureInput.files[0]);
            uploadSubmitBtn.style.display = 'block';
        }
    });

    document.getElementById('upload-picture-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const response = await fetch('api/upload_picture.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            alert('Photo mise à jour !');
            updateProfilePicture(result.filePath);
            uploadSubmitBtn.style.display = 'none';
        } else {
            alert(`Erreur : ${result.error}`);
        }
    });

    // Changement de nom d'utilisateur
    document.getElementById('change-username-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsernameInput = document.getElementById('new-username');
        const newUsername = newUsernameInput.value;
        const response = await fetch('api/change_username.php', {
            method: 'POST', body: JSON.stringify({ newUsername })
        });
        const result = await response.json();
        if (result.success) {
            alert('Nom d\'utilisateur mis à jour !');
            updateWelcomeMessage(result.newUsername);
            newUsernameInput.value = '';
        } else {
            alert(`Erreur : ${result.error}`);
        }
    });

    // Changement de mot de passe
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        const response = await fetch('api/change_password.php', {
            method: 'POST', body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
        const result = await response.json();
        if (result.success) {
            alert('Mot de passe mis à jour !');
            e.target.reset();
        } else {
            alert(`Erreur : ${result.error}`);
        }
    });

    // Suppression du compte
    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        if (prompt("Pour confirmer la suppression de votre compte, tapez 'SUPPRIMER'") === 'SUPPRIMER') {
            const response = await fetch('api/delete_account.php', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                document.location.reload();
            } else {
                alert("La suppression du compte a échoué.");
            }
        }
    });
}