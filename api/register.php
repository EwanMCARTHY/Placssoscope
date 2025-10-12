<?php
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nom d\'utilisateur ou mot de passe manquant.']);
    exit();
}

$username = trim($data['username']);
$password = $data['password'];

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Les champs ne peuvent pas être vides.']);
    exit();
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Ce nom d\'utilisateur est déjà pris.']);
        exit();
    }

    $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
    $stmt->execute([':username' => $username, ':password' => $password_hash]);

    $_SESSION['user_id'] = $db->lastInsertId();
    $_SESSION['username'] = $username;

    echo json_encode(['success' => true, 'message' => 'Compte créé avec succès.']);

} catch (PDOException $e) {
    http_response_code(500);
    // Pour le débogage, il est utile de voir l'erreur exacte
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>