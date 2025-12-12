<?php
header('Content-Type: application/json');
session_start();
date_default_timezone_set('Europe/Paris');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non connecté']);
    exit();
}

$user_id = $_SESSION['user_id'];
$date_param = $_GET['date'] ?? null; // Format YYYY-MM-DD

if (!$date_param) {
    echo json_encode(['success' => false, 'error' => 'Date manquante']);
    exit();
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Définir la plage horaire (10h le jour J à 10h le jour J+1)
    $start_time = $date_param . ' 10:00:00';
    $end_time = date('Y-m-d H:i:s', strtotime($start_time . ' +24 hours'));

    // 2. Récupérer les ID de tous les amis (confirmés) + Moi
    // CORRECTION ICI : On utilise bien 'friendships' et non 'friends'
    $sql_users = "
        SELECT DISTINCT u.id
        FROM users u
        WHERE u.id = :my_id
        OR u.id IN (
            SELECT CASE 
                WHEN user_one_id = :my_id THEN user_two_id 
                ELSE user_one_id 
            END
            FROM friendships 
            WHERE (user_one_id = :my_id OR user_two_id = :my_id) 
            AND status = 'accepted'
        )
    ";

    // Récupération des IDs
    $stmtUsers = $db->prepare($sql_users);
    $stmtUsers->execute(['my_id' => $user_id]);
    $allowed_ids = $stmtUsers->fetchAll(PDO::FETCH_COLUMN);
    
    // Si personne n'est trouvé (peu probable car il y a au moins 'moi'), on arrête
    if (empty($allowed_ids)) {
        echo json_encode(['success' => true, 'datasets' => []]);
        exit;
    }

    // 3. Récupérer les scores et infos user pour ces IDs
    // On crée une chaîne de '?, ?, ?' pour la requête SQL IN (...)
    $placeholders = implode(',', array_fill(0, count($allowed_ids), '?'));
    
    $sql_final = "
        SELECT s.user_id, s.score_value, s.created_at, u.username, u.profile_picture
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.created_at >= ? 
        AND s.created_at < ?
        AND s.user_id IN ($placeholders)
        ORDER BY s.created_at ASC
    ";
    
    // On fusionne les paramètres de date et les IDs pour l'exécution
    $params = array_merge([$start_time, $end_time], $allowed_ids);
    
    $stmtScores = $db->prepare($sql_final);
    $stmtScores->execute($params);
    $raw_scores = $stmtScores->fetchAll(PDO::FETCH_ASSOC);

    // 4. Formater pour le Frontend
    $datasets = [];
    foreach ($raw_scores as $row) {
        $uid = $row['user_id'];
        if (!isset($datasets[$uid])) {
            $datasets[$uid] = [
                'label' => $row['username'],
                'profile_picture' => $row['profile_picture'],
                'data' => [],
                'user_id' => $uid
            ];
        }
        $datasets[$uid]['data'][] = [
            'created_at' => $row['created_at'],
            'score' => $row['score_value']
        ];
    }

    echo json_encode(['success' => true, 'datasets' => array_values($datasets)]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur Serveur : ' . $e->getMessage()]);
}
?>