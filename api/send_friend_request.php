<?php
session_start();
header('Content-Type: application/json');

// 1. Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

// 2. Vérifier la méthode et les données reçues
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$recipient_id = $data['recipient_id'] ?? null;
$current_user_id = $_SESSION['user_id'];

if (empty($recipient_id) || !is_numeric($recipient_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID du destinataire manquant ou invalide.']);
    exit();
}

// 3. Empêcher l'auto-demande
if ($recipient_id == $current_user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Vous не pouvez pas vous ajouter en ami.']);
    exit();
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 4. Vérifier s'il existe déjà une relation entre les deux utilisateurs
    $stmt = $db->prepare(
        "SELECT id FROM friendships 
         WHERE (user_one_id = :user1 AND user_two_id = :user2) 
            OR (user_one_id = :user2 AND user_two_id = :user1)"
    );
    $stmt->execute(['user1' => $current_user_id, 'user2' => $recipient_id]);

    if ($stmt->fetch()) {
        http_response_code(409); // Conflit
        echo json_encode(['success' => false, 'error' => 'Une relation (demande ou amitié) existe déjà avec cet utilisateur.']);
        exit();
    }

    // 5. Si tout est bon, on insère la nouvelle demande d'ami
    $stmt = $db->prepare(
        "INSERT INTO friendships (user_one_id, user_two_id, status) 
         VALUES (:sender, :recipient, 'pending')"
    );
    $stmt->execute(['sender' => $current_user_id, 'recipient' => $recipient_id]);

    echo json_encode(['success' => true, 'message' => 'Demande d\'ami envoyée.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>