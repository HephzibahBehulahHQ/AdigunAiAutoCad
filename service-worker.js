'use strict';

const shellCacheName = 'adigun-editor-shell-v1';
const scope = new URL(self.registration.scope);
const editorUrl = new URL('index.html', scope).href;
const scripts = ['cad-engine.js', 'cad-dxf.js', 'vendor/dxf-parser-1.1.2.js', 'vendor/dxf-writer-2.8.9.mjs'].map(path => new URL(path, scope).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(shellCacheName).then(cache => cache.addAll([editorUrl, ...scripts])));
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
  if (!editorNavigation && !scripts.includes(url.href)) return;

  event.respondWith(loadShellResource(request, editorNavigation ? editorUrl : url.href));
});

async function loadShellResource(request, cacheKey) {
  const cache = await caches.open(shellCacheName).catch(() => null);
  try {
    const response = await fetch(request);
    if (response.status >= 500) {
      const cached = await cache?.match(cacheKey);
      return cached || response;
    }
    if (response.ok && cache) await cache.put(cacheKey, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const cached = await cache?.match(cacheKey);
    if (!cached) throw error;
    return cached;
  }
}
