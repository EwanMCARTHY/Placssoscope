// scripts/friends.js
import { switchView } from './ui.js';

// On garde une référence au graphique pour pouvoir le détruire et le recréer
let sharedScoresChart = null;

/**
 * Calcule les limites de l'axe des X pour une meilleure lisibilité.
 */
function calculateXAxisBounds(datasets) {
    const allPoints = datasets.flatMap(ds => ds.data);
    if (allPoints.length === 0) {
        return { min: 18, max: 30 }; // Vue par défaut de 18h à 6h
    }
    const minTime = Math.min(...allPoints.map(p => p.x));
    const maxTime = Math.max(...allPoints.map(p => p.x));
    return { min: Math.floor(minTime) - 1, max: Math.ceil(maxTime) + 1 };
}

/**
 * Dessine ou met à jour le graphique des scores partagés.
 * Cette version est compatible avec votre script get_evening_scores.php
 */
function drawSharedEveningChart(scoresData, friendUsername) {
    const datasets = [];
    const getTime = (dateStr) => {
        const d = new Date(dateStr);
        let timeValue = d.getHours() + d.getMinutes() / 60;
        if (d.getHours() < 10) timeValue += 24;
        return timeValue;
    };

    // Création du dataset pour l'utilisateur actuel (my_scores)
    if (scoresData.my_scores) {
        datasets.push({
            label: 'Moi',
            data: scoresData.my_scores.map(s => ({ x: getTime(s.created_at), y: parseFloat(s.score_value) })).sort((a, b) => a.x - b.x),
            borderColor: 'rgba(147, 51, 234, 1)',
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
            tension: 0.2,
        });
    }

    // Création du dataset pour l'ami (friend_scores)
    if (scoresData.friend_scores) {
        datasets.push({
            label: friendUsername || 'Ami',
            data: scoresData.friend_scores.map(s => ({ x: getTime(s.created_at), y: parseFloat(s.score_value) })).sort((a, b) => a.x - b.x),
            borderColor: 'rgba(3, 218, 198, 1)',
            backgroundColor: 'rgba(3, 218, 198, 0.2)',
            tension: 0.2,
        });
    }

    const { min, max } = calculateXAxisBounds(datasets);
    const chartContext = document.getElementById('shared-scores-chart-container').getContext('2d');
    
    if (sharedScoresChart) {
        sharedScoresChart.destroy();
    }
    
    sharedScoresChart = new Chart(chartContext, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    min: min,
                    max: max,
                    ticks: { color: '#ccc', stepSize: 2, callback: (v) => `${String(Math.floor(v) % 24).padStart(2, '0')}:00` },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: { beginAtZero: true, max: 10, ticks: { color: '#ccc', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            },
            plugins: { legend: { labels: { color: '#ccc' } } }
        }
    });
}

/**
 * Met à jour la pastille de notification sur l'icône des amis.
 */
