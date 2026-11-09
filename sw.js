/* Service worker do Volante Mega-Sena.
   Para publicar uma versão nova, troque o número em CACHE (ex.: v2). */
const CACHE = "mega-sena-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Abre do cache na hora e atualiza em segundo plano; sem internet usa o que está guardado.
   Fontes e a biblioteca de planilhas (outros domínios) entram no cache na primeira visita online. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === "navigate") return cache.match("./index.html");
    return new Response("", { status: 504 });
  }));
});
