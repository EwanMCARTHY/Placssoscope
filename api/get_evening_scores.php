<?php
session_start();
header('Content-Type: application/json');

date_default_timezone_set('Europe/Paris');

// 1. Sécurité et validation
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

$friend_id = $_GET['friend_id'] ?? null;
$evening_date = $_GET['date'] ?? null;

if (empty($friend_id) || !is_numeric($friend_id) || empty($evening_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants ou invalides.']);
    exit();
}

// Valide le format de la date (YYYY-MM-DD)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $evening_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Format de date invalide.']);
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

    // 2. Récupérer tous les scores pour les deux utilisateurs à la date donnée
    $stmt = $db->prepare(
        "SELECT user_id, score_value, created_at FROM scores 
         WHERE (user_id = :current_user_id OR user_id = :friend_id) 
         AND DATE(created_at) = :evening_date
         ORDER BY created_at ASC"
    );

    $stmt->execute([
        'current_user_id' => $current_user_id,
        'friend_id' => $friend_id,
        'evening_date' => $evening_date
    ]);

    $all_scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Séparer les scores en deux listes distinctes
    $my_scores = [];
    $friend_scores = [];

    foreach ($all_scores as $score) {
        if ($score['user_id'] == $current_user_id) {
            $my_scores[] = $score;
        } else {
            $friend_scores[] = $score;
        }
    }

    // 4. Construire et renvoyer la réponse
    $response = [
        'my_scores' => $my_scores,
        'friend_scores' => $friend_scores
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>