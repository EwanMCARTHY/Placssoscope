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
    echo json_encode(['success' => false, 'error' => 'Méthode de requête non autorisée.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !is_numeric($data['id']) || !isset($data['score']) || !is_numeric($data['score'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID ou score manquant ou invalide.']);
    exit();
}

$score = $data['score'];
if ($score < 0 || $score > 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Le score doit être compris entre 0 et 10.']);
    exit();
}

try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // La requête UPDATE inclut maintenant une vérification de user_id
    $stmt = $db->prepare("UPDATE scores SET score_value = :score WHERE id = :id AND user_id = :user_id");
    $stmt->execute([
        ':score' => $score,
        ':id' => $data['id'],
        ':user_id' => $user_id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Aucun score trouvé avec cet ID pour cet utilisateur.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>