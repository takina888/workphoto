(() => {
  'use strict';
  // WORK PHOTO for Machines v1.6 Web仕上げ版 - V1.4 editor lineage integrated with camera, album and Excel ledger shell
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const DB=window.WorkPhotoDB, XLSX=window.WorkPhotoXlsx;
  const PARAMS=new URLSearchParams(location.search);
  const TEST_MODE=PARAMS.has('test');
  const MARKET_CONTEXT=PARAMS.get('from')==='market-base'||PARAMS.has('return')||/market[_\s-]?base/i.test(document.referrer||'');
  const EMBEDDED=PARAMS.get('embedded')==='1';
  document.documentElement.dataset.marketBase=MARKET_CONTEXT?'true':'false';
  document.documentElement.dataset.embedded=EMBEDDED?'true':'false';
  const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const nowName=()=>new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  const refs={
    views:{camera:$('#cameraView'),album:$('#albumView'),viewer:$('#viewerView'),report:$('#reportView'),settings:$('#settingsView')},
    back:$('#backBtn'),settings:$('#settingsBtn'),nav:$$('.bottom-nav button'),toast:$('#toast'),modal:$('#modal'),modalContent:$('#modalContent'),photoInput:$('#photoInput'),
    video:$('#cameraVideo'),cameraPlaceholder:$('#cameraPlaceholder'),shutter:$('#shutterBtn'),switchCamera:$('#switchCameraBtn'),flash:$('#flashBtn'),gps:$('#gpsBtn'),gpsText:$('#locationText'),mode:$('#cameraMode'),stage:$('#cameraStage'),focus:$('#focusRing'),exposurePanel:$('#exposurePanel'),exposure:$('#exposureSlider'),exposureValue:$('#exposureValue'),zoomPanel:$('#zoomPanel'),zoom:$('#zoomSlider'),zoomValue:$('#zoomValue'),thumb:$('#albumThumb'),thumbEmpty:$('#albumThumbEmpty'),albumThumbBtn:$('#albumThumbBtn'),openImport:$('#openImportBtn'),captureContextBtn:$('#captureContextBtn'),captureContextText:$('#captureContextText'),
    albumGrid:$('#albumGrid'),albumEmpty:$('#albumEmpty'),albumImport:$('#albumImportBtn'),emptyImport:$('#emptyImportBtn'),selectMode:$('#selectModeBtn'),selectionBar:$('#albumSelectionBar'),selectedCount:$('#selectedCount'),makeReport:$('#makeReportBtn'),deleteSelected:$('#deleteSelectedBtn'),albumSearch:$('#albumSearch'),albumSourceFilter:$('#albumSourceFilter'),
    viewerStage:$('#viewerStage'),viewerImage:$('#viewerImage'),viewerPrev:$('#viewerPrevBtn'),viewerNext:$('#viewerNextBtn'),viewerCounter:$('#viewerCounter'),viewerName:$('#viewerName'),viewerMeta:$('#viewerMeta'),viewerMetaChips:$('#viewerMetaChips'),viewerEdit:$('#viewerEditBtn'),viewerShare:$('#viewerShareBtn'),viewerReport:$('#viewerReportBtn'),viewerInfo:$('#viewerInfoBtn'),viewerDelete:$('#viewerDeleteBtn'),
    reportTitle:$('#reportTitle'),reportSubtitle:$('#reportSubtitle'),reportOrientation:$('#reportOrientation'),reportCount:$('#reportCount'),reportNumberMode:$('#reportNumberMode'),reportNumberStyle:$('#reportNumberStyle'),reportStartNumber:$('#reportStartNumber'),reportStartNumberLabel:$('#reportStartNumberLabel'),reportNumberPosition:$('#reportNumberPosition'),reportNote:$('#reportNote'),reportIncludeMeta:$('#reportIncludeMeta'),reportFilename:$('#reportFilename'),reportPhotoCount:$('#reportPhotoCount'),reportPageCount:$('#reportPageCount'),reportItems:$('#reportItems'),reportPreview:$('#reportPreview'),exportXlsx:$('#exportXlsxBtn'),reportTemplateName:$('#reportTemplateName'),reportTemplateSelect:$('#reportTemplateSelect'),saveReportTemplate:$('#saveReportTemplateBtn'),loadReportTemplate:$('#loadReportTemplateBtn'),duplicateReportTemplate:$('#duplicateReportTemplateBtn'),deleteReportTemplate:$('#deleteReportTemplateBtn'),
    gpsSetting:$('#gpsSetting'),modeMemory:$('#modeMemorySetting'),continuous:$('#continuousSetting'),editCaptureContext:$('#editCaptureContextBtn'),clearAll:$('#clearAllBtn')
  };
  const state={view:'',history:[],photos:[],selectionMode:false,selected:new Set(),reportIds:[],reportEntries:[],reportTemplates:[],activeReportTemplateId:null,viewerIndex:0,viewerSwipe:null,stream:null,track:null,facing:'environment',torch:false,location:null,captureContext:{place:'',machine:'',equipment:''},recentContexts:[],albumQuery:'',albumSource:'all',settings:{gps:true,modeMemory:true,continuous:true},urls:new Map(),toastTimer:null,marketContext:MARKET_CONTEXT,returnUrl:null};

  function toast(msg){clearTimeout(state.toastTimer);refs.toast.textContent=msg;refs.toast.classList.add('show');state.toastTimer=setTimeout(()=>refs.toast.classList.remove('show'),2200)}
  function setView(name,{push=true}={}){
    if(name===state.view) return;
    if(push) state.history.push(state.view);
    Object.entries(refs.views).forEach(([k,v])=>v.classList.toggle('active',k===name));
    refs.nav.forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    state.view=name;
    const internalBack=['viewer','report','settings'].includes(name);
    refs.back.hidden=!(internalBack||state.marketContext);
    refs.back.title=internalBack?'アプリ内で戻る':'MARKET BASEへ戻る';
    refs.back.setAttribute('aria-label',refs.back.title);
    if(name==='camera') startCamera(); else stopCamera();
    if(name==='album') renderAlbum();
    if(name==='report') renderReport();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function safeSameOriginUrl(value){
    if(!value)return null;
    try{const url=new URL(value,location.href);return (url.protocol==='http:'||url.protocol==='https:')&&url.origin===location.origin?url.href:null}catch(_){return null}
  }
  function resolveReturnUrl(){return safeSameOriginUrl(PARAMS.get('return'))||safeSameOriginUrl(document.referrer)}
  function returnToMarketBase(){
    stopCamera();
    const url=state.returnUrl||resolveReturnUrl();
    if(url){location.assign(url);return}
    if(history.length>1){history.back();return}
    location.assign('../');
  }
  async function goBack(){
    if(state.view==='viewer'){setView('album',{push:false});return}
    if(state.view==='settings'){setView(state.history.pop()||'camera',{push:false});return}
    if(state.view==='report'){setView('album',{push:false});return}
    if(state.marketContext){returnToMarketBase();return}
    setView(state.history.pop()||'camera',{push:false});
  }
  function photoUrl(photo){if(!photo) return '';if(!state.urls.has(photo.id))state.urls.set(photo.id,URL.createObjectURL(photo.blob));return state.urls.get(photo.id)}
  function revokePhotoUrl(id){const u=state.urls.get(id);if(u)URL.revokeObjectURL(u);state.urls.delete(id)}
  async function refreshPhotos(){state.photos=await DB.getPhotos();updateLatestThumb();if(state.view==='album')renderAlbum()}
  function updateLatestThumb(){const p=state.photos[0];if(!p){refs.thumb.hidden=true;refs.thumbEmpty.hidden=false;return}refs.thumb.src=photoUrl(p);refs.thumb.hidden=false;refs.thumbEmpty.hidden=true}
  function cleanText(v){return String(v??'').trim()}
  function normalizedMeta(photo){const m=photo?.meta||{};return {place:cleanText(m.place),machine:cleanText(m.machine),equipment:cleanText(m.equipment),memo:cleanText(m.memo)}}
  function contextLabel(context=state.captureContext){const parts=[cleanText(context.place),cleanText(context.machine),cleanText(context.equipment)].filter(Boolean);return parts.join(' ／ ')||'未設定'}
  function updateCaptureContextDisplay(){if(refs.captureContextText)refs.captureContextText.textContent=contextLabel()}
  async function rememberCaptureContext(context){const normalized={place:cleanText(context.place),machine:cleanText(context.machine),equipment:cleanText(context.equipment)};state.captureContext=normalized;await DB.setSetting('captureContext',normalized);if(Object.values(normalized).some(Boolean)){const key=JSON.stringify(normalized);state.recentContexts=[normalized,...state.recentContexts.filter(x=>JSON.stringify(x)!==key)].slice(0,8);await DB.setSetting('recentContexts',state.recentContexts)}updateCaptureContextDisplay()}

  async function loadSettings(){
    state.settings=await DB.getSetting('settings',state.settings);
    state.captureContext=await DB.getSetting('captureContext',state.captureContext);
    state.recentContexts=await DB.getSetting('recentContexts',[]);
    refs.gpsSetting.checked=state.settings.gps!==false;refs.modeMemory.checked=state.settings.modeMemory!==false;refs.continuous.checked=state.settings.continuous!==false;
    if(state.settings.modeMemory){const m=await DB.getSetting('cameraMode','factory');refs.mode.value=m}
    updateCaptureContextDisplay();
  }
  async function saveSettings(){state.settings={gps:refs.gpsSetting.checked,modeMemory:refs.modeMemory.checked,continuous:refs.continuous.checked};await DB.setSetting('settings',state.settings);toast('設定を保存しました')}

  async function startCamera(){
    if(TEST_MODE){refs.cameraPlaceholder.hidden=false;return}
    if(state.stream || state.view!=='camera') return;
    if(!navigator.mediaDevices?.getUserMedia){refs.cameraPlaceholder.hidden=false;toast('このブラウザではカメラを直接起動できません');return}
    try{
      const constraints={audio:false,video:{facingMode:{ideal:state.facing},width:{ideal:1920},height:{ideal:1440}}};
      const stream=await navigator.mediaDevices.getUserMedia(constraints);state.stream=stream;state.track=stream.getVideoTracks()[0];refs.video.srcObject=stream;await refs.video.play();refs.cameraPlaceholder.hidden=true;setupCameraCapabilities();
    }catch(e){refs.cameraPlaceholder.hidden=false;toast('カメラを起動できません。写真選択は利用できます')}
  }
  function stopCamera(){if(!state.stream)return;state.stream.getTracks().forEach(t=>t.stop());state.stream=null;state.track=null;state.torch=false;refs.flash.querySelector('span').textContent='OFF'}
  function setupCameraCapabilities(){
    const caps=state.track?.getCapabilities?.()||{};
    if(caps.exposureCompensation){refs.exposure.min=caps.exposureCompensation.min;refs.exposure.max=caps.exposureCompensation.max;refs.exposure.step=caps.exposureCompensation.step||.1;refs.exposurePanel.hidden=false}else refs.exposurePanel.hidden=true;
    if(caps.zoom){refs.zoom.min=caps.zoom.min;refs.zoom.max=caps.zoom.max;refs.zoom.step=caps.zoom.step||.1;refs.zoom.value=caps.zoom.min;refs.zoomPanel.hidden=false}else refs.zoomPanel.hidden=true;
    if(!caps.torch) refs.flash.title='この端末では常時ライトに対応していない場合があります';
  }
  async function applyTrackConstraint(key,value){try{await state.track?.applyConstraints({advanced:[{[key]:value}]});return true}catch(e){return false}}
  async function toggleTorch(){if(!state.track){toast('カメラが起動していません');return}state.torch=!state.torch;const ok=await applyTrackConstraint('torch',state.torch);if(!ok){state.torch=false;toast('この端末では常時ライトを操作できません')}refs.flash.querySelector('span').textContent=state.torch?'ON':'OFF'}
  async function switchCamera(){state.facing=state.facing==='environment'?'user':'environment';stopCamera();await startCamera()}
  function showFocus(ev){const r=refs.stage.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top;refs.focus.style.left=`${x}px`;refs.focus.style.top=`${y}px`;refs.focus.hidden=false;setTimeout(()=>refs.focus.hidden=true,900)}
  async function capture(){
    if(!state.stream||!refs.video.videoWidth){refs.photoInput.click();return}
    const c=document.createElement('canvas');c.width=refs.video.videoWidth;c.height=refs.video.videoHeight;const x=c.getContext('2d');if(state.facing==='user'){x.translate(c.width,0);x.scale(-1,1)}x.drawImage(refs.video,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.94));if(!blob)return;
    const photo={id:uid('photo'),name:`WORK_PHOTO_${nowName()}.jpg`,blob,createdAt:Date.now(),source:'camera',edited:false,mode:refs.mode.value,location:state.settings.gps?state.location:null,meta:{...state.captureContext,memo:''},width:c.width,height:c.height};
    await DB.putPhoto(photo);state.photos.unshift(photo);updateLatestThumb();toast('撮影しました');
    if(!state.settings.continuous) openEditor(photo.id);
  }
  async function importFiles(files){
    const list=[...files].filter(f=>f.type.startsWith('image/'));if(!list.length)return;
    for(const f of list){const dims=await imageDimensions(f);await DB.putPhoto({id:uid('photo'),name:f.name||`PHOTO_${nowName()}.jpg`,blob:f,createdAt:Date.now(),source:'import',edited:false,location:null,meta:{place:'',machine:'',equipment:'',memo:''},width:dims.width,height:dims.height})}
    refs.photoInput.value='';await refreshPhotos();toast(`${list.length}枚追加しました`);setView('album');
  }
  async function imageDimensions(blob){try{const b=await createImageBitmap(blob);const d={width:b.width,height:b.height};b.close();return d}catch(e){return {width:0,height:0}}}
  function requestGps(){
    if(!navigator.geolocation){toast('位置情報に対応していません');return}
    refs.gps.querySelector('span').textContent='取得中';navigator.geolocation.getCurrentPosition(pos=>{state.location={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,timestamp:Date.now()};refs.gpsText.textContent=`位置情報：${state.location.latitude.toFixed(5)}, ${state.location.longitude.toFixed(5)}`;refs.gps.querySelector('span').textContent='取得済';toast('位置情報を取得しました')},()=>{refs.gps.querySelector('span').textContent='GPS';toast('位置情報を取得できませんでした')},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  }

  function filteredPhotos(){
    const q=cleanText(state.albumQuery).toLocaleLowerCase('ja');
    return state.photos.filter(p=>{
      if(state.albumSource!=='all'&&p.source!==state.albumSource)return false;
      if(!q)return true;
      const m=normalizedMeta(p);const hay=[p.name,p.mode,m.place,m.machine,m.equipment,m.memo].join(' ').toLocaleLowerCase('ja');
      return hay.includes(q);
    });
  }
  function renderAlbum(){
    const photos=filteredPhotos();
    refs.albumGrid.innerHTML='';refs.albumGrid.classList.toggle('selecting',state.selectionMode);refs.selectionBar.hidden=!state.selectionMode;refs.selectedCount.textContent=state.selected.size;
    refs.albumEmpty.hidden=photos.length>0;
    if(refs.albumEmpty&&!photos.length){const title=$('h2',refs.albumEmpty),desc=$('p',refs.albumEmpty);if(title)title.textContent=state.photos.length?'該当する写真がありません':'写真はまだありません';if(desc)desc.textContent=state.photos.length?'検索条件を変更してください。':'カメラで撮影するか、スマホの写真を読み込んでください。'}
    photos.forEach(p=>{const m=normalizedMeta(p),label=[m.place,m.machine].filter(Boolean).join(' ／ ');const btn=document.createElement('button');btn.className='album-item'+(state.selected.has(p.id)?' selected':'');btn.dataset.id=p.id;btn.innerHTML=`<img src="${photoUrl(p)}" alt="${escapeHtml(p.name)}"><span class="check">${state.selected.has(p.id)?'✓':''}</span><span class="tag">${escapeHtml(label|| (p.edited?'編集':'写真'))}</span>`;btn.onclick=()=>{if(state.selectionMode){if(state.selected.has(p.id))state.selected.delete(p.id);else state.selected.add(p.id);renderAlbum()}else openViewer(p.id)};refs.albumGrid.appendChild(btn)});
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toggleSelectionMode(){state.selectionMode=!state.selectionMode;if(!state.selectionMode)state.selected.clear();refs.selectMode.textContent=state.selectionMode?'完了':'選択';renderAlbum()}
  async function deleteSelected(){if(!state.selected.size)return;if(!confirm(`${state.selected.size}枚を削除しますか？`))return;for(const id of state.selected){await DB.deletePhoto(id);revokePhotoUrl(id)}state.selected.clear();state.selectionMode=false;refs.selectMode.textContent='選択';await refreshPhotos();toast('削除しました')}


  function currentViewerPhoto(){return state.photos[state.viewerIndex]||null}
  function openViewer(id){const index=state.photos.findIndex(p=>p.id===id);if(index<0)return;state.viewerIndex=index;setView('viewer');renderViewer()}
  function renderViewer(){const p=currentViewerPhoto();if(!p){setView('album',{push:false});return}refs.viewerImage.src=photoUrl(p);refs.viewerName.textContent=p.name||'写真';const date=new Date(p.createdAt).toLocaleString('ja-JP');const source=p.source==='camera'?'撮影':p.source==='edited'?'編集済み':'読み込み';const gps=p.location?` ／ GPS ${Number(p.location.latitude).toFixed(5)}, ${Number(p.location.longitude).toFixed(5)}`:'';refs.viewerMeta.textContent=`${date} ／ ${source} ／ ${p.width||'?'}×${p.height||'?'} px${gps}`;const m=normalizedMeta(p);refs.viewerMetaChips.innerHTML=[m.place&&`撮影先：${m.place}`,m.machine&&`機械：${m.machine}`,m.equipment&&`設備：${m.equipment}`,m.memo&&`メモ：${m.memo}`].filter(Boolean).map(v=>`<span class="meta-chip">${escapeHtml(v)}</span>`).join('');refs.viewerCounter.textContent=`${state.viewerIndex+1} / ${state.photos.length}`;refs.viewerPrev.disabled=state.viewerIndex<=0;refs.viewerNext.disabled=state.viewerIndex>=state.photos.length-1}
  function moveViewer(delta){const next=clamp(state.viewerIndex+delta,0,state.photos.length-1);if(next===state.viewerIndex)return;state.viewerIndex=next;renderViewer()}
  async function shareOriginalPhoto(){
    const p=currentViewerPhoto();if(!p)return;
    const ext=p.blob.type==='image/png'?'png':p.blob.type==='image/webp'?'webp':'jpg';
    const f=new File([p.blob],p.name||`WORK_PHOTO_${nowName()}.${ext}`,{type:p.blob.type||'image/jpeg'});
    if(navigator.canShare?.({files:[f]})){
      try{await navigator.share({files:[f],title:'WORK PHOTO'});return}
      catch(error){if(error?.name==='AbortError')return}
    }
    downloadBlob(p.blob,f.name);toast('共有できなかったため端末へ保存しました');
  }
  async function deleteViewerPhoto(){const p=currentViewerPhoto();if(!p||!confirm('この写真を削除しますか？'))return;await DB.deletePhoto(p.id);revokePhotoUrl(p.id);state.photos.splice(state.viewerIndex,1);if(state.viewerIndex>=state.photos.length)state.viewerIndex=Math.max(0,state.photos.length-1);updateLatestThumb();if(!state.photos.length){setView('album',{push:false});renderAlbum()}else renderViewer();toast('削除しました')}
  function showViewerInfo(){
    const p=currentViewerPhoto();if(!p)return;const m=normalizedMeta(p);
    const location=p.location?`${Number(p.location.latitude).toFixed(6)}, ${Number(p.location.longitude).toFixed(6)}（精度 約${Math.round(p.location.accuracy||0)}m）`:'位置情報なし';
    refs.modalContent.innerHTML=`<h2>写真情報</h2><div class="field-info-form"><label>撮影先<input id="photoPlaceInput" type="text" value="${escapeHtml(m.place)}" placeholder="任意"></label><label>機械名<input id="photoMachineInput" type="text" value="${escapeHtml(m.machine)}" placeholder="任意"></label><label>設備番号<input id="photoEquipmentInput" type="text" value="${escapeHtml(m.equipment)}" placeholder="任意"></label><label>メモ<textarea id="photoMemoInput" placeholder="任意">${escapeHtml(m.memo)}</textarea></label></div><p><b>ファイル名</b><br>${escapeHtml(p.name||'')}</p><p><b>撮影・登録日時</b><br>${escapeHtml(new Date(p.createdAt).toLocaleString('ja-JP'))}</p><p><b>画像サイズ</b><br>${p.width||'?'} × ${p.height||'?'} px</p><p><b>位置情報</b><br>${escapeHtml(location)}</p><div class="modal-actions two"><button id="cancelInfoModal" class="soft-btn">閉じる</button><button id="saveInfoModal" class="primary-btn">保存</button></div>`;
    refs.modal.hidden=false;
    $('#cancelInfoModal').onclick=()=>{refs.modal.hidden=true};
    $('#saveInfoModal').onclick=async()=>{p.meta={place:cleanText($('#photoPlaceInput').value),machine:cleanText($('#photoMachineInput').value),equipment:cleanText($('#photoEquipmentInput').value),memo:cleanText($('#photoMemoInput').value)};await DB.putPhoto(p);refs.modal.hidden=true;renderViewer();if(state.view==='album')renderAlbum();toast('写真情報を保存しました')};
  }

  async function openEditor(id){
    const photo=await DB.getPhoto(id);if(!photo)return;
    stopCamera();
    const shellUrl=new URL('./index.html',location.href),safeReturn=safeSameOriginUrl(PARAMS.get('return'));
    if(PARAMS.get('from')==='market-base')shellUrl.searchParams.set('from','market-base');
    if(safeReturn)shellUrl.searchParams.set('return',safeReturn);
    if(EMBEDDED)shellUrl.searchParams.set('embedded','1');
    shellUrl.hash='album';
    const editorUrl=new URL('./editor/index.html',location.href);
    editorUrl.searchParams.set('photoId',id);editorUrl.searchParams.set('return',shellUrl.href);
    location.assign(editorUrl.href);
  }

  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
  function normalizeReportEntry(entry={}){
    return {
      ...entry,
      id:entry.id,
      comment:String(entry.comment??''),
      manualNumber:String(entry.manualNumber??''),
      frameMode:entry.frameMode==='cover'?'cover':'contain',
      frameX:clamp(entry.frameX==null?50:entry.frameX,0,100),
      frameY:clamp(entry.frameY==null?50:entry.frameY,0,100),
      frameZoom:clamp(entry.frameZoom==null?100:entry.frameZoom,50,250)
    };
  }
  function reportPhotos(){return state.reportEntries.map(entry=>{const photo=state.photos.find(p=>p.id===entry.id);return photo?{...entry,photo}:null}).filter(Boolean)}
  function reportComment(entry,photo){const base=cleanText(entry.comment);if(!refs.reportIncludeMeta?.checked)return base;const m=normalizedMeta(photo);const meta=[m.place&&`撮影先：${m.place}`,m.machine&&`機械名：${m.machine}`,m.equipment&&`設備番号：${m.equipment}`].filter(Boolean).join('\n');return [meta,base].filter(Boolean).join('\n')}
  function ensureReportEntries(){
    const ids=state.reportIds.length?state.reportIds:[...state.selected];
    const source=ids.length?ids:state.photos.map(p=>p.id);
    const old=new Map(state.reportEntries.map(e=>[e.id,e]));
    state.reportEntries=source.map(id=>normalizeReportEntry(old.get(id)||{id})).filter(e=>state.photos.some(p=>p.id===e.id));
  }
  function circledNumber(n){const chars=['⓪','①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];return chars[n]||String(n)}
  function rawPhotoNumber(index,entry){
    if(refs.reportNumberMode.value==='manual')return cleanText(entry?.manualNumber);
    const start=Number(refs.reportStartNumber.value||0),per=Number(refs.reportCount.value)||9;
    return String(start+(refs.reportNumberMode.value==='page'?index%per:index));
  }
  function formatPhotoNumber(index,entry){
    const raw=rawPhotoNumber(index,entry);if(!raw)return '';
    switch(refs.reportNumberStyle.value){
      case'no':return`No.${raw}`;
      case'plain':return raw;
      case'zero':return /^\d+$/.test(raw)?raw.padStart(3,'0'):raw;
      case'circled':return /^\d+$/.test(raw)?circledNumber(Number(raw)):raw;
      default:return`写真${raw}`;
    }
  }
  function framePlacementForSize(sourceWidth,sourceHeight,entry,targetWidth,targetHeight){
    const sw=Math.max(1,Number(sourceWidth)||1),sh=Math.max(1,Number(sourceHeight)||1),tw=Math.max(1,Number(targetWidth)||1),th=Math.max(1,Number(targetHeight)||1);
    const base=entry.frameMode==='cover'?Math.max(tw/sw,th/sh):Math.min(tw/sw,th/sh);
    const scale=base*(clamp(entry.frameZoom,50,250)/100),width=sw*scale,height=sh*scale;
    return {width,height,left:(tw-width)*(clamp(entry.frameX,0,100)/100),top:(th-height)*(clamp(entry.frameY,0,100)/100)};
  }
  function framedPhotoMarkup(item,geometry,label){
    const placement=framePlacementForSize(item.photo.width||4,item.photo.height||3,item,geometry.photoPixelWidth,geometry.photoPixelHeight);
    const style=`width:${placement.width/geometry.photoPixelWidth*100}%;height:${placement.height/geometry.photoPixelHeight*100}%;left:${placement.left/geometry.photoPixelWidth*100}%;top:${placement.top/geometry.photoPixelHeight*100}%`;
    const topNumber=geometry.numberPosition==='bottom'?'':`<b class="report-photo-number ${geometry.numberPosition==='top-right'?'right':''}">${escapeHtml(label)}</b>`;
    const strip=geometry.labelStripPoints/geometry.imageRowPoints*100;
    return `<div class="report-photo-area${topNumber?' numbered-top':''}" style="--label-strip:${strip}%">${topNumber}<div class="report-photo-frame"><img src="${photoUrl(item.photo)}" alt="${escapeHtml(label||item.photo.name||'写真')}" style="${style}"></div></div>`;
  }
  function moveReportEntry(index,delta){const next=index+delta;if(next<0||next>=state.reportEntries.length)return;const [entry]=state.reportEntries.splice(index,1);state.reportEntries.splice(next,0,entry);renderReport()}
  function removeReportEntry(index){state.reportEntries.splice(index,1);renderReport()}
  function renderReportItems(){
    const manual=refs.reportNumberMode.value==='manual';refs.reportStartNumberLabel.hidden=manual;refs.reportItems.innerHTML='';
    state.reportEntries.forEach((entry,index)=>{
      const p=state.photos.find(x=>x.id===entry.id);if(!p)return;
      const row=document.createElement('div');row.className='report-item';
      row.innerHTML=`<img src="${photoUrl(p)}" alt="${escapeHtml(p.name)}"><div class="report-item-main"><div class="report-item-title"><span class="report-item-number">${escapeHtml(formatPhotoNumber(index,entry))}</span>　${escapeHtml(p.name||'')}</div><div class="report-entry-fields"><label class="manual-number-field"${manual?'':' hidden'}>写真番号<input data-field="manualNumber" type="text" maxlength="24" value="${escapeHtml(entry.manualNumber)}" placeholder="1 / A-01 など"></label><label>コメント<textarea data-field="comment" placeholder="空白のままExcelへ出力可">${escapeHtml(entry.comment)}</textarea></label></div><div class="report-framing"><label>表示<select data-field="frameMode"><option value="contain"${entry.frameMode==='contain'?' selected':''}>全体を表示</option><option value="cover"${entry.frameMode==='cover'?' selected':''}>枠に合わせる</option></select></label><label>横位置<input data-field="frameX" type="range" min="0" max="100" value="${entry.frameX}"><output>${entry.frameX}%</output></label><label>縦位置<input data-field="frameY" type="range" min="0" max="100" value="${entry.frameY}"><output>${entry.frameY}%</output></label><label>ズーム<input data-field="frameZoom" type="range" min="50" max="250" value="${entry.frameZoom}"><output>${entry.frameZoom}%</output></label><button type="button" data-act="reset-frame" class="soft-btn">枠をリセット</button></div></div><div class="report-item-actions"><button type="button" data-act="up" aria-label="上へ移動" title="上へ移動"${index===0?' disabled':''}>↑</button><button type="button" data-act="down" aria-label="下へ移動" title="下へ移動"${index===state.reportEntries.length-1?' disabled':''}>↓</button><button type="button" data-act="remove" class="remove" aria-label="台帳から外す" title="台帳から外す">×</button></div>`;
      const numberInput=$('[data-field=manualNumber]',row),titleNumber=$('.report-item-number',row);
      if(numberInput)numberInput.oninput=()=>{entry.manualNumber=numberInput.value;titleNumber.textContent=formatPhotoNumber(index,entry);renderReportPreview()};
      $('[data-field=comment]',row).oninput=ev=>{entry.comment=ev.target.value;renderReportPreview()};
      $('[data-field=frameMode]',row).onchange=ev=>{entry.frameMode=ev.target.value==='cover'?'cover':'contain';renderReportPreview()};
      for(const key of ['frameX','frameY','frameZoom']){const input=$(`[data-field=${key}]`,row);input.oninput=()=>{entry[key]=Number(input.value);input.nextElementSibling.textContent=`${input.value}%`;renderReportPreview()}}
      $('[data-act=reset-frame]',row).onclick=()=>{Object.assign(entry,{frameMode:'contain',frameX:50,frameY:50,frameZoom:100});renderReportItems();renderReportPreview()};
      $('[data-act=up]',row).onclick=()=>moveReportEntry(index,-1);$('[data-act=down]',row).onclick=()=>moveReportEntry(index,1);$('[data-act=remove]',row).onclick=()=>removeReportEntry(index);refs.reportItems.appendChild(row);
    });
  }
  function renderReportPreview(){
    const entries=reportPhotos(),per=Number(refs.reportCount.value),geometry=XLSX.getPhotoLedgerGeometry({orientation:refs.reportOrientation.value,perPage:per,numberPosition:refs.reportNumberPosition.value}),pages=Math.ceil(entries.length/per)||0;
    refs.reportPhotoCount.textContent=entries.length;refs.reportPageCount.textContent=pages;refs.reportPreview.innerHTML='';
    for(let pageIndex=0;pageIndex<pages;pageIndex++){
      const page=document.createElement('div');page.className='report-page'+(geometry.orientation==='landscape'?' landscape':'');page.innerHTML=`<h3>${escapeHtml(refs.reportTitle.value||'写真台帳')}</h3><div class="report-subtitle">${escapeHtml(refs.reportSubtitle.value||'')}</div><div class="report-grid" style="grid-template-columns:repeat(${geometry.cols},1fr);grid-template-rows:repeat(${geometry.rows},1fr)"></div><div class="report-note">${escapeHtml(refs.reportNote.value||'')}</div><div class="report-footer">${pageIndex+1} / ${pages}</div>`;
      const grid=$('.report-grid',page),items=entries.slice(pageIndex*per,(pageIndex+1)*per);
      for(let i=0;i<per;i++){
        const cell=document.createElement('div');cell.className='report-cell';
        if(items[i]){const globalIndex=pageIndex*per+i,label=formatPhotoNumber(globalIndex,items[i]),caption=[geometry.numberPosition==='bottom'?label:'',reportComment(items[i],items[i].photo)].filter(Boolean).join('\n');cell.innerHTML=`${framedPhotoMarkup(items[i],geometry,label)}<span>${escapeHtml(caption)}</span>`}else cell.innerHTML='<div class="report-photo-area"><div class="report-photo-frame"></div></div><span></span>';
        grid.appendChild(cell);
      }
      refs.reportPreview.appendChild(page);
    }
  }
  function renderReport(){ensureReportEntries();renderReportItems();renderReportPreview()}
  async function fitPhotoForLedger(blob,entry,geometry){
    const bmp=await createImageBitmap(blob),c=document.createElement('canvas');c.width=geometry.photoPixelWidth;c.height=geometry.photoPixelHeight;
    const ctx=c.getContext('2d'),placement=framePlacementForSize(bmp.width,bmp.height,entry,c.width,c.height);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bmp,placement.left,placement.top,placement.width,placement.height);bmp.close();
    const out=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));if(!out)throw new Error('台帳用画像を作成できませんでした');return new Uint8Array(await out.arrayBuffer());
  }
  async function exportReport(){
    const entries=reportPhotos();if(!entries.length){toast('写真を選択してください');return}
    refs.exportXlsx.disabled=true;refs.exportXlsx.textContent='Excelを作成中…';
    try{
      const options={orientation:refs.reportOrientation.value,perPage:Number(refs.reportCount.value),numberPosition:refs.reportNumberPosition.value},geometry=XLSX.getPhotoLedgerGeometry(options),data=[];
      for(let i=0;i<entries.length;i++){refs.exportXlsx.textContent=`Excelを作成中… ${i+1}/${entries.length}`;data.push({bytes:await fitPhotoForLedger(entries[i].photo.blob,entries[i],geometry),label:formatPhotoNumber(i,entries[i]),comment:reportComment(entries[i],entries[i].photo)})}
      const blob=await XLSX.createPhotoLedgerXlsx({title:refs.reportTitle.value||'写真台帳',subtitle:refs.reportSubtitle.value||'',...options,photos:data,note:refs.reportNote.value||''}),name=(refs.reportFilename.value.trim()||'写真台帳').replace(/[\/:*?"<>|]/g,'_')+'.xlsx';downloadBlob(blob,name);toast('Excel写真台帳を保存しました');
    }catch(e){console.error(e);toast('Excelの作成に失敗しました')}finally{refs.exportXlsx.disabled=false;refs.exportXlsx.textContent='Excel（.xlsx）で保存'}
  }
  function reportTemplateValues(){return {title:refs.reportTitle.value,subtitle:refs.reportSubtitle.value,orientation:refs.reportOrientation.value,count:refs.reportCount.value,numberMode:refs.reportNumberMode.value,numberStyle:refs.reportNumberStyle.value,startNumber:refs.reportStartNumber.value,numberPosition:refs.reportNumberPosition.value,note:refs.reportNote.value,includeMeta:refs.reportIncludeMeta.checked,filename:refs.reportFilename.value}}
  function applyReportTemplate(v={}){refs.reportTitle.value=v.title||'写真台帳';refs.reportSubtitle.value=v.subtitle||'';refs.reportOrientation.value=v.orientation==='landscape'?'landscape':'portrait';refs.reportCount.value=['9','12','16','20'].includes(String(v.count))?String(v.count):'9';refs.reportNumberMode.value=['continuous','page','manual'].includes(v.numberMode)?v.numberMode:'continuous';refs.reportNumberStyle.value=['photo','no','plain','zero','circled'].includes(v.numberStyle)?v.numberStyle:'photo';refs.reportStartNumber.value=v.startNumber??'1';refs.reportNumberPosition.value=['top-left','top-right'].includes(v.numberPosition)?v.numberPosition:'bottom';refs.reportNote.value=v.note||'';refs.reportIncludeMeta.checked=!!v.includeMeta;refs.reportFilename.value=v.filename||'写真台帳';renderReport()}
  function renderReportTemplateSelect(){refs.reportTemplateSelect.innerHTML='<option value="">新しい書式</option>'+state.reportTemplates.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');refs.reportTemplateSelect.value=state.activeReportTemplateId||'';const disabled=!state.activeReportTemplateId;refs.loadReportTemplate.disabled=disabled;refs.duplicateReportTemplate.disabled=disabled;refs.deleteReportTemplate.disabled=disabled}
  async function persistReportTemplates(){await DB.setSetting('reportTemplates',state.reportTemplates)}
  async function loadReportTemplates(){
    const stored=await DB.getSetting('reportTemplates',null);let templates=Array.isArray(stored)?stored:null,migrated=null;
    if(!templates){const legacy=await DB.getSetting('reportTemplate',null);templates=legacy?[{id:uid('report_template'),name:'以前の書式',values:{...legacy,numberMode:legacy.numberMode||'continuous',numberPosition:legacy.numberPosition||'bottom'}}]:[];if(templates.length){migrated=templates[0];await DB.setSetting('reportTemplates',templates)}}
    state.reportTemplates=templates.map((t,i)=>({id:String(t.id||uid(`report_template_${i}`)),name:cleanText(t.name)||`書式 ${i+1}`,values:t.values||t}));renderReportTemplateSelect();if(migrated){state.activeReportTemplateId=state.reportTemplates[0].id;refs.reportTemplateName.value=state.reportTemplates[0].name;renderReportTemplateSelect();applyReportTemplate(state.reportTemplates[0].values)}
  }
  async function saveReportTemplate(){
    const name=cleanText(refs.reportTemplateName.value);if(!name){toast('書式名を入力してください');refs.reportTemplateName.focus();return}
    const values=reportTemplateValues(),existing=state.reportTemplates.find(t=>t.id===state.activeReportTemplateId);
    if(existing){existing.name=name;existing.values=values}else{const created={id:uid('report_template'),name,values};state.reportTemplates.push(created);state.activeReportTemplateId=created.id}
    await persistReportTemplates();renderReportTemplateSelect();toast('写真台帳の書式を保存しました');
  }
  function selectedReportTemplate(){return state.reportTemplates.find(t=>t.id===state.activeReportTemplateId)||null}
  function loadSelectedReportTemplate(){const template=selectedReportTemplate();if(!template){toast('読み込む書式を選択してください');return}refs.reportTemplateName.value=template.name;applyReportTemplate(template.values);toast('保存書式を読み込みました')}
  async function duplicateReportTemplate(){const template=selectedReportTemplate();if(!template)return;const base=`${template.name} 複製`;let name=base,n=2;while(state.reportTemplates.some(t=>t.name===name))name=`${base} ${n++}`;const copy={id:uid('report_template'),name,values:{...template.values}};state.reportTemplates.push(copy);state.activeReportTemplateId=copy.id;refs.reportTemplateName.value=name;await persistReportTemplates();renderReportTemplateSelect();toast('書式を複製しました')}
  async function deleteReportTemplate(){const template=selectedReportTemplate();if(!template||!confirm(`書式「${template.name}」を削除しますか？`))return;state.reportTemplates=state.reportTemplates.filter(t=>t.id!==template.id);state.activeReportTemplateId=null;refs.reportTemplateName.value='';await persistReportTemplates();renderReportTemplateSelect();toast('書式を削除しました')}


  function renderRecentContexts(){
    if(!state.recentContexts.length)return '<p class="panel-note">最近使った撮影先はありません。</p>';
    return `<div class="recent-contexts">${state.recentContexts.map((c,i)=>`<button type="button" data-context-index="${i}">${escapeHtml(contextLabel(c))}</button>`).join('')}</div>`;
  }
  function openCaptureContextModal(){
    const c=state.captureContext;
    refs.modalContent.innerHTML=`<h2>撮影先情報</h2><p class="panel-note">ここで設定した内容は、これから撮影する写真へ関連付けられます。</p><div class="field-info-form"><label>撮影先<input id="capturePlaceInput" type="text" value="${escapeHtml(c.place)}" placeholder="場所・工場名など"></label><label>機械名<input id="captureMachineInput" type="text" value="${escapeHtml(c.machine)}" placeholder="任意"></label><label>設備番号<input id="captureEquipmentInput" type="text" value="${escapeHtml(c.equipment)}" placeholder="任意"></label></div><h3>最近使った撮影先</h3>${renderRecentContexts()}<div class="modal-actions two"><button id="clearCaptureContext" class="soft-btn">未設定にする</button><button id="saveCaptureContext" class="primary-btn">設定</button></div>`;
    refs.modal.hidden=false;
    $$('[data-context-index]',refs.modalContent).forEach(b=>b.onclick=()=>{const r=state.recentContexts[Number(b.dataset.contextIndex)];if(!r)return;$('#capturePlaceInput').value=r.place||'';$('#captureMachineInput').value=r.machine||'';$('#captureEquipmentInput').value=r.equipment||''});
    $('#clearCaptureContext').onclick=async()=>{await rememberCaptureContext({place:'',machine:'',equipment:''});refs.modal.hidden=true;toast('撮影先を未設定にしました')};
    $('#saveCaptureContext').onclick=async()=>{await rememberCaptureContext({place:$('#capturePlaceInput').value,machine:$('#captureMachineInput').value,equipment:$('#captureEquipmentInput').value});refs.modal.hidden=true;toast('撮影先を設定しました')};
  }
  function wireEvents(){
    refs.back.onclick=goBack;refs.settings.onclick=()=>setView('settings');refs.captureContextBtn.onclick=openCaptureContextModal;refs.editCaptureContext.onclick=openCaptureContextModal;
    refs.viewerPrev.onclick=()=>moveViewer(-1);refs.viewerNext.onclick=()=>moveViewer(1);refs.viewerEdit.onclick=()=>{const p=currentViewerPhoto();if(p)openEditor(p.id)};refs.viewerShare.onclick=shareOriginalPhoto;refs.viewerDelete.onclick=deleteViewerPhoto;refs.viewerInfo.onclick=showViewerInfo;refs.viewerReport.onclick=()=>{const p=currentViewerPhoto();if(!p)return;state.reportIds=[p.id];state.reportEntries=[normalizeReportEntry({id:p.id})];setView('report')};refs.viewerStage.addEventListener('pointerdown',ev=>{state.viewerSwipe={x:ev.clientX,y:ev.clientY}});refs.viewerStage.addEventListener('pointerup',ev=>{if(!state.viewerSwipe)return;const dx=ev.clientX-state.viewerSwipe.x,dy=ev.clientY-state.viewerSwipe.y;state.viewerSwipe=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))moveViewer(dx<0?1:-1)});refs.nav.forEach(b=>b.onclick=()=>{const v=b.dataset.view;if(v==='report'){state.reportIds=[]}setView(v)});
    refs.shutter.onclick=capture;refs.switchCamera.onclick=switchCamera;refs.flash.onclick=toggleTorch;refs.gps.onclick=requestGps;refs.stage.addEventListener('pointerdown',ev=>{if(ev.target===refs.video)showFocus(ev)});refs.exposure.oninput=async()=>{refs.exposureValue.textContent=Number(refs.exposure.value).toFixed(1);await applyTrackConstraint('exposureCompensation',Number(refs.exposure.value))};refs.zoom.oninput=async()=>{refs.zoomValue.textContent=`${Number(refs.zoom.value).toFixed(1)}×`;await applyTrackConstraint('zoom',Number(refs.zoom.value))};refs.mode.onchange=async()=>{if(state.settings.modeMemory)await DB.setSetting('cameraMode',refs.mode.value);toast(`${refs.mode.options[refs.mode.selectedIndex].text}に切り替えました`)};
    [refs.openImport,refs.albumImport,refs.emptyImport].forEach(b=>b.onclick=()=>refs.photoInput.click());refs.photoInput.onchange=()=>importFiles(refs.photoInput.files);refs.albumThumbBtn.onclick=()=>setView('album');refs.albumSearch.oninput=()=>{state.albumQuery=refs.albumSearch.value;renderAlbum()};refs.albumSourceFilter.onchange=()=>{state.albumSource=refs.albumSourceFilter.value;renderAlbum()};refs.selectMode.onclick=toggleSelectionMode;refs.deleteSelected.onclick=deleteSelected;refs.makeReport.onclick=()=>{state.reportIds=[...state.selected];setView('report')};
    [refs.reportTitle,refs.reportSubtitle,refs.reportNote,refs.reportIncludeMeta].forEach(el=>el.oninput=renderReportPreview);
    [refs.reportOrientation,refs.reportCount,refs.reportNumberMode,refs.reportNumberStyle,refs.reportStartNumber,refs.reportNumberPosition].forEach(el=>el.oninput=()=>{renderReportItems();renderReportPreview()});
    refs.exportXlsx.onclick=exportReport;refs.saveReportTemplate.onclick=saveReportTemplate;refs.loadReportTemplate.onclick=loadSelectedReportTemplate;refs.duplicateReportTemplate.onclick=duplicateReportTemplate;refs.deleteReportTemplate.onclick=deleteReportTemplate;refs.reportTemplateSelect.onchange=()=>{state.activeReportTemplateId=refs.reportTemplateSelect.value||null;const template=selectedReportTemplate();refs.reportTemplateName.value=template?.name||'';renderReportTemplateSelect()};
    [refs.gpsSetting,refs.modeMemory,refs.continuous].forEach(el=>el.onchange=saveSettings);refs.clearAll.onclick=async()=>{if(!confirm('アプリ内の写真をすべて削除しますか？'))return;await DB.clearPhotos();for(const id of state.urls.keys())revokePhotoUrl(id);state.photos=[];updateLatestThumb();toast('すべて削除しました')};
  }
  async function init(){state.returnUrl=resolveReturnUrl();wireEvents();await loadSettings();await refreshPhotos();await loadReportTemplates();const requested=location.hash.replace(/^#/,'');const initial=['album','report','settings'].includes(requested)?requested:'camera';setView(initial,{push:false});if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if(state.view==='camera')startCamera()})}
  init().catch(e=>{console.error(e);toast('アプリの初期化に失敗しました')});
})();
