<?php
session_start();

// 1. Détruire toutes les variables de session
$_SESSION = array();

// 2. Effacer le cookie "remember_me" en lui donnant une date d'expiration passée
if (isset($_COOKIE['remember_me'])) {
    unset($_COOKIE['remember_me']);
    // Le path '/' est important pour s'assurer qu'on cible le bon cookie
    setcookie('remember_me', '', time() - 3600, '/'); 
}

// 3. Finalement, détruire la session elle-même
session_destroy();

header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>