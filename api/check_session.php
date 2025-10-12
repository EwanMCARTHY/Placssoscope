<?php
session_start();
header('Content-Type: application/json');

/**
 * Tente de connecter un utilisateur via le cookie "remember_me".
 * @param PDO $db L'objet de connexion à la base de données.
 * @return bool True si la connexion a réussi, sinon false.
 */
function loginWithToken($db) {
    if (empty($_COOKIE['remember_me'])) {
        return false;
    }

    // Sépare le sélecteur et le validateur du cookie
    list($selector, $validator) = explode(':', $_COOKIE['remember_me'], 2);
    if (!$selector || !$validator) {
        return false;
    }

    // Recherche le jeton dans la base de données
    $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE selector = :selector AND expires >= NOW()");
    $stmt->execute(['selector' => $selector]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    // Vérifie si le jeton existe et si le validateur est correct
    if ($token && password_verify($validator, $token['hashed_validator'])) {
        // Le jeton est valide, on récupère les infos de l'utilisateur
        $user_stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
        $user_stmt->execute(['id' => $token['user_id']]);
        $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // On démarre la session pour l'utilisateur
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            return true;
        }
    }
    
    return false;
}

// ---- LOGIQUE PRINCIPALE ----

// D'abord, on vérifie s'il y a déjà une session active
if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    try {
        // Connexion à la BDD pour récupérer la photo de profil
        $db_host = 'localhost';
        $db_name = 'u551125034_placssographe';
        $db_user = 'u551125034_contact';
        $db_pass = 'Ewan2004+';
        
        $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $db->prepare("SELECT profile_picture FROM users WHERE id = :id");
        $stmt->execute(['id' => $_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'username' => $_SESSION['username'],
            'profile_picture' => $user['profile_picture'] ?? null
        ]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
        exit();
    }
}

// S'il n'y a pas de session, on essaie de se connecter avec le cookie
try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (loginWithToken($db)) {
        // La connexion via le jeton a réussi, on peut maintenant renvoyer les infos
        $stmt = $db->prepare("SELECT profile_picture FROM users WHERE id = :id");
        $stmt->execute(['id' => $_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'username' => $_SESSION['username'],
            'profile_picture' => $user['profile_picture'] ?? null
        ]);
    } else {
        // Aucune session et aucun jeton valide
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Aucune session active.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>