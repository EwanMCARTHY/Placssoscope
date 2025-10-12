document.addEventListener('DOMContentLoaded', () => {
    // --- Références aux éléments du DOM ---
    const mainView = document.getElementById('main-view');
    const historyView = document.getElementById('history-view');
    const sendScoreBtn = document.getElementById('send-score-btn');
    const showHistoryBtn = document.getElementById('show-history-btn');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const scoreValueDisplay = document.getElementById('score-value-display');
    const scoresListContainer = document.getElementById('scores-list');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    const listContainer = document.getElementById('list-container');
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
    
    let currentScore = 5.0;
    let scoresChart;
    let scoreIdToUpdate = null;
    let dayToRename = null;
    let allScoresData = {};

    // --- Initialisation du slider circulaire ---
    try {
        if ($ && $.fn.roundSlider) {
            $("#score-slider").roundSlider({
                radius: 120, width: 22, handleSize: "+8", handleShape: "dot",
                sliderType: "min-range", value: 5.0, min: 0, max: 10, step: 0.1, startAngle: 90,
                create: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); },
                drag: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); },
                change: (e) => { scoreValueDisplay.textContent = e.value.toFixed(1); currentScore = parseFloat(e.value); }
            });
        } else { throw new Error("jQuery ou roundSlider non chargé."); }
    } catch (error) {
        console.error("Erreur d'initialisation du slider.", error);
        document.querySelector('.score-input-container').innerHTML = `<p style="color: var(--error-color);">Erreur: Le composant de score n'a pas pu charger.</p>`;
    }

    // --- Gestion des Événements ---
    sendScoreBtn.addEventListener('click', async () => { /* ... (code inchangé) ... */ });
    showHistoryBtn.addEventListener('click', () => { switchView(historyView); fetchAndDisplayScores(); });
    backToMainBtn.addEventListener('click', () => { switchView(mainView); });
    toggleListBtn.addEventListener('click', () => { /* ... (code inchangé) ... */ });
    saveEditBtn.addEventListener('click', () => { /* ... (code inchangé) ... */ });
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    chartFilterBtn.addEventListener('click', () => { chartFilterPanel.classList.toggle('visible'); });
    document.addEventListener('click', (e) => { if (!chartFilterDropdown.contains(e.target)) chartFilterPanel.classList.remove('visible'); });
    chartFilterList.addEventListener('click', (e) => {
        const item = e.target.closest('.filter-item');
        if (item && e.target.tagName.toLowerCase() !== 'input' && e.target.tagName.toLowerCase() !== 'label') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                chartFilterList.dispatchEvent(new Event('change'));
            }
        }
    });
    chartFilterList.addEventListener('change', () => {
        const selectedDays = [...chartFilterList.querySelectorAll('input:checked')].map(input => input.value);
        updateChart(selectedDays);
        updateFilterButtonText();
    });
    selectAllBtn.addEventListener('click', () => {
        chartFilterList.querySelectorAll('input').forEach(input => input.checked = true);
        chartFilterList.dispatchEvent(new Event('change'));
    });
    deselectAllBtn.addEventListener('click', () => {
        chartFilterList.querySelectorAll('input').forEach(input => input.checked = false);
        chartFilterList.dispatchEvent(new Event('change'));
    });
    saveRenameBtn.addEventListener('click', () => {
        const newName = renameDayInput.value.trim();
        if (dayToRename && newName) {
            renameDay(dayToRename, newName);
            closeRenameModal();
        }
    });
    cancelRenameBtn.addEventListener('click', closeRenameModal);
    renameDayModal.addEventListener('click', (e) => { if (e.target === renameDayModal) closeRenameModal(); });
    
    // --- Fonctions ---
    function switchView(viewToShow) { /* ... (code inchangé) ... */ }
    async function fetchAndDisplayScores() { /* ... (code inchangé) ... */ }
    function displayScoresList(dataByDay) { /* ... (code inchangé) ... */ }
    function populateChartFilters(dataByDay) { /* ... (code inchangé) ... */ }
    function updateFilterButtonText() { /* ... (code inchangé) ... */ }
    function updateChart(selectedDays) { /* ... (code inchangé) ... */ }
    function buildChartDatasets(dataByDay, daysToInclude) { /* ... (code inchangé) ... */ }
    
    function displayScoresChart(initialDatasets) {
        const chartCanvas = document.getElementById('scores-chart-container');
        if (!chartCanvas) return;
        const chartContext = chartCanvas.getContext('2d');
        if (scoresChart) scoresChart.destroy();

        const textColor = getComputedStyle(document.body).getPropertyValue('--on-surface-color').trim();
        const gridColor = 'rgba(255, 255, 255, 0.1)';

        // --- CORRECTION : Calcul des bornes dynamiques de l'axe X ---
        let minTime = Infinity;
        let maxTime = -Infinity;

        if (initialDatasets.length > 0) {
            initialDatasets.forEach(dataset => {
                dataset.data.forEach(point => {
                    if (point.x < minTime) minTime = point.x;
                    if (point.x > maxTime) maxTime = point.x;
                });
            });
        } else {
            // Valeurs par défaut si aucune donnée
            minTime = 10;
            maxTime = 34;
        }
        
        // Ajoute un peu de marge pour la lisibilité
        const axisMin = Math.floor(minTime) - 1;
        const axisMax = Math.ceil(maxTime) + 1;
        // --- FIN DE LA CORRECTION ---

        scoresChart = new Chart(chartContext, {
            type: 'line', data: { datasets: initialDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false, 
                scales: {
                    x: {
                        type: 'linear',
                        // On utilise les bornes dynamiques
                        min: axisMin,
                        max: axisMax,
                        ticks: {
                            color: textColor,
                            stepSize: 2,
                            callback: (value) => `${String(Math.floor(value) % 24).padStart(2, '0')}:00`
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        beginAtZero: true, max: 10,
                        ticks: { color: textColor, stepSize: 1 },
                        grid: { color: gridColor }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: textColor }
                    },
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

    // --- Fonctions de gestion de la liste (inchangées) ---
    function addListActionListeners() { /* ... */ }
    function handleEdit(scoreItem) { /* ... */ }
    function closeEditModal() { /* ... */ }
    async function handleDelete(scoreItem) { /* ... */ }
    async function updateScore(id, newScore) { /* ... */ }
    async function renameDay(date, newName) { /* ... */ }

    // --- Code complet des fonctions inchangées ---
    sendScoreBtn.addEventListener('click', async () => { sendScoreBtn.disabled = true; sendScoreBtn.textContent = 'Envoi...'; try { const response = await fetch('api/save_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: currentScore }) }); const result = await response.json(); if (result.success) { sendScoreBtn.style.backgroundColor = 'var(--success-color)'; sendScoreBtn.textContent = 'Envoyé !'; } else { throw new Error(result.error || 'Erreur inconnue'); } } catch (error) { console.error('Erreur lors de l\'envoi du score:', error); sendScoreBtn.style.backgroundColor = 'var(--error-color)'; sendScoreBtn.textContent = 'Échec'; } setTimeout(() => { sendScoreBtn.disabled = false; sendScoreBtn.style.backgroundColor = ''; sendScoreBtn.textContent = 'Envoyer'; }, 1500); });
    showHistoryBtn.addEventListener('click', () => { switchView(historyView); fetchAndDisplayScores(); });
    backToMainBtn.addEventListener('click', () => { switchView(mainView); });
    toggleListBtn.addEventListener('click', () => { listContainer.classList.toggle('visible'); toggleListBtn.textContent = listContainer.classList.contains('visible') ? 'Masquer la liste' : 'Afficher la liste'; });
    saveEditBtn.addEventListener('click', () => { const newScore = parseFloat(editScoreInput.value); if (scoreIdToUpdate !== null && !isNaN(newScore) && newScore >= 0 && newScore <= 10) { updateScore(scoreIdToUpdate, newScore); closeEditModal(); } });
    function switchView(viewToShow) { [mainView, historyView].forEach(v => v.classList.remove('active-view')); viewToShow.classList.add('active-view'); listContainer.classList.remove('visible'); toggleListBtn.textContent = 'Afficher la liste'; }
    async function fetchAndDisplayScores() { try { const response = await fetch('api/get_scores.php'); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); allScoresData = await response.json(); displayScoresList(allScoresData); populateChartFilters(allScoresData); updateChart(Object.keys(allScoresData)); updateFilterButtonText(); toggleListBtn.style.display = Object.keys(allScoresData).length > 0 ? 'block' : 'none'; } catch (error) { console.error('Erreur lors de la récupération des scores:', error); scoresListContainer.innerHTML = `<p style="color: var(--error-color);">Impossible de charger l'historique.</p>`; toggleListBtn.style.display = 'none'; } }
    function displayScoresList(dataByDay) { scoresListContainer.innerHTML = ''; const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a)); if (sortedDays.length === 0) { scoresListContainer.innerHTML = `<p>Aucun score enregistré.</p>`; return; } sortedDays.forEach(day => { const dayData = dataByDay[day]; const dayGroupEl = document.createElement('div'); dayGroupEl.className = 'day-group'; dayGroupEl.dataset.day = day; const title = document.createElement('h3'); const titleText = document.createElement('span'); titleText.textContent = dayData.customName || new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); const renameBtn = document.createElement('button'); renameBtn.className = 'btn-icon rename-day-btn'; renameBtn.innerHTML = `<i class="material-icons">drive_file_rename_outline</i>`; title.appendChild(titleText); title.appendChild(renameBtn); dayGroupEl.appendChild(title); const scoresForDay = dayData.scores; if (Array.isArray(scoresForDay)) { scoresForDay.forEach(score => { const scoreItemEl = document.createElement('div'); scoreItemEl.className = 'score-item'; scoreItemEl.dataset.id = score.id; scoreItemEl.innerHTML = `<span class="score-time">${new Date(score.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span><span class="score-value">${parseFloat(score.score_value).toFixed(1)}</span><div class="score-actions"><button class="btn-icon edit-btn"><i class="material-icons">edit</i></button><button class="btn-icon delete-btn"><i class="material-icons">delete</i></button></div>`; dayGroupEl.appendChild(scoreItemEl); }); } scoresListContainer.appendChild(dayGroupEl); }); addListActionListeners(); }
    function populateChartFilters(dataByDay) { chartFilterList.innerHTML = ''; const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a)); if (sortedDays.length <= 1) { chartFilterDropdown.style.display = 'none'; return; } chartFilterDropdown.style.display = 'block'; sortedDays.forEach(day => { const dayData = dataByDay[day]; const date = new Date(day); const labelText = dayData.customName || date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' }); const item = document.createElement('div'); item.className = 'filter-item'; const input = document.createElement('input'); input.type = 'checkbox'; input.id = `filter-${day}`; input.value = day; input.checked = true; const checkmark = document.createElement('span'); checkmark.className = 'checkmark'; const label = document.createElement('label'); label.htmlFor = `filter-${day}`; label.textContent = labelText; item.appendChild(input); item.appendChild(checkmark); item.appendChild(label); chartFilterList.appendChild(item); }); }
    function updateFilterButtonText() { const count = chartFilterList.querySelectorAll('input:checked').length; if (count === 0) { chartFilterBtnText.textContent = "Aucun jour sélectionné"; } else if (count === 1) { chartFilterBtnText.textContent = "1 jour sélectionné"; } else { chartFilterBtnText.textContent = `${count} jours sélectionnés`; } }
    function updateChart(selectedDays) { const datasets = buildChartDatasets(allScoresData, selectedDays); if (scoresChart) { scoresChart.destroy(); displayScoresChart(datasets); } else { displayScoresChart(datasets); } }
    function buildChartDatasets(dataByDay, daysToInclude) { const sortedDays = Object.keys(dataByDay).filter(day => daysToInclude.includes(day)).sort((a, b) => new Date(a) - new Date(b)); return sortedDays.map((day, index) => { const dayData = dataByDay[day]; const scores = dayData.scores; if (!Array.isArray(scores)) return null; const color = `hsl(${(index * 50) % 360}, 70%, 60%)`; const getTimeValue = (dateString) => { const date = new Date(dateString); let timeValue = date.getHours() + date.getMinutes() / 60; if (date.getHours() < 10) timeValue += 24; return timeValue; }; return { label: dayData.customName || new Date(day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }), data: scores.map(s => ({ x: getTimeValue(s.created_at), y: parseFloat(s.score_value) })), borderColor: color, backgroundColor: `${color}33`, tension: 0.2, pointRadius: 4, pointHoverRadius: 7 }; }).filter(ds => ds !== null); }
    function addListActionListeners() { scoresListContainer.addEventListener('click', (e) => { const editBtn = e.target.closest('.edit-btn'); if (editBtn) handleEdit(editBtn.closest('.score-item')); const deleteBtn = e.target.closest('.delete-btn'); if (deleteBtn) handleDelete(deleteBtn.closest('.score-item')); const renameBtn = e.target.closest('.rename-day-btn'); if (renameBtn) handleRename(renameBtn.closest('.day-group')); }); }
    function handleEdit(scoreItem) { scoreIdToUpdate = scoreItem.dataset.id; editScoreInput.value = scoreItem.querySelector('.score-value').textContent; editModal.classList.add('visible'); }
    function closeEditModal() { editModal.classList.remove('visible'); scoreIdToUpdate = null; }
    function handleRename(dayGroup) { dayToRename = dayGroup.dataset.day; const currentName = allScoresData[dayToRename]?.customName || ''; renameDayInput.value = currentName; renameDayModal.classList.add('visible'); renameDayInput.focus(); }
    function closeRenameModal() { renameDayModal.classList.remove('visible'); dayToRename = null; }
    async function handleDelete(scoreItem) { const scoreId = scoreItem.dataset.id; scoreItem.style.opacity = '0'; setTimeout(async () => { try { const res = await fetch('api/delete_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: scoreId }) }); const result = await res.json(); if (result.success) { fetchAndDisplayScores(); } else { throw new Error(result.error); } } catch (error) { console.error("Erreur de suppression:", error); scoreItem.style.opacity = '1'; } }, 300); }
    async function updateScore(id, newScore) { try { const res = await fetch('api/update_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, score: newScore }) }); const result = await res.json(); if (result.success) fetchAndDisplayScores(); } catch (error) { console.error('Erreur de mise à jour:', error); } }
    async function renameDay(date, newName) { try { const res = await fetch('api/rename_day.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, name: newName }) }); const result = await res.json(); if (result.success) { fetchAndDisplayScores(); } } catch (error) { console.error('Erreur lors du renommage:', error); } }
});