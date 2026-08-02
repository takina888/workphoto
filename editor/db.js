(() => {
  'use strict';
  const DB_NAME = 'work_photo_db';
  const DB_VERSION = 1;
  let dbPromise;
  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded = () => {
        const db=req.result;
        if(!db.objectStoreNames.contains('photos')){
          const s=db.createObjectStore('photos',{keyPath:'id'});
          s.createIndex('createdAt','createdAt');
        }
        if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings',{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }
  async function tx(store,mode,fn){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const t=db.transaction(store,mode); const s=t.objectStore(store); let result;
      try{ result=fn(s); }catch(e){ reject(e); return; }
      t.oncomplete=()=>resolve(result?.result ?? result);
      t.onerror=()=>reject(t.error); t.onabort=()=>reject(t.error);
    });
  }
  async function putPhoto(photo){ await tx('photos','readwrite',s=>s.put(photo)); return photo; }
  async function getPhoto(id){ return tx('photos','readonly',s=>s.get(id)); }
  async function getPhotos(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const t=db.transaction('photos','readonly'); const s=t.objectStore('photos'); const req=s.getAll();
      req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.createdAt-a.createdAt)); req.onerror=()=>reject(req.error);
    });
  }
  async function deletePhoto(id){ return tx('photos','readwrite',s=>s.delete(id)); }
  async function clearPhotos(){ return tx('photos','readwrite',s=>s.clear()); }
  async function setSetting(key,value){ return tx('settings','readwrite',s=>s.put({key,value})); }
  async function getSetting(key,fallback=null){ const r=await tx('settings','readonly',s=>s.get(key)); return r?.value ?? fallback; }
  window.WorkPhotoDB={openDb,putPhoto,getPhoto,getPhotos,deletePhoto,clearPhotos,setSetting,getSetting};
})();
