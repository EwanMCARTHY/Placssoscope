<?php
session_start();
header('Content-Type: application/json');

// 1. Sécurité et validation
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

$evening_date = $_GET['date'] ?? null;
if (empty($evening_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $evening_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Date manquante ou invalide.']);
    exit();
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $current_user_id = $_SESSION['user_id'];

    // 2. Requête pour trouver les amis présents à une date donnée
    $stmt = $db->prepare(
        "SELECT DISTINCT
            u.id as user_id,
            u.username,
            u.profile_picture
         FROM users u
         -- Jointure pour ne garder que les amis
         JOIN friendships f ON 
            (f.user_one_id = u.id AND f.user_two_id = :current_user_id) OR 
            (f.user_two_id = u.id AND f.user_one_id = :current_user_id)
         -- Jointure pour vérifier qu'ils ont un score ce jour-là
         JOIN scores s ON s.user_id = u.id
         WHERE f.status = 'accepted' AND DATE(s.created_at) = :evening_date"
    );
    
    $stmt->execute([
        'current_user_id' => $current_user_id,
        'evening_date' => $evening_date
    ]);
    
    $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($attendees);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>