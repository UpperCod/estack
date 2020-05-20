export function createSw(name, files) {
  return `
  const CACHENAME = "${name}" ;
  
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHENAME).then((cache) => {
        return cache.addAll(${JSON.stringify(files)});
      })
    );
  });
  
  
  self.addEventListener('fetch', async (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(caches.match('/'));
      return;
    }
    event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)))
  });`;
}
