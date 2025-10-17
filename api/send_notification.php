<?php
require __DIR__ . '/../vendor/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// Récupérez ici les abonnements de votre base de données
$db_host = 'localhost';
$db_name = 'u551125034_placssographe';
$db_user = 'u551125034_contact';
$db_pass = 'Ewan2004+';
$db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);

$subscriptions = $db->query("SELECT * FROM push_subscriptions")->fetchAll(PDO::FETCH_ASSOC);

// TODO : Remplacez par vos clés VAPID (la clé publique doit correspondre à celle dans notifications.js)
$auth = [
    'VAPID' => [
        'subject' => 'mailto:votre-email@votredomaine.com',
        'publicKey' => 'BIbvLm2QQbMYUcN-hJ4xS-T13vmcVYFvGPMbIVHxKVygy-56wJ73q_TFumpahkN1nHQO_JmSrVWFA9_N9hJJ0Ms',
        'privateKey' => 'b7NLe2o3577rMeqqlN9EZwVL_AVaWAqtKnQd8fQukAc',
    ],
];

$webPush = new WebPush($auth);

$notification = [
    'title' => 'Nouvelle notification !',
    'body' => 'Ceci est un test de notification push.',
];

foreach ($subscriptions as $sub) {
    $subscription = Subscription::create([
        'endpoint' => $sub['endpoint'],
        'publicKey' => $sub['p256dh'],
        'authToken' => $sub['auth'],
    ]);
    $webPush->queueNotification($subscription, json_encode($notification));
}

/**
 * @var MessageSentReport $report
 */
foreach ($webPush->flush() as $report) {
    $endpoint = $report->getRequest()->getUri()->__toString();

    if ($report->isSuccess()) {
        echo "[v] Message envoyé avec succès pour {$endpoint}.";
    } else {
        echo "[x] Message échoué pour {$endpoint}: {$report->getReason()}";
    }
}