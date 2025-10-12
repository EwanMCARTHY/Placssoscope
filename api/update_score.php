<?php
// Définit le type de contenu de la réponse en JSON
header('Content-Type: application/json');

// 1. Vérifier que la méthode de la requête est bien POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'error' => 'Méthode de requête non autorisée.']);
    exit();
}

// 2. Récupérer et décoder le JSON envoyé
$data = json_decode(file_get_contents('php://input'), true);

// 3. Valider les données : l'ID et le score doivent exister et être numériques
if (!isset($data['id']) || !is_numeric($data['id']) || !isset($data['score']) || !is_numeric($data['score'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'ID ou score manquant ou invalide.']);
    exit();
}

// 4. Valider la plage du score
$score = $data['score'];
if ($score < 0 || $score > 10) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'Le score doit être compris entre 0 et 10.']);
    exit();
}

// Si la validation est passée, on met à jour la base de données
try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("UPDATE scores SET score_value = :score WHERE id = :id");
    $stmt->execute([
        ':score' => $score,
        ':id' => $data['id']
    ]);

    // Vérifie si une ligne a bien été modifiée
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        // L'ID n'existait pas dans la base de données
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'error' => 'Aucun score trouvé avec cet ID.']);
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données: ' . $e->getMessage()]);
    exit();
}
?>