<?php
session_start();
header('Content-Type: application/json');

// --- Chargement des dépendances ---
require_once '../vendor/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// --- Sécurité et validation ---
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$recipient_id = $data['recipient_id'] ?? null;
$sender_id = $_SESSION['user_id'];

if (empty($recipient_id) || !is_numeric($recipient_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de destinataire invalide.']);
    exit();
}

// --- Connexion DB ---
try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de connexion à la base de données.']);
    exit();
}

$notification_error = null;

try {
    // --- Logique principale : Création de la demande d'ami ---
    $stmt = $db->prepare("INSERT INTO friendships (user_one_id, user_two_id, status) VALUES (:user_one, :user_two, 'pending')");
    $stmt->execute(['user_one' => $sender_id, 'user_two' => $recipient_id]);

    // --- Logique secondaire : Envoi de la notification Push ---
    try {
        $stmt = $db->prepare("SELECT * FROM push_subscriptions WHERE user_id = :user_id ORDER BY id DESC LIMIT 1");
        $stmt->execute(['user_id' => $recipient_id]);
        $subscription_data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($subscription_data) {
            $stmt = $db->prepare("SELECT username FROM users WHERE id = :id");
            $stmt->execute(['id' => $sender_id]);
            $sender = $stmt->fetch(PDO::FETCH_ASSOC);
            $sender_name = $sender ? $sender['username'] : 'Quelqu\'un';

            $auth = [
                'VAPID' => [
                    'subject' => 'https://placssographe.fr',
                    'publicKey' => 'BIbvLm2QQbMYUcN-hJ4xS-T13vmcVYFvGPMbIVHxKVygy-56wJ73q_TFumpahkN1nHQO_JmSrVWFA9_N9hJJ0Ms',
                    'privateKey' => 'b7NLe2o3577rMeqqlN9EZwVL_AVaWAqtKnQd8fQukAc',
                ],
            ];

            $webPush = new WebPush($auth);

            // *** CORRECTION APPLIQUÉE ICI ***
            $notificationPayload = json_encode([
                'title' => 'Nouvelle demande d\'ami !',
                'body' => $sender_name . ' vous a envoyé une demande d\'ami.',
                'icon' => 'assets/default-avatar.png',
                'data' => [
                    'url' => '/?action=show_friend_requests' // On ajoute l'URL de destination
                ]
            ]);

            $subscription = Subscription::create([
                'endpoint' => $subscription_data['endpoint'],
                'publicKey' => $subscription_data['p256dh'],
                'authToken' => $subscription_data['auth'],
            ]);
            
            $webPush->sendOneNotification($subscription, $notificationPayload);
        }
    } catch (Throwable $e) {
        $notification_error = $e->getMessage();
    }

    echo json_encode(['success' => true, 'notification_error' => $notification_error]);

} catch (PDOException $e) {
    if ($e->getCode() == 23000) { 
        echo json_encode(['success' => true, 'message' => 'Une demande existe déjà.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur de base de données : ' . $e->getMessage()]);
    }
}
?>