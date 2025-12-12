// scripts/friends.js
import { switchView, escapeHtml } from './ui.js';

let sharedScoresChart = null;

// Génère une couleur unique (HSL) basée sur le pseudo
function getColorForUser(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
}

// Calcule les bornes X du graphique
function calculateXAxisBounds(datasets) {
    const allPoints = datasets.flatMap(ds => ds.data);
    if (allPoints.length === 0) {
        return { min: 18, max: 30 };
    }
    const minTime = Math.min(...allPoints.map(p => p.x));
    const maxTime = Math.max(...allPoints.map(p => p.x));
    
    // Si une seule donnée ou plage très courte, on force un minimum de largeur (ex: 4h)
    if (maxTime - minTime < 4) {
        return { min: Math.floor(minTime) - 2, max: Math.ceil(maxTime) + 2 };
    }
    return { min: Math.floor(minTime) - 1, max: Math.ceil(maxTime) + 1 };
}

// Convertit une date SQL en heure décimale (ex: 22h30 -> 22.5, 02h00 -> 26.0)
function getTime(dateStr) {
    const d = new Date(dateStr);
    let timeValue = d.getHours() + d.getMinutes() / 60;
    if (d.getHours() < 10) timeValue += 24; 
    return timeValue;
}

// Dessine le graphique multi-utilisateurs
function drawPartyChart(datasetsRaw) {
    const datasets = datasetsRaw.map(ds => {
        const color = getColorForUser(ds.label);
        return {
            label: ds.label,
            data: ds.data.map(p => ({
                x: getTime(p.created_at),
                y: parseFloat(p.score)
            })).sort((a, b) => a.x - b.x),
            borderColor: color,
            backgroundColor: color.replace('hsl', 'hsla').replace(')', ', 0.2)'),
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });

    const { min, max } = calculateXAxisBounds(datasets);
    const chartContext = document.getElementById('shared-scores-chart-container').getContext('2d');
    
    if (sharedScoresChart) {
        sharedScoresChart.destroy();
    }
    
    sharedScoresChart = new Chart(chartContext, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
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

// Met à jour la liste des participants sous le graphique
function updateAttendeesList(datasets) {
    const list = document.getElementById('attendees-list');
    list.innerHTML = '';
    
    if (!datasets || datasets.length === 0) {
        list.innerHTML = '<p>Aucun participant.</p>';
        return;
    }

    datasets.forEach(ds => {
        const color = getColorForUser(ds.label);
        const pic = ds.profile_picture || 'assets/default-avatar.png';
        
        list.innerHTML += `
            <div class="user-item" style="border-left: 4px solid ${color}; padding-left: 12px;">
                <img src="${pic}" alt="Avatar" class="user-item-avatar">
                <div class="user-item-info"><strong>${escapeHtml(ds.label)}</strong></div>
            </div>
        `;
    });
}

// Fonction exportée pour être utilisée depuis scores.js (Historique)
export async function openSharedEvening(date, source = 'friend') {
    const sharedEveningView = document.getElementById('shared-evening-view');
    const sharedEveningTitle = document.getElementById('shared-evening-title');
    
    // On sauvegarde la source dans l'élément HTML pour s'en souvenir plus tard
    sharedEveningView.dataset.source = source;

    sharedEveningView.dataset.date = date;
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' });
    sharedEveningTitle.textContent = `Soirée du ${formattedDate}`;
    
    switchView(sharedEveningView);
    
    if (sharedScoresChart) { sharedScoresChart.destroy(); sharedScoresChart = null; }
    document.getElementById('attendees-list').innerHTML = '<p>Chargement des données...</p>';
    try {
        const response = await fetch(`api/get_party_data.php?date=${date}`);
        const result = await response.json();
        if (result.success) {
            drawPartyChart(result.datasets);
            updateAttendeesList(result.datasets);
        } else {
            document.getElementById('attendees-list').innerHTML = `<p style="color:var(--error-color)">Erreur: ${result.error}</p>`;
        }
    } catch (e) {
        document.getElementById('attendees-list').innerHTML = '<p style="color:var(--error-color)">Erreur de chargement.</p>';
    }
}

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
        console.error("Erreur notif:", error);
    }
}

export function setupFriends(user) {
    const friendsView = document.getElementById('friends-view');
    const friendsBtn = document.getElementById('friends-btn');
    const friendProfileView = document.getElementById('friend-profile-view');
    const backToFriendsListBtn = document.getElementById('back-to-friends-list-btn');
    const friendProfileName = document.getElementById('friend-profile-name');
    const friendProfilePic = document.getElementById('friend-profile-pic');
    const friendProfileUsername = document.getElementById('friend-profile-username');
    const friendProfileDescription = document.getElementById('friend-profile-description-text');
    const commonEveningsList = document.getElementById('common-evenings-list');
    const backToFriendProfileBtn = document.getElementById('back-to-friend-profile-btn');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const userSearchInput = document.getElementById('user-search-input');
    const userSearchResults = document.getElementById('user-search-results');
    const friendsList = document.getElementById('friends-list');
    const friendSuggestionsList = document.getElementById('friend-suggestions-list');
    const mutualFriendSuggestionsList = document.getElementById('mutual-friend-suggestions-list');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    let searchTimeout;

    // --- Navigation ---
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
        if (targetTab) targetTab.classList.add('active');
    }

    // --- Chargements ---
    async function loadFriendRequests() {
        try {
            const response = await fetch('api/get_friend_requests.php');
            const requests = await response.json();
            friendRequestsList.innerHTML = '';
            if (requests.length === 0) {
                friendRequestsList.innerHTML = '<p>Aucune demande.</p>';
                return;
            }
            requests.forEach(req => {
                friendRequestsList.innerHTML += `
                    <div class="user-item">
                        <img src="${req.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${escapeHtml(req.username)}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon accept" data-friendship-id="${req.friendship_id}"><i class="material-icons">check</i></button>
                            <button class="btn-icon decline" data-friendship-id="${req.friendship_id}"><i class="material-icons">close</i></button>
                        </div>
                    </div>`;
            });
        } catch (e) { console.error(e); }
    }

    async function loadFriendsList() {
        try {
            const response = await fetch('api/get_friends.php');
            const friends = await response.json();
            friendsList.innerHTML = '';
            if (friends.length === 0) {
                friendsList.innerHTML = '<p>Aucun ami.</p>';
                return;
            }
            friends.forEach(friend => {
                const friendData = JSON.stringify(friend);
                friendsList.innerHTML += `
                    <div class="user-item clickable" data-friend='${friendData}'>
                        <img src="${friend.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${escapeHtml(friend.username)}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon remove-friend decline" data-friendship-id="${friend.friendship_id}"><i class="material-icons">person_remove</i></button>
                        </div>
                    </div>`;
            });
        } catch (e) { console.error(e); }
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
                        <div class="user-item-info"><strong>${escapeHtml(user.username)}</strong></div>
                        <div class="user-item-actions">
                            <button class="btn-icon add-friend" data-user-id="${user.id}"><i class="material-icons">person_add</i></button>
                        </div>
                    </div>`;
            });
        } catch (e) { console.error(e); }
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
                            <strong>${escapeHtml(user.username)}</strong>
                            <small>${user.mutual_friends} ami(s) en commun</small>
                        </div>
                        <div class="user-item-actions">
                            <button class="btn-icon add-friend" data-user-id="${user.id}"><i class="material-icons">person_add</i></button>
                        </div>
                    </div>`;
            });
        } catch (e) { console.error(e); }
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
                userSearchResults.innerHTML = '<p>Aucun résultat.</p>';
                return;
            }
            users.forEach(user => {
                let action = `<button class="btn-icon add-friend" data-user-id="${user.id}"><i class="material-icons">person_add</i></button>`;
                if (user.status === 'pending') action = `<button class="btn-icon" disabled><i class="material-icons">hourglass_top</i></button>`;
                else if (user.status === 'friends') action = `<button class="btn-icon" disabled><i class="material-icons">check</i></button>`;
                
                userSearchResults.innerHTML += `
                    <div class="user-item">
                        <img src="${user.profile_picture || 'assets/default-avatar.png'}" alt="Avatar" class="user-item-avatar">
                        <div class="user-item-info"><strong>${escapeHtml(user.username)}</strong></div>
                        <div class="user-item-actions">${action}</div>
                    </div>`;
            });
        } catch (e) { console.error(e); }
    }

    // --- Actions ---
    async function handleRequest(id, action) {
        try {
            await fetch('api/respond_to_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: id, action })
            });
            loadFriendRequests();
            loadFriendsList();
            updateNotificationDot();
        } catch (e) { alert(e); }
    }

    async function sendRequest(id, btn) {
        btn.disabled = true;
        try {
            const res = await fetch('api/send_friend_request.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient_id: id })
            });
            const data = await res.json();
            if (data.success) btn.innerHTML = '<i class="material-icons">hourglass_top</i>';
            else throw new Error(data.error);
        } catch (e) { alert(e.message); btn.disabled = false; }
    }

    async function removeFriend(id) {
        if (!confirm("Supprimer cet ami ?")) return;
        try {
            await fetch('api/remove_friend.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: id })
            });
            loadFriendsList();
        } catch (e) { alert(e); }
    }

    // --- Listeners ---
    friendsBtn.addEventListener('click', openFriendsPage);
    tabLinks.forEach(tab => tab.addEventListener('click', () => switchTab(tab)));
    userSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });

    friendRequestsList.addEventListener('click', (e) => {
        const acc = e.target.closest('.accept');
        const dec = e.target.closest('.decline');
        if (acc) handleRequest(acc.dataset.friendshipId, 'accept');
        if (dec) handleRequest(dec.dataset.friendshipId, 'decline');
    });

    const addFriendTab = document.getElementById('tab-add-friend');
    if(addFriendTab) {
        addFriendTab.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-friend');
            if (btn) sendRequest(btn.dataset.userId, btn);
        });
    }

    friendsList.addEventListener('click', (e) => {
        const rm = e.target.closest('.remove-friend');
        if (rm) { e.stopPropagation(); removeFriend(rm.dataset.friendshipId); }
        else {
            const item = e.target.closest('.user-item');
            if (item && item.dataset.friend) {
                const f = JSON.parse(item.dataset.friend);
                friendProfileName.textContent = f.username;
                friendProfileUsername.textContent = f.username;
                friendProfilePic.src = f.profile_picture || 'assets/default-avatar.png';
                friendProfileDescription.textContent = f.description || 'Aucune description.';
                switchView(friendProfileView);
                
                // Charger les soirées communes
                commonEveningsList.innerHTML = '<p>Chargement...</p>';
                fetch(`api/get_common_evenings.php?friend_id=${f.user_id}`)
                    .then(r => r.json())
                    .then(evenings => {
                        commonEveningsList.innerHTML = '';
                        if (evenings.length === 0) commonEveningsList.innerHTML = '<p>Aucune soirée en commun.</p>';
                        else {
                            evenings.forEach(ev => {
                                const d = new Date(ev.evening_date);
                                commonEveningsList.innerHTML += `
                                    <div class="evening-item" data-date="${ev.evening_date}">
                                        <div class="date">${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                        <div class="names">Soirée partagée</div>
                                    </div>`;
                            });
                        }
                    });
            }
        }
    });

    commonEveningsList.addEventListener('click', (e) => {
        const item = e.target.closest('.evening-item');
        if (item) openSharedEvening(item.dataset.date);
    });

    backToFriendsListBtn.addEventListener('click', () => switchView(friendsView));
    backToFriendProfileBtn.addEventListener('click', () => switchView(friendProfileView));
    document.getElementById('back-to-friend-profile-btn').addEventListener('click', () => {
        const sharedView = document.getElementById('shared-evening-view');
        // On vérifie d'où on vient
        if (sharedView.dataset.source === 'history') {
            switchView(document.getElementById('history-view'));
        } else {
            switchView(document.getElementById('friend-profile-view'));
        }
    });
}