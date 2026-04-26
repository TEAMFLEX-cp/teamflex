// TeamFlex Service Worker v4 — Network-First (캐시 완전 무효화)
// v4: 구버전 캐시 강제 삭제, 항상 최신 파일 제공

const CACHE_NAME = 'teamflex-v4';

self.addEventListener('install', function(e) {
  self.skipWaiting();  // 즉시 활성화
});

self.addEventListener('activate', function(e) {
  // 이전 버전 캐시 전체 삭제 (v1, v2, v3 포함)
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        console.log('[SW v4] 캐시 삭제:', k);
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();  // 즉시 모든 탭 제어
    })
  );
});

// 항상 네트워크 우선 — 캐시 저장 안 함
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('supabase') >= 0 || url.indexOf('googleapis') >= 0) return;

  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).catch(function() {
      return caches.match(e.request);
    })
  );
});

// 푸시 알림
self.addEventListener('push', function(e) {
  var d = e.data ? e.data.json() : {};
  var title = d.title || 'TeamFlex 공지';
  var opts = {
    body: d.body || '새 공지사항이 있습니다.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag || 'teamflex',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: d.data || {}
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(function(cs) {
      for (var c of cs) {
        if (c.url && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/TeamFlex_기사포털.html');
    })
  );
});
