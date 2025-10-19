<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

if (!isset($_FILES['profile_picture'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Aucun fichier envoyé.']);
    exit();
}

$file = $_FILES['profile_picture'];

// --- Vérifications de sécurité ---
// 1. Erreurs d'upload ?
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur lors de l\'upload.']);
    exit();
}

// 2. Taille du fichier (max 2 Mo)
$maxSize = 2 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => 'Le fichier est trop volumineux (max 2 Mo).']);
    exit();
}

// 3. Type de fichier (uniquement JPEG et PNG)
$allowedTypes = ['image/jpeg', 'image/png'];
$fileType = mime_content_type($file['tmp_name']);
if (!in_array($fileType, $allowedTypes)) {
    http_response_code(415);
    echo json_encode(['success' => false, 'error' => 'Type de fichier non autorisé (JPEG et PNG uniquement).']);
    exit();
}

// --- Traitement du fichier ---
$uploadDir = '../uploads/';
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
// Crée un nom de fichier unique pour éviter les conflits
$newFileName = 'user_' . $_SESSION['user_id'] . '_' . time() . '.' . strtolower($extension);
$destination = $uploadDir . $newFileName;

try {
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';

    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Avant d'uploader le nouveau, on supprime l'ancien (s'il existe)
    $stmt = $db->prepare("SELECT profile_picture FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && !empty($user['profile_picture']) && file_exists('../' . $user['profile_picture'])) {
        unlink('../' . $user['profile_picture']);
    }

    // Déplace le fichier uploadé vers sa destination finale
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        // Met à jour la base de données avec le chemin du nouveau fichier
        $filePathInDb = 'uploads/' . $newFileName;
        $stmt = $db->prepare("UPDATE users SET profile_picture = :path WHERE id = :id");
        $stmt->execute(['path' => $filePathInDb, 'id' => $_SESSION['user_id']]);

        // *** CORRECTION APPLIQUÉE ICI ***
        // On renvoie 'filepath' en minuscules pour correspondre au JavaScript
        echo json_encode(['success' => true, 'filepath' => $filePathInDb]);
    } else {
        throw new Exception('Impossible de déplacer le fichier uploadé.');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>