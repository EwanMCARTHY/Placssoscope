<?php
header('Content-Type: application/json');
session_start();

// 1. Valider la méthode et les données
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

// 2. Hacher le mot de passe
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// 3. Interagir avec la base de données
try {
    // IMPORTANT : Remplacez les informations de connexion par les vôtres
    $db_host = 'localhost'; // ou l'adresse de votre serveur de base de données
    $db_name = 'placssoscope_db'; // Le nom de votre base de données
    $db_user = 'root'; // Votre nom d'utilisateur
    $db_pass = ''; // Votre mot de passe
    
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier si l'utilisateur existe déjà
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'Ce nom d\'utilisateur est déjà pris.']);
        exit();
    }

    // Insérer le nouvel utilisateur
    $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
    $stmt->execute([':username' => $username, ':password' => $password_hash]);

    // Connecter automatiquement l'utilisateur après l'inscription
    $_SESSION['user_id'] = $db->lastInsertId();
    $_SESSION['username'] = $username;

    echo json_encode(['success' => true, 'message' => 'Compte créé avec succès.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>