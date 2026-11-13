// Garde la fiche sur le téléphone pour l'ouvrir sans réseau.
// Changer le numéro de version à chaque modification de la fiche.
const CACHE = 'fiche-visite-v1';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(c => c !== CACHE).map(c => caches.delete(c))))
    .then(() => self.clients.claim()));
});

// Version gardée affichée tout de suite (rapide même avec un réseau faible, en cave par exemple),
// puis mise à jour en arrière-plan quand le réseau répond : la nouvelle version sert à l'ouverture suivante.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const garde = await cache.match(e.request, { ignoreSearch: true });
    const reseau = fetch(e.request).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    if (garde) { e.waitUntil(reseau); return garde; }
    return (await reseau) || cache.match('index.html');
  }));
});
