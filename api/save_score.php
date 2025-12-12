<?php
header('Content-Type: application/json');
session_start();

date_default_timezone_set('Europe/Paris');

// Vérifie si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}
$user_id = $_SESSION['user_id'];

// Vérifie que la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Valide les données du score
if (!isset($data['score']) || !is_numeric($data['score']) || $data['score'] < 0 || $data['score'] > 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Score invalide.']);
    exit();
}

try {
    // Informations de connexion à votre base de données MySQL
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact'; // Votre nom d'utilisateur corrigé
    $db_pass = 'Ewan2004+'; // Votre mot de passe

    // Connexion à MySQL
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Prépare et exécute la requête d'insertion
    $stmt = $db->prepare("INSERT INTO scores (user_id, score_value, created_at) VALUES (:user_id, :score, :created_at)");
    $stmt->execute([
        ':user_id' => $user_id,
        ':score' => $data['score'],
        ':created_at' => date('Y-m-d H:i:s')
    ]);

    // Envoie une réponse de succès
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>