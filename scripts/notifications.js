// scripts/notifications.js

// Remplacez cette clé par VOTRE clé publique VAPID
const VAPID_PUBLIC_KEY = 'BIbvLm2QQbMYUcN-hJ4xS-T13vmcVYFvGPMbIVHxKVygy-56wJ73q_TFumpahkN1nHQO_JmSrVWFA9_N9hJJ0Ms';

/**
 * Convertit une clé VAPID pour l'API Push.
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Demande la permission pour les notifications et s'abonne.
 */
async function subscribeUserToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Envoyer l'objet d'abonnement au serveur
        await sendSubscriptionToServer(subscription);
        console.log('Abonnement Push réussi.');

    } catch (error) {
        console.error('Échec de l\'abonnement Push :', error);
    }
}

/**
 * Enregistre l'abonnement dans la base de données.
 */
async function sendSubscriptionToServer(subscription) {
    await fetch('api/save_subscription.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    });
}

/**
 * Initialise le processus.
 * CORRECTION : Le nom de la fonction est maintenant aligné avec ce qui est importé dans main.js
 */
export function initializeNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Les notifications Push ne sont pas supportées par ce navigateur.');
        return;
    }

    // Demander la permission dès que l'application est prête
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Permission pour les notifications accordée.');
            subscribeUserToPush();
        } else {
            console.warn('Permission pour les notifications refusée.');
        }
    });
}

/**
 * Enregistre le Service Worker.
 */
export async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker enregistré avec succès :', registration);
        } catch (error) {
            console.error('Échec de l\'enregistrement du Service Worker :', error);
        }
    }
}