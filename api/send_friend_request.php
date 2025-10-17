<?php
session_start();
header('Content-Type: application/json');

// On inclut notre chargeur manuel correct qui s'occupe de tout.
require_once __DIR__ . '/../vendor/autoloader.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']));
}

$data = json_decode(file_get_contents('php://input'), true);
$recipient_id = $data['recipient_id'] ?? null;
$current_user_id = $_SESSION['user_id'];

if (empty($recipient_id) || !is_numeric($recipient_id) || $recipient_id == $current_user_id) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'error' => 'ID destinataire invalide.']));
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si une relation existe déjà
    $stmt = $db->prepare("SELECT id FROM friendships WHERE (user_one_id = :u1 AND user_two_id = :u2) OR (user_one_id = :u2 AND user_two_id = :u1)");
    $stmt->execute(['u1' => $current_user_id, 'u2' => $recipient_id]);
    if ($stmt->fetch()) {
        http_response_code(409);
        exit(json_encode(['success' => false, 'error' => 'Une relation existe déjà.']));
    }

    // Insérer la demande d'ami
    $stmt = $db->prepare("INSERT INTO friendships (user_one_id, user_two_id, status) VALUES (:sender, :recipient, 'pending')");
    $stmt->execute(['sender' => $current_user_id, 'recipient' => $recipient_id]);

    // --- ENVOI DE LA NOTIFICATION ---
    $stmtSub = $db->prepare("SELECT * FROM push_subscriptions WHERE user_id = :user_id");
    $stmtSub->execute(['user_id' => $recipient_id]);
    $subscriptions = $stmtSub->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($subscriptions)) {
        $auth = [
            'VAPID' => [
                'subject' => 'mailto: <contact@placssographe.fr>', // N'oubliez pas de mettre votre email
                'publicKey' => 'BIbvLm2QQbMYUcN-hJ4xS-T13vmcVYFvGPMbIVHxKVygy-56wJ73q_TFumpahkN1nHQO_JmSrVWFA9_N9hJJ0Ms',  // Et vos clés VAPID
                'privateKey' => 'b7NLe2o3577rMeqqlN9EZwVL_AVaWAqtKnQd8fQukAc',
            ],
        ];

        $webPush = new WebPush($auth);
        
        $payload = json_encode([
            'title' => 'Nouvelle demande d\'ami !',
            'body' => $_SESSION['username'] . ' vous a envoyé une demande d\'ami.',
        ]);

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint' => $sub['endpoint'],
                'publicKey' => $sub['p256dh'],
                'authToken' => $sub['auth'],
            ]);
            $webPush->queueNotification($subscription, $payload);
        }
        
        foreach ($webPush->flush() as $report) {
            // Gérer les erreurs ici si besoin
        }
    }

    echo json_encode(['success' => true, 'message' => 'Demande d\'ami envoyée.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Throwable $e) { // Attrape toutes les erreurs, y compris celles de la bibliothèque
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur lors de l\'envoi de la notif: ' . $e->getMessage()]);
}
?>