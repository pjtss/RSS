self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const options = {
    body: payload.body,
    tag: payload.tag,
    icon: "/manifest-icon-192.maskable.png", // Fallback to maskable manifest icon
    badge: "/manifest-icon-192.maskable.png",
    actions: payload.actions || [],
    requireInteraction: payload.priority === "high",
    data: {
      url: payload.url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;

  let targetUrl = url || "/";

  // If "실시간 대시보드" action was clicked, direct to root dashboard page
  if (event.action === "open_terminal") {
    targetUrl = "/";
  }

  if (!targetUrl) {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.host) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
