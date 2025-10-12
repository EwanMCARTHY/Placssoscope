<?php
session_start();
header('Content-Type: application/json');

// 1. Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

// 2. Récupérer le terme de recherche (envoyé via l'URL, ex: /api/search_users.php?query=John)
$query = trim($_GET['query'] ?? '');

if (empty($query)) {
    echo json_encode([]); // Renvoie un tableau vide si la recherche est vide
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

    // 3. La requête de recherche
    // On cherche les utilisateurs dont le nom ressemble à la recherche (`LIKE`)
    // On s'assure de ne pas s'inclure soi-même dans les résultats (`id != :current_user_id`)
    $stmt = $db->prepare(
        "SELECT id, username, profile_picture FROM users 
         WHERE username LIKE :query AND id != :current_user_id"
    );
    
    // Le '%' permet de chercher des noms qui *contiennent* le terme de recherche
    $stmt->execute([
        'query' => '%' . $query . '%',
        'current_user_id' => $current_user_id
    ]);

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Renvoie les résultats au format JSON
    echo json_encode($users);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>