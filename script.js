document.addEventListener('DOMContentLoaded', () => {
    // --- Vues de l'application ---
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');
    const historyView = document.getElementById('history-view');
    const profileView = document.getElementById('profile-view');
    const friendsView = document.getElementById('friends-view');
    const friendProfileView = document.getElementById('friend-profile-view');
    const sharedEveningView = document.getElementById('shared-evening-view');

    // --- Éléments d'authentification et Header ---
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthBtn = document.getElementById('switch-auth-btn');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    const infoBtn = document.getElementById('info-btn');

    // --- Éléments de la page principale ---
    const sendScoreBtn = document.getElementById('send-score-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const scoreValueDisplay = document.getElementById('score-value-display');
    
    // --- Éléments de la page d'historique ---
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const scoresListContainer = document.getElementById('scores-list');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    const listContainer = document.getElementById('list-container');
    const chartFilterDropdown = document.getElementById('chart-filter-dropdown');
    const chartFilterBtn = document.getElementById('chart-filter-btn');
    const chartFilterBtnText = document.getElementById('chart-filter-btn-text');
    const chartFilterPanel = document.getElementById('chart-filter-panel');
    const chartFilterList = document.getElementById('chart-filter-list');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');

    // --- Éléments de la page de profil ---
    const profileBtn = document.getElementById('profile-btn');
    const backToMainFromProfileBtn = document.getElementById('back-to-main-from-profile-btn');
    const changeUsernameForm = document.getElementById('change-username-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const uploadPictureForm = document.getElementById('upload-picture-form');
    const pictureInput = document.getElementById('picture-input');
    const uploadSubmitBtn = document.getElementById('upload-submit-btn');
    const profilePicDisplay = document.getElementById('profile-pic-display');

    // --- Éléments de la page Amis ---
    const friendsBtn = document.getElementById('friends-btn');
    const backToMainFromFriendsBtn = document.getElementById('back-to-main-from-friends-btn');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const requestsCountBadge = document.getElementById('requests-count-badge');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const userSearchInput = document.getElementById('user-search-input');
    const userSearchResults = document.getElementById('user-search-results');
    const friendsList = document.getElementById('friends-list');
    const friendSuggestionsList = document.getElementById('friend-suggestions-list');

    // --- Éléments du Profil Ami ---
    const backToFriendsListBtn = document.getElementById('back-to-friends-list-btn');
    const friendProfileName = document.getElementById('friend-profile-name');
    const friendProfilePic = document.getElementById('friend-profile-pic');
    const friendProfileUsername = document.getElementById('friend-profile-username');
    const commonEveningsList = document.getElementById('common-evenings-list');

    // --- Éléments de la Soirée Partagée ---
    const backToFriendProfileBtn = document.getElementById('back-to-friend-profile-btn');
    const sharedEveningTitle = document.getElementById('shared-evening-title');
    const attendeesList = document.getElementById('attendees-list');

    // --- Éléments des modales ---
    const infoModal = document.getElementById('info-modal');
    const closeInfoModalBtn = document.getElementById('close-info-modal-btn');
    const editModal = document.getElementById('edit-modal');
    const editScoreInput = document.getElementById('edit-score-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const renameDayModal = document.getElementById('rename-day-modal');
    const renameDayInput = document.getElementById('rename-day-input');
    const saveRenameBtn = document.getElementById('save-rename-btn');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    
    // --- Variables d'état ---
    let isLoginMode = true;
    let currentUser = null;
    let currentlyViewedFriend = null;
    let sharedScoresChart;
    let eveningAttendees = [];
    let currentScore = 5.0;
    let scoresChart;
    let scoreIdToUpdate = null;
    let dayToRename = null;
    let allScoresData = {};
    let searchTimeout;

    // =========================================================================
    // --- GESTION DE L'AUTHENTIFICATION ET DE LA SESSION ---
    // =========================================================================

    function switchAuthMode() {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Connexion' : 'Inscription';
        authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
        switchAuthBtn.textContent = isLoginMode ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter';
        errorMessage.style.display = 'none';
        authForm.reset();
        document.getElementById('remember-me').checked = true;
    }

    async function handleAuth(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
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
                await checkSession();
            } else {
                throw new Error(result.error || 'Une erreur est survenue.');
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    }

    async function logout() {
        await fetch('api/logout.php');
        currentUser = null;
        authForm.reset();
        document.getElementById('remember-me').checked = true;
        switchView(authView);
        document.body.classList.remove('app-loaded');
        if (scoresChart) {
            scoresChart.destroy();
            scoresChart = null;
        }
        if (sharedScoresChart) {
            sharedScoresChart.destroy();
            sharedScoresChart = null;
        }
        const headerIcon = document.querySelector('.header-actions .profile-picture-icon');
        if (headerIcon) headerIcon.remove();
    }

    async function checkSession() {
        try {
            const response = await fetch('api/check_session.php');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    currentUser = {
                        username: result.username,
                        profile_picture: result.profile_picture
                    };
                    initializeApp();
                } else {
                    throw new Error("Session invalide.");
                }
            } else {
                switchView(authView);
                document.body.classList.add('app-loaded');
            }
        } catch (error) {
            console.error("Pas de session active, affichage de la page de connexion.");
            switchView(authView);
            document.body.classList.add('app-loaded');
        }
    }
    
    // =========================================================================
    // --- INITIALISATION ET NAVIGATION ---
    // =========================================================================

    function initializeApp() {
        if (currentUser) {
            welcomeMessage.textContent = `Bienvenue, ${currentUser.username} !`;
            const picUrl = currentUser.profile_picture ? currentUser.profile_picture : 'assets/default-avatar.png';
            profilePicDisplay.src = picUrl;

            let headerIcon = document.querySelector('.header-actions .profile-picture-icon');
            if (!headerIcon) {
                headerIcon = document.createElement('img');
                headerIcon.className = 'profile-picture-icon';
                headerIcon.title = 'Mon Profil';
                headerIcon.addEventListener('click', () => switchView(profileView));
                document.querySelector('.header-actions').prepend(headerIcon);
            }
            headerIcon.src = picUrl;
        }
        switchView(mainView);
        document.body.classList.add('app-loaded');
        initializeSlider();
        updateNotificationDot();
    }

    function switchView(viewToShow) {
        [authView, mainView, historyView, profileView, friendsView, friendProfileView, sharedEveningView].forEach(v => {
            if(v) v.classList.remove('active-view');
        });
        if(viewToShow) viewToShow.classList.add('active-view');
        listContainer.classList.remove('visible');
        toggleListBtn.textContent = 'Afficher la liste';
    }

    function initializeSlider() {
        try {
            if ($ && $.fn.roundSlider && $("#score-slider").data("roundSlider") === undefined) {
                $("#score-slider").roundSlider({
                    radius: 120, width: 22, handleSize: "+8", handleShape: "dot",
                    sliderType: "min-range", value: 5.0, min: 0, max: 10, step: 0.1, startAngle: 90,
                    create: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); },
                    drag: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); },
                    change: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); }
                });
            } else if (!($ && $.fn.roundSlider)) { 
                throw new Error("jQuery ou roundSlider non chargé."); 
            }
        } catch (error) {
            console.error("Erreur d'initialisation du slider.", error);
            document.querySelector('.score-input-container').innerHTML = `<p style="color: var(--error-color);">Erreur: Le composant de score n'a pas pu charger.</p>`;
        }
    }

    // =========================================================================
    // --- GESTION DES NOTIFICATIONS ET DE LA PAGE AMIS ---
    // =========================================================================

    async function updateNotificationDot() {
        try {
            const response = await fetch('api/get_friend_requests.php');
            const requests = await response.json();
            if (requests && requests.length > 0) {
                friendsBtn.classList.add('has-notification');
            } else {
                friendsBtn.classList.remove('has-notification');
            }
        } catch (error) {
            console.error("Impossible de vérifier les notifications de demandes d'ami.", error);
        }
    }

    function openFriendsPage() {
        switchView(friendsView);
        friendsBtn.classList.remove('has-notification');
        switchTab(document.querySelector('.tab-link[data-tab="tab-requests"]'));
        loadFriendRequests();
        loadFriendsList();
        loadFriendSuggestions();
    }

    function switchTab(clickedTab) {
        tabLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        clickedTab.classList.add('active');
        document.getElementById(clickedTab.dataset.tab).classList.add('active');
    }
    
    async function loadFriendSuggestions() {
        try {
            const response = await fetch('api/get_friend_suggestions.php');
            const suggestions = await response.json();
            friendSuggestionsList.innerHTML = '';
            const container = document.querySelector('.suggestions-container');
            if (!suggestions || suggestions.length === 0) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'block';
            suggestions.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                    <div class="user-item-info">${user.username}</div>
                    <div class="user-item-actions">
                        <button class="btn-icon add-friend" data-user-id="${user.id}" title="Ajouter en ami"><i class="material-icons">person_add</i></button>
                    </div>
                `;
                friendSuggestionsList.appendChild(userItem);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des suggestions:', error);
        }
    }

    async function loadFriendRequests() {
        try {
            const response = await fetch('api/get_friend_requests.php');
            const requests = await response.json();
            friendRequestsList.innerHTML = '';
            if (requests.length === 0) {
                friendRequestsList.innerHTML = '<p>Aucune demande d\'ami en attente.</p>';
                requestsCountBadge.style.display = 'none';
                return;
            }
            requestsCountBadge.textContent = requests.length;
            requestsCountBadge.style.display = 'block';
            requests.forEach(req => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <img src="${req.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                    <div class="user-item-info">${req.username}</div>
                    <div class="user-item-actions">
                        <button class="btn-icon accept" data-friendship-id="${req.friendship_id}" title="Accepter"><i class="material-icons">check</i></button>
                        <button class="btn-icon decline" data-friendship-id="${req.friendship_id}" title="Refuser"><i class="material-icons">close</i></button>
                    </div>
                `;
                friendRequestsList.appendChild(userItem);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des demandes d\'ami:', error);
            friendRequestsList.innerHTML = '<p style="color: var(--error-color);">Erreur de chargement.</p>';
        }
    }

    async function handleFriendRequestResponse(friendshipId, action) {
        try {
            const response = await fetch('api/respond_to_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId, action })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                loadFriendRequests();
                loadFriendsList();
                updateNotificationDot();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }

    async function searchUsers(query) {
        if (query.length < 2) {
            userSearchResults.innerHTML = '';
            return;
        }
        try {
            const response = await fetch(`api/search_users.php?query=${encodeURIComponent(query)}`);
            const users = await response.json();
            userSearchResults.innerHTML = '';
            if (users.length === 0) {
                userSearchResults.innerHTML = '<p>Aucun utilisateur trouvé.</p>';
                return;
            }
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                    <div class="user-item-info">${user.username}</div>
                    <div class="user-item-actions">
                        <button class="btn-icon add-friend" data-user-id="${user.id}" title="Ajouter en ami"><i class="material-icons">person_add</i></button>
                    </div>
                `;
                userSearchResults.appendChild(userItem);
            });
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
    }
    
    async function sendFriendRequest(recipientId) {
        try {
            const response = await fetch('api/send_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient_id: recipientId })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Demande d\'ami envoyée !');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }
    
    async function loadFriendsList() {
        try {
            const response = await fetch('api/get_friends.php');
            const friends = await response.json();
            friendsList.innerHTML = '';
            if (friends.length === 0) {
                friendsList.innerHTML = '<p>Vous n\'avez aucun ami pour le moment.</p>';
                return;
            }
            friends.forEach(friend => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item clickable';
                userItem.dataset.friend = JSON.stringify(friend);
                userItem.innerHTML = `
                    <img src="${friend.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                    <div class="user-item-info">${friend.username}</div>
                    <div class="user-item-actions">
                        <button class="btn-icon remove-friend decline" data-friendship-id="${friend.friendship_id}" title="Supprimer l'ami"><i class="material-icons">person_remove</i></button>
                    </div>
                `;
                friendsList.appendChild(userItem);
            });
        } catch (error) {
            console.error('Erreur lors du chargement de la liste d\'amis:', error);
            friendsList.innerHTML = '<p style="color: var(--error-color);">Erreur de chargement.</p>';
        }
    }

    async function removeFriend(friendshipId) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet ami ?")) {
            return;
        }
        try {
            const response = await fetch('api/remove_friend.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                loadFriendsList();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }

    // =========================================================================
    // --- GESTION DES SOIRÉES COMMUNES ---
    // =========================================================================
    
    async function openFriendProfile(friend) {
        currentlyViewedFriend = friend;
        friendProfileName.textContent = `Profil de ${friend.username}`;
        friendProfileUsername.textContent = friend.username;
        friendProfilePic.src = friend.profile_picture || 'assets/default-avatar.png';
        switchView(friendProfileView);
        commonEveningsList.innerHTML = '<p>Chargement des soirées...</p>';

        try {
            const response = await fetch(`api/get_common_evenings.php?friend_id=${friend.user_id}`);
            const eveningsData = await response.json();
            const evenings = Array.isArray(eveningsData) ? eveningsData : Object.values(eveningsData);
            commonEveningsList.innerHTML = '';
            if (evenings.length === 0) {
                commonEveningsList.innerHTML = '<p>Aucune soirée en commun trouvée.</p>';
                return;
            }
            evenings.forEach(evening => {
                const eveningItem = document.createElement('div');
                eveningItem.className = 'evening-item';
                eveningItem.dataset.date = evening.evening_date;
                const formattedDate = new Date(evening.evening_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                eveningItem.innerHTML = `
                    <div class="date">${formattedDate}</div>
                    <div class="names">
                        ${evening.my_day_name || 'Ma soirée'} avec ${evening.friend_day_name || 'sa soirée'}
                    </div>
                `;
                commonEveningsList.appendChild(eveningItem);
            });
        } catch (error) {
            console.error("Erreur lors du chargement des soirées communes:", error);
            commonEveningsList.innerHTML = '<p style="color: var(--error-color);">Erreur de chargement.</p>';
        }
    }

    async function openSharedEvening(date) {
        if (!currentlyViewedFriend) return;
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' });
        sharedEveningTitle.textContent = `Soirée du ${formattedDate}`;
        switchView(sharedEveningView);
        attendeesList.innerHTML = '';

        try {
            const scoresResponse = await fetch(`api/get_evening_scores.php?friend_id=${currentlyViewedFriend.user_id}&date=${date}`);
            const scoresData = await scoresResponse.json();
            loadEveningAttendees(date);
            displaySharedChart(scoresData.my_scores, scoresData.friend_scores);
        } catch (error) {
            console.error("Erreur lors du chargement des scores partagés:", error);
        }
    }

    async function loadEveningAttendees(date) {
        try {
            const response = await fetch(`api/get_evening_attendees.php?date=${date}`);
            eveningAttendees = await response.json();
            attendeesList.innerHTML = '';
            const container = document.querySelector('.attendees-container');
            if (eveningAttendees.length === 0) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'block';
            eveningAttendees.forEach(attendee => {
                if (attendee.user_id == currentlyViewedFriend.user_id) return;
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <img src="${attendee.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                    <div class="user-item-info">${attendee.username}</div>
                    <div class="user-item-actions">
                        <label class="graph-toggle">
                            <input type="checkbox" class="attendee-toggle" data-user-id="${attendee.user_id}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
                attendeesList.appendChild(userItem);
            });
        } catch (error) {
            console.error("Erreur lors du chargement des participants:", error);
        }
    }

    async function toggleAttendeeOnGraph(userId, add) {
        if (!sharedScoresChart) return;
        if (add) {
            try {
                const response = await fetch(`api/get_evening_scores.php?friend_id=${userId}&date=${sharedEveningView.dataset.date}`);
                const data = await response.json();
                const attendeeData = eveningAttendees.find(a => a.user_id == userId);
                if (!attendeeData) return;
                const newDataset = createDataset(data.friend_scores, attendeeData, sharedScoresChart.data.datasets.length);
                sharedScoresChart.data.datasets.push(newDataset);
                sharedScoresChart.update();
            } catch (error) {
                console.error("Erreur lors de l'ajout de l'ami au graphique:", error);
            }
        } else {
            const datasetIndex = sharedScoresChart.data.datasets.findIndex(ds => ds.userId == userId);
            if (datasetIndex > -1) {
                sharedScoresChart.data.datasets.splice(datasetIndex, 1);
                sharedScoresChart.update();
            }
        }
    }

    function createDataset(scores, user, colorIndex = 0) {
        const getTimeValue = (dateString) => {
            const date = new Date(dateString);
            let timeValue = date.getHours() + date.getMinutes() / 60;
            if (date.getHours() < 10) timeValue += 24;
            return timeValue;
        };
        const color = `hsl(${(150 + colorIndex * 60) % 360}, 70%, 60%)`;
        return {
            label: user.username,
            userId: user.user_id,
            data: (scores || []).map(s => ({ x: getTimeValue(s.created_at), y: parseFloat(s.score_value) })).sort((a,b) => a.x - b.x),
            borderColor: color,
            backgroundColor: `${color}33`,
            tension: 0.2
        };
    }

    function displaySharedChart(myScores, friendScores) {
        const chartCanvas = document.getElementById('shared-scores-chart-container');
        if (!chartCanvas) return;
        const chartContext = chartCanvas.getContext('2d');
        if (sharedScoresChart) sharedScoresChart.destroy();
        const myDataset = createDataset(myScores, { username: currentUser.username, user_id: null }, 0);
        const friendDataset = createDataset(friendScores, { username: currentlyViewedFriend.username, user_id: currentlyViewedFriend.user_id }, 1);
        const textColor = getComputedStyle(document.body).getPropertyValue('--on-surface-color').trim();
        const gridColor = 'rgba(255, 255, 255, 0.1)';
        const { min: axisMin, max: axisMax } = calculateXAxisBounds([myDataset, friendDataset]);
        sharedScoresChart = new Chart(chartContext, {
            type: 'line',
            data: { datasets: [myDataset, friendDataset] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', min: axisMin, max: axisMax, ticks: { color: textColor, stepSize: 2, callback: (value) => `${String(Math.floor(value) % 24).padStart(2, '0')}:00` }, grid: { color: gridColor } },
                    y: { beginAtZero: true, max: 10, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { display: true, labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                const value = tooltipItems[0].parsed.x;
                                const hour = Math.floor(value) % 24;
                                const minutes = Math.round((value % 1) * 60);
                                return `Heure: ${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            },
                            label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)}`
                        }
                    }
                }
            }
        });
    }
    
    // =========================================================================
    // --- GESTION DES ACTIONS (PROFIL, SCORES, ETC.) ---
    // =========================================================================
    
    async function handlePictureUpload(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('profile_picture', pictureInput.files[0]);
        try {
            const response = await fetch('api/upload_picture.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Photo de profil mise à jour !');
                const newPicUrl = result.filePath;
                currentUser.profile_picture = newPicUrl;
                profilePicDisplay.src = newPicUrl;
                document.querySelector('.header-actions .profile-picture-icon').src = newPicUrl;
                uploadSubmitBtn.style.display = 'none';
                uploadPictureForm.reset();
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
        if (!newUsername) {
            alert("Le nom d'utilisateur ne peut pas être vide.");
            return;
        }
        try {
            const response = await fetch('api/change_username.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUsername })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Nom d\'utilisateur changé avec succès !');
                currentUser.username = result.newUsername;
                welcomeMessage.textContent = `Bienvenue, ${currentUser.username} !`;
                changeUsernameForm.reset();
            } else {
                throw new Error(result.error || "Une erreur s'est produite.");
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
                throw new Error(result.error || "Une erreur s'est produite.");
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function handleDeleteAccount() {
        const confirmation = prompt("Pour confirmer la suppression DÉFINITIVE de votre compte et de toutes vos données, veuillez taper 'SUPPRIMER' dans le champ ci-dessous.");
        if (confirmation !== 'SUPPRIMER') {
            alert('Suppression annulée.');
            return;
        }
        try {
            const response = await fetch('api/delete_account.php', { method: 'POST' });
            const result = await response.json();
            if (response.ok && result.success) {
                alert('Votre compte a été supprimé.');
                logout();
            } else {
                throw new Error(result.error || "Une erreur s'est produite.");
            }
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        }
    }

    async function sendScore() {
        sendScoreBtn.disabled = true;
        sendScoreBtn.textContent = 'Envoi...';
        try {
            const response = await fetch('api/save_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score: currentScore })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                sendScoreBtn.style.backgroundColor = 'var(--success-color)';
                sendScoreBtn.textContent = 'Envoyé !';
            } else {
                if (response.status === 401) logout();
                throw new Error(result.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du score:', error);
            sendScoreBtn.style.backgroundColor = 'var(--error-color)';
            sendScoreBtn.textContent = 'Échec';
        }
        setTimeout(() => {
            sendScoreBtn.disabled = false;
            sendScoreBtn.style.backgroundColor = '';
            sendScoreBtn.textContent = 'Envoyer';
        }, 1500);
    }

    async function fetchAndDisplayScores() {
        try {
            const response = await fetch('api/get_score.php');
            if (!response.ok) {
                if (response.status === 401) logout();
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allScoresData = await response.json();
            displayScoresList(allScoresData);
            populateChartFilters(allScoresData);
            const allDays = Object.keys(allScoresData);
            updateChart(allDays);
            updateFilterButtonText(allDays.length);
            toggleListBtn.style.display = allDays.length > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Erreur lors de la récupération des scores:', error);
            scoresListContainer.innerHTML = `<p style="color: var(--error-color);">Impossible de charger l'historique.</p>`;
            toggleListBtn.style.display = 'none';
        }
    }

    function displayScoresList(dataByDay) {
        scoresListContainer.innerHTML = '';
        const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a));
        if (sortedDays.length === 0) {
            scoresListContainer.innerHTML = `<p>Aucun score enregistré.</p>`;
            return;
        }
        sortedDays.forEach(day => {
            const dayData = dataByDay[day];
            const dayGroupEl = document.createElement('div');
            dayGroupEl.className = 'day-group';
            dayGroupEl.dataset.day = day;
            const title = document.createElement('h3');
            const titleText = document.createElement('span');
            titleText.textContent = dayData.customName || new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const renameBtn = document.createElement('button');
            renameBtn.className = 'btn-icon rename-day-btn';
            renameBtn.innerHTML = `<i class="material-icons">drive_file_rename_outline</i>`;
            title.appendChild(titleText);
            title.appendChild(renameBtn);
            dayGroupEl.appendChild(title);
            const scoresForDay = dayData.scores;
            if (Array.isArray(scoresForDay)) {
                scoresForDay.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(score => {
                    const scoreItemEl = document.createElement('div');
                    scoreItemEl.className = 'score-item';
                    scoreItemEl.dataset.id = score.id;
                    scoreItemEl.innerHTML = `
                        <span class="score-time">${new Date(score.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span class="score-value">${parseFloat(score.score_value).toFixed(1)}</span>
                        <div class="score-actions">
                            <button class="btn-icon edit-btn"><i class="material-icons">edit</i></button>
                            <button class="btn-icon delete-btn"><i class="material-icons">delete</i></button>
                        </div>`;
                    dayGroupEl.appendChild(scoreItemEl);
                });
            }
            scoresListContainer.appendChild(dayGroupEl);
        });
        addListActionListeners();
    }

    function populateChartFilters(dataByDay) {
        chartFilterList.innerHTML = '';
        const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a));
        if (sortedDays.length <= 1) {
            chartFilterDropdown.style.display = 'none';
            return;
        }
        chartFilterDropdown.style.display = 'block';
        sortedDays.forEach(day => {
            const dayData = dataByDay[day];
            const date = new Date(day);
            const labelText = dayData.customName || date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
            const item = document.createElement('div');
            item.className = 'filter-item';
            const uniqueId = `filter-${day.replace(/[^a-zA-Z0-9]/g, '')}`;
            item.innerHTML = `
                <input type="checkbox" id="${uniqueId}" value="${day}" checked>
                <span class="checkmark"></span>
                <label for="${uniqueId}">${labelText}</label>
            `;
            chartFilterList.appendChild(item);
        });
    }

    function updateFilterButtonText(count) {
        if (count === 0) {
            chartFilterBtnText.textContent = "Aucun jour sélectionné";
        } else if (count === 1) {
            chartFilterBtnText.textContent = "1 jour sélectionné";
        } else {
            chartFilterBtnText.textContent = `${count} jours sélectionnés`;
        }
    }

    function updateChart(selectedDays) {
        const datasets = buildChartDatasets(allScoresData, selectedDays);
        if (scoresChart) {
            scoresChart.data.datasets = datasets;
            const { min, max } = calculateXAxisBounds(datasets);
            scoresChart.options.scales.x.min = min;
            scoresChart.options.scales.x.max = max;
            scoresChart.update();
        } else {
            displayScoresChart(datasets);
        }
    }

    function calculateXAxisBounds(datasets) {
        let minTime = 10, maxTime = 34;
        const allPoints = datasets.flatMap(ds => ds.data);
        if (allPoints.length > 0) {
            minTime = Math.min(...allPoints.map(p => p.x));
            maxTime = Math.max(...allPoints.map(p => p.x));
        }
        return { min: Math.floor(minTime) - 1, max: Math.ceil(maxTime) + 1 };
    }

    function buildChartDatasets(dataByDay, daysToInclude) {
        const sortedDays = Object.keys(dataByDay).filter(day => daysToInclude.includes(day)).sort((a, b) => new Date(a) - new Date(b));
        return sortedDays.map((day, index) => {
            const dayData = dataByDay[day];
            const scores = dayData.scores;
            if (!Array.isArray(scores)) return null;
            const color = `hsl(${(index * 50) % 360}, 70%, 60%)`;
            const getTimeValue = (dateString) => {
                const date = new Date(dateString);
                let timeValue = date.getHours() + date.getMinutes() / 60;
                if (date.getHours() < 10) timeValue += 24;
                return timeValue;
            };
            return {
                label: dayData.customName || new Date(day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                data: scores.map(s => ({ x: getTimeValue(s.created_at), y: parseFloat(s.score_value) })).sort((a, b) => a.x - b.x),
                borderColor: color, backgroundColor: `${color}33`, tension: 0.2, pointRadius: 4, pointHoverRadius: 7
            };
        }).filter(ds => ds !== null);
    }
    
    function displayScoresChart(initialDatasets) {
        const chartCanvas = document.getElementById('scores-chart-container');
        if (!chartCanvas) return;
        const chartContext = chartCanvas.getContext('2d');
        if (scoresChart) scoresChart.destroy();
        const textColor = getComputedStyle(document.body).getPropertyValue('--on-surface-color').trim();
        const gridColor = 'rgba(255, 255, 255, 0.1)';
        const { min: axisMin, max: axisMax } = calculateXAxisBounds(initialDatasets);
        scoresChart = new Chart(chartContext, {
            type: 'line', data: { datasets: initialDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', min: axisMin, max: axisMax, ticks: { color: textColor, stepSize: 2, callback: (value) => `${String(Math.floor(value) % 24).padStart(2, '0')}:00` }, grid: { color: gridColor } },
                    y: { beginAtZero: true, max: 10, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { display: true, labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                const value = tooltipItems[0].parsed.x;
                                const hour = Math.floor(value) % 24;
                                const minutes = Math.round((value % 1) * 60);
                                return `Heure: ${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            },
                            label: (c) => `Score: ${c.parsed.y.toFixed(1)}`
                        }
                    }
                }
            }
        });
    }

    function addListActionListeners() {
        scoresListContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn'); if (editBtn) handleEdit(editBtn.closest('.score-item'));
            const deleteBtn = e.target.closest('.delete-btn'); if (deleteBtn) handleDelete(deleteBtn.closest('.score-item'));
            const renameBtn = e.target.closest('.rename-day-btn'); if (renameBtn) handleRename(renameBtn.closest('.day-group'));
        });
    }
    function handleEdit(scoreItem) { scoreIdToUpdate = scoreItem.dataset.id; editScoreInput.value = scoreItem.querySelector('.score-value').textContent; editModal.classList.add('visible'); }
    function closeEditModal() { editModal.classList.remove('visible'); scoreIdToUpdate = null; }
    function handleRename(dayGroup) { dayToRename = dayGroup.dataset.day; const currentName = allScoresData[dayToRename]?.customName || ''; renameDayInput.value = currentName; renameDayModal.classList.add('visible'); renameDayInput.focus(); }
    function closeRenameModal() { renameDayModal.classList.remove('visible'); dayToRename = null; }
    
    async function handleDelete(scoreItem) {
        if (!confirm("Voulez-vous vraiment supprimer ce score ?")) return;
        try {
            const res = await fetch('api/delete_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: scoreItem.dataset.id }) });
            const result = await res.json();
            if (res.ok && result.success) { fetchAndDisplayScores(); } else { throw new Error(result.error); }
        } catch (error) { console.error("Erreur de suppression:", error); alert("La suppression a échoué."); }
    }
    async function updateScore(id, newScore) {
        try {
            const res = await fetch('api/update_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, score: newScore }) });
            const result = await res.json();
            if (res.ok && result.success) { fetchAndDisplayScores(); } else { throw new Error(result.error); }
        } catch (error) { console.error('Erreur de mise à jour:', error); alert("La mise à jour a échoué."); }
    }
    async function renameDay(date, newName) {
        try {
            const res = await fetch('api/rename_day.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, name: newName }) });
            const result = await res.json();
            if (res.ok && result.success) { fetchAndDisplayScores(); } else { throw new Error(result.error); }
        } catch (error) { console.error('Erreur lors du renommage:', error); alert("Le renommage a échoué."); }
    }

    // =========================================================================
    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    // =========================================================================
    
    // Authentification et Profil
    switchAuthBtn.addEventListener('click', switchAuthMode);
    authForm.addEventListener('submit', handleAuth);
    logoutBtn.addEventListener('click', logout);
    profileBtn.addEventListener('click', () => switchView(profileView));
    backToMainFromProfileBtn.addEventListener('click', () => switchView(mainView));
    changeUsernameForm.addEventListener('submit', handleChangeUsername);
    changePasswordForm.addEventListener('submit', handleChangePassword);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    uploadPictureForm.addEventListener('submit', handlePictureUpload);
    pictureInput.addEventListener('change', () => {
        if (pictureInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => { profilePicDisplay.src = e.target.result; };
            reader.readAsDataURL(pictureInput.files[0]);
            uploadSubmitBtn.style.display = 'block';
        }
    });

    // Page Amis et Soirées
    friendsBtn.addEventListener('click', openFriendsPage);
    backToMainFromFriendsBtn.addEventListener('click', () => switchView(mainView));
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });
    friendRequestsList.addEventListener('click', (e) => {
        const acceptBtn = e.target.closest('.accept');
        const declineBtn = e.target.closest('.decline');
        if (acceptBtn) handleFriendRequestResponse(acceptBtn.dataset.friendshipId, 'accept');
        if (declineBtn) handleFriendRequestResponse(declineBtn.dataset.friendshipId, 'decline');
    });
    userSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchUsers(e.target.value);
        }, 300);
    });
    userSearchResults.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-friend');
        if (addBtn) {
            addBtn.disabled = true;
            sendFriendRequest(addBtn.dataset.userId);
        }
    });
    friendSuggestionsList.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-friend');
        if (addBtn) {
            addBtn.disabled = true;
            sendFriendRequest(addBtn.dataset.userId);
            addBtn.closest('.user-item').style.display = 'none';
        }
    });
    friendsList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-friend');
        if (removeBtn) {
            e.stopPropagation();
            removeFriend(removeBtn.dataset.friendshipId);
        } else {
            const friendItem = e.target.closest('.user-item');
            if (friendItem && friendItem.dataset.friend) {
                const friendData = JSON.parse(friendItem.dataset.friend);
                openFriendProfile(friendData);
            }
        }
    });
    commonEveningsList.addEventListener('click', (e) => {
        const eveningItem = e.target.closest('.evening-item');
        if (eveningItem && eveningItem.dataset.date) {
            sharedEveningView.dataset.date = eveningItem.dataset.date;
            openSharedEvening(eveningItem.dataset.date);
        }
    });
    attendeesList.addEventListener('click', (e) => {
        const toggle = e.target.closest('.attendee-toggle');
        if (toggle) {
            const userId = toggle.dataset.userId;
            toggleAttendeeOnGraph(userId, toggle.checked);
        }
    });
    backToFriendsListBtn.addEventListener('click', () => switchView(friendsView));
    backToFriendProfileBtn.addEventListener('click', () => {
        if (currentlyViewedFriend) {
            switchView(friendProfileView);
        } else {
            switchView(friendsView);
        }
    });

    // Navigation principale et actions
    infoBtn.addEventListener('click', () => infoModal.classList.add('visible'));
    closeInfoModalBtn.addEventListener('click', () => infoModal.classList.remove('visible'));
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('visible'); });
    showHistoryBtn.addEventListener('click', () => { switchView(historyView); fetchAndDisplayScores(); });
    backToMainBtn.addEventListener('click', () => switchView(mainView));
    sendScoreBtn.addEventListener('click', sendScore);
    toggleListBtn.addEventListener('click', () => { listContainer.classList.toggle('visible'); toggleListBtn.textContent = listContainer.classList.contains('visible') ? 'Masquer la liste' : 'Afficher la liste'; });
    
    // Modales
    saveEditBtn.addEventListener('click', () => { const newScore = parseFloat(editScoreInput.value); if (scoreIdToUpdate !== null && !isNaN(newScore) && newScore >= 0 && newScore <= 10) { updateScore(scoreIdToUpdate, newScore); closeEditModal(); } });
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    saveRenameBtn.addEventListener('click', () => { const newName = renameDayInput.value.trim(); if (dayToRename) { renameDay(dayToRename, newName); closeRenameModal(); } });
    cancelRenameBtn.addEventListener('click', closeRenameModal);
    renameDayModal.addEventListener('click', (e) => { if (e.target === renameDayModal) closeRenameModal(); });

    // Filtres du graphique
    chartFilterBtn.addEventListener('click', () => { chartFilterPanel.classList.toggle('visible'); });
    document.addEventListener('click', (e) => { if (!chartFilterDropdown.contains(e.target)) chartFilterPanel.classList.remove('visible'); });
    chartFilterList.addEventListener('change', () => {
        const selectedDays = [...chartFilterList.querySelectorAll('input:checked')].map(input => input.value);
        updateChart(selectedDays);
        updateFilterButtonText(selectedDays.length);
    });
    selectAllBtn.addEventListener('click', () => { chartFilterList.querySelectorAll('input').forEach(input => input.checked = true); chartFilterList.dispatchEvent(new Event('change')); });
    deselectAllBtn.addEventListener('click', () => { chartFilterList.querySelectorAll('input').forEach(input => input.checked = false); chartFilterList.dispatchEvent(new Event('change')); });

    // GESTION DE L'ACCORDÉON
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                }
            });
            header.classList.toggle('active');
            const panel = header.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });

    // --- DÉMARRAGE DE L'APPLICATION ---
    checkSession();
});

