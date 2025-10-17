<?php
// vendor/autoloader.php

// Chargeur manuel corrigé pour la version de la bibliothèque que vous possédez.
// L'ordre est important pour que les dépendances soient chargées correctement.

// Interfaces et classes de base
require_once __DIR__ . '/SubscriptionInterface.php';
require_once __DIR__ . '/Subscription.php';
require_once __DIR__ . '/Utils.php';
require_once __DIR__ . '/VAPID.php';

// Classes pour la notification et le chiffrement
require_once __DIR__ . '/Encryption.php';
require_once __DIR__ . '/Notification.php';
require_once __DIR__ . '/MessageSentReport.php';

// Classe principale en dernier car elle dépend des autres
require_once __DIR__ . '/WebPush.php';