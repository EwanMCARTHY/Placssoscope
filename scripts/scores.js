// scripts/scores.js
import { switchView, showModal, hideModal, escapeHtml } from './ui.js';
import { openSharedEvening } from './friends.js';

let currentScore = 5.0;
let scoresChart;
let allScoresData = {};
let scoreIdToUpdate = null;
let dayToRename = null;

function getScoreDescription(score) {
    if (score >= 10) return "T'es complètement plac'ss !";
    if (score >= 9) return "Marche difficile, on ne te comprend plus";
    if (score >= 8) return "Tu titubes et t'as du mal à parler";
    if (score >= 7) return "Tu as les premières pertes d'équilibre";
    if (score >= 6) return "T'es bien";
    if (score >= 5) return "Tu ne peux plus ignorer les effets";
    if (score >= 4) return "Tu as les premiers effets";
    if (score >= 3) return "Tu sens que t'es pas parfaitement sobre";
    if (score >= 2) return "Tu sens que les effets vont bientôt arriver";
    if (score >= 1) return "T'as touché à ton premier verre";
    return "T'es sobre";
}

function updateScoreDisplay(value) {
    const floatVal = parseFloat(value);
    
    // Mise à jour du chiffre au centre
    document.getElementById('score-value-display').textContent = floatVal.toFixed(1);
    
    // Mise à jour du texte de description
    const descriptionEl = document.getElementById('score-description');
    if (descriptionEl) {
        descriptionEl.textContent = getScoreDescription(floatVal);
    }
    
    currentScore = floatVal;
}

