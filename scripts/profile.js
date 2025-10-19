// scripts/profile.js
import { switchView } from './ui.js';

export function setupProfile() {
    const changeUsernameForm = document.getElementById('change-username-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const pictureInput = document.getElementById('picture-input');
    const profilePicDisplay = document.getElementById('profile-pic-display');
    const descriptionDisplay = document.getElementById('description-display');
    const descriptionEditor = document.getElementById('description-editor');
    const editDescriptionBtn = document.getElementById('edit-description-btn');
    const cancelDescriptionBtn = document.getElementById('cancel-description-btn');
    const saveDescriptionBtn = document.getElementById('save-description-btn');
    const descriptionText = document.getElementById('profile-description-text');
    const descriptionTextarea = document.getElementById('profile-description-textarea');

    // La fonction est maintenant appelée directement par l'événement 'change'
    async function uploadProfilePicture(file) {
        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await fetch('api/upload_picture.php', { method: 'POST', body: formData });
            const result = await response.json();
            
            if (response.ok && result.success && result.filepath) {
                const newPicUrl = result.filepath + '?t=' + new Date().getTime();
                
                profilePicDisplay.src = newPicUrl;
                
                const headerProfileIcon = document.querySelector('#profile-btn .profile-picture-icon');
                if(headerProfileIcon) {
                    headerProfileIcon.src = newPicUrl;
                }
                
                // La ligne d'alerte a été supprimée ici.

            } else {
                throw new Error(result.error || "La réponse du serveur est invalide.");
            }
        } catch (error) {
            // On garde l'alerte en cas d'erreur pour informer l'utilisateur
            alert(`Erreur lors de la mise à jour : ${error.message}`);
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

    // --- Écouteurs d'événements ---
    changeUsernameForm.addEventListener('submit', handleChangeUsername);
    changePasswordForm.addEventListener('submit', handleChangePassword);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    
    // On écoute le changement sur l'input de fichier
    pictureInput.addEventListener('change', (event) => {
        // S'il y a un fichier, on lance l'upload
        if (event.target.files.length > 0) {
            uploadProfilePicture(event.target.files[0]);
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