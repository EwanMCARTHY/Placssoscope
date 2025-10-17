<?php
// api/request_password_reset.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- DÉBUT DU DÉBOGAGE ---
// Tentative d'inclusion manuelle pour contourner les problèmes d'autoloading.
// Ces chemins supposent que votre structure est /public_html/vendor/phpmailer/phpmailer/
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php';
// --- FIN DU DÉBOGAGE ---

// On garde l'autoload pour les autres dépendances, au cas où.
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Veuillez fournir une adresse e-mail.']);
    exit();
}

try {
    // --- Configuration de la base de données ---
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $token = bin2hex(random_bytes(50));
        $expires = new DateTime('NOW');
        $expires->add(new DateInterval('PT1H'));

        $stmt = $db->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)");
        $stmt->execute([
            'user_id' => $user['id'],
            'token' => $token,
            'expires_at' => $expires->format('Y-m-d H:i:s')
        ]);

        $mail = new PHPMailer(true);
        
        // --- CONFIGURATION SMTP ---
        // $mail->SMTPDebug = 2; // Décommentez pour un débogage détaillé
        $mail->isSMTP();
        $mail->Host = 'smtp.hostinger.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'contact@placssographe.fr';
        $mail->Password = 'Ewan2004+';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';
        
        $mail->setFrom('contact@placssographe.fr', 'Plac\'ssographe');
        $mail->addAddress($data['email']);
        
        $mail->isHTML(true);
        $mail->Subject = 'Réinitialisation de votre mot de passe';
        $resetLink = "https://placssographe.fr/index.html?reset_token=" . $token;
        $mail->Body    = "Bonjour,<br><br>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant : <a href='{$resetLink}'>Réinitialiser mon mot de passe</a><br><br>Ce lien expirera dans une heure.<br><br>L'équipe Plac'ssographe";
        
        $mail->send();
    }
    
    echo json_encode(['success' => true, 'message' => 'Si un compte est associé à cet e-mail, un lien de réinitialisation a été envoyé.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Le service de messagerie a rencontré un problème.', 'details' => $mail->ErrorInfo]);
}
?>