<?php
header('Content-Type: application/json');
session_start();
// On définit la timezone pour être sûr, même si le gros du travail est fait en SQL
date_default_timezone_set('Europe/Paris');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non connecté']);
    exit();
}

$user_id = $_SESSION['user_id'];
$friend_user_id = $_GET['friend_id'] ?? null;

if (!$friend_user_id) {
    echo json_encode(['success' => false, 'error' => 'ID ami manquant']);
    exit();
}

try {
    $db = new PDO("mysql:host=localhost;dbname=u551125034_placssographe;charset=utf8", "u551125034_contact", "Ewan2004+");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // REQUÊTE CORRIGÉE AVEC LA LOGIQUE DES 10H
    // On décale l'heure de création de 10h en arrière (DATE_SUB) avant de prendre la DATE.
    // Ex: Le 15 à 02h00 -> devient le 14 à 16h00 -> DATE = Le 14.
    
    $sql = "
        SELECT DISTINCT 
            DATE(DATE_SUB(s1.created_at, INTERVAL 10 HOUR)) as evening_date,
            dn1.custom_name as my_day_name,
            dn2.custom_name as friend_day_name
        FROM scores s1
        JOIN scores s2 ON DATE(DATE_SUB(s1.created_at, INTERVAL 10 HOUR)) = DATE(DATE_SUB(s2.created_at, INTERVAL 10 HOUR))
        LEFT JOIN day_names dn1 ON dn1.user_id = s1.user_id AND dn1.day_date = DATE(DATE_SUB(s1.created_at, INTERVAL 10 HOUR))
        LEFT JOIN day_names dn2 ON dn2.user_id = s2.user_id AND dn2.day_date = DATE(DATE_SUB(s2.created_at, INTERVAL 10 HOUR))
        WHERE s1.user_id = :my_id 
        AND s2.user_id = :friend_id
        ORDER BY evening_date DESC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        'my_id' => $user_id,
        'friend_id' => $friend_user_id
    ]);

    $evenings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($evenings);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
}
?>