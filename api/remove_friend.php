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
$friendship_id = $data['friendship_id'] ?? null;

if (empty($friendship_id) || !is_numeric($friendship_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de l\'amitié manquant.']);
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

    // On supprime l'amitié, en s'assurant que l'utilisateur actuel fait bien partie de cette relation
    $stmt = $db->prepare(
        "DELETE FROM friendships 
         WHERE id = :friendship_id AND (user_one_id = :current_user_id OR user_two_id = :current_user_id)"
    );

    $stmt->execute([
        'friendship_id' => $friendship_id,
        'current_user_id' => $current_user_id
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Ami supprimé.']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Relation non trouvée.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>