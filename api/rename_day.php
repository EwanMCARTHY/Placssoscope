<?php
header('Content-Type: application/json');
session_start();

// SÉCURITÉ : Vérifier si l'utilisateur est connecté
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

if (!isset($data['date']) || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données manquantes : date et nom sont requis.']);
    exit();
}

$day_date = $data['date'];
$custom_name = trim($data['name']);

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Format de date invalide.']);
    exit();
}

try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec("CREATE TABLE IF NOT EXISTS day_names (
        day_date TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        custom_name TEXT NOT NULL,
        PRIMARY KEY (day_date, user_id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )");

    $stmt = $db->prepare("INSERT OR REPLACE INTO day_names (day_date, user_id, custom_name) VALUES (:day_date, :user_id, :custom_name)");
    
    $stmt->execute([
        ':day_date' => $day_date,
        ':user_id' => $user_id, // On ajoute l'ID de l'utilisateur
        ':custom_name' => $custom_name
    ]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>