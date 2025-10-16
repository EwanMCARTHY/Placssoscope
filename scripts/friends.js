// scripts/friends.js
import { switchView } from './ui.js';

let currentlyViewedFriend = null;
let sharedScoresChart;
let searchTimeout;

async function loadFriendData() {
    loadFriendRequests();
    loadFriendsList();
    loadFriendSuggestions();
    loadMutualFriendSuggestions(); // <-- On ajoute l'appel à la nouvelle fonction
    updateNotificationDot();
}

async function updateNotificationDot() {
    try {
        const response = await fetch('api/get_friend_requests.php');
        const requests = await response.json();
        document.getElementById('friends-btn').classList.toggle('has-notification', requests.length > 0);
        document.getElementById('requests-count-badge').textContent = requests.length || '';
        document.getElementById('requests-count-badge').style.display = requests.length > 0 ? 'inline' : 'none';
    } catch (error) {
        console.error("Erreur de notification:", error);
    }
}

async function loadFriendRequests() {
    const list = document.getElementById('friend-requests-list');
    list.innerHTML = '';
    const requests = await (await fetch('api/get_friend_requests.php')).json();
    if (requests.length === 0) {
        list.innerHTML = '<p>Aucune demande d\'ami en attente.</p>';
        return;
    }
    requests.forEach(req => {
        list.innerHTML += `
            <div class="user-item">
                <img src="${req.profile_picture || 'assets/default-avatar.png'}" class="user-item-avatar">
                <div class="user-item-info"><strong>${req.username}</strong></div>
                <div class="user-item-actions">
                    <button class="btn-icon accept" data-id="${req.friendship_id}"><i class="material-icons">check</i></button>
                    <button class="btn-icon decline" data-id="${req.friendship_id}"><i class="material-icons">close</i></button>
                </div>
            </div>`;
    });
}

async function loadFriendsList() {
    const list = document.getElementById('friends-list');
    list.innerHTML = '';
    const friends = await (await fetch('api/get_friends.php')).json();
    if (friends.length === 0) {
        list.innerHTML = '<p>Vous n\'avez aucun ami.</p>';
        return;
    }
    friends.forEach(friend => {
        const item = document.createElement('div');
        item.className = 'user-item clickable';
        item.dataset.friend = JSON.stringify(friend);
        item.innerHTML = `
            <img src="${friend.profile_picture || 'assets/default-avatar.png'}" class="user-item-avatar">
            <div class="user-item-info"><strong>${friend.username}</strong></div>
            <div class="user-item-actions">
                <button class="btn-icon remove-friend" data-id="${friend.friendship_id}"><i class="material-icons">person_remove</i></button>
            </div>`;
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-friend')) openFriendProfile(friend);
        });
        list.appendChild(item);
    });
}

