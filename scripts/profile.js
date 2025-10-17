// scripts/profile.js
import { switchView } from './ui.js';

export function setupProfile() {
    const profileView = document.getElementById('profile-view');
    const changeUsernameForm = document.getElementById('change-username-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const uploadPictureForm = document.getElementById('upload-picture-form');
    const pictureInput = document.getElementById('picture-input');
    const uploadSubmitBtn = document.getElementById('upload-submit-btn');
    const profilePicDisplay = document.getElementById('profile-pic-display');
    const descriptionDisplay = document.getElementById('description-display');
    const descriptionEditor = document.getElementById('description-editor');
    const editDescriptionBtn = document.getElementById('edit-description-btn');
    const cancelDescriptionBtn = document.getElementById('cancel-description-btn');
    const saveDescriptionBtn = document.getElementById('save-description-btn');
    const descriptionText = document.getElementById('profile-description-text');
    const descriptionTextarea = document.getElementById('profile-description-textarea');

    async function handlePictureUpload(event) {
        event.preventDefault();
        const formData = new FormData();
        if (pictureInput.files.length === 0) return;
        formData.append('profile_picture', pictureInput.files[0]);

        try {
            const response = await fetch('api/upload_picture.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Photo de profil mise à jour !');
                window.location.reload(); // Recharger pour voir les changements partout
            } else {
                throw new Error(result.error || "Une erreur s'est produite.");
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function handleChangeUsername(event) {
        event.preventDefault();
        const newUsername = document.getElementById('new-username').value;
        try {
            const response = await fetch('api/change_username.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUsername })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Nom d\'utilisateur changé avec succès !');
                window.location.reload();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (newPassword !== confirmPassword) {
            alert("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }
        try {
            const response = await fetch('api/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Mot de passe changé avec succès !');
                changePasswordForm.reset();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function handleDeleteAccount() {
        const confirmation = prompt("Pour confirmer la suppression DÉFINITIVE de votre compte, tapez 'SUPPRIMER'.");
        if (confirmation !== 'SUPPRIMER') return;
        try {
            const response = await fetch('api/delete_account.php', { method: 'POST' });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Votre compte a été supprimé.');
                window.location.reload();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function saveDescription() {
        const newDescription = descriptionTextarea.value;
        try {
            const response = await fetch('api/update_description.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: newDescription })
            });
            const result = await response.json();
            if(response.ok && result.success) {
                descriptionText.textContent = newDescription || 'Aucune description.';
                descriptionDisplay.style.display = 'flex';
                descriptionEditor.style.display = 'none';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
             alert(`Erreur : ${error.message}`);
        }
    }

    // Écouteurs d'événements
    document.getElementById('profile-btn').addEventListener('click', () => switchView(profileView));
    changeUsernameForm.addEventListener('submit', handleChangeUsername);
    changePasswordForm.addEventListener('submit', handleChangePassword);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    uploadPictureForm.addEventListener('submit', handlePictureUpload);
    pictureInput.addEventListener('change', () => {
        if (pictureInput.files.length > 0) {
            uploadSubmitBtn.style.display = 'block';
        }
    });

    editDescriptionBtn.addEventListener('click', () => {
        descriptionTextarea.value = descriptionText.textContent === 'Aucune description.' ? '' : descriptionText.textContent;
        descriptionDisplay.style.display = 'none';
        descriptionEditor.style.display = 'block';
    });

    cancelDescriptionBtn.addEventListener('click', () => {
        descriptionDisplay.style.display = 'flex';
        descriptionEditor.style.display = 'none';
    });
    
    saveDescriptionBtn.addEventListener('click', saveDescription);
    
    // Logique de l'accordéon
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const panel = header.nextElementSibling;
            header.classList.toggle('active');
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
}