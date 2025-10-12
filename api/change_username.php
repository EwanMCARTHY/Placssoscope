<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$newUsername = trim($data['newUsername'] ?? '');

if (empty($newUsername)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Le nouveau nom d\'utilisateur ne peut pas être vide.']);
    exit();
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Vérifier si le nouveau nom est déjà pris par quelqu'un d'autre
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username AND id != :current_user_id");
    $stmt->execute(['username' => $newUsername, 'current_user_id' => $_SESSION['user_id']]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'Ce nom d\'utilisateur est déjà pris.']);
        exit();
    }

    // 2. Mettre à jour le nom d'utilisateur
    $stmt = $db->prepare("UPDATE users SET username = :username WHERE id = :id");
    $stmt->execute(['username' => $newUsername, 'id' => $_SESSION['user_id']]);

    // 3. Mettre à jour le nom dans la session
    $_SESSION['username'] = $newUsername;

    echo json_encode(['success' => true, 'newUsername' => $newUsername]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>