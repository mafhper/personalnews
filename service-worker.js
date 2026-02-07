const STATIC_CACHE_NAME = "static-cache-v2";
const DYNAMIC_CACHE_NAME = "dynamic-cache-v2";
const IMAGE_CACHE_NAME = "image-cache-v1";
const API_CACHE_NAME = "api-cache-v1";

// All the files that make up the "app shell"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/index.css",
  "/assets/index.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap",
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - cache first with long TTL
  static: {
    cacheName: STATIC_CACHE_NAME,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  // API responses - network first with fallback
  api: {
    cacheName: API_CACHE_NAME,
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  // Images - cache first with compression
  images: {
    cacheName: IMAGE_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  // Dynamic content - stale while revalidate
  dynamic: {
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("Precaching static assets");
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error("Failed to cache static assets during install:", error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(
            (key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Use a stale-while-revalidate strategy for APIs and dynamic modules.
  if (
    url.hostname === "api.rss2json.com" ||
    url.hostname === "api.open-meteo.com" ||
    url.hostname === "nominatim.openstreetmap.org" ||
    url.hostname === "esm.sh" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Validate response before caching
              if (networkResponse && networkResponse.status === 200) {
                // Check security headers
                const contentType = networkResponse.headers.get('content-type') || '';
                const xContentTypeOptions = networkResponse.headers.get('x-content-type-options');
                
                // Validate content type
                const allowedTypes = [
                  'application/json',
                  'application/xml',
                  'text/xml',
                  'application/rss+xml',
                  'application/atom+xml',
                  'text/plain',
                  'application/font',
                  'font/',
                ];
                
                const isValidType = allowedTypes.some(type => 
                  contentType.toLowerCase().includes(type)
                );
                
                // Reject suspicious content types
                const suspiciousTypes = [
                  'application/javascript',
                  'text/javascript',
                  'application/x-executable',
                ];
                
                const isSuspicious = suspiciousTypes.some(type => 
                  contentType.toLowerCase().includes(type)
                );
                
                // Only cache if content type is valid and not suspicious
                if (isValidType && !isSuspicious) {
                  // Additional validation: check content length
                  const contentLength = networkResponse.headers.get('content-length');
                  if (contentLength) {
                    const size = parseInt(contentLength, 10);
                    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                    if (size > MAX_SIZE) {
                      console.warn('Response too large to cache:', request.url, size);
                      return networkResponse; // Return but don't cache
                    }
                  }
                  
                  cache.put(request, networkResponse.clone());
                } else {
                  console.warn('Invalid or suspicious content type, not caching:', contentType, request.url);
                }
              }
              return networkResponse;
            })
            .catch((err) => {
              console.error(
                "Network fetch failed for dynamic content:",
                request.url,
                err
              );
              // If fetch fails, we still have the cachedResponse.
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Use a cache-first strategy for static app shell assets.
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE_NAME).then((cache) => {
            if (fetchResponse && fetchResponse.status === 200) {
              // Validate static assets before caching
              const contentType = fetchResponse.headers.get('content-type') || '';
              const allowedStaticTypes = [
                'text/html',
                'text/css',
                'application/javascript',
                'text/javascript',
                'application/json',
                'image/',
                'font/',
                'application/font',
              ];
              
              const isValidStaticType = allowedStaticTypes.some(type => 
                contentType.toLowerCase().includes(type)
              );
              
              if (isValidStaticType) {
                cache.put(request, fetchResponse.clone());
              } else {
                console.warn('Invalid static asset type, not caching:', contentType, request.url);
              }
            }
            return fetchResponse;
          });
        })
      );
    })
  );
});
