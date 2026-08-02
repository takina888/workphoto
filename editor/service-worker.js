'use strict';

// Migration-only worker for installations that still have the old /editor/
// cache-first worker. The application is now owned by the parent worker.
const LEGACY_EDITOR_CACHE_PREFIX='work-photo-editor-';

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const cacheNames=await caches.keys();
    await Promise.all(cacheNames
      .filter(name=>name.startsWith(LEGACY_EDITOR_CACHE_PREFIX))
      .map(name=>caches.delete(name)));

    await self.clients.claim();
    const scopeUrl=new URL(self.registration.scope);
    const editorClients=(await self.clients.matchAll({type:'window',includeUncontrolled:true}))
      .filter(client=>{
        const clientUrl=new URL(client.url);
        return clientUrl.origin===scopeUrl.origin&&clientUrl.pathname.startsWith(scopeUrl.pathname);
      });

    // Unregister before navigating so the refreshed editor can be controlled by
    // the parent WORK PHOTO worker. The active worker remains alive for this task.
    await self.registration.unregister();
    await Promise.allSettled(editorClients.map(client=>client.navigate(client.url)));
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    try{
      return await fetch(event.request,{cache:'no-store'});
    }catch(error){
      // An exact cached response may keep an offline page usable during the
      // one-time migration. Never substitute index.html for another request.
      const exact=await caches.match(event.request,{ignoreSearch:false,ignoreVary:false});
      if(exact)return exact;
      throw error;
    }
  })());
});
