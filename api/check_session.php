<?php
session_start();
header('Content-Type: application/json');

function loginWithToken($db) {
    if (empty($_COOKIE['remember_me'])) {
        return false;
    }

    list($selector, $validator) = explode(':', $_COOKIE['remember_me']);
    if (!$selector || !$validator) {
        return false;
    }

    $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE selector = :selector AND expires >= NOW()");
    $stmt->execute(['selector' => $selector]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($token && password_verify($validator, $token['hashed_validator'])) {
        // Le jeton est valide, on connecte l'utilisateur
        $user_stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
        $user_stmt->execute(['id' => $token['user_id']]);
        $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            return true;
        }
    }
    
    return false;
}

// ---- LOGIQUE PRINCIPALE ----

if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    echo json_encode([
        'success' => true,
        'username' => $_SESSION['username']
    ]);
    exit();
}

// NOUVEAU : Essayer de se connecter avec le cookie
try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (loginWithToken($db)) {
        // Connexion via le jeton réussie
        echo json_encode([
            'success' => true,
            'username' => $_SESSION['username']
        ]);
    } else {
        // Aucune session et aucun jeton valide
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Aucune session active.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>