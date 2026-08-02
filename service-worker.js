const BUILD='v1.8-20260802-color-pipeline-r1';
const CACHE=`work-photo-${BUILD}`;
const CACHE_PREFIXES=['work-photo-','work-photo-editor-'];
const RECOVERY_PATH=new URL('./recovery-r1/',self.registration.scope).pathname;
const VERSION='20260802-v18-color-r1';
const ASSETS=[
  './','./index.html','./clear-cache.html','./manifest.webmanifest',
  './assets/app-icon.svg','./assets/app-icon-192.png','./assets/app-icon-512.png',
  './recovery-r1/index.html',`./recovery-r1/styles.css?v=${VERSION}`,`./recovery-r1/work-series.css?v=${VERSION}`,
  `./recovery-r1/market-base-integration.css?v=${VERSION}`,`./recovery-r1/ui-polish.css?v=${VERSION}`,
  `./recovery-r1/db.js?v=${VERSION}`,`./recovery-r1/xlsx.js?v=${VERSION}`,`./recovery-r1/app.js?v=${VERSION}`,
  './recovery-r1/assets/app-icon.svg','./recovery-r1/assets/app-icon-192.png','./recovery-r1/assets/app-icon-512.png',
  './recovery-r1/editor/index.html',`./recovery-r1/editor/style.css?v=${VERSION}`,`./recovery-r1/editor/integration.css?v=${VERSION}`,
  `./recovery-r1/editor/polish.css?v=${VERSION}`,`./recovery-r1/editor/db.js?v=${VERSION}`,`./recovery-r1/editor/app.js?v=${VERSION}`,
  './recovery-r1/editor/demo/sample-photo.png','./recovery-r1/editor/icons/icon-192.png','./recovery-r1/editor/icons/icon-512.png'
];

async function cacheFresh(cache,path){
  const canonical=new URL(path,self.registration.scope),fresh=new URL(canonical);fresh.searchParams.set('wp-precache',BUILD);
  const response=await fetch(fresh.href,{cache:'reload'});if(!response.ok)throw new Error(`precache ${response.status}: ${path}`);
  await cache.put(canonical.href,response);
}
async function navigationFallback(url){
  const cache=await caches.open(CACHE);
  if(url.pathname.includes('/recovery-r1/editor/'))return cache.match(new URL('./recovery-r1/editor/index.html',self.registration.scope).href);
  if(url.pathname.includes('/recovery-r1/'))return cache.match(new URL('./recovery-r1/index.html',self.registration.scope).href);
  return cache.match(new URL('./index.html',self.registration.scope).href);
}

self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const asset of ASSETS)await cacheFresh(cache,asset);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.allSettled(names.filter(name=>CACHE_PREFIXES.some(prefix=>name.startsWith(prefix))&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const response=await fetch(request,{cache:'no-store'});if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}return response}catch(_){return await caches.match(request)||await navigationFallback(url)}})());return
  }
  if(url.pathname.startsWith(RECOVERY_PATH)){
    event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}return response})());
  }
});