export async function updateNotificationDot() {
    try {
        const response = await fetch('api/get_friend_requests.php');
        const requests = await response.json();
        const friendsBtn = document.getElementById('friends-btn');
        const requestsCountBadge = document.getElementById('requests-count-badge');

        if (friendsBtn && requestsCountBadge) {
            if (requests && requests.length > 0) {
                friendsBtn.classList.add('has-notification');
                requestsCountBadge.textContent = requests.length;
                requestsCountBadge.style.display = 'inline-block';
            } else {
                friendsBtn.classList.remove('has-notification');
                requestsCountBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Impossible de vérifier les notifications d'amis.", error);
    }
}

export function setupFriends() {
    const friendsView = document.getElementById('friends-view');
    const friendsBtn = document.getElementById('friends-btn');
    const friendProfileView = document.getElementById('friend-profile-view');
    const backToFriendsListBtn = document.getElementById('back-to-friends-list-btn');
    const friendProfileName = document.getElementById('friend-profile-name');
    const friendProfilePic = document.getElementById('friend-profile-pic');
    const friendProfileUsername = document.getElementById('friend-profile-username');
    const friendProfileDescription = document.getElementById('friend-profile-description-text');
    const commonEveningsList = document.getElementById('common-evenings-list');
    const sharedEveningView = document.getElementById('shared-evening-view');
    const backToFriendProfileBtn = document.getElementById('back-to-friend-profile-btn');
    const sharedEveningTitle = document.getElementById('shared-evening-title');
    const attendeesList = document.getElementById('attendees-list');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const requestsCountBadge = document.getElementById('requests-count-badge');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const userSearchInput = document.getElementById('user-search-input');
    const userSearchResults = document.getElementById('user-search-results');
    const friendsList = document.getElementById('friends-list');
    const friendSuggestionsList = document.getElementById('friend-suggestions-list');
    const mutualFriendSuggestionsList = document.getElementById('mutual-friend-suggestions-list');

    let searchTimeout;
    let currentlyViewedFriend = null;

    // --- Fonctions principales ---
    function openFriendsPage() {
        switchView(friendsView);
        updateNotificationDot();
        loadFriendRequests();
        loadFriendsList();
        loadFriendSuggestions();
        loadMutualFriendSuggestions();
    }

    function switchTab(clickedTab) {
        tabLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        clickedTab.classList.add('active');
        const targetTab = document.getElementById(clickedTab.dataset.tab);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }

    // --- Chargement des données ---
    async function loadFriendRequests() {
        try {
            const response = await fetch('api/get_friend_requests.php');
            const requests = await response.json();
            friendRequestsList.innerHTML = '';
            if (requests.length === 0) {
                friendRequestsList.innerHTML = '<p>Aucune demande d\'ami en attente.</p>';
                if(requestsCountBadge) requestsCountBadge.style.display = 'none';
                return;
            }
            if(requestsCountBadge) {
                requestsCountBadge.textContent = requests.length;
                requestsCountBadge.style.display = 'inline-block';
            }

            requests.forEach(req => {
                friendRequestsList.innerHTML += `
                    <div class="user-item">
                        <img src="${req.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${req.username}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon accept" data-friendship-id="${req.friendship_id}" title="Accepter"><i class="material-icons">check</i></button>
                            <button class="btn-icon decline" data-friendship-id="${req.friendship_id}" title="Refuser"><i class="material-icons">close</i></button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erreur chargement demandes d\'ami:', error);
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
                // MODIFICATION ICI: On stocke le JSON proprement dans l'attribut data-friend
                const friendData = JSON.stringify(friend);
                friendsList.innerHTML += `
                    <div class="user-item clickable" data-friend='${friendData}'>
                        <img src="${friend.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${friend.username}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon remove-friend decline" data-friendship-id="${friend.friendship_id}" title="Supprimer l'ami"><i class="material-icons">person_remove</i></button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erreur chargement liste d\'amis:', error);
        }
    }

    async function loadFriendSuggestions() {
        try {
            const response = await fetch('api/get_friend_suggestions.php');
            const suggestions = await response.json();
            const container = friendSuggestionsList.closest('.suggestions-container');
            friendSuggestionsList.innerHTML = '';
            if (!suggestions || suggestions.length === 0) {
                if(container) container.style.display = 'none';
                return;
            }
            if(container) container.style.display = 'block';
            suggestions.forEach(user => {
                friendSuggestionsList.innerHTML += `
                    <div class="user-item">
                        <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${user.username}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon add-friend" data-user-id="${user.id}" title="Ajouter en ami"><i class="material-icons">person_add</i></button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erreur chargement suggestions:', error);
        }
    }

    async function loadMutualFriendSuggestions() {
        try {
            const response = await fetch('api/get_mutual_friend_suggestions.php');
            const suggestions = await response.json();
            const container = mutualFriendSuggestionsList.closest('.suggestions-container');
            mutualFriendSuggestionsList.innerHTML = '';
            if (!suggestions || suggestions.length === 0) {
                if(container) container.style.display = 'none';
                return;
            }
            if(container) container.style.display = 'block';
            suggestions.forEach(user => {
                mutualFriendSuggestionsList.innerHTML += `
                     <div class="user-item">
                        <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info">
                            <strong>${user.username}</strong>
                            <small>${user.mutual_friends} ami(s) en commun</small>
                        </div>
                        <div class="user-item-actions">
                            <button class="btn-icon add-friend" data-user-id="${user.id}" title="Ajouter en ami"><i class="material-icons">person_add</i></button>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erreur chargement suggestions mutuelles:', error);
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
                let actionButton = `<button class="btn-icon add-friend" data-user-id="${user.id}" title="Ajouter en ami"><i class="material-icons">person_add</i></button>`;
                if (user.status === 'pending') {
                    actionButton = `<button class="btn-icon" disabled><i class="material-icons">hourglass_top</i></button>`;
                } else if (user.status === 'friends') {
                    actionButton = `<button class="btn-icon" disabled><i class="material-icons">check</i></button>`;
                }
                userSearchResults.innerHTML += `
                    <div class="user-item">
                        <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${user.username}</strong></div>
                        <div class="user-item-actions">${actionButton}</div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
    }

    // --- Actions ---
    async function handleFriendRequestResponse(friendshipId, action) {
        try {
            const response = await fetch('api/respond_to_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId, action })
            });
            if (response.ok) {
                loadFriendRequests();
                loadFriendsList();
                updateNotificationDot();
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }

    async function sendFriendRequest(recipientId, btn) {
        btn.disabled = true;
        try {
            const response = await fetch('api/send_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient_id: recipientId })
            });
            const result = await response.json();
            if (response.ok && result.success) {
                btn.innerHTML = '<i class="material-icons">hourglass_top</i>';
            } else {
                throw new Error(result.error || 'Une erreur est survenue.');
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
            btn.disabled = false;
        }
    }

    async function removeFriend(friendshipId) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet ami ?")) return;
        try {
            const response = await fetch('api/remove_friend.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: friendshipId })
            });
            if (response.ok) {
                loadFriendsList();
            }
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    }

    // --- Profil Ami et Soirées communes ---
    async function openFriendProfile(friend) {
        currentlyViewedFriend = friend;
        friendProfileName.textContent = friend.username;
        friendProfileUsername.textContent = friend.username;
        friendProfilePic.src = friend.profile_picture || 'assets/default-avatar.png';
        friendProfileDescription.textContent = friend.description || 'Aucune description.';
        switchView(friendProfileView);
        commonEveningsList.innerHTML = '<p>Chargement...</p>';

        try {
            const response = await fetch(`api/get_common_evenings.php?friend_id=${friend.user_id}`);
            const evenings = await response.json();
            commonEveningsList.innerHTML = '';
            if (evenings.length === 0) {
                commonEveningsList.innerHTML = '<p>Aucune soirée en commun.</p>';
                return;
            }
            evenings.forEach(evening => {
                const date = new Date(evening.evening_date);
                commonEveningsList.innerHTML += `
                    <div class="evening-item" data-date="${evening.evening_date}">
                        <div class="date">${date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div class="names">${evening.my_day_name || 'Ma soirée'} avec ${evening.friend_day_name || 'sa soirée'}</div>
                    </div>
                `;
            });
        } catch (error) {
            commonEveningsList.innerHTML = '<p style="color: var(--error-color);">Erreur de chargement.</p>';
        }
    }

    async function openSharedEvening(date) {
        if (!currentlyViewedFriend) return;

        sharedEveningView.dataset.date = date;
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' });
        sharedEveningTitle.textContent = `Soirée du ${formattedDate}`;
        switchView(sharedEveningView);

        attendeesList.innerHTML = '<p>Chargement...</p>';
        if (sharedScoresChart) {
            sharedScoresChart.destroy();
            sharedScoresChart = null;
        }

        try {
            const scoresResponse = await fetch(`api/get_evening_scores.php?friend_id=${currentlyViewedFriend.user_id}&date=${date}`);
            const scoresData = await scoresResponse.json();

            if (scoresData.success === false) {
                throw new Error(scoresData.error);
            }
            drawSharedEveningChart(scoresData, currentlyViewedFriend.username);
            
            const attendeesResponse = await fetch(`api/get_evening_attendees.php?friend_id=${currentlyViewedFriend.user_id}&date=${date}`);
            if (attendeesResponse.ok) {
                const attendeesData = await attendeesResponse.json();
                attendeesList.innerHTML = '';
                if(attendeesData && attendeesData.length > 0){
                    attendeesData.forEach(user => {
                        attendeesList.innerHTML += `
                            <div class="user-item">
                                <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                                <div class="user-item-info"><strong>${user.username}</strong></div>
                            </div>
                        `;
                    });
                } else {
                    attendeesList.innerHTML = '<p>Aucun autre participant.</p>';
                }
            } else {
                 attendeesList.innerHTML = '<p>Erreur au chargement des participants.</p>';
            }

        } catch (error) {
            console.error("Erreur lors du chargement de la soirée partagée:", error);
            const chartContext = document.getElementById('shared-scores-chart-container').getContext('2d');
            chartContext.clearRect(0, 0, chartContext.canvas.width, chartContext.canvas.height);
            chartContext.fillStyle = 'red';
            chartContext.textAlign = 'center';
            chartContext.fillText("Erreur de chargement du graphique", chartContext.canvas.width / 2, 50);
        }
    }

    // --- Écouteurs d'événements ---
    friendsBtn.addEventListener('click', openFriendsPage);
    
    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab));
    });

    userSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });

    friendRequestsList.addEventListener('click', (e) => {
        const acceptBtn = e.target.closest('.accept');
        const declineBtn = e.target.closest('.decline');
        if (acceptBtn) handleFriendRequestResponse(acceptBtn.dataset.friendshipId, 'accept');
        if (declineBtn) handleFriendRequestResponse(declineBtn.dataset.friendshipId, 'decline');
    });
    
    const addFriendTab = document.getElementById('tab-add-friend');
    if (addFriendTab) {
        addFriendTab.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-friend');
            if (addBtn) {
                sendFriendRequest(addBtn.dataset.userId, addBtn);
            }
        });
    }

    friendsList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-friend');
        if (removeBtn) {
            e.stopPropagation();
            removeFriend(removeBtn.dataset.friendshipId);
        } else {
            const friendItem = e.target.closest('.user-item');
            if (friendItem && friendItem.dataset.friend) {
                try {
                    // MODIFICATION ICI: On parse directement le JSON, sans remplacer les guillemets.
                    const friendData = JSON.parse(friendItem.dataset.friend);
                    openFriendProfile(friendData);
                } catch(e) { console.error("Erreur parsing friend data", e); }
            }
        }
    });
    
    commonEveningsList.addEventListener('click', (e) => {
        const eveningItem = e.target.closest('.evening-item');
        if (eveningItem) openSharedEvening(eveningItem.dataset.date);
    });

    backToFriendsListBtn.addEventListener('click', () => switchView(friendsView));
    backToFriendProfileBtn.addEventListener('click', () => switchView(friendProfileView));
}