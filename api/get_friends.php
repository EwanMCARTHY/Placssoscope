<?php
session_start();
header('Content-Type: application/json');

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

    // Requête complexe pour trouver les amis
    // On doit joindre la table `users` pour obtenir les infos de l'ami,
    // qui peut être soit user_one_id, soit user_two_id.
    $stmt = $db->prepare(
        "SELECT
            u.id as user_id,
            u.username,
            u.profile_picture,
            f.id as friendship_id
         FROM friendships f
         JOIN users u ON u.id = (CASE WHEN f.user_one_id = :current_user_id THEN f.user_two_id ELSE f.user_one_id END)
         WHERE (f.user_one_id = :current_user_id OR f.user_two_id = :current_user_id)
         AND f.status = 'accepted'
         ORDER BY u.username ASC"
    );
    
    $stmt->execute(['current_user_id' => $current_user_id]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($friends);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>