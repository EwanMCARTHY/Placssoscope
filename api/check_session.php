<?php
session_start();
header('Content-Type: application/json');

// Vérifie si un utilisateur est stocké en session
if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    // Si oui, on renvoie une réponse de succès avec le nom d'utilisateur
    echo json_encode([
        'success' => true,
        'username' => $_SESSION['username']
    ]);
} else {
    // Sinon, on indique que personne n'est connecté
    http_response_code(401); // Unauthorized
    echo json_encode([
        'success' => false,
        'error' => 'Aucune session active.'
    ]);
}
?>