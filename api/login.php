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

// 2. Interagir avec la base de données
try {
    // IMPORTANT : Remplacez les informations de connexion par les vôtres
    $db_host = 'localhost';
    $db_name = 'placssoscope_db';
    $db_user = 'root';
    $db_pass = '';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Récupérer l'utilisateur
    $stmt = $db->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Vérifier le mot de passe
    if ($user && password_verify($password, $user['password'])) {
        // Le mot de passe est correct, on démarre la session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode(['success' => true]);
    } else {
        // Identifiants incorrects
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'error' => 'Nom d\'utilisateur ou mot de passe incorrect.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>