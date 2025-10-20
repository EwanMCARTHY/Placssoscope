// service-worker.js

// Événement de réception de la notification
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon,
      // On stocke l'URL directement dans la propriété 'data' de la notification
      data: {
        url: data.data.url 
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Erreur lors de la réception push:', e);
  }
});

// Événement de clic sur la notification (version corrigée et simplifiée)
self.addEventListener('notificationclick', event => {
  // On ferme la notification qui a été cliquée
  event.notification.close();

  // On récupère l'URL qu'on a stockée
  const urlToOpen = event.notification.data.url;

  if (urlToOpen) {
    // On demande au navigateur d'ouvrir cette URL.
    // C'est la méthode la plus fiable.
    const promiseChain = clients.openWindow(urlToOpen);
    event.waitUntil(promiseChain);
  }
});