async function sendScore() {
    const btn = document.getElementById('send-score-btn');
    
    // Protection anti-spam clic
    if (btn.disabled) return;

    btn.disabled = true;
    btn.textContent = 'Envoi...';

    // On fige la valeur au moment du clic
    const scoreToSend = currentScore;

    try {
        const response = await fetch('api/save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: scoreToSend })
        });

        // Gestion expiration session
        if (response.status === 401) {
            alert("Votre session a expiré. Veuillez vous reconnecter.");
            window.location.reload();
            return;
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erreur inconnue');

        btn.style.backgroundColor = 'var(--success-color)';
        btn.textContent = 'Envoyé !';
        
        // Optionnel : Recharger l'historique si on est sur la vue historique
        // fetchAndDisplayScores(); 

    } catch (error) {
        console.error('Erreur envoi:', error);
        btn.style.backgroundColor = 'var(--error-color)';
        btn.textContent = 'Échec';
    } finally {
        setTimeout(() => {
            btn.disabled = false;
            btn.style.backgroundColor = '';
            btn.textContent = 'Envoyer';
        }, 1500);
    }
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
        console.error('Erreur fetch scores:', error);
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
        
        // Sécurisation du nom de la journée
        const dayName = dayData.customName 
            ? escapeHtml(dayData.customName) 
            : new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

        dayGroupEl.innerHTML = `
            <h3>
                <span>${dayName}</span>
                <div class="day-actions" style="display:flex; gap:8px;">
                    <button class="btn-icon view-party-btn" title="Voir le groupe"><i class="material-icons">groups</i></button>
                    <button class="btn-icon rename-day-btn" title="Renommer"><i class="material-icons">drive_file_rename_outline</i></button>
                </div>
            </h3>
        `;
        
        (dayData.scores || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(score => {
            const scoreItemEl = document.createElement('div');
            scoreItemEl.className = 'score-item';
            scoreItemEl.dataset.id = score.id;
            
            // Formatage de l'heure
            const timeStr = new Date(score.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            scoreItemEl.innerHTML = `
                <span class="score-time">${timeStr}</span>
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
        const dayName = dataByDay[day].customName 
            ? escapeHtml(dataByDay[day].customName) 
            : new Date(day).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
            
        list.innerHTML += `
            <div class="filter-item">
                <input type="checkbox" id="filter-${day}" value="${day}" checked>
                <span class="checkmark"></span>
                <label for="filter-${day}">${dayName}</label>
            </div>`;
    });
}

function calculateXAxisBounds(datasets) {
    const allPoints = datasets.flatMap(ds => ds.data);
    
    if (allPoints.length === 0) {
        // Vue par défaut 18h -> 06h (30h)
        return { min: 18, max: 30 };
    }
    
    const minTime = Math.min(...allPoints.map(p => p.x));
    const maxTime = Math.max(...allPoints.map(p => p.x));
    
    // Si la plage est trop petite (< 4h), on l'élargit pour la lisibilité
    if (maxTime - minTime < 4) {
        return { min: Math.floor(minTime) - 2, max: Math.ceil(maxTime) + 2 };
    }
    
    return { min: Math.floor(minTime) - 1, max: Math.ceil(maxTime) + 1 };
}

function updateChart(selectedDays) {
    const buildChartDatasets = (data, days) => {
        return days.map((day, index) => {
            const dayData = data[day];
            const color = `hsl(${(index * 50) % 360}, 70%, 60%)`;
            
            const getTime = (dateStr) => {
                if (!dateStr) return 0;
                const parts = dateStr.split(' ');
                const timeParts = parts[1].split(':');
                const hour = parseInt(timeParts[0], 10);
                const minute = parseInt(timeParts[1], 10);
                
                let timeValue = hour + minute / 60;
                if (hour < 10) timeValue += 24; 
                return timeValue;
            };
            
            const dayLabel = dayData.customName 
                ? escapeHtml(dayData.customName)
                : new Date(day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });

            return {
                label: dayLabel,
                data: (dayData.scores || [])
                    .map(s => ({ x: getTime(s.created_at), y: parseFloat(s.score_value) }))
                    .sort((a, b) => a.x - b.x),
                borderColor: color, 
                backgroundColor: `${color}33`, // Opacité
                tension: 0.2,
            };
        });
    };

    const datasets = buildChartDatasets(allScoresData, selectedDays);
    const { min, max } = calculateXAxisBounds(datasets);
    const chartContext = document.getElementById('scores-chart-container').getContext('2d');
    
    if (scoresChart) {
        scoresChart.destroy();
    }
    
    scoresChart = new Chart(chartContext, {
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
                    ticks: { 
                        color: '#ccc', 
                        stepSize: 2, 
                        callback: (v) => `${String(Math.floor(v) % 24).padStart(2, '0')}:00` 
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: { 
                    beginAtZero: true, 
                    max: 10, 
                    ticks: { color: '#ccc', stepSize: 1 }, 
                    grid: { color: 'rgba(255, 255, 255, 0.1)' } 
                }
            },
            plugins: { legend: { labels: { color: '#ccc' } } }
        }
    });
}

async function updateScore(id, newScore) {
    try {
        const res = await fetch('api/update_score.php', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ id, score: newScore }) 
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);
        fetchAndDisplayScores();
    } catch (error) { 
        alert("La mise à jour a échoué."); 
    }
}

async function deleteScore(id) {
    if (!confirm("Voulez-vous vraiment supprimer ce score ?")) return;
    try {
        const res = await fetch('api/delete_score.php', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ id }) 
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);
        fetchAndDisplayScores();
    } catch (error) { 
        alert("La suppression a échoué."); 
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
        
        if (!res.ok) throw new Error(result.error);
        fetchAndDisplayScores();
    } catch (error) { 
        alert("Le renommage a échoué."); 
    }
}

export function setupScores() {
    // Initialisation du slider rond
    $("#score-slider").roundSlider({
        radius: 120, width: 22, handleSize: "+8", handleShape: "dot", sliderType: "min-range",
        value: 5.0, min: 0, max: 10, step: 0.1, startAngle: 90,
        create: (e) => updateScoreDisplay(e.value),
        drag: (e) => updateScoreDisplay(e.value),
        change: (e) => updateScoreDisplay(e.value)
    });

    // Listeners principaux
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

    // Délégation d'événements pour la liste (Performance & Dynamique)
    document.getElementById('scores-list').addEventListener('click', e => {
        const scoreItem = e.target.closest('.score-item');
        const dayGroup = e.target.closest('.day-group');
        
        // Clic sur le bouton Groupe
        if (e.target.closest('.view-party-btn')) {
            // On appelle la fonction importée avec le paramètre 'history' pour gérer le retour
            openSharedEvening(dayGroup.dataset.day, 'history');
            return;
        }

        // Clic sur Modifier
        if (e.target.closest('.edit-btn')) {
            scoreIdToUpdate = scoreItem.dataset.id;
            document.getElementById('edit-score-input').value = scoreItem.querySelector('.score-value').textContent;
            showModal(document.getElementById('edit-modal'));
        }
        
        // Clic sur Supprimer
        if (e.target.closest('.delete-btn')) {
            deleteScore(scoreItem.dataset.id);
        }
        
        // Clic sur Renommer la journée
        if (e.target.closest('.rename-day-btn')) {
            dayToRename = dayGroup.dataset.day;
            document.getElementById('rename-day-input').value = allScoresData[dayToRename]?.customName || '';
            showModal(document.getElementById('rename-day-modal'));
        }
    });

    // --- Modales ---

    // Bouton Annuler l'édition (Correction Bug)
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        hideModal(document.getElementById('edit-modal'));
        scoreIdToUpdate = null;
    });

    // Bouton Valider l'édition (Validation stricte)
    document.getElementById('save-edit-btn').addEventListener('click', () => {
        const inputVal = document.getElementById('edit-score-input').value;
        const newScore = parseFloat(inputVal);
        
        if (scoreIdToUpdate && !isNaN(newScore) && newScore >= 0 && newScore <= 10) {
            updateScore(scoreIdToUpdate, newScore);
            hideModal(document.getElementById('edit-modal'));
            scoreIdToUpdate = null; // Reset après succès
        } else {
            alert("Score invalide. Il doit être compris entre 0 et 10.");
        }
    });

    // Bouton Valider le renommage
    document.getElementById('save-rename-btn').addEventListener('click', () => {
        const newName = document.getElementById('rename-day-input').value.trim();
        if (dayToRename) {
            renameDay(dayToRename, newName);
            hideModal(document.getElementById('rename-day-modal'));
        }
    });
    
    // Bouton Annuler le renommage (Bonus, au cas où il manquerait)
    document.getElementById('cancel-rename-btn')?.addEventListener('click', () => {
        hideModal(document.getElementById('rename-day-modal'));
        dayToRename = null;
    });
    
    // --- Filtres du graphique ---
    const filterList = document.getElementById('chart-filter-list');
    
    document.getElementById('chart-filter-btn').addEventListener('click', () => {
        document.getElementById('chart-filter-panel').classList.toggle('visible');
    });
    
    // Fermer le dropdown si on clique ailleurs
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