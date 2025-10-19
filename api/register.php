<?php
header('Content-Type: application/json');

// --- Connexion à la base de données ---
try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de connexion à la base de données.']);
    exit();
}

// --- Récupération et validation des données ---
$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$email = $data['email'] ?? '';

// *** CORRECTION APPLIQUÉE ICI ***
// On vérifie que les champs ne sont pas vides AVANT de continuer.
if (empty($username) || empty($password) || empty($email)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Tous les champs sont requis.']);
    exit();
}

// On vérifie que l'email a un format valide.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'L\'adresse e-mail n\'est pas valide.']);
    exit();
}

// --- Logique d'inscription ---
try {
    // Vérifier si le nom d'utilisateur ou l'e-mail existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
    $stmt->execute(['username' => $username, 'email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'Ce nom d\'utilisateur ou cet e-mail est déjà utilisé.']);
        exit();
    }

    // Hasher le mot de passe
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insérer le nouvel utilisateur
    $stmt = $db->prepare("INSERT INTO users (username, password, email) VALUES (:username, :password, :email)");
    $stmt->execute([
        'username' => $username,
        'password' => $hashed_password,
        'email' => $email
    ]);

    // Connecter automatiquement l'utilisateur après l'inscription
    session_start();
    $_SESSION['user_id'] = $db->lastInsertId();
    $_SESSION['username'] = $username;

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    // On peut donner un message plus générique en production
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données lors de l\'inscription.']);
}
?>