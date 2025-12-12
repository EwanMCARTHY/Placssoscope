<?php
header('Content-Type: application/json');
session_start();

date_default_timezone_set('Europe/Paris');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}
$user_id = $_SESSION['user_id'];

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact'; // Votre nom d'utilisateur corrigé
    $db_pass = 'Ewan2004+'; // Votre mot de passe

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $names_stmt = $db->prepare("SELECT day_date, custom_name FROM day_names WHERE user_id = :user_id");
    $names_stmt->execute([':user_id' => $user_id]);
    $custom_names = $names_stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $scores_stmt = $db->prepare("SELECT * FROM scores WHERE user_id = :user_id ORDER BY created_at ASC");
    $scores_stmt->execute([':user_id' => $user_id]);
    $scores = $scores_stmt->fetchAll(PDO::FETCH_ASSOC);

    $data_by_day = [];
    foreach ($scores as $score) {
        $timestamp = strtotime($score['created_at']);
        $day_key = (date('H', $timestamp) < 10) 
                   ? date('Y-m-d', strtotime('-1 day', $timestamp)) 
                   : date('Y-m-d', $timestamp);

        if (!isset($data_by_day[$day_key])) {
            $data_by_day[$day_key] = [
                'customName' => $custom_names[$day_key] ?? null,
                'scores' => []
            ];
        }
        $data_by_day[$day_key]['scores'][] = $score;
    }

    echo json_encode((object)$data_by_day);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
}
?>