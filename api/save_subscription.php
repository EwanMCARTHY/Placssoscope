<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['endpoint'])) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'error' => 'Données d\'abonnement invalides.']));
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);

    // On utilise INSERT ... ON DUPLICATE KEY UPDATE pour éviter les doublons
    $stmt = $db->prepare("
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (:user_id, :endpoint, :p256dh, :auth)
        ON DUPLICATE KEY UPDATE p256dh = :p256dh, auth = :auth
    ");
    
    $stmt->execute([
        'user_id' => $_SESSION['user_id'],
        'endpoint' => $data['endpoint'],
        'p256dh' => $data['keys']['p256dh'],
        'auth' => $data['keys']['auth']
    ]);
    
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
}
?>