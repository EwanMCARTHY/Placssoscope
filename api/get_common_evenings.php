<?php
session_start();
header('Content-Type: application/json');

// 1. Sécurité et validation
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

$friend_id = $_GET['friend_id'] ?? null;
if (empty($friend_id) || !is_numeric($friend_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID de l\'ami manquant ou invalide.']);
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

    // 2. Requête SQL corrigée et optimisée
    $stmt = $db->prepare(
        "SELECT
            dates.evening_date,
            n1.custom_name as my_day_name,
            n2.custom_name as friend_day_name
        FROM (
            -- Cette sous-requête identifie les dates où les DEUX utilisateurs ont enregistré des scores
            SELECT DATE(s.created_at) as evening_date
            FROM scores s
            WHERE s.user_id IN (:current_user_id, :friend_id)
            GROUP BY evening_date
            HAVING COUNT(DISTINCT s.user_id) = 2
        ) as dates
        -- On joint ensuite les noms de journées pour chaque utilisateur
        LEFT JOIN day_names n1 ON n1.day_date = dates.evening_date AND n1.user_id = :current_user_id
        LEFT JOIN day_names n2 ON n2.day_date = dates.evening_date AND n2.user_id = :friend_id
        ORDER BY dates.evening_date DESC"
    );

    $stmt->execute([
        'current_user_id' => $current_user_id,
        'friend_id'       => $friend_id
    ]);

    $evenings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Renvoie le résultat
    echo json_encode($evenings);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>

