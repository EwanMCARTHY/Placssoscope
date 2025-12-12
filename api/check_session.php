<?php
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// --- Connexion BDD (identique à avant) ---
try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur BDD']);
    exit;
}

// 1. Si l'utilisateur n'est PAS en session, on essaie de le restaurer via le cookie
if (!isset($_SESSION['user_id'])) {
    if (isset($_COOKIE['remember_me'])) {
        list($selector, $validator) = explode(':', $_COOKIE['remember_me']);
        
        $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE selector = :selector AND expires > NOW()");
        $stmt->execute(['selector' => $selector]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($token && password_verify($validator, $token['hashed_validator'])) {
            // Bingo ! Le cookie est valide, on restaure la session
            $_SESSION['user_id'] = $token['user_id'];
            
            // On récupère le username pour la session (optionnel mais propre)
            $stmtUser = $db->prepare("SELECT username FROM users WHERE id = :id");
            $stmtUser->execute(['id' => $token['user_id']]);
            $userBasic = $stmtUser->fetch(PDO::FETCH_ASSOC);
            $_SESSION['username'] = $userBasic['username'];
        }
    }
}

// 2. Vérification classique (maintenant que la session est potentiellement restaurée)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

// 3. Récupération des données fraîches (inchangé)
try {
    $stmt = $db->prepare("SELECT username, profile_picture, description FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            'success' => true,
            'username' => $user['username'],
            'profile_picture' => $user['profile_picture'],
            'description' => $user['description']
        ]);
    } else {
        session_destroy();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.']);
}
?>