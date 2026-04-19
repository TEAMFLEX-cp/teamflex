// TeamFlex Service Worker v4
const CACHE_NAME = 'teamflex-v4';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

// ★ fetch 핸들러 필수 - Chrome이 PWA 설치 가능으로 인식하려면 있어야 함
self.addEventListener('fetch', function(e) {
  // 네트워크 우선, 실패 시 캐시
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

// 푸시 알림 수신
self.addEventListener('push', function(e) {
  var d = e.data ? e.data.json() : {};
  var title = d.title || 'TeamFlex 공지';
  var opts = {
    body: d.body || '새 공지사항이 있습니다.',
    icon: d.icon || '/icons/icon-192.png',
    badge: d.badge || '/icons/icon-192.png',
    tag: d.tag || 'teamflex',
    renotify: true,
    requireInteraction: true,
    data: d.data || {}
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// 알림 클릭 시 앱 열기 + 해당 공지 팝업 표시
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var notifData = e.notification.data || {};
  var annId = notifData.ann_id || '';
  var targetUrl = annId ? ('/?ann=' + annId) : '/';

  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs) {
      // 이미 열려있는 앱 창이 있으면 포커스 후 메시지 전송
      for(var c of cs){
        if(c.url && 'focus' in c){
          c.focus();
          if(annId) c.postMessage({type:'SHOW_ANN', ann_id: annId});
          return;
        }
      }
      // 새 창으로 열기
      if(clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
