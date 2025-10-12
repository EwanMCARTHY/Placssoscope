<?php
header('Content-Type: application/json');

// 1. Validation de la requête
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
$custom_name = trim($data['name']); // Retire les espaces en début/fin

// Valide le format de la date (YYYY-MM-DD)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Format de date invalide.']);
    exit();
}

// 2. Interaction avec la base de données
try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Crée la nouvelle table si elle n'existe pas
    $db->exec("CREATE TABLE IF NOT EXISTS day_names (
        day_date TEXT PRIMARY KEY,
        custom_name TEXT NOT NULL
    )");

    // Utilise INSERT OR REPLACE pour insérer ou mettre à jour la ligne
    $stmt = $db->prepare("INSERT OR REPLACE INTO day_names (day_date, custom_name) VALUES (:day_date, :custom_name)");
    
    $stmt->execute([
        ':day_date' => $day_date,
        ':custom_name' => $custom_name
    ]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>