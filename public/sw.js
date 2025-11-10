const CACHE_NAME = "prontivus-cache-v1";
const CRITICAL = ["/", "/portal", "/patient/profile", "/manifest.json"];

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CRITICAL)));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	event.respondWith(
		caches.match(request).then((cached) =>
			cached ||
			fetch(request)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
					return res;
				})
				.catch(() => cached)
		)
	);
});

// Push notification event listener
self.addEventListener("push", (event) => {
	let notificationData = {
		title: "Prontivus",
		body: "Você tem uma nova notificação",
		icon: "/favicon.png",
		badge: "/favicon.png",
		tag: "default",
		data: {},
	};

	if (event.data) {
		try {
			const data = event.data.json();
			notificationData = {
				title: data.title || notificationData.title,
				body: data.body || notificationData.body,
				icon: data.icon || notificationData.icon,
				badge: data.badge || notificationData.badge,
				tag: data.tag || notificationData.tag,
				data: data.data || notificationData.data,
				requireInteraction: data.requireInteraction || false,
			};
		} catch (e) {
			console.error("Error parsing push notification data:", e);
		}
	}

	const promiseChain = self.registration.showNotification(notificationData.title, {
		body: notificationData.body,
		icon: notificationData.icon,
		badge: notificationData.badge,
		tag: notificationData.tag,
		data: notificationData.data,
		requireInteraction: notificationData.requireInteraction,
		vibrate: [200, 100, 200],
		timestamp: Date.now(),
	});

	event.waitUntil(promiseChain);
});

// Notification click event listener
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const data = event.notification.data || {};
	const urlToOpen = data.url || "/";

	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			// Check if there's already a window/tab open with the target URL
			for (let i = 0; i < clientList.length; i++) {
				const client = clientList[i];
				if (client.url === urlToOpen && "focus" in client) {
					return client.focus();
				}
			}
			// If not, open a new window/tab
			if (clients.openWindow) {
				return clients.openWindow(urlToOpen);
			}
		})
	);
});