// NOUVELLE FONCTION
async function loadMutualFriendSuggestions() {
    const list = document.getElementById('mutual-friend-suggestions-list');
    list.innerHTML = '';
    try {
        const response = await fetch('api/get_mutual_friend_suggestions.php');
        const suggestions = await response.json();
        
        if (suggestions.length === 0) {
            list.parentElement.style.display = 'none'; // Cache le conteneur s'il n'y a rien
            return;
        }

        list.parentElement.style.display = 'block';
        suggestions.forEach(user => {
            const mutualText = user.mutual_friends > 1 ? `${user.mutual_friends} amis en commun` : `1 ami en commun`;
            list.innerHTML += `
                <div class="user-item" id="suggestion-${user.id}">
                    <img src="${user.profile_picture || 'assets/default-avatar.png'}" class="user-item-avatar">
                    <div class="user-item-info">
                        <strong>${user.username}</strong>
                        <small>${mutualText}</small>
                    </div>
                    <div class="user-item-actions">
                        <button class="btn-icon add-friend" data-id="${user.id}"><i class="material-icons">person_add</i></button>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error('Erreur lors du chargement des suggestions mutuelles:', error);
        list.parentElement.style.display = 'none';
    }
}

async function loadFriendSuggestions() {
    const list = document.getElementById('friend-suggestions-list');
    list.innerHTML = '';
    const suggestions = await (await fetch('api/get_friend_suggestions.php')).json();
    if (suggestions.length === 0) {
        list.parentElement.style.display = 'none';
        return;
    }
    list.parentElement.style.display = 'block';
    suggestions.forEach(user => {
        list.innerHTML += `
            <div class="user-item" id="suggestion-${user.id}">
                <img src="${user.profile_picture || 'assets/default-avatar.png'}" class="user-item-avatar">
                <div class="user-item-info"><strong>${user.username}</strong></div>
                <div class="user-item-actions">
                    <button class="btn-icon add-friend" data-id="${user.id}"><i class="material-icons">person_add</i></button>
                </div>
            </div>`;
    });
}

async function searchUsers(query) {
    const resultsContainer = document.getElementById('user-search-results');
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    const users = await (await fetch(`api/search_users.php?query=${encodeURIComponent(query)}`)).json();
    resultsContainer.innerHTML = users.length === 0 ? '<p>Aucun utilisateur trouvé.</p>' : '';
    users.forEach(user => {
        resultsContainer.innerHTML += `
            <div class="user-item">
                <img src="${user.profile_picture || 'assets/default-avatar.png'}" class="user-item-avatar">
                <div class="user-item-info"><strong>${user.username}</strong></div>
                <div class="user-item-actions">
                    <button class="btn-icon add-friend" data-id="${user.id}"><i class="material-icons">person_add</i></button>
                </div>
            </div>`;
    });
}

async function openFriendProfile(friend) {
    currentlyViewedFriend = friend;
    document.getElementById('friend-profile-name').textContent = `Profil de ${friend.username}`;
    document.getElementById('friend-profile-username').textContent = friend.username;
    document.getElementById('friend-profile-pic').src = friend.profile_picture || 'assets/default-avatar.png';
    switchView(document.getElementById('friend-profile-view'));
    
    const list = document.getElementById('common-evenings-list');
    list.innerHTML = '<p>Chargement...</p>';
    const evenings = await (await fetch(`api/get_common_evenings.php?friend_id=${friend.user_id}`)).json();
    list.innerHTML = evenings.length === 0 ? '<p>Aucune soirée en commun.</p>' : '';
    evenings.forEach(evening => {
        const item = document.createElement('div');
        item.className = 'evening-item';
        item.dataset.date = evening.evening_date;
        item.innerHTML = `
            <div class="date">${new Date(evening.evening_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div class="names">${evening.my_day_name || 'Ma soirée'} avec ${evening.friend_day_name || 'sa soirée'}</div>`;
        item.addEventListener('click', () => openSharedEvening(evening.evening_date));
        list.appendChild(item);
    });
}

async function openSharedEvening(date) {
    document.getElementById('shared-evening-title').textContent = `Soirée du ${new Date(date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}`;
    switchView(document.getElementById('shared-evening-view'));

    const { my_scores, friend_scores } = await (await fetch(`api/get_evening_scores.php?friend_id=${currentlyViewedFriend.user_id}&date=${date}`)).json();
    
    const chartContext = document.getElementById('shared-scores-chart-container').getContext('2d');
    if (sharedScoresChart) sharedScoresChart.destroy();
    const getTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.getHours() < 10 ? d.getHours() + 24 + d.getMinutes() / 60 : d.getHours() + d.getMinutes() / 60;
    };
    sharedScoresChart = new Chart(chartContext, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Moi', data: my_scores.map(s => ({ x: getTime(s.created_at), y: s.score_value })), borderColor: '#9333ea', tension: 0.2 },
                { label: currentlyViewedFriend.username, data: friend_scores.map(s => ({ x: getTime(s.created_at), y: s.score_value })), borderColor: '#03dac6', tension: 0.2 }
            ]
        },
        options: { /* ... options du graphique ... */ }
    });
}

export function setupFriends() {
    document.getElementById('friends-btn').addEventListener('click', () => {
        switchView(document.getElementById('friends-view'));
        loadFriendData();
    });
    
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-link, .tab-content').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('friend-requests-list').addEventListener('click', async e => {
        const btn = e.target.closest('.btn-icon');
        if (!btn) return;
        const action = btn.classList.contains('accept') ? 'accept' : 'decline';
        await fetch('api/respond_to_friend_request.php', { method: 'POST', body: JSON.stringify({ friendship_id: btn.dataset.id, action }) });
        loadFriendData();
    });
    
    document.getElementById('friends-list').addEventListener('click', async e => {
        const btn = e.target.closest('.remove-friend');
        if (btn && confirm("Supprimer cet ami ?")) {
            await fetch('api/remove_friend.php', { method: 'POST', body: JSON.stringify({ friendship_id: btn.dataset.id }) });
            loadFriendData();
        }
    });

    const handleAddFriend = async (e) => {
        const btn = e.target.closest('.add-friend');
        if (btn) {
            btn.disabled = true;
            await fetch('api/send_friend_request.php', { method: 'POST', body: JSON.stringify({ recipient_id: btn.dataset.id }) });
            alert('Demande envoyée !');
            const itemToRemove = btn.closest('.user-item');
            if(itemToRemove) itemToRemove.remove();
        }
    };
    document.getElementById('mutual-friend-suggestions-list').addEventListener('click', handleAddFriend);
    document.getElementById('friend-suggestions-list').addEventListener('click', handleAddFriend);
    document.getElementById('user-search-results').addEventListener('click', handleAddFriend);
    
    document.getElementById('user-search-input').addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });

    document.getElementById('back-to-friends-list-btn').addEventListener('click', () => switchView(document.getElementById('friends-view')));
    document.getElementById('back-to-friend-profile-btn').addEventListener('click', () => {
        if (currentlyViewedFriend) openFriendProfile(currentlyViewedFriend);
        else switchView(document.getElementById('friends-view'));
    });
}