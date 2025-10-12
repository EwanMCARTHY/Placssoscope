document.addEventListener('DOMContentLoaded', () => {
    // --- Vues de l'application ---
    const authView = document.getElementById('auth-view');
    const mainView = document.getElementById('main-view');
    const historyView = document.getElementById('history-view');

    // --- Éléments d'authentification ---
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchAuthBtn = document.getElementById('switch-auth-btn');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');

    // --- Éléments de l'application principale ---
    const sendScoreBtn = document.getElementById('send-score-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const scoreValueDisplay = document.getElementById('score-value-display');
    const scoresListContainer = document.getElementById('scores-list');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    const listContainer = document.getElementById('list-container');

    // --- Éléments des modales et filtres (inchangés) ---
    const editModal = document.getElementById('edit-modal');
    const editScoreInput = document.getElementById('edit-score-input');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const chartFilterDropdown = document.getElementById('chart-filter-dropdown');
    const chartFilterBtn = document.getElementById('chart-filter-btn');
    const chartFilterBtnText = document.getElementById('chart-filter-btn-text');
    const chartFilterPanel = document.getElementById('chart-filter-panel');
    const chartFilterList = document.getElementById('chart-filter-list');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const renameDayModal = document.getElementById('rename-day-modal');
    const renameDayInput = document.getElementById('rename-day-input');
    const saveRenameBtn = document.getElementById('save-rename-btn');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    
    // --- Variables d'état ---
    let isLoginMode = true;
    let currentUser = null; // Contiendra { username: '...' }
    let currentScore = 5.0;
    let scoresChart;
    let scoreIdToUpdate = null;
    let dayToRename = null;
    let allScoresData = {};

    // =========================================================================
    // --- GESTION DE L'AUTHENTIFICATION ---
    // =========================================================================

    function switchAuthMode() {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Connexion' : 'Inscription';
        authSubmitBtn.textContent = isLoginMode ? 'Se connecter' : 'Créer un compte';
        switchAuthBtn.textContent = isLoginMode ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter';
        errorMessage.style.display = 'none';
        authForm.reset();
    }

    async function handleAuth(event) {
        event.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        const endpoint = isLoginMode ? 'api/login.php' : 'api/register.php';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Connexion réussie
                currentUser = { username }; // On stocke le nom d'utilisateur
                initializeApp();
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
        // On réinitialise complètement l'état de l'application
        authForm.reset();
        switchView(authView);
        document.body.classList.remove('app-loaded');
        if (scoresChart) {
            scoresChart.destroy();
            scoresChart = null;
        }
    }

    // CORRECTION : La fonction vérifie maintenant la session via le nouveau script
    async function checkSession() {
        try {
            const response = await fetch('api/check_session.php');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // L'utilisateur est connecté, on stocke son nom
                    currentUser = { username: result.username };
                    initializeApp();
                } else {
                    throw new Error("Session invalide.");
                }
            } else {
                // L'utilisateur n'est pas connecté
                switchView(authView);
                document.body.classList.add('app-loaded');
            }
        } catch (error) {
            console.error("Pas de session active, affichage de la page de connexion.", error);
            switchView(authView);
            document.body.classList.add('app-loaded');
        }
    }
    
    // =========================================================================
    // --- INITIALISATION DE L'APPLICATION ---
    // =========================================================================

    function initializeApp() {
        // CORRECTION : On utilise la variable currentUser pour le message
        if (currentUser) {
            welcomeMessage.textContent = `Bienvenue, ${currentUser.username} !`;
        }
        switchView(mainView);
        document.body.classList.add('app-loaded');
        initializeSlider();
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
    // --- LOGIQUE PRINCIPALE DE L'APPLICATION (le reste du fichier est inchangé) ---
    // =========================================================================

    function switchView(viewToShow) {
        [authView, mainView, historyView].forEach(v => v.classList.remove('active-view'));
        viewToShow.classList.add('active-view');
        listContainer.classList.remove('visible');
        toggleListBtn.textContent = 'Afficher la liste';
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
                throw new Error(result.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du score:', error);
            sendScoreBtn.style.backgroundColor = 'var(--error-color)';
            sendScoreBtn.textContent = 'Échec';
            if (error.message.includes('Utilisateur non connecté')) logout();
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
            // On s'assure que les IDs sont uniques pour éviter les conflits de clics
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
        let minTime = 10;
        let maxTime = 34;
        
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
                borderColor: color,
                backgroundColor: `${color}33`,
                tension: 0.2,
                pointRadius: 4,
                pointHoverRadius: 7
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
            type: 'line',
            data: { datasets: initialDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: axisMin,
                        max: axisMax,
                        ticks: { color: textColor, stepSize: 2, callback: (value) => `${String(Math.floor(value) % 24).padStart(2, '0')}:00` },
                        grid: { color: gridColor }
                    },
                    y: {
                        beginAtZero: true, max: 10, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }
                    }
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
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) handleEdit(editBtn.closest('.score-item'));
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) handleDelete(deleteBtn.closest('.score-item'));
            const renameBtn = e.target.closest('.rename-day-btn');
            if (renameBtn) handleRename(renameBtn.closest('.day-group'));
        });
    }

    function handleEdit(scoreItem) {
        scoreIdToUpdate = scoreItem.dataset.id;
        editScoreInput.value = scoreItem.querySelector('.score-value').textContent;
        editModal.classList.add('visible');
    }
    function closeEditModal() {
        editModal.classList.remove('visible');
        scoreIdToUpdate = null;
    }
    
    function handleRename(dayGroup) {
        dayToRename = dayGroup.dataset.day;
        const currentName = allScoresData[dayToRename]?.customName || '';
        renameDayInput.value = currentName;
        renameDayModal.classList.add('visible');
        renameDayInput.focus();
    }
    function closeRenameModal() {
        renameDayModal.classList.remove('visible');
        dayToRename = null;
    }
    
    async function handleDelete(scoreItem) {
        const scoreId = scoreItem.dataset.id;
        if (!confirm("Voulez-vous vraiment supprimer ce score ?")) return;
        
        try {
            const res = await fetch('api/delete_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: scoreId })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                fetchAndDisplayScores();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Erreur de suppression:", error);
            alert("La suppression a échoué.");
        }
    }

    async function updateScore(id, newScore) {
        try {
            const res = await fetch('api/update_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, score: newScore })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                fetchAndDisplayScores();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur de mise à jour:', error);
            alert("La mise à jour a échoué.");
        }
    }
    
    async function renameDay(date, newName) {
        try {
            const res = await fetch('api/rename_day.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, name: newName })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                fetchAndDisplayScores();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur lors du renommage:', error);
            alert("Le renommage a échoué.");
        }
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    switchAuthBtn.addEventListener('click', switchAuthMode);
    authForm.addEventListener('submit', handleAuth);
    logoutBtn.addEventListener('click', logout);
    showHistoryBtn.addEventListener('click', () => { switchView(historyView); fetchAndDisplayScores(); });
    backToMainBtn.addEventListener('click', () => { switchView(mainView); });
    sendScoreBtn.addEventListener('click', sendScore);
    toggleListBtn.addEventListener('click', () => { listContainer.classList.toggle('visible'); toggleListBtn.textContent = listContainer.classList.contains('visible') ? 'Masquer la liste' : 'Afficher la liste'; });
    saveEditBtn.addEventListener('click', () => { const newScore = parseFloat(editScoreInput.value); if (scoreIdToUpdate !== null && !isNaN(newScore) && newScore >= 0 && newScore <= 10) { updateScore(scoreIdToUpdate, newScore); closeEditModal(); } });
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    saveRenameBtn.addEventListener('click', () => { const newName = renameDayInput.value.trim(); if (dayToRename) { renameDay(dayToRename, newName); closeRenameModal(); } });
    cancelRenameBtn.addEventListener('click', closeRenameModal);
    renameDayModal.addEventListener('click', (e) => { if (e.target === renameDayModal) closeRenameModal(); });
    chartFilterBtn.addEventListener('click', () => { chartFilterPanel.classList.toggle('visible'); });
    document.addEventListener('click', (e) => { if (!chartFilterDropdown.contains(e.target)) chartFilterPanel.classList.remove('visible'); });
    chartFilterList.addEventListener('change', () => {
        const selectedDays = [...chartFilterList.querySelectorAll('input:checked')].map(input => input.value);
        updateChart(selectedDays);
        updateFilterButtonText(selectedDays.length);
    });
    selectAllBtn.addEventListener('click', () => { chartFilterList.querySelectorAll('input').forEach(input => input.checked = true); chartFilterList.dispatchEvent(new Event('change')); });
    deselectAllBtn.addEventListener('click', () => { chartFilterList.querySelectorAll('input').forEach(input => input.checked = false); chartFilterList.dispatchEvent(new Event('change')); });

    // --- DÉMARRAGE ---
    checkSession();
});