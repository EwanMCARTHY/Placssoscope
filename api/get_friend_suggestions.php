<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
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

    // Requête pour trouver des utilisateurs aléatoires qui ne sont pas amis
    $stmt = $db->prepare(
        "SELECT u.id, u.username, u.profile_picture
         FROM users u
         LEFT JOIN friendships f ON
            (f.user_one_id = :current_user_id AND f.user_two_id = u.id) OR
            (f.user_two_id = :current_user_id AND f.user_one_id = u.id)
         WHERE f.id IS NULL AND u.id != :current_user_id
         ORDER BY RAND()
         LIMIT 5" // On suggère 5 personnes au hasard
    );
    
    $stmt->execute(['current_user_id' => $current_user_id]);
    $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($suggestions);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>