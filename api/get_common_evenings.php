<?php
session_start();
header('Content-Type: application/json');

// 1. Sécurité et validation des entrées
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

    // 2. La requête principale pour trouver les soirées en commun
    // On utilise une jointure interne (INNER JOIN) pour ne garder que les dates
    // qui existent à la fois pour l'utilisateur actuel ET pour son ami.
    // La fonction DATE() extrait juste la date (YYYY-MM-DD) de la colonne DATETIME.
    $stmt = $db->prepare(
       "SELECT DISTINCT common_date FROM (
            SELECT DATE(created_at) AS common_date FROM scores WHERE user_id = :current_user_id
        ) AS user_scores
        INNER JOIN (
            SELECT DATE(created_at) AS common_date FROM scores WHERE user_id = :friend_id
        ) AS friend_scores ON user_scores.common_date = friend_scores.common_date
        ORDER BY user_scores.common_date DESC"
    );

    $stmt->execute([
        'current_user_id' => $current_user_id,
        'friend_id' => $friend_id
    ]);

    $common_dates = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    
    if (empty($common_dates)) {
        echo json_encode([]);
        exit();
    }

    // 3. Pour chaque date commune, récupérer les noms personnalisés
    $day_names_stmt = $db->prepare(
        "SELECT day_date, custom_name, user_id FROM day_names WHERE day_date IN (" . implode(',', array_fill(0, count($common_dates), '?')) . ")"
    );
    $day_names_stmt->execute($common_dates);
    $all_names = $day_names_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Organiser les noms pour un accès facile
    $names_by_date = [];
    foreach ($all_names as $name_row) {
        $names_by_date[$name_row['day_date']][$name_row['user_id']] = $name_row['custom_name'];
    }

    // 4. Construire la réponse finale
    $result = [];
    foreach ($common_dates as $date) {
        $result[] = [
            'evening_date' => $date,
            'my_day_name' => $names_by_date[$date][$current_user_id] ?? null,
            'friend_day_name' => $names_by_date[$date][$friend_id] ?? null,
        ];
    }
    
    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>
