<?php
// Définit le type de contenu de la réponse en JSON pour être cohérent
header('Content-Type: application/json');
session_start(); // On démarre la session

// SÉCURITÉ : Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}
$user_id = $_SESSION['user_id']; // On récupère l'ID de l'utilisateur

// 1. Vérifier que la méthode de la requête est bien POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'error' => 'Méthode de requête non autorisée. Seul POST est accepté.']);
    exit();
}

// 2. Récupérer le corps de la requête (le JSON envoyé par le script)
$json_input = file_get_contents('php://input');

// 3. Vérifier si des données ont bien été reçues
if (empty($json_input)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Aucune donnée reçue dans la requête.']);
    exit();
}

// 4. Essayer de décoder le JSON
$data = json_decode($json_input, true);

// Vérifier si le décodage a échoué
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'JSON malformé. Erreur: ' . json_last_error_msg()]);
    exit();
}

// 5. Valider les données : le score doit exister, être un nombre, et être entre 0 et 10
if (!isset($data['score']) || !is_numeric($data['score'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Score manquant ou invalide.']);
    exit();
}

$score = $data['score'];
if ($score < 0 || $score > 10) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Le score doit être compris entre 0 et 10.']);
    exit();
}

// 6. Si tout est bon, on interagit avec la base de données
try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Crée la table `scores` si elle n'existe pas (avec le user_id)
    $db->exec("CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score_value REAL NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )");

    $stmt = $db->prepare("INSERT INTO scores (user_id, score_value, created_at) VALUES (:user_id, :score, :created_at)");
    $stmt->execute([
        ':user_id' => $user_id, // On ajoute l'ID de l'utilisateur
        ':score' => $score,
        ':created_at' => date('Y-m-d H:i:s')
    ]);

    // 7. Envoyer une réponse de succès
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>