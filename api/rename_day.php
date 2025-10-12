<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}
$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['date']) || !isset($data['name']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données invalides.']);
    exit();
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact'; // Votre nom d'utilisateur corrigé
    $db_pass = 'Ewan2004+'; // Votre mot de passe

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // INSERT ... ON DUPLICATE KEY UPDATE est la syntaxe MySQL pour "INSERT OR REPLACE"
    $stmt = $db->prepare("
        INSERT INTO day_names (day_date, user_id, custom_name) 
        VALUES (:day_date, :user_id, :custom_name) 
        ON DUPLICATE KEY UPDATE custom_name = :custom_name
    ");
    
    $stmt->execute([
        ':day_date' => $data['date'],
        ':user_id' => $user_id,
        ':custom_name' => trim($data['name'])
    ]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>