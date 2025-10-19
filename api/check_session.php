<?php
session_start();
header('Content-Type: application/json');

// On empêche la mise en cache de cette réponse par le navigateur
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

try {
    // --- Connexion à la base de données ---
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- Relecture des informations utilisateur à jour ---
    $stmt = $db->prepare("SELECT username, profile_picture, description FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // On renvoie les données fraîches de la base de données
        echo json_encode([
            'success' => true,
            'username' => $user['username'],
            'profile_picture' => $user['profile_picture'],
            'description' => $user['description']
        ]);
    } else {
        // Si l'utilisateur n'est plus dans la DB, on détruit la session
        session_destroy();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur non trouvé']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>