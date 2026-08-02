(() => {
  'use strict';
  // WORK PHOTO for Machines v1.8 色調整実機修正版
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const APP_BUILD='v1.8-20260802-color-pipeline-r1';
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
    topbar:$('#topbar'),back:$('#backBtn'),nav:$$('.bottom-nav button'),toast:$('#toast'),modal:$('#modal'),modalContent:$('#modalContent'),photoInput:$('#photoInput'),nativeCameraInput:$('#nativeCameraInput'),
    video:$('#cameraVideo'),cameraPlaceholder:$('#cameraPlaceholder'),cameraBack:$('#cameraBackBtn'),cameraSettings:$('#cameraSettingsBtn'),shutter:$('#shutterBtn'),photoMode:$('#photoModeBtn'),videoMode:$('#videoModeBtn'),recordingStatus:$('#recordingStatus'),recordingTime:$('#recordingTime'),switchCamera:$('#switchCameraBtn'),flash:$('#flashBtn'),gps:$('#gpsBtn'),gpsText:$('#locationText'),mode:$('#cameraMode'),modeBadge:$('#cameraModeBadge'),assistBadge:$('#cameraAssistBadge'),guides:$('#cameraGuides'),ratioGuide:$('#captureRatioGuide'),levelGuide:$('#levelGuide'),stage:$('#cameraStage'),focus:$('#focusRing'),exposurePanel:$('#exposurePanel'),exposure:$('#exposureSlider'),exposureValue:$('#exposureValue'),zoomPanel:$('#zoomPanel'),zoom:$('#zoomSlider'),zoomValue:$('#zoomValue'),thumb:$('#albumThumb'),thumbEmpty:$('#albumThumbEmpty'),albumThumbBtn:$('#albumThumbBtn'),openImport:$('#openImportBtn'),captureContextBtn:$('#captureContextBtn'),captureContextText:$('#captureContextText'),
    albumGrid:$('#albumGrid'),albumEmpty:$('#albumEmpty'),albumCamera:$('#albumCameraBtn'),albumImport:$('#albumImportBtn'),emptyImport:$('#emptyImportBtn'),selectMode:$('#selectModeBtn'),selectionBar:$('#albumSelectionBar'),selectedCount:$('#selectedCount'),selectAll:$('#selectAllBtn'),clearSelection:$('#clearSelectionBtn'),saveSelected:$('#saveSelectedBtn'),makeReport:$('#makeReportBtn'),deleteSelected:$('#deleteSelectedBtn'),albumSearch:$('#albumSearch'),albumSourceFilter:$('#albumSourceFilter'),
    viewerStage:$('#viewerStage'),viewerImage:$('#viewerImage'),viewerPrev:$('#viewerPrevBtn'),viewerNext:$('#viewerNextBtn'),viewerCounter:$('#viewerCounter'),viewerName:$('#viewerName'),viewerMeta:$('#viewerMeta'),viewerMetaChips:$('#viewerMetaChips'),viewerEdit:$('#viewerEditBtn'),viewerShare:$('#viewerShareBtn'),viewerInfo:$('#viewerInfoBtn'),viewerDelete:$('#viewerDeleteBtn'),
    reportTitle:$('#reportTitle'),reportSubtitle:$('#reportSubtitle'),reportOrientation:$('#reportOrientation'),reportCount:$('#reportCount'),reportNumberMode:$('#reportNumberMode'),reportNumberStyle:$('#reportNumberStyle'),reportStartNumber:$('#reportStartNumber'),reportStartNumberLabel:$('#reportStartNumberLabel'),reportNumberPosition:$('#reportNumberPosition'),reportNote:$('#reportNote'),reportIncludeMeta:$('#reportIncludeMeta'),reportFilename:$('#reportFilename'),reportPhotoCount:$('#reportPhotoCount'),reportPageCount:$('#reportPageCount'),reportItems:$('#reportItems'),reportPreview:$('#reportPreview'),exportXlsx:$('#exportXlsxBtn'),reportTemplateName:$('#reportTemplateName'),reportTemplateSelect:$('#reportTemplateSelect'),saveReportTemplate:$('#saveReportTemplateBtn'),loadReportTemplate:$('#loadReportTemplateBtn'),duplicateReportTemplate:$('#duplicateReportTemplateBtn'),deleteReportTemplate:$('#deleteReportTemplateBtn'),
    gpsSetting:$('#gpsSetting'),modeMemory:$('#modeMemorySetting'),continuous:$('#continuousSetting'),editCaptureContext:$('#editCaptureContextBtn'),refreshApp:$('#refreshAppBtn'),clearAll:$('#clearAllBtn')
  };
  const state={view:'',history:[],photos:[],selectionMode:false,selected:new Set(),reportIds:[],reportEntries:[],reportTemplates:[],activeReportTemplateId:null,viewerIndex:0,viewerSwipe:null,stream:null,track:null,capabilities:{},cameraRequestId:0,filePickerActive:false,facing:'environment',torch:false,captureKind:'photo',videoHasAudio:true,mediaRecorder:null,recordedChunks:[],recordingStartedAt:0,recordingTimer:null,recordingLimit:null,location:null,captureContext:{place:'',machine:'',equipment:''},recentContexts:[],albumQuery:'',albumSource:'all',settings:{gps:true,modeMemory:true,continuous:true,camera:{grid:'thirds',center:false,front:false,level:false,timer:0,flicker:'off',phoneSavePrompt:false,captureSize:'high',captureRatio:'4:3',saveSize:'original'}},softwareExposure:0,focusTimer:null,focusPoint:null,levelHandler:null,cameraFallbackOpen:false,urls:new Map(),toastTimer:null,marketContext:MARKET_CONTEXT,returnUrl:null};

  function toast(msg){clearTimeout(state.toastTimer);refs.toast.textContent=msg;refs.toast.classList.add('show');state.toastTimer=setTimeout(()=>refs.toast.classList.remove('show'),2200)}
  function setView(name,{push=true}={}){
    if(name===state.view) return;
    if(push) state.history.push(state.view);
    Object.entries(refs.views).forEach(([k,v])=>v.classList.toggle('active',k===name));
    refs.nav.forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    state.view=name;document.documentElement.dataset.view=name;
    const internalBack=['viewer','report','settings'].includes(name);
    if(refs.topbar)refs.topbar.hidden=!(internalBack||state.marketContext);
    refs.back.hidden=!(internalBack||state.marketContext);
    refs.back.title=internalBack?'アプリ内で戻る':'MARKET BASEへ戻る';
    refs.back.setAttribute('aria-label',refs.back.title);
    if(refs.cameraBack)refs.cameraBack.hidden=!(name==='camera'&&state.marketContext);
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
  async function rememberCaptureContext(context){
    const normalized={place:cleanText(context.place),machine:cleanText(context.machine),equipment:cleanText(context.equipment),address:cleanText(context.address),latitude:Number.isFinite(Number(context.latitude))?Number(context.latitude):(state.location?.latitude??null),longitude:Number.isFinite(Number(context.longitude))?Number(context.longitude):(state.location?.longitude??null)};
    state.captureContext=normalized;await DB.setSetting('captureContext',normalized);
    if([normalized.place,normalized.machine,normalized.equipment].some(Boolean)){const key=[normalized.place,normalized.machine,normalized.equipment].join('|');state.recentContexts=[normalized,...state.recentContexts.filter(x=>[x.place,x.machine,x.equipment].join('|')!==key)].slice(0,12);await DB.setSetting('recentContexts',state.recentContexts)}updateCaptureContextDisplay()
  }

  async function loadSettings(){
    const saved=await DB.getSetting('settings',state.settings);state.settings={...state.settings,...saved,camera:{...state.settings.camera,...(saved?.camera||{}),phoneSavePrompt:false}};
    state.captureContext=await DB.getSetting('captureContext',state.captureContext);
    state.recentContexts=await DB.getSetting('recentContexts',[]);
    refs.gpsSetting.checked=state.settings.gps!==false;refs.modeMemory.checked=state.settings.modeMemory!==false;refs.continuous.checked=state.settings.continuous!==false;
    if(state.settings.modeMemory){const m=await DB.getSetting('cameraMode','standard');refs.mode.value=m}
    updateCaptureContextDisplay();updateCameraUi();
  }
  async function saveSettings(){state.settings={...state.settings,gps:refs.gpsSetting.checked,modeMemory:refs.modeMemory.checked,continuous:refs.continuous.checked};await DB.setSetting('settings',state.settings);toast('設定を保存しました')}
  async function refreshApplication(){
    stopCamera();if(refs.refreshApp){refs.refreshApp.disabled=true;refs.refreshApp.textContent='最新版を読み込み中…'}
    try{
      if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.map(reg=>reg.unregister()))}
      if('caches'in window){const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('work-photo-')).map(name=>caches.delete(name)))}
      const next=new URL(location.href);next.searchParams.delete('wpv');next.searchParams.set('cache-reset',Date.now());location.replace(next.href)
    }catch(error){console.error(error);if(refs.refreshApp){refs.refreshApp.disabled=false;refs.refreshApp.textContent='キャッシュを消して最新版を開く'}toast('更新できませんでした。もう一度お試しください')}
  }
  async function registerAppWorker(){
    if(!('serviceWorker'in navigator)||location.protocol==='file:')return;
    try{const registration=await navigator.serviceWorker.register(`../service-worker.js?v=${encodeURIComponent(APP_BUILD)}`,{scope:'../',updateViaCache:'none'});if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'})}catch(error){console.warn('Offline setup skipped',error)}
  }
  function preferredFlickerFrameRate(){const mode=state.settings.camera?.flicker;return mode==='50'?25:mode==='60'?30:null}
  function captureSizeLongEdge(){return ({high:3840,standard:1920,compact:1280})[state.settings.camera?.captureSize]||3840}
  function captureRatioNumber(){return ({'4:3':4/3,'16:9':16/9,'1:1':1})[state.settings.camera?.captureRatio]||4/3}
  function cameraVideoConstraints(){
    const long=captureSizeLongEdge(),ratio=captureRatioNumber(),landscapeWidth=Math.round(long),landscapeHeight=Math.round(long/ratio),video={facingMode:{ideal:state.facing},width:{ideal:landscapeWidth},height:{ideal:landscapeHeight}},frameRate=preferredFlickerFrameRate();
    if(frameRate)video.frameRate={ideal:frameRate};
    return video
  }
  async function applyFlickerReduction({notify=false}={}){
    const mode=state.settings.camera?.flicker||'off',target=preferredFlickerFrameRate();
    if(mode==='off'||!target)return true;
    if(!state.track){if(notify)toast('カメラ起動後にフリッカー軽減を適用します');return false}
    const range=state.capabilities?.frameRate;
    if(range&&(target<Number(range.min)||target>Number(range.max))){if(notify)toast('この端末では選択したフリッカー軽減を利用できません');return false}
    try{
      await state.track.applyConstraints({advanced:[{frameRate:target}]});
      const actual=Number(state.track.getSettings?.().frameRate||0),applied=!actual||Math.abs(actual-target)<1.1;
      if(notify)toast(applied?`フリッカー軽減 ${mode}Hz（${target}fps）`:'端末側の制限によりフレームレートを固定できませんでした');
      return applied
    }catch(error){if(notify)toast('この端末ではフリッカー軽減を利用できません');return false}
  }
  function openCameraFallbackModal(error){
    if(state.cameraFallbackOpen)return;state.cameraFallbackOpen=true;
    const denied=error?.name==='NotAllowedError'||error?.name==='SecurityError';
    refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">カメラ</p><h2>${denied?'カメラの許可が必要です':'カメラを起動できません'}</h2></div><button id="closeCameraFallback" class="modal-close" aria-label="閉じる">×</button></div><p class="panel-note">${denied?'通常、許可の確認は初回だけです。拒否した場合はSafariまたはサイトの設定でカメラを許可してから再試行してください。':'端末やブラウザの状態により、アプリ内カメラを利用できない場合があります。'}</p><div class="camera-fallback-actions"><button id="retryCamera" class="primary-btn">もう一度試す</button><button id="openNativeCamera" class="soft-btn">iPhone標準カメラで撮る</button><button id="chooseExistingPhoto" class="soft-btn">既存の写真を選ぶ</button></div>`;
    refs.modal.hidden=false;
    const close=()=>{refs.modal.hidden=true;state.cameraFallbackOpen=false};
    $('#closeCameraFallback').onclick=close;
    $('#retryCamera').onclick=()=>{close();startCamera()};
    $('#openNativeCamera').onclick=()=>{close();openFilePicker(refs.nativeCameraInput)};
    $('#chooseExistingPhoto').onclick=()=>{close();openFilePicker(refs.photoInput)}
  }
  function openFilePicker(input){state.filePickerActive=true;input.click()}
  async function startCamera(){
    if(TEST_MODE){refs.cameraPlaceholder.hidden=false;return}
    if(state.stream || state.view!=='camera'||document.hidden) return;
    if(!navigator.mediaDevices?.getUserMedia){refs.cameraPlaceholder.hidden=false;openCameraFallbackModal(new Error('unsupported'));return}
    const requestId=++state.cameraRequestId;let stream=null;
    try{
      const wantsAudio=state.captureKind==='video';state.videoHasAudio=!wantsAudio;
      try{stream=await navigator.mediaDevices.getUserMedia({audio:wantsAudio,video:cameraVideoConstraints()});state.videoHasAudio=!wantsAudio||stream.getAudioTracks().length>0}
      catch(firstError){if(!wantsAudio)throw firstError;if(requestId!==state.cameraRequestId||state.view!=='camera')return;stream=await navigator.mediaDevices.getUserMedia({audio:false,video:cameraVideoConstraints()});state.videoHasAudio=false;toast('マイクを使えないため、音声なしで動画を撮影します')}
      if(requestId!==state.cameraRequestId||state.view!=='camera'||document.hidden){stream.getTracks().forEach(t=>t.stop());return}
      state.stream=stream;state.track=stream.getVideoTracks()[0];refs.video.srcObject=stream;
      try{await refs.video.play()}catch(playError){stream.getTracks().forEach(t=>t.stop());state.stream=null;state.track=null;refs.video.srcObject=null;throw playError}
      refs.cameraPlaceholder.hidden=true;setupCameraCapabilities();const flickerApplied=await applyFlickerReduction();if(!flickerApplied&&state.settings.camera?.flicker!=='off'){state.settings.camera.flicker='off';await DB.setSetting('settings',state.settings)}updateCameraUi();
    }catch(e){if(stream)stream.getTracks().forEach(t=>t.stop());if(requestId!==state.cameraRequestId||state.view!=='camera')return;state.stream=null;state.track=null;refs.video.srcObject=null;refs.cameraPlaceholder.hidden=false;openCameraFallbackModal(e)}
  }
  function stopCamera(){state.cameraRequestId+=1;if(state.mediaRecorder?.state==='recording')state.mediaRecorder.stop();if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;state.track=null;refs.video.srcObject=null;state.capabilities={};state.torch=false;state.focusPoint=null;refs.focus.hidden=true;refs.flash.querySelector('span').textContent='OFF';refs.exposurePanel.hidden=true;refs.zoomPanel.hidden=true}
  function setupCameraCapabilities(){
    const caps=state.track?.getCapabilities?.()||{};state.capabilities=caps;
    if(caps.exposureCompensation){refs.exposure.min=caps.exposureCompensation.min;refs.exposure.max=caps.exposureCompensation.max;refs.exposure.step=caps.exposureCompensation.step||.1;refs.exposure.dataset.kind='camera'}else{refs.exposure.min=-2;refs.exposure.max=2;refs.exposure.step=.1;refs.exposure.dataset.kind='software'}
    refs.exposure.value=0;refs.exposureValue.textContent='0.0';refs.exposurePanel.hidden=!state.focusPoint;
    if(caps.zoom){refs.zoom.min=caps.zoom.min;refs.zoom.max=caps.zoom.max;refs.zoom.step=caps.zoom.step||.1;refs.zoom.value=caps.zoom.min;refs.zoomPanel.hidden=false}else refs.zoomPanel.hidden=true;
    if(!caps.torch) refs.flash.title='この端末では常時ライトに対応していない場合があります';
  }
  async function applyTrackConstraint(key,value){try{await state.track?.applyConstraints({advanced:[{[key]:value}]});return true}catch(e){return false}}
  async function toggleTorch(){if(!state.track){toast('カメラが起動していません');return}state.torch=!state.torch;const ok=await applyTrackConstraint('torch',state.torch);if(!ok){state.torch=false;toast('この端末では常時ライトを操作できません')}refs.flash.querySelector('span').textContent=state.torch?'ON':'OFF'}
  async function switchCamera(){if(state.mediaRecorder){toast('動画の停止処理が終わってからカメラを切り替えてください');return}state.facing=state.facing==='environment'?'user':'environment';stopCamera();await startCamera()}
  const cameraModeNames={factory:'工場内撮影',standard:'標準撮影',plate:'銘板・書類',inside:'機械内部',line:'製造ライン'};
  function updateCameraUi(){
    const camera=state.settings.camera||{};refs.modeBadge.textContent=cameraModeNames[refs.mode.value]||'標準撮影';refs.guides.dataset.grid=camera.grid||'off';refs.guides.classList.toggle('show-center',!!camera.center);refs.guides.classList.toggle('show-front',!!camera.front);refs.guides.classList.toggle('show-level',!!camera.level);
    const active=(camera.grid&&camera.grid!=='off')||camera.center||camera.front||camera.level;refs.assistBadge.hidden=!active;refs.video.style.filter=state.softwareExposure?`brightness(${Math.pow(2,state.softwareExposure/2)})`:'none';updateRatioGuide()
  }
  function updateRatioGuide(){
    if(!refs.ratioGuide||!refs.stage)return;const rect=refs.stage.getBoundingClientRect();if(!rect.width||!rect.height)return;const base=captureRatioNumber(),target=rect.width>=rect.height?base:1/base,maxW=rect.width*.94,maxH=rect.height*.94;let w=maxW,h=w/target;if(h>maxH){h=maxH;w=h*target}refs.ratioGuide.style.width=`${Math.max(80,w)}px`;refs.ratioGuide.style.height=`${Math.max(80,h)}px`;refs.ratioGuide.dataset.ratio=state.settings.camera?.captureRatio||'4:3';$('span',refs.ratioGuide).textContent=state.settings.camera?.captureRatio||'4:3'
  }
  async function applyExposure(value){
    const v=Number(value)||0;refs.exposureValue.textContent=v.toFixed(1);
    if(refs.exposure.dataset.kind==='camera'){const ok=await applyTrackConstraint('exposureCompensation',v);if(ok){state.softwareExposure=0;refs.video.style.filter='none';return}}
    state.softwareExposure=v;updateCameraUi()
  }
  async function applyPointFocus(point,lock=false){
    const caps=state.capabilities||{},advanced={};
    if(caps.pointsOfInterest)advanced.pointsOfInterest=[{x:point.x,y:point.y}];
    const focusModes=Array.isArray(caps.focusMode)?caps.focusMode:[],exposureModes=Array.isArray(caps.exposureMode)?caps.exposureMode:[];
    if(lock&&focusModes.includes('manual'))advanced.focusMode='manual';else if(focusModes.includes('single-shot'))advanced.focusMode='single-shot';
    if(lock&&exposureModes.includes('manual'))advanced.exposureMode='manual';else if(exposureModes.includes('single-shot'))advanced.exposureMode='single-shot';
    if(!Object.keys(advanced).length)return false;
    try{await state.track?.applyConstraints({advanced:[advanced]});return true}catch(_){return false}
  }
  async function showFocus(ev,{lock=false}={}){
    if(ev.target!==refs.video&&ev.currentTarget!==refs.stage)return;const r=refs.stage.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top,point={x:clamp(x/r.width,0,1),y:clamp(y/r.height,0,1)};
    refs.focus.style.left=`${x}px`;refs.focus.style.top=`${y}px`;refs.focus.classList.toggle('locked',lock);refs.focus.hidden=false;refs.exposurePanel.hidden=false;state.focusPoint=point;const applied=await applyPointFocus(point,lock);
    if(lock)toast(applied?'ピントと露出を固定しました':'このiPhoneではAE/AF固定をWebから操作できません');setTimeout(()=>{if(!lock)refs.focus.hidden=true},1100)
  }
  function updateCaptureKindUi(){const video=state.captureKind==='video';refs.photoMode.classList.toggle('active',!video);refs.videoMode.classList.toggle('active',video);refs.photoMode.setAttribute('aria-pressed',String(!video));refs.videoMode.setAttribute('aria-pressed',String(video));refs.shutter.classList.toggle('video-mode',video);refs.albumThumbBtn.hidden=video;refs.exposurePanel.hidden=true}
  async function switchCaptureKind(kind){if(kind===state.captureKind)return;if(state.mediaRecorder){toast('動画の停止処理が終わってから切り替えてください');return}state.captureKind=kind==='video'?'video':'photo';updateCaptureKindUi();stopCamera();await startCamera();toast(state.captureKind==='video'?'動画撮影：停止後に写真アプリへ保存できます':'写真撮影に切り替えました')}
  function supportedVideoMime(){if(typeof MediaRecorder==='undefined')return'';return ['video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported?.(t))||''}
  function clearRecordingTimers(){if(state.recordingTimer)clearInterval(state.recordingTimer);if(state.recordingLimit)clearTimeout(state.recordingLimit);state.recordingTimer=null;state.recordingLimit=null}
  function updateRecordingClock(){const seconds=Math.max(0,Math.floor((Date.now()-state.recordingStartedAt)/1000)),m=String(Math.floor(seconds/60)).padStart(2,'0'),s=String(seconds%60).padStart(2,'0');refs.recordingTime.textContent=`${m}:${s}`}
  async function shareVideoFile(file){if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'WORK PHOTO 動画'});toast('iPhoneでは「ビデオを保存」を選んでください');return true}catch(error){if(error?.name==='AbortError')return false}}downloadBlob(file,file.name);toast('共有できないためダウンロードへ保存しました');return false}
  function openVideoSaveModal(blob,mime,{hasAudio=true}={}){
    const ext=mime.includes('mp4')?'mp4':'webm',file=new File([blob],`WORK_PHOTO_VIDEO_${nowName()}.${ext}`,{type:mime||blob.type||'video/mp4'}),url=URL.createObjectURL(blob),audioNote=hasAudio?'':' この動画はマイク権限がないため音声なしです。';refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">動画撮影</p><h2>撮影した動画</h2></div><button id="closeVideoSave" class="modal-close" aria-label="閉じる">×</button></div><video class="video-review" src="${url}" controls playsinline></video><p class="panel-note">WORK PHOTOでは動画編集を行いません。iPhoneの共有画面から「ビデオを保存」を選びます。${audioNote}</p><div class="modal-actions two"><button id="discardVideo" class="soft-btn">撮り直す</button><button id="saveVideoToDevice" class="primary-btn">写真アプリへ保存</button></div>`;refs.modal.hidden=false;const close=()=>{refs.modal.hidden=true;URL.revokeObjectURL(url)};$('#closeVideoSave').onclick=close;$('#discardVideo').onclick=close;$('#saveVideoToDevice').onclick=async()=>{const b=$('#saveVideoToDevice');b.disabled=true;b.textContent='準備中…';await shareVideoFile(file);b.disabled=false;b.textContent='写真アプリへ保存';close()}
  }
  async function toggleVideoRecording(){
    if(state.captureKind!=='video'){await switchCaptureKind('video');return}if(state.mediaRecorder){if(state.mediaRecorder.state==='recording')state.mediaRecorder.stop();else toast('動画の停止処理中です');return}
    if(!state.stream)await startCamera();if(!state.stream)return;const mime=supportedVideoMime();if(typeof MediaRecorder==='undefined'||!mime){toast('このブラウザでは動画撮影に対応していません');return}
    try{state.recordedChunks=[];const recorder=new MediaRecorder(state.stream,{mimeType:mime}),hasAudio=state.stream.getAudioTracks().length>0;state.mediaRecorder=recorder;recorder.ondataavailable=e=>{if(e.data?.size)state.recordedChunks.push(e.data)};recorder.onstop=()=>{clearRecordingTimers();refs.shutter.classList.remove('recording');refs.recordingStatus.hidden=true;const blob=new Blob(state.recordedChunks,{type:recorder.mimeType||mime});state.mediaRecorder=null;state.recordedChunks=[];if(blob.size)openVideoSaveModal(blob,blob.type,{hasAudio})};recorder.onerror=e=>{console.error(e);toast('動画撮影を続けられませんでした')};recorder.start(500);state.recordingStartedAt=Date.now();refs.shutter.classList.add('recording');refs.recordingStatus.hidden=false;updateRecordingClock();state.recordingTimer=setInterval(updateRecordingClock,250);state.recordingLimit=setTimeout(()=>{if(recorder.state==='recording'){recorder.stop();toast('5分で撮影を終了しました')}},300000)}catch(error){console.error(error);toast('動画撮影を開始できませんでした')}
  }
  async function captureWithTimer(){
    if(state.captureKind==='video'){await toggleVideoRecording();return}
    if(!state.stream||!refs.video.videoWidth){openFilePicker(refs.nativeCameraInput);return}
    const seconds=Number(state.settings.camera?.timer||0);if(!seconds){await capture();return}
    refs.shutter.disabled=true;for(let left=seconds;left>0;left--){refs.modeBadge.textContent=String(left);await new Promise(r=>setTimeout(r,1000))}refs.shutter.disabled=false;updateCameraUi();await capture()
  }
  function captureCropRect(width,height){const base=captureRatioNumber(),target=width>=height?base:1/base,current=width/height;let sx=0,sy=0,sw=width,sh=height;if(current>target){sw=height*target;sx=(width-sw)/2}else if(current<target){sh=width/target;sy=(height-sh)/2}return {sx,sy,sw,sh}}
  async function capture(){
    if(!state.stream||!refs.video.videoWidth){openFilePicker(refs.nativeCameraInput);return}
    const crop=captureCropRect(refs.video.videoWidth,refs.video.videoHeight),long=captureSizeLongEdge(),scale=Math.min(1,long/Math.max(crop.sw,crop.sh)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(crop.sw*scale));c.height=Math.max(1,Math.round(crop.sh*scale));const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';if(state.facing==='user'){x.translate(c.width,0);x.scale(-1,1)}if(state.softwareExposure)x.filter=`brightness(${Math.pow(2,state.softwareExposure/2)})`;x.drawImage(refs.video,crop.sx,crop.sy,crop.sw,crop.sh,0,0,c.width,c.height);x.filter='none';
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.94));if(!blob)return;
    const photo={id:uid('photo'),name:`WORK_PHOTO_${nowName()}.jpg`,blob,createdAt:Date.now(),source:'camera',edited:false,mode:refs.mode.value,location:state.settings.gps?state.location:null,meta:{...state.captureContext,memo:''},width:c.width,height:c.height,captureSize:state.settings.camera?.captureSize||'high',captureRatio:state.settings.camera?.captureRatio||'4:3',savedToPhotosAt:null};
    await DB.putPhoto(photo);state.photos.unshift(photo);updateLatestThumb();toast('作業フォルダに追加しました');
    if(!state.settings.continuous)openEditor(photo.id);
  }
  function openCaptureReviewModal(photo,saveFile){
    const sizeNames={original:'オリジナル',high:'高画質 3840px',standard:'標準 1920px',compact:'容量優先 1280px'},size=state.settings.camera?.saveSize||'standard';
    refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">撮影済み</p><h2>WORK PHOTO内に保存しました</h2></div><button id="continueAfterCaptureTop" class="modal-close" aria-label="続けて撮影">×</button></div><img class="capture-review-image" src="${photoUrl(photo)}" alt="撮影した写真"><p class="panel-note">iPhoneの写真アプリにも保存する場合は、下のボタンを押し、共有画面で「画像を保存」を選びます。自動保存ではありません。保存サイズ：${sizeNames[size]||sizeNames.standard}</p><div class="modal-actions two"><button id="continueAfterCapture" class="soft-btn">続けて撮影</button><button id="saveCapturedPhoto" class="primary-btn">写真アプリへ保存</button></div>`;
    refs.modal.hidden=false;
    const close=()=>{refs.modal.hidden=true};
    $('#continueAfterCaptureTop').onclick=close;$('#continueAfterCapture').onclick=close;
    $('#saveCapturedPhoto').onclick=async()=>{
      const button=$('#saveCapturedPhoto');button.disabled=true;button.textContent='共有画面を開いています…';
      const sharePromise=sharePreparedPhotoFile(saveFile,{afterCapture:true});
      await sharePromise;close()
    }
  }
  async function importFiles(files){
    const list=[...files].filter(f=>f.type.startsWith('image/'));if(!list.length)return;
    for(const f of list){const dims=await imageDimensions(f);await DB.putPhoto({id:uid('photo'),name:f.name||`PHOTO_${nowName()}.jpg`,blob:f,createdAt:Date.now(),source:'import',edited:false,location:null,meta:{place:'',machine:'',equipment:'',memo:''},width:dims.width,height:dims.height,savedToPhotosAt:null})}
    refs.photoInput.value='';await refreshPhotos();toast(`${list.length}枚追加しました`);setView('album');
  }
  async function imageDimensions(blob){try{const b=await createImageBitmap(blob);const d={width:b.width,height:b.height};b.close();return d}catch(e){return {width:0,height:0}}}
  function requestGps({fresh=false}={}){
    if(!navigator.geolocation){toast('位置情報に対応していません');return Promise.resolve(null)}
    refs.gps.querySelector('span').textContent='取得中';return new Promise(resolve=>navigator.geolocation.getCurrentPosition(pos=>{state.location={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,timestamp:Date.now()};refs.gpsText.textContent=`位置情報：${state.location.latitude.toFixed(5)}, ${state.location.longitude.toFixed(5)}`;refs.gps.querySelector('span').textContent='取得済';toast('位置情報を取得しました');resolve(state.location)},()=>{if(fresh){state.location=null;refs.gpsText.textContent='位置情報：未取得'}refs.gps.querySelector('span').textContent='GPS';toast('位置情報を取得できませんでした');resolve(null)},{enableHighAccuracy:true,timeout:10000,maximumAge:fresh?0:60000}));
  }

  function filteredPhotos(){
    const q=cleanText(state.albumQuery).toLocaleLowerCase('ja');
    return state.photos.filter(p=>{
      if(state.albumSource==='unsaved'&&p.savedToPhotosAt)return false;
      if(!['all','unsaved'].includes(state.albumSource)&&p.source!==state.albumSource)return false;
      if(!q)return true;
      const m=normalizedMeta(p);const hay=[p.name,p.mode,m.place,m.machine,m.equipment,m.memo].join(' ').toLocaleLowerCase('ja');
      return hay.includes(q);
    });
  }
  function renderAlbum(){
    const photos=filteredPhotos();
    refs.albumGrid.innerHTML='';refs.albumGrid.classList.toggle('selecting',state.selectionMode);refs.selectionBar.hidden=!state.selectionMode;refs.selectedCount.textContent=state.selected.size;refs.makeReport.disabled=!state.selected.size;refs.saveSelected.disabled=!state.selected.size;refs.saveSelected.textContent=state.selected.size?`選択した${state.selected.size}枚を写真アプリへ保存`:'選択した写真を保存';refs.clearSelection.disabled=!state.selected.size;refs.selectAll.disabled=!photos.length||photos.every(p=>state.selected.has(p.id));
    refs.albumEmpty.hidden=photos.length>0;
    if(refs.albumEmpty&&!photos.length){const title=$('h2',refs.albumEmpty),desc=$('p',refs.albumEmpty);if(title)title.textContent=state.photos.length?'該当する写真がありません':'写真はまだありません';if(desc)desc.textContent=state.photos.length?'検索条件を変更してください。':'カメラで撮影するか、スマホの写真を読み込んでください。'}
    photos.forEach(p=>{const m=normalizedMeta(p),label=[m.place,m.machine].filter(Boolean).join(' ／ ');const btn=document.createElement('button');btn.className='album-item'+(state.selected.has(p.id)?' selected':'');btn.dataset.id=p.id;btn.innerHTML=`<img src="${photoUrl(p)}" alt="${escapeHtml(p.name)}"><span class="check">${state.selected.has(p.id)?'✓':''}</span>${p.savedToPhotosAt?'<span class="saved-badge">写真保存済</span>':''}<span class="tag">${escapeHtml(label|| (p.edited?'編集':'写真'))}</span>`;btn.onclick=()=>{if(state.selectionMode){if(state.selected.has(p.id))state.selected.delete(p.id);else state.selected.add(p.id);renderAlbum()}else openViewer(p.id)};refs.albumGrid.appendChild(btn)});
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toggleSelectionMode(){state.selectionMode=!state.selectionMode;if(!state.selectionMode)state.selected.clear();refs.selectMode.textContent=state.selectionMode?'完了':'選択';renderAlbum()}
  function selectAllVisible(){filteredPhotos().forEach(p=>state.selected.add(p.id));renderAlbum()}
  function clearSelection(){state.selected.clear();renderAlbum()}
  async function deleteSelected(){if(!state.selected.size)return;if(!confirm(`${state.selected.size}枚を削除しますか？`))return;for(const id of state.selected){await DB.deletePhoto(id);revokePhotoUrl(id)}state.selected.clear();state.selectionMode=false;refs.selectMode.textContent='選択';await refreshPhotos();toast('削除しました')}


  function currentViewerPhoto(){return state.photos[state.viewerIndex]||null}
  function openViewer(id){const index=state.photos.findIndex(p=>p.id===id);if(index<0)return;state.viewerIndex=index;setView('viewer');renderViewer()}
  function renderViewer(){const p=currentViewerPhoto();if(!p){setView('album',{push:false});return}refs.viewerImage.src=photoUrl(p);refs.viewerName.textContent=p.name||'写真';const date=new Date(p.createdAt).toLocaleString('ja-JP');const source=p.source==='camera'?'撮影':p.source==='edited'?'編集済み':'読み込み';const gps=p.location?` ／ GPS ${Number(p.location.latitude).toFixed(5)}, ${Number(p.location.longitude).toFixed(5)}`:'';refs.viewerMeta.textContent=`${date} ／ ${source} ／ ${p.width||'?'}×${p.height||'?'} px${gps}`;const m=normalizedMeta(p);refs.viewerMetaChips.innerHTML=[p.savedToPhotosAt&&'写真アプリ保存済み',m.place&&`撮影先：${m.place}`,m.machine&&`機械：${m.machine}`,m.equipment&&`設備：${m.equipment}`,m.memo&&`メモ：${m.memo}`].filter(Boolean).map(v=>`<span class="meta-chip">${escapeHtml(v)}</span>`).join('');refs.viewerCounter.textContent=`${state.viewerIndex+1} / ${state.photos.length}`;refs.viewerPrev.disabled=state.viewerIndex<=0;refs.viewerNext.disabled=state.viewerIndex>=state.photos.length-1}
  function moveViewer(delta){const next=clamp(state.viewerIndex+delta,0,state.photos.length-1);if(next===state.viewerIndex)return;state.viewerIndex=next;renderViewer()}
  async function makeDeviceSaveFile(photo,size='original',quality=.94){
    const maxBySize={high:3840,standard:1920,compact:1280},requested=maxBySize[size]||0,sourceType=photo.blob.type||'image/jpeg';
    if(!requested){const ext=sourceType==='image/png'?'png':sourceType==='image/webp'?'webp':'jpg';return new File([photo.blob],photo.name||`WORK_PHOTO_${nowName()}.${ext}`,{type:sourceType})}
    const bmp=await createImageBitmap(photo.blob),scale=Math.min(1,requested/Math.max(bmp.width,bmp.height)),w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const cc=c.getContext('2d');cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';cc.drawImage(bmp,0,0,w,h);bmp.close();const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',quality));if(!blob)throw new Error('保存画像を作成できませんでした');const base=(photo.name||`WORK_PHOTO_${nowName()}`).replace(/\.[^.]+$/,'');return new File([blob],`${base}_${w}x${h}.jpg`,{type:'image/jpeg'})
  }
  async function markPhotosSaved(photoIds){const when=Date.now();for(const id of photoIds){const photo=state.photos.find(p=>p.id===id);if(!photo)continue;photo.savedToPhotosAt=when;await DB.putPhoto(photo)}if(state.view==='album')renderAlbum();if(state.view==='viewer')renderViewer()}
  async function sharePreparedPhotoFiles(files,{afterCapture=false,photoIds=[]}={}){
    if(navigator.canShare?.({files})){
      try{await navigator.share({files,title:'WORK PHOTO'});if(photoIds.length)await markPhotosSaved(photoIds);toast(files.length>1?`${files.length}枚の保存操作が完了しました`:'写真アプリへの保存操作が完了しました');return true}catch(error){if(error?.name==='AbortError'){if(afterCapture)toast('作業フォルダには保存済みです');return false}}
    }
    if(files.length===1){downloadBlob(files[0],files[0].name);toast('写真共有に対応していないためダウンロードしました')}else toast('この端末では複数写真をまとめて共有できません');return false
  }
  async function sharePreparedPhotoFile(file,options={}){return sharePreparedPhotoFiles([file],options)}
  async function sharePhotoToDevice(photo,size='original',quality=.94,{afterCapture=false}={}){
    try{
      const file=await makeDeviceSaveFile(photo,size,quality);
      return await sharePreparedPhotoFile(file,{afterCapture,photoIds:[photo.id]})
    }catch(error){console.error(error);toast('端末保存用の画像を作成できませんでした');return false}
  }
  function openDeviceSaveModal(photo=currentViewerPhoto()){
    if(!photo)return;refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">iPhone</p><h2>写真アプリへ保存</h2></div><button id="closeDeviceSave" class="modal-close" aria-label="閉じる">×</button></div><p class="panel-note">元写真は上書きしません。iPhoneの共有画面が開いたら「画像を保存」を選びます。「ファイルに保存」ではありません。</p><div class="save-option-grid"><label>写真サイズ<select id="deviceSaveSize"><option value="original">オリジナル（元の解像度）</option><option value="high">高画質 3840px</option><option value="standard">標準 1920px</option><option value="compact">容量優先 1280px</option></select></label><label>JPEG画質<select id="deviceSaveQuality"><option value="0.96">高画質</option><option value="0.90" selected>標準</option><option value="0.78">容量優先</option></select></label></div><div class="modal-actions two"><button id="cancelDeviceSave" class="soft-btn">戻る</button><button id="confirmDeviceSave" class="primary-btn">iPhoneの保存画面へ</button></div>`;refs.modal.hidden=false;
    const sizeSelect=$('#deviceSaveSize'),qualitySelect=$('#deviceSaveQuality'),button=$('#confirmDeviceSave');sizeSelect.value=state.settings.camera?.saveSize||'standard';let preparedFile=null,prepareId=0;
    const close=()=>{prepareId+=1;refs.modal.hidden=true};
    const prepare=async()=>{const id=++prepareId;preparedFile=null;button.disabled=true;button.textContent='保存データを準備中…';try{const file=await makeDeviceSaveFile(photo,sizeSelect.value,Number(qualitySelect.value));if(id!==prepareId)return;preparedFile=file;button.disabled=false;button.textContent='iPhoneの保存画面へ'}catch(error){console.error(error);if(id!==prepareId)return;button.textContent='準備できませんでした';toast('端末保存用の画像を作成できませんでした')}};
    $('#closeDeviceSave').onclick=close;$('#cancelDeviceSave').onclick=close;sizeSelect.onchange=prepare;qualitySelect.onchange=prepare;
    button.onclick=()=>{if(!preparedFile)return;state.settings.camera.saveSize=sizeSelect.value;DB.setSetting('settings',state.settings).catch(console.error);button.disabled=true;button.textContent='共有画面を開いています…';const sharePromise=sharePreparedPhotoFile(preparedFile,{photoIds:[photo.id]});sharePromise.finally(close)};
    prepare()
  }
  function openBatchSaveModal(){
    const photos=state.photos.filter(p=>state.selected.has(p.id));if(!photos.length)return;
    refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">作業フォルダ</p><h2>選択した${photos.length}枚を保存</h2></div><button id="closeBatchSave" class="modal-close" aria-label="閉じる">×</button></div><p class="panel-note">写真をまとめてiPhoneの共有画面へ渡します。共有画面では「画像を保存」を選びます。</p><div class="save-option-grid"><label>写真サイズ<select id="batchSaveSize"><option value="original">オリジナル</option><option value="high">高画質 3840px</option><option value="standard">標準 1920px</option><option value="compact">軽量 1280px</option></select></label><label>JPEG画質<select id="batchSaveQuality"><option value="0.96">高画質</option><option value="0.90" selected>標準</option><option value="0.78">容量優先</option></select></label></div><p id="batchSaveProgress" class="panel-note">保存データを準備しています…</p><div class="modal-actions two"><button id="cancelBatchSave" class="soft-btn">戻る</button><button id="confirmBatchSave" class="primary-btn" disabled>準備中…</button></div>`;refs.modal.hidden=false;
    const size=$('#batchSaveSize'),quality=$('#batchSaveQuality'),progress=$('#batchSaveProgress'),button=$('#confirmBatchSave');size.value=state.settings.camera?.saveSize||'original';let prepared=[],prepareId=0;
    const close=()=>{prepareId+=1;refs.modal.hidden=true};
    const prepare=async()=>{const id=++prepareId;prepared=[];button.disabled=true;button.textContent='準備中…';try{for(let i=0;i<photos.length;i++){progress.textContent=`${i+1} / ${photos.length}枚を準備中…`;prepared.push(await makeDeviceSaveFile(photos[i],size.value,Number(quality.value)));if(id!==prepareId)return;await new Promise(r=>requestAnimationFrame(r))}if(!navigator.canShare?.({files:prepared})){progress.textContent='この端末では複数写真の一括共有に対応していません。';button.textContent='一括保存できません';return}progress.textContent=`${photos.length}枚をまとめて保存できます。`;button.disabled=false;button.textContent='iPhoneの保存画面へ'}catch(error){console.error(error);progress.textContent='保存データを準備できませんでした。';button.textContent='準備できませんでした'}};
    $('#closeBatchSave').onclick=close;$('#cancelBatchSave').onclick=close;size.onchange=prepare;quality.onchange=prepare;button.onclick=async()=>{if(!prepared.length)return;state.settings.camera.saveSize=size.value;await DB.setSetting('settings',state.settings);button.disabled=true;button.textContent='共有画面を開いています…';await sharePreparedPhotoFiles(prepared,{photoIds:photos.map(p=>p.id)});close()};prepare()
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
  function distanceMeters(a,b){const rad=n=>n*Math.PI/180,R=6371000,dLat=rad(Number(b.latitude)-Number(a.latitude)),dLon=rad(Number(b.longitude)-Number(a.longitude)),lat1=rad(Number(a.latitude)),lat2=rad(Number(b.latitude)),h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
  function nearbyContexts(){if(!state.location)return[];return state.recentContexts.filter(c=>Number.isFinite(Number(c.latitude))&&Number.isFinite(Number(c.longitude))).map(c=>({context:c,distance:distanceMeters(state.location,c)})).filter(x=>x.distance<=5000).sort((a,b)=>a.distance-b.distance).slice(0,5)}
  async function reverseGeocodeCandidates(){
    if(!state.location)return[];const lat=Number(state.location.latitude),lon=Number(state.location.longitude),cacheKey=`geocode_${lat.toFixed(4)}_${lon.toFixed(4)}`,cached=await DB.getSetting(cacheKey,null);if(cached?.candidates)return cached.candidates;
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&accept-language=ja`;
    const response=await fetch(url,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error('住所候補を取得できませんでした');const data=await response.json(),a=data.address||{},locality=[a.state,a.city||a.town||a.village,a.suburb||a.quarter||a.neighbourhood].filter(Boolean).join(''),street=[locality,a.road,a.house_number].filter(Boolean).join(' '),candidates=[street,locality,data.display_name].map(cleanText).filter((v,i,arr)=>v&&arr.indexOf(v)===i).slice(0,3);await DB.setSetting(cacheKey,{candidates,at:Date.now()});return candidates
  }
  function renderGpsCandidates(container,addresses=[]){
    const nearby=nearbyContexts(),items=[...nearby.map(x=>({label:`${contextLabel(x.context)}（約${x.distance<1000?Math.round(x.distance)+'m':(x.distance/1000).toFixed(1)+'km'}）`,value:x.context.place||contextLabel(x.context),context:x.context})),...addresses.map(v=>({label:v,value:v}))];
    container.innerHTML=items.length?items.map((x,i)=>`<button type="button" data-gps-candidate="${i}">${escapeHtml(x.label)}</button>`).join(''):'<p class="panel-note">近くの保存済み撮影先はありません。</p>';$$('[data-gps-candidate]',container).forEach(b=>b.onclick=()=>{const item=items[Number(b.dataset.gpsCandidate)];if(!item)return;$('#capturePlaceInput').value=item.value||'';if(item.context){$('#captureMachineInput').value=item.context.machine||'';$('#captureEquipmentInput').value=item.context.equipment||''}$$('[data-gps-candidate]',container).forEach(x=>x.classList.toggle('selected',x===b))})
  }
  function openCaptureContextModal(){
    const c=state.captureContext;
    refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">撮影情報</p><h2>撮影先</h2></div><button id="closeCaptureContext" class="modal-close" aria-label="閉じる">×</button></div><section class="gps-suggestion-card"><div><strong>現在地から候補</strong><small id="gpsCandidateStatus">${state.location?`取得済み（精度 約${Math.round(state.location.accuracy||0)}m）`:'位置情報は未取得です'}</small></div><button id="getGpsCandidates" type="button">候補を表示</button><p>住所候補を取得する時だけ、現在地の座標をOpenStreetMapへ送ります。写真は送信しません。</p><div id="gpsCandidateList" class="gps-candidate-list"></div></section><div class="field-info-form compact-fields"><label>撮影先<input id="capturePlaceInput" type="text" value="${escapeHtml(c.place)}" placeholder="場所・工場名など"></label><div class="field-pair"><label>機械名<input id="captureMachineInput" type="text" value="${escapeHtml(c.machine)}" placeholder="任意"></label><label>設備番号<input id="captureEquipmentInput" type="text" value="${escapeHtml(c.equipment)}" placeholder="任意"></label></div></div><details class="recent-details"><summary>最近使った撮影先</summary>${renderRecentContexts()}</details><div class="modal-actions two"><button id="clearCaptureContext" class="soft-btn">未設定にする</button><button id="saveCaptureContext" class="primary-btn">設定</button></div>`;
    refs.modal.hidden=false;
    renderGpsCandidates($('#gpsCandidateList'));
    $$('[data-context-index]',refs.modalContent).forEach(b=>b.onclick=()=>{const r=state.recentContexts[Number(b.dataset.contextIndex)];if(!r)return;$('#capturePlaceInput').value=r.place||'';$('#captureMachineInput').value=r.machine||'';$('#captureEquipmentInput').value=r.equipment||''});
    $('#closeCaptureContext').onclick=()=>{refs.modal.hidden=true};
    $('#getGpsCandidates').onclick=async()=>{const button=$('#getGpsCandidates'),status=$('#gpsCandidateStatus');button.disabled=true;button.textContent='取得中…';try{const current=await requestGps({fresh:true});if(!current){status.textContent='位置情報を取得できませんでした';return}status.textContent=`取得済み（精度 約${Math.round(current.accuracy||0)}m）`;const addresses=await reverseGeocodeCandidates();renderGpsCandidates($('#gpsCandidateList'),addresses)}catch(error){console.error(error);status.textContent='住所候補を取得できませんでした';renderGpsCandidates($('#gpsCandidateList'))}finally{button.disabled=false;button.textContent='候補を更新'}};
    $('#clearCaptureContext').onclick=async()=>{await rememberCaptureContext({place:'',machine:'',equipment:''});refs.modal.hidden=true;toast('撮影先を未設定にしました')};
    $('#saveCaptureContext').onclick=async()=>{await rememberCaptureContext({place:$('#capturePlaceInput').value,machine:$('#captureMachineInput').value,equipment:$('#captureEquipmentInput').value,address:$('#capturePlaceInput').value});refs.modal.hidden=true;toast('撮影先を設定しました')};
  }
  async function enableLevelGuide(){
    if(!state.settings.camera.level)return true;try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted')throw new Error('denied')}if(state.levelHandler)window.removeEventListener('deviceorientation',state.levelHandler);state.levelHandler=event=>{const roll=Number(event.gamma)||0,clamped=clamp(roll,-18,18);refs.levelGuide.style.setProperty('--level-roll',`${clamped}deg`);refs.levelGuide.classList.toggle('is-level',Math.abs(roll)<1.5)};window.addEventListener('deviceorientation',state.levelHandler);return true}catch(_){state.settings.camera.level=false;toast('水平器の利用が許可されませんでした');return false}
  }
  function applyModeAssistDefaults(mode,camera=state.settings.camera){if(mode==='plate'){camera.grid='off';camera.center=true;camera.front=true}else if(mode==='line'){camera.grid='thirds';camera.center=true;camera.front=false}else if(mode==='inside'){camera.grid='off';camera.center=false;camera.front=false}else{camera.grid='thirds';camera.center=false;camera.front=false}return camera}
  function openCameraSettingsModal(){
    if(state.mediaRecorder){toast('動画の停止処理が終わってから設定を開いてください');return}
    const camera=state.settings.camera;
    refs.modalContent.innerHTML=`<div class="compact-modal-head"><div><p class="modal-eyebrow">カメラ</p><h2>撮影設定</h2></div><button id="closeCameraSettings" class="modal-close" aria-label="閉じる">×</button></div><div class="camera-settings-list"><label><span><b>撮影モード</b><small>モードに合うガイドへ切替</small></span><select id="cameraModeSetting">${Object.entries(cameraModeNames).map(([v,l])=>`<option value="${v}"${refs.mode.value===v?' selected':''}>${l}</option>`).join('')}</select></label><label><span><b>撮影サイズ</b><small>作業フォルダへ追加する解像度</small></span><select id="cameraCaptureSizeSetting"><option value="high"${camera.captureSize==='high'?' selected':''}>高画質</option><option value="standard"${camera.captureSize==='standard'?' selected':''}>標準</option><option value="compact"${camera.captureSize==='compact'?' selected':''}>軽量</option></select></label><label><span><b>写真の比率</b><small>撮影範囲の縦横比</small></span><select id="cameraCaptureRatioSetting"><option value="4:3"${camera.captureRatio==='4:3'?' selected':''}>4:3</option><option value="16:9"${camera.captureRatio==='16:9'?' selected':''}>16:9</option><option value="1:1"${camera.captureRatio==='1:1'?' selected':''}>1:1</option></select></label><label><span><b>グリッド</b><small>構図を合わせる補助線</small></span><select id="cameraGridSetting"><option value="off">表示しない</option><option value="thirds"${camera.grid==='thirds'?' selected':''}>三分割</option></select></label><label><span><b>中央線</b><small>機械の中心を合わせる</small></span><input id="cameraCenterSetting" type="checkbox"${camera.center?' checked':''}></label><label><span><b>正面撮影ガイド</b><small>銘板・書類の位置合わせ</small></span><input id="cameraFrontSetting" type="checkbox"${camera.front?' checked':''}></label><label><span><b>水平器</b><small>端末の傾きを表示</small></span><input id="cameraLevelSetting" type="checkbox"${camera.level?' checked':''}></label><label><span><b>セルフタイマー</b><small>シャッターまでの時間</small></span><select id="cameraTimerSetting"><option value="0">OFF</option><option value="3"${Number(camera.timer)===3?' selected':''}>3秒</option><option value="10"${Number(camera.timer)===10?' selected':''}>10秒</option></select></label><label><span><b>フリッカー軽減</b><small>端末対応時のみ 50Hz→25fps／60Hz→30fps</small></span><select id="cameraFlickerSetting"><option value="off">OFF</option><option value="50"${camera.flicker==='50'?' selected':''}>50Hz地域</option><option value="60"${camera.flicker==='60'?' selected':''}>60Hz地域</option></select></label><label><span><b>写真アプリ保存サイズ</b><small>一括保存・詳細画面で使用</small></span><select id="cameraSaveSizeSetting"><option value="original">撮影時のサイズ</option><option value="high"${camera.saveSize==='high'?' selected':''}>高画質 3840px</option><option value="standard"${camera.saveSize==='standard'?' selected':''}>標準 1920px</option><option value="compact"${camera.saveSize==='compact'?' selected':''}>軽量 1280px</option></select></label></div><div class="camera-quick-actions"><button id="toggleCameraLight" class="soft-btn">常時ライト ${state.torch?'OFF':'ON'}</button><button id="captureGpsNow" class="soft-btn">現在地を取得</button></div><div class="modal-actions two"><button id="openAppSettings" class="soft-btn">アプリ設定</button><button id="applyCameraSettings" class="primary-btn">完了</button></div>`;
    refs.modal.hidden=false;
    const close=()=>{refs.modal.hidden=true};
    $('#closeCameraSettings').onclick=close;
    $('#cameraModeSetting').onchange=()=>{const preview=applyModeAssistDefaults($('#cameraModeSetting').value,{...camera});$('#cameraGridSetting').value=preview.grid;$('#cameraCenterSetting').checked=preview.center;$('#cameraFrontSetting').checked=preview.front};
    $('#toggleCameraLight').onclick=async()=>{await toggleTorch();$('#toggleCameraLight').textContent=`常時ライト ${state.torch?'OFF':'ON'}`};
    $('#captureGpsNow').onclick=async()=>{const b=$('#captureGpsNow');b.disabled=true;b.textContent='取得中…';await requestGps({fresh:true});b.disabled=false;b.textContent=state.location?'現在地 取得済み':'現在地を取得'};
    $('#openAppSettings').onclick=()=>{close();setView('settings')};
    $('#applyCameraSettings').onclick=async()=>{
      const oldFlicker=camera.flicker||'off',newFlicker=$('#cameraFlickerSetting').value,oldCaptureSize=camera.captureSize||'high';refs.mode.value=$('#cameraModeSetting').value;
      Object.assign(camera,{grid:$('#cameraGridSetting').value,center:$('#cameraCenterSetting').checked,front:$('#cameraFrontSetting').checked,level:$('#cameraLevelSetting').checked,timer:Number($('#cameraTimerSetting').value),flicker:newFlicker,phoneSavePrompt:false,captureSize:$('#cameraCaptureSizeSetting').value,captureRatio:$('#cameraCaptureRatioSetting').value,saveSize:$('#cameraSaveSizeSetting').value});
      if(state.settings.modeMemory)await DB.setSetting('cameraMode',refs.mode.value);await DB.setSetting('settings',state.settings);if(camera.level){const levelEnabled=await enableLevelGuide();if(!levelEnabled)await DB.setSetting('settings',state.settings)}updateCameraUi();close();
      if(oldFlicker!==newFlicker||oldCaptureSize!==camera.captureSize){stopCamera();await startCamera();if(newFlicker!=='off'){const applied=await applyFlickerReduction({notify:true});if(!applied){camera.flicker='off';await DB.setSetting('settings',state.settings)}}else toast('撮影設定を更新しました')}else toast('撮影設定を更新しました')
    }
  }
  function wireEvents(){
    refs.back.onclick=goBack;refs.cameraBack.onclick=goBack;refs.cameraSettings.onclick=openCameraSettingsModal;refs.captureContextBtn.onclick=openCaptureContextModal;refs.editCaptureContext.onclick=openCaptureContextModal;
    refs.viewerPrev.onclick=()=>moveViewer(-1);refs.viewerNext.onclick=()=>moveViewer(1);refs.viewerEdit.onclick=()=>{const p=currentViewerPhoto();if(p)openEditor(p.id)};refs.viewerShare.onclick=()=>openDeviceSaveModal();refs.viewerDelete.onclick=deleteViewerPhoto;refs.viewerInfo.onclick=showViewerInfo;refs.viewerStage.addEventListener('pointerdown',ev=>{state.viewerSwipe={x:ev.clientX,y:ev.clientY}});refs.viewerStage.addEventListener('pointerup',ev=>{if(!state.viewerSwipe)return;const dx=ev.clientX-state.viewerSwipe.x,dy=ev.clientY-state.viewerSwipe.y;state.viewerSwipe=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))moveViewer(dx<0?1:-1)});
    refs.shutter.onclick=captureWithTimer;refs.photoMode.onclick=()=>switchCaptureKind('photo');refs.videoMode.onclick=()=>switchCaptureKind('video');refs.switchCamera.onclick=switchCamera;refs.flash.onclick=toggleTorch;refs.gps.onclick=requestGps;refs.stage.addEventListener('pointerdown',ev=>{if(state.captureKind==='video'||ev.target.closest?.('button,input,select'))return;const point={target:refs.video,currentTarget:refs.stage,clientX:ev.clientX,clientY:ev.clientY};state.focusPoint=point;state.focusTimer=setTimeout(()=>{state.focusTimer=null;showFocus(point,{lock:true})},650)});refs.stage.addEventListener('pointerup',()=>{if(state.focusTimer){clearTimeout(state.focusTimer);state.focusTimer=null;showFocus(state.focusPoint)}});refs.stage.addEventListener('pointercancel',()=>{if(state.focusTimer)clearTimeout(state.focusTimer);state.focusTimer=null});refs.exposure.oninput=async()=>applyExposure(refs.exposure.value);refs.zoom.oninput=async()=>{refs.zoomValue.textContent=`${Number(refs.zoom.value).toFixed(1)}×`;await applyTrackConstraint('zoom',Number(refs.zoom.value))};refs.mode.onchange=async()=>{if(state.settings.modeMemory)await DB.setSetting('cameraMode',refs.mode.value);updateCameraUi()};
    [refs.openImport,refs.albumImport,refs.emptyImport].filter(Boolean).forEach(b=>b.onclick=()=>openFilePicker(refs.photoInput));refs.photoInput.onchange=()=>{state.filePickerActive=false;importFiles(refs.photoInput.files)};refs.nativeCameraInput.onchange=async()=>{state.filePickerActive=false;await importFiles(refs.nativeCameraInput.files);refs.nativeCameraInput.value=''};refs.albumThumbBtn.onclick=()=>setView('album');refs.albumCamera.onclick=()=>setView('camera');refs.albumSearch.oninput=()=>{state.albumQuery=refs.albumSearch.value;renderAlbum()};refs.albumSourceFilter.onchange=()=>{state.albumSource=refs.albumSourceFilter.value;renderAlbum()};refs.selectMode.onclick=toggleSelectionMode;refs.selectAll.onclick=selectAllVisible;refs.clearSelection.onclick=clearSelection;refs.saveSelected.onclick=openBatchSaveModal;refs.deleteSelected.onclick=deleteSelected;refs.makeReport.onclick=()=>{if(!state.selected.size)return;state.reportIds=[...state.selected];setView('report')};
    [refs.reportTitle,refs.reportSubtitle,refs.reportNote,refs.reportIncludeMeta].forEach(el=>el.oninput=renderReportPreview);
    [refs.reportOrientation,refs.reportCount,refs.reportNumberMode,refs.reportNumberStyle,refs.reportStartNumber,refs.reportNumberPosition].forEach(el=>el.oninput=()=>{renderReportItems();renderReportPreview()});
    refs.exportXlsx.onclick=exportReport;refs.saveReportTemplate.onclick=saveReportTemplate;refs.loadReportTemplate.onclick=loadSelectedReportTemplate;refs.duplicateReportTemplate.onclick=duplicateReportTemplate;refs.deleteReportTemplate.onclick=deleteReportTemplate;refs.reportTemplateSelect.onchange=()=>{state.activeReportTemplateId=refs.reportTemplateSelect.value||null;const template=selectedReportTemplate();refs.reportTemplateName.value=template?.name||'';renderReportTemplateSelect()};
    [refs.gpsSetting,refs.modeMemory,refs.continuous].forEach(el=>el.onchange=saveSettings);if(refs.refreshApp)refs.refreshApp.onclick=refreshApplication;refs.clearAll.onclick=async()=>{if(!confirm('アプリ内の写真をすべて削除しますか？'))return;await DB.clearPhotos();for(const id of state.urls.keys())revokePhotoUrl(id);state.photos=[];updateLatestThumb();toast('すべて削除しました')};
  }
  async function init(){state.returnUrl=resolveReturnUrl();wireEvents();await loadSettings();updateCaptureKindUi();await refreshPhotos();await loadReportTemplates();const requested=location.hash.replace(/^#/,'');const initial=['album','report','settings'].includes(requested)?requested:'camera';setView(initial,{push:false});registerAppWorker();document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else if(state.view==='camera'&&!state.filePickerActive)startCamera()});window.addEventListener('focus',()=>{if(state.filePickerActive)setTimeout(()=>{if(!state.filePickerActive)return;state.filePickerActive=false;if(state.view==='camera'&&!state.stream&&!document.hidden)startCamera()},500)});window.addEventListener('resize',()=>requestAnimationFrame(updateRatioGuide))}
  init().catch(e=>{console.error(e);toast('アプリの初期化に失敗しました')});
})();
