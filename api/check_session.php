<?php
session_start();
header('Content-Type: application/json');

function loginWithToken($db) {
    if (empty($_COOKIE['remember_me'])) {
        return false;
    }
    list($selector, $validator) = explode(':', $_COOKIE['remember_me'], 2);
    if (!$selector || !$validator) return false;

    $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE selector = :selector AND expires >= NOW()");
    $stmt->execute(['selector' => $selector]);
    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($token && password_verify($validator, $token['hashed_validator'])) {
        $user_stmt = $db->prepare("SELECT id, username, profile_picture, description FROM users WHERE id = :id"); // MODIFIÉ
        $user_stmt->execute(['id' => $token['user_id']]);
        $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            return $user; // On retourne l'utilisateur complet
        }
    }
    return false;
}

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $user_data = null;

    if (isset($_SESSION['user_id'])) {
        $stmt = $db->prepare("SELECT id, username, profile_picture, description FROM users WHERE id = :id"); // MODIFIÉ
        $stmt->execute(['id' => $_SESSION['user_id']]);
        $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $user_data = loginWithToken($db);
    }

    if ($user_data) {
        echo json_encode([
            'success' => true,
            'username' => $user_data['username'],
            'profile_picture' => $user_data['profile_picture'],
            'description' => $user_data['description'] // AJOUTÉ
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Aucune session active.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>