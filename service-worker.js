// service-worker.js

self.addEventListener('push', function(event) {
    const data = event.data.json(); // On récupère les données envoyées par le serveur

    const title = data.title || 'Plac\'ssographe';
    const options = {
        body: data.body,
        icon: 'favicon.ico', // L'icône qui s'affichera sur la notif
        badge: 'assets/default-avatar.png' // Pour Android
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});