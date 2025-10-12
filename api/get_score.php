<?php
header('Content-Type: application/json');
session_start();

// SÉCURITÉ : Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}
$user_id = $_SESSION['user_id'];

try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // S'assure que les tables existent
    $db->exec("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, user_id INTEGER, score_value REAL, created_at DATETIME)");
    $db->exec("CREATE TABLE IF NOT EXISTS day_names (day_date TEXT, user_id INTEGER, custom_name TEXT, PRIMARY KEY (day_date, user_id))");

    // 1. Récupérer tous les noms personnalisés DE L'UTILISATEUR
    $names_stmt = $db->prepare("SELECT day_date, custom_name FROM day_names WHERE user_id = :user_id");
    $names_stmt->execute([':user_id' => $user_id]);
    $custom_names = $names_stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // 2. Récupérer tous les scores DE L'UTILISATEUR
    $scores_stmt = $db->prepare("SELECT * FROM scores WHERE user_id = :user_id ORDER BY created_at ASC");
    $scores_stmt->execute([':user_id' => $user_id]);
    $scores = $scores_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Organiser les scores par jour et combiner avec les noms
    $data_by_day = [];
    foreach ($scores as $score) {
        $timestamp = strtotime($score['created_at']);
        $day_key = (date('H', $timestamp) < 10) 
                   ? date('Y-m-d', strtotime('-1 day', $timestamp)) 
                   : date('Y-m-d', $timestamp);

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