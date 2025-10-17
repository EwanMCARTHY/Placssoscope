<?php
// api/check_session.php

session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    // L'utilisateur est connecté, on renvoie ses informations
    echo json_encode([
        'success' => true,
        'username' => $_SESSION['username'],
        'profile_picture' => $_SESSION['profile_picture'] ?? null 
    ]);
} else {
    // Personne n'est connecté, on envoie une réponse claire avec un statut 401
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No active session']);
}
?>