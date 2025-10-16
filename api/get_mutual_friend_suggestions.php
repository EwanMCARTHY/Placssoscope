<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']));
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $current_user_id = $_SESSION['user_id'];

    // Cette requête complexe identifie les "amis d'amis"
    $stmt = $db->prepare("
        SELECT
            u.id,
            u.username,
            u.profile_picture,
            COUNT(DISTINCT f1.friend_id) as mutual_friends
        FROM
            -- Étape 1: Obtenir la liste des amis de l'utilisateur actuel (F1)
            (
                SELECT user_two_id as friend_id FROM friendships WHERE user_one_id = :current_user_id AND status = 'accepted'
                UNION
                SELECT user_one_id as friend_id FROM friendships WHERE user_two_id = :current_user_id AND status = 'accepted'
            ) AS f1
        -- Étape 2: Trouver les relations d'amitié de ces amis (F1)
        JOIN friendships AS f2 ON (f2.user_one_id = f1.friend_id OR f2.user_two_id = f1.friend_id) AND f2.status = 'accepted'
        -- Étape 3: Obtenir les informations de l'ami de l'ami (le F2, la suggestion potentielle)
        JOIN users AS u ON u.id = IF(f2.user_one_id = f1.friend_id, f2.user_two_id, f2.user_one_id)
        WHERE
            -- Étape 4: Exclure l'utilisateur actuel des suggestions
            u.id != :current_user_id
            -- Étape 5: Exclure les personnes qui sont déjà amies avec l'utilisateur actuel
            AND u.id NOT IN (SELECT friend_id FROM (
                SELECT user_two_id as friend_id FROM friendships WHERE user_one_id = :current_user_id AND status = 'accepted'
                UNION
                SELECT user_one_id as friend_id FROM friendships WHERE user_two_id = :current_user_id AND status = 'accepted'
            ) as my_friends_to_exclude)
        GROUP BY
            u.id, u.username, u.profile_picture
        ORDER BY
            mutual_friends DESC, RAND()
        LIMIT 10
    ");
    
    $stmt->execute(['current_user_id' => $current_user_id]);
    $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($suggestions);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>