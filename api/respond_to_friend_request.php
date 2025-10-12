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
$friendship_id = $data['friendship_id'] ?? null;
$action = $data['action'] ?? ''; // 'accept' ou 'decline'

if (empty($friendship_id) || !is_numeric($friendship_id) || !in_array($action, ['accept', 'decline'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données manquantes ou action invalide.']);
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

    // 3. Traiter l'action
    if ($action === 'accept') {
        // Pour accepter, on change le statut de 'pending' à 'accepted'
        // On vérifie que l'utilisateur actuel est bien le destinataire (user_two_id)
        $stmt = $db->prepare(
            "UPDATE friendships 
             SET status = 'accepted' 
             WHERE id = :friendship_id AND user_two_id = :current_user_id AND status = 'pending'"
        );
        $stmt->execute([
            'friendship_id' => $friendship_id,
            'current_user_id' => $current_user_id
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Demande d\'ami acceptée.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Demande non trouvée ou déjà traitée.']);
        }

    } elseif ($action === 'decline') {
        // Pour refuser, on supprime simplement la demande de la table
        // On vérifie que l'utilisateur actuel est bien le destinataire
        $stmt = $db->prepare(
            "DELETE FROM friendships 
             WHERE id = :friendship_id AND user_two_id = :current_user_id AND status = 'pending'"
        );
        $stmt->execute([
            'friendship_id' => $friendship_id,
            'current_user_id' => $current_user_id
        ]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Demande d\'ami refusée.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Demande non trouvée ou déjà traitée.']);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>