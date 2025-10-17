<?php
// api/request_password_reset.php

// Lignes de débogage : à commenter ou supprimer une fois que tout fonctionne
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Vérification cruciale du chemin de l'autoload
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Fichier autoload manquant. Vérifiez le chemin et l\'installation de Composer.']);
    exit();
}
require $autoloadPath;

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
    $db_host = 'localhost';
    $db_name = 'u551125034_placssographe';
    $db_user = 'u551125034_contact';
    $db_pass = 'Ewan2004+';
    $db = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // On ne fait l'envoi que si l'utilisateur existe
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
        // $mail->SMTPDebug = 2; // Décommentez pour avoir des logs très détaillés de l'envoi
        $mail->isSMTP();
        $mail->Host = 'smtp.votreserveur.com'; // Ex: smtp.gmail.com, smtp.ionos.fr
        $mail->SMTPAuth = true;
        $mail->Username = 'votre_email@example.com';
        $mail->Password = 'votre_mot_de_passe_email_ou_application';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        $mail->setFrom('no-reply@placssographe.fr', 'Plac\'ssographe');
        $mail->addAddress($data['email']);
        
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = 'Réinitialisation de votre mot de passe';
        $resetLink = "https://placssographe.fr/index.html?reset_token=" . $token;
        $mail->Body    = "Bonjour,<br><br>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant : <a href='{$resetLink}'>Réinitialiser mon mot de passe</a><br><br>Ce lien expirera dans une heure.<br><br>L'équipe Plac'ssographe";
        
        $mail->send();
    }
    
    // Pour la sécurité, on affiche toujours ce message, que l'email existe ou non.
    echo json_encode(['success' => true, 'message' => 'Si un compte est associé à cet e-mail, un lien de réinitialisation a été envoyé.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base de données.', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    // Cette erreur est cruciale pour le débogage de l'email !
    echo json_encode(['success' => false, 'error' => 'Le service de messagerie a rencontré un problème.', 'details' => $mail->ErrorInfo]);
}
?>