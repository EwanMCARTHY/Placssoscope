// scripts/scores.js
import { switchView, showModal, hideModal, escapeHtml } from './ui.js';
import { openSharedEvening } from './friends.js'; // Import de la fonction

let currentScore = 5.0;
let scoresChart;
let allScoresData = {};
let scoreIdToUpdate = null;
let dayToRename = null;

function updateScoreDisplay(value) {
    document.getElementById('score-value-display').textContent = value.toFixed(1);
    currentScore = parseFloat(value);
}

async function sendScore() {
    const btn = document.getElementById('send-score-btn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Envoi...';
    const scoreToSend = currentScore;

    try {
        const response = await fetch('api/save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: scoreToSend })
        });

        if (response.status === 401) {
            alert("Session expirée. Reconnexion requise.");
            window.location.reload();
            return;
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erreur');
        
        btn.style.backgroundColor = 'var(--success-color)';
        btn.textContent = 'Envoyé !';
    } catch (error) {
        console.error('Erreur:', error);
        btn.style.backgroundColor = 'var(--error-color)';
        btn.textContent = 'Échec';
    }
    setTimeout(() => {
        btn.disabled = false;
        btn.style.backgroundColor = '';
        btn.textContent = 'Envoyer';
    }, 1500);
}

async function fetchAndDisplayScores() {
    try {
        const response = await fetch('api/get_score.php');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allScoresData = await response.json();
        displayScoresList(allScoresData);
        populateChartFilters(allScoresData);
        const allDays = Object.keys(allScoresData);
        updateChart(allDays);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('scores-list').innerHTML = `<p style="color: var(--error-color);">Impossible de charger l'historique.</p>`;
    }
}

function displayScoresList(dataByDay) {
    const container = document.getElementById('scores-list');
    container.innerHTML = '';
    const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDays.length === 0) {
        container.innerHTML = `<p>Aucun score enregistré.</p>`;
        return;
    }

    sortedDays.forEach(day => {
        const dayData = dataByDay[day];
        const dayGroupEl = document.createElement('div');
        dayGroupEl.className = 'day-group';
        dayGroupEl.dataset.day = day;
        
        const dayName = dayData.customName ? escapeHtml(dayData.customName) : new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

        dayGroupEl.innerHTML = `
            <h3>
                <span>${dayName}</span>
                <div class="day-actions" style="display:flex; gap:8px;">
                     <button class="btn-icon view-party-btn" title="Voir le groupe"><i class="material-icons">groups</i></button>
                    <button class="btn-icon rename-day-btn"><i class="material-icons">drive_file_rename_outline</i></button>
                </div>
            </h3>
        `;
        (dayData.scores || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(score => {
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
        container.appendChild(dayGroupEl);
    });
}

function populateChartFilters(dataByDay) {
    const list = document.getElementById('chart-filter-list');
    list.innerHTML = '';
    const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(b) - new Date(a));
    if (sortedDays.length <= 1) {
        document.getElementById('chart-filter-dropdown').style.display = 'none';
        return;
    }
    document.getElementById('chart-filter-dropdown').style.display = 'block';
    sortedDays.forEach(day => {
        const labelText = dataByDay[day].customName ? escapeHtml(dataByDay[day].customName) : new Date(day).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
        list.innerHTML += `
            <div class="filter-item">
                <input type="checkbox" id="filter-${day}" value="${day}" checked>
                <span class="checkmark"></span>
                <label for="filter-${day}">${labelText}</label>
            </div>`;
    });
}

function calculateXAxisBounds(datasets) {
    const allPoints = datasets.flatMap(ds => ds.data);
    if (allPoints.length === 0) return { min: 18, max: 30 };
    const minTime = Math.min(...allPoints.map(p => p.x));
    const maxTime = Math.max(...allPoints.map(p => p.x));
    if (maxTime - minTime < 4) return { min: Math.floor(minTime) - 2, max: Math.ceil(maxTime) + 2 };
    return { min: Math.floor(minTime) - 1, max: Math.ceil(maxTime) + 1 };
}

function updateChart(selectedDays) {
    const buildChartDatasets = (data, days) => {
        return days.map((day, index) => {
            const dayData = data[day];
            const color = `hsl(${(index * 50) % 360}, 70%, 60%)`;
            const getTime = (dateStr) => {
                const d = new Date(dateStr);
                let timeValue = d.getHours() + d.getMinutes() / 60;
                if (d.getHours() < 10) timeValue += 24;
                return timeValue;
            };
            return {
                label: dayData.customName || new Date(day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                data: (dayData.scores || []).map(s => ({ x: getTime(s.created_at), y: parseFloat(s.score_value) })).sort((a, b) => a.x - b.x),
                borderColor: color, backgroundColor: `${color}33`, tension: 0.2,
            };
        });
    };

    const datasets = buildChartDatasets(allScoresData, selectedDays);
    const { min, max } = calculateXAxisBounds(datasets);
    const chartContext = document.getElementById('scores-chart-container').getContext('2d');
    
    if (scoresChart) scoresChart.destroy();
    
    scoresChart = new Chart(chartContext, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear', min: min, max: max,
                    ticks: { color: '#ccc', stepSize: 2, callback: (v) => `${String(Math.floor(v) % 24).padStart(2, '0')}:00` },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: { beginAtZero: true, max: 10, ticks: { color: '#ccc', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            },
            plugins: { legend: { labels: { color: '#ccc' } } }
        }
    });
}

async function updateScore(id, newScore) {
    try {
        const res = await fetch('api/update_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, score: newScore }) });
        if (!res.ok) throw new Error();
        fetchAndDisplayScores();
    } catch (e) { alert("Erreur maj score."); }
}

async function deleteScore(id) {
    if (!confirm("Supprimer ce score ?")) return;
    try {
        const res = await fetch('api/delete_score.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (!res.ok) throw new Error();
        fetchAndDisplayScores();
    } catch (e) { alert("Erreur suppression."); }
}

async function renameDay(date, newName) {
    try {
        const res = await fetch('api/rename_day.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, name: newName }) });
        if (!res.ok) throw new Error();
        fetchAndDisplayScores();
    } catch (e) { alert("Erreur renommage."); }
}

export function setupScores(user) {
    $("#score-slider").roundSlider({
        radius: 120, width: 22, handleSize: "+8", handleShape: "dot", sliderType: "min-range",
        value: 5.0, min: 0, max: 10, step: 0.1, startAngle: 90,
        create: (e) => updateScoreDisplay(e.value),
        drag: (e) => updateScoreDisplay(e.value),
        change: (e) => updateScoreDisplay(e.value)
    });

    document.getElementById('send-score-btn').addEventListener('click', sendScore);
    document.getElementById('show-history-btn').addEventListener('click', () => {
        switchView(document.getElementById('history-view'));
        fetchAndDisplayScores();
    });
    document.getElementById('toggle-list-btn').addEventListener('click', (e) => {
        const list = document.getElementById('list-container');
        list.classList.toggle('visible');
        e.target.textContent = list.classList.contains('visible') ? 'Masquer la liste' : 'Afficher la liste';
    });

    // Event Delegation pour la liste
    document.getElementById('scores-list').addEventListener('click', e => {
        const scoreItem = e.target.closest('.score-item');
        const dayGroup = e.target.closest('.day-group');
        
        // Clic sur le bouton Groupe
        if (e.target.closest('.view-party-btn')) {
            openSharedEvening(dayGroup.dataset.day);
            return;
        }

        if (e.target.closest('.edit-btn')) {
            scoreIdToUpdate = scoreItem.dataset.id;
            document.getElementById('edit-score-input').value = scoreItem.querySelector('.score-value').textContent;
            showModal(document.getElementById('edit-modal'));
        }
        if (e.target.closest('.delete-btn')) deleteScore(scoreItem.dataset.id);
        if (e.target.closest('.rename-day-btn')) {
            dayToRename = dayGroup.dataset.day;
            document.getElementById('rename-day-input').value = allScoresData[dayToRename]?.customName || '';
            showModal(document.getElementById('rename-day-modal'));
        }
    });

    // Modales
    document.getElementById('save-edit-btn').addEventListener('click', () => {
        const newScore = parseFloat(document.getElementById('edit-score-input').value);
        if (scoreIdToUpdate !== null && !isNaN(newScore)) {
            updateScore(scoreIdToUpdate, newScore);
            hideModal(document.getElementById('edit-modal'));
        }
    });
    document.getElementById('save-rename-btn').addEventListener('click', () => {
        const newName = document.getElementById('rename-day-input').value.trim();
        if (dayToRename) {
            renameDay(dayToRename, newName);
            hideModal(document.getElementById('rename-day-modal'));
        }
    });
    
    // Filtres
    const filterList = document.getElementById('chart-filter-list');
    document.getElementById('chart-filter-btn').addEventListener('click', () => document.getElementById('chart-filter-panel').classList.toggle('visible'));
    document.addEventListener('click', (e) => {
        if (!document.getElementById('chart-filter-dropdown').contains(e.target)) {
            document.getElementById('chart-filter-panel').classList.remove('visible');
        }
    });
    filterList.addEventListener('change', () => {
        const selected = [...filterList.querySelectorAll('input:checked')].map(i => i.value);
        updateChart(selected);
    });
    document.getElementById('select-all-btn').addEventListener('click', () => {
        filterList.querySelectorAll('input').forEach(i => i.checked = true);
        filterList.dispatchEvent(new Event('change'));
    });
    document.getElementById('deselect-all-btn').addEventListener('click', () => {
        filterList.querySelectorAll('input').forEach(i => i.checked = false);
        filterList.dispatchEvent(new Event('change'));
    });
}