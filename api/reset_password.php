<?php
// api/reset_password.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORRECTION : Utilisation d'un chemin absolu pour plus de fiabilité
require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['token']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données manquantes. Veuillez réessayer.']);
    exit();
}

$token = $data['token'];
$newPassword = $data['password'];

if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Le mot de passe doit contenir au moins 8 caractères.']);
    exit();
}

try {
    // --- Configuration de la base de données ---
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT * FROM password_resets WHERE token = :token");
    $stmt->execute(['token' => $token]);
    $resetRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetRequest) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ce jeton de réinitialisation est invalide.']);
        exit();
    }

    $expires = new DateTime($resetRequest['expires_at']);
    $now = new DateTime();
    if ($now > $expires) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ce jeton de réinitialisation a expiré.']);
        exit();
    }
    
    $userId = $resetRequest['user_id'];
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
    $stmt->execute([
        'password' => $hashedPassword,
        'id' => $userId
    ]);

    $stmt = $db->prepare("DELETE FROM password_resets WHERE token = :token");
    $stmt->execute(['token' => $token]);

    echo json_encode(['success' => true, 'message' => 'Votre mot de passe a été réinitialisé avec succès.']);

} catch (PDOException $e) {
    error_log('PDO Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de connexion au serveur lors de la mise à jour.']);
} catch (Exception $e) {
    error_log('Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Une erreur inattendue est survenue.']);
}
?>