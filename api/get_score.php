<?php
header('Content-Type: application/json');

try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // S'assure que les deux tables existent
    $db->exec("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score_value REAL, created_at DATETIME)");
    $db->exec("CREATE TABLE IF NOT EXISTS day_names (day_date TEXT PRIMARY KEY, custom_name TEXT)");

    // 1. Récupérer tous les noms personnalisés
    $names_stmt = $db->query("SELECT * FROM day_names");
    $custom_names = $names_stmt->fetchAll(PDO::FETCH_KEY_PAIR); // ['YYYY-MM-DD' => 'Custom Name']

    // 2. Récupérer tous les scores
    $scores_stmt = $db->query("SELECT * FROM scores ORDER BY created_at ASC");
    $scores = $scores_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Organiser les scores par jour et combiner avec les noms
    $data_by_day = [];
    foreach ($scores as $score) {
        $timestamp = strtotime($score['created_at']);
        $day_key = (date('H', $timestamp) < 10) 
                   ? date('Y-m-d', strtotime('-1 day', $timestamp)) 
                   : date('Y-m-d', $timestamp);

        // Initialise le groupe pour ce jour s'il n'existe pas
        if (!isset($data_by_day[$day_key])) {
            $data_by_day[$day_key] = [
                'customName' => isset($custom_names[$day_key]) ? $custom_names[$day_key] : null,
                'scores' => []
            ];
        }
        $data_by_day[$day_key]['scores'][] = $score;
    }

    echo json_encode((object) $data_by_day);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
}
?>