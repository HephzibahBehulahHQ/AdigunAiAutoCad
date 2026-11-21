'use strict';

const shellCacheName = 'adigun-editor-shell-v1';
const scope = new URL(self.registration.scope);
const editorUrl = new URL('index.html', scope).href;
const engineUrl = new URL('cad-engine.js', scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(shellCacheName).then(cache => cache.addAll([editorUrl, engineUrl])));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const editorNavigation = request.mode === 'navigate' && url.origin === scope.origin
    && [scope.pathname, new URL(editorUrl).pathname].includes(url.pathname);
  const engineRequest = url.href === engineUrl;
  if (!editorNavigation && !engineRequest) return;

  event.respondWith(loadShellResource(request, editorNavigation ? editorUrl : engineUrl));
});

async function loadShellResource(request, cacheKey) {
  const cache = await caches.open(shellCacheName).catch(() => null);
  try {
    const response = await fetch(request);
    if (response.ok && cache) await cache.put(cacheKey, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const cached = await cache?.match(cacheKey);
    if (!cached) throw error;
    return cached;
  }
}
