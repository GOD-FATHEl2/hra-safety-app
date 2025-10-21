// Service Worker for offline functionality
// File: sw.js

const CACHE_NAME = 'hra-v1.0.0';
const STATIC_CACHE = 'hra-static-v1.0.0';
const DYNAMIC_CACHE = 'hra-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that can work offline
const CACHEABLE_APIS = [
  '/api/assessments',
  '/api/assessments/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful API responses
              if (response.status === 200 && CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return cached version if network fails
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Handle static files
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        // Fetch from network and cache if successful
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-assessment-sync') {
    event.waitUntil(syncOfflineAssessments());
  }
});

async function syncOfflineAssessments() {
  const assessments = await getOfflineAssessments();
  
  for (const assessment of assessments) {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${assessment.token}`
        },
        body: JSON.stringify(assessment.data)
      });

      if (response.ok) {
        await removeOfflineAssessment(assessment.id);
        await notifyClient('Assessment synced successfully');
      }
    } catch (error) {
      console.error('[SW] Failed to sync assessment:', error);
    }
  }
}

async function getOfflineAssessments() {
  // Get stored offline assessments from IndexedDB
  return new Promise((resolve) => {
    const request = indexedDB.open('hra-offline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('assessments')) {
        db.createObjectStore('assessments', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['assessments'], 'readonly');
      const store = transaction.objectStore('assessments');
      const getAll = store.getAll();
      
      getAll.onsuccess = () => {
        resolve(getAll.result || []);
      };
    };
  });
}

async function removeOfflineAssessment(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('hra-offline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['assessments'], 'readwrite');
      const store = transaction.objectStore('assessments');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

async function notifyClient(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_SUCCESS',
      message
    });
  });
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Ny uppdatering tillgänglig',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Öppna appen',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Stäng',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('HRA - Högriskarbete', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      const client = clients.find(c => c.visibilityState === 'visible');
      if (client) {
        client.navigate('/');
        client.focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});