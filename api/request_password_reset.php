<?php
// api/request_password_reset.php

require '../vendor/autoload.php';
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

    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute(['email' => $data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $token = bin2hex(random_bytes(50));
        $expires = new DateTime('NOW');
        $expires->add(new DateInterval('PT1H')); // Le jeton expire dans 1 heure

        $stmt = $db->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)");
        $stmt->execute([
            'user_id' => $user['id'],
            'token' => $token,
            'expires_at' => $expires->format('Y-m-d H:i:s')
        ]);

        // === Configuration de l'envoi d'e-mail avec PHPMailer ===
        $mail = new PHPMailer(true);
        
        // Configurez ici les détails de votre serveur SMTP
        // ATTENTION : Ne mettez pas vos vrais identifiants directement dans le code en production.
        // Utilisez des variables d'environnement.
        $mail->isSMTP();
        $mail->Host = 'smtp.example.com'; // Ex: smtp.gmail.com
        $mail->SMTPAuth = true;
        $mail->Username = 'votre_email@example.com';
        $mail->Password = 'votre_mot_de_passe_email';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        $mail->setFrom('no-reply@placssographe.com', 'Plac\'ssographe');
        $mail->addAddress($data['email']);
        
        $mail->isHTML(true);
        $mail->Subject = 'Réinitialisation de votre mot de passe';
        $resetLink = "http://votresite.com/index.html?reset_token=" . $token;
        $mail->Body    = "Bonjour,<br><br>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant : <a href='{$resetLink}'>{$resetLink}</a><br><br>Ce lien expirera dans une heure.<br><br>L'équipe Plac'ssographe";
        
        $mail->send();
    }
    
    // On envoie une réponse positive même si l'email n'existe pas, pour des raisons de sécurité.
    echo json_encode(['success' => true, 'message' => 'Si un compte est associé à cet e-mail, un lien de réinitialisation a été envoyé.']);

} catch (Exception $e) {
    http_response_code(500);
    // Pour le débogage, vous pouvez logger $e->getMessage()
    echo json_encode(['success' => false, 'error' => 'Une erreur est survenue lors de l\'envoi de l\'e-mail.']);
}
?>