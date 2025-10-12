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

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->execute([':username' => $data['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data['password'], $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        // NOUVEAU : GESTION DE "SE SOUVENIR DE MOI"
        if (!empty($data['remember'])) {
            // Génère des jetons sécurisés
            $selector = bin2hex(random_bytes(16));
            $validator = bin2hex(random_bytes(32));
            
            // Stocke le jeton dans un cookie (qui dure 30 jours)
            setcookie(
                'remember_me',
                $selector . ':' . $validator,
                time() + 86400 * 30, // 86400 secondes = 1 jour
                '/',
                '',
                true, // `secure` - à n'utiliser que si votre site est en HTTPS
                true  // `httponly`
            );

            // Stocke la version hachée du jeton dans la base de données
            $hashed_validator = password_hash($validator, PASSWORD_DEFAULT);
            $expires = date('Y-m-d H:i:s', time() + 86400 * 30);

            $stmt = $db->prepare("INSERT INTO auth_tokens (selector, hashed_validator, user_id, expires) VALUES (:selector, :hashed_validator, :user_id, :expires)");
            $stmt->execute([
                'selector' => $selector,
                'hashed_validator' => $hashed_validator,
                'user_id' => $user['id'],
                'expires' => $expires
            ]);
        }
        // FIN DE L'AJOUT

        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Nom d\'utilisateur ou mot de passe incorrect.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
}
?>