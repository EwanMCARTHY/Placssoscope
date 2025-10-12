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

// 3. Valider les données : l'ID doit exister et être un nombre
if (!isset($data['id']) || !is_numeric($data['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => 'ID manquant ou invalide.']);
    exit();
}

// Si la validation est passée, on procède à la suppression
try {
    $db_path = '../database/scores.db';
    $db = new PDO('sqlite:' . $db_path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("DELETE FROM scores WHERE id = :id");
    $stmt->execute([':id' => $data['id']]);
    
    // Vérifie si une ligne a bien été supprimée
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