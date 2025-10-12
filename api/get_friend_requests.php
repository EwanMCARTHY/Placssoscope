<?php
session_start();
header('Content-Type: application/json');

// 1. Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
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

    // 2. La requête pour récupérer les demandes en attente
    // On fait une "jointure" entre la table `friendships` et la table `users`
    // pour récupérer les informations de l'expéditeur (user_one_id)
    $stmt = $db->prepare(
        "SELECT f.id as friendship_id, u.id as user_id, u.username, u.profile_picture 
         FROM friendships f
         JOIN users u ON f.user_one_id = u.id
         WHERE f.user_two_id = :current_user_id AND f.status = 'pending'"
    );
    
    $stmt->execute(['current_user_id' => $current_user_id]);

    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Renvoie les résultats
    echo json_encode($requests);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>