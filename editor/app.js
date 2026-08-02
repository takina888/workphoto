'use strict';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

const els = {
  start: $('#startScreen'), editor: $('#editorScreen'), chooseBtn: $('#choosePhotoButton'), takeBtn: $('#takePhotoButton'),
  chooseInput: $('#choosePhotoInput'), takeInput: $('#takePhotoInput'), brandHome: $('#brandHome'), headerBack: $('#headerBack'),
  helpButton: $('#helpButton'), helpDialog: $('#helpDialog'), helpGrid: $('#helpGrid'), imageInfo: $('#imageInfo'),
  canvas: $('#editorCanvas'), stage: $('#canvasStage'), toolGrid: $('#toolGrid'), currentTool: $('#currentToolLabel'),
  cancelTool: $('#cancelToolButton'), applyTool: $('#applyToolButton'), undo: $('#undoButton'), redo: $('#redoButton'), compare: $('#compareButton'), save: $('#saveButton'),
  sheet: $('#bottomSheet'), sheetBackdrop: $('#sheetBackdrop'), sheetTitle: $('#sheetTitle'), sheetEyebrow: $('#sheetEyebrow'),
  sheetDescription: $('#sheetDescription'), sheetContent: $('#sheetContent'), closeSheet: $('#closeSheetButton'),
  toolHint: $('#toolHint'), snapBadge: $('#snapBadge'), zoomRange: $('#zoomRange'), zoomLabel: $('#zoomLabel'),
  zoomOut: $('#zoomOut'), zoomIn: $('#zoomIn'), fit: $('#fitButton'), saveDialog: $('#saveDialog'), saveForm: $('#saveForm'),
  saveFormat: $('#saveFormat'), saveQuality: $('#saveQuality'), saveSize: $('#saveSize'), saveFilename: $('#saveFilename'),
  saveCustomRow: $('#saveCustomSizeRow'), saveCustomLongEdge: $('#saveCustomLongEdge'), cancelSaveTop: $('#cancelSaveTop'), cancelSave: $('#cancelSaveButton'),
  saveEstimate: $('#saveEstimate'), confirmSave: $('#confirmSaveButton'), saveToAppAlbum: $('#saveToAppAlbum'), returnAlbum: $('#returnAlbumButton'), toast: $('#toast')
};
const ctx = els.canvas.getContext('2d', {willReadFrequently:true});
const uid=(prefix='overlay')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

const ICONS = {
  horizontal:'<svg viewBox="0 0 32 32"><path d="M4 20h24M7 14h18"></path><path d="m10 9-3 5 5 1M22 9l3 5-5 1"></path></svg>',
  crop:'<svg viewBox="0 0 32 32"><path d="M9 4v19a4 4 0 0 0 4 4h15"></path><path d="M4 9h15a4 4 0 0 1 4 4v15"></path></svg>',
  rotate:'<svg viewBox="0 0 32 32"><path d="M25 12A10 10 0 1 0 26 21"></path><path d="m25 5 1 7-7-1"></path></svg>',
  color:'<svg viewBox="0 0 32 32"><path d="M16 4C9 11 7 15 7 20a9 9 0 0 0 18 0c0-5-2-9-9-16Z"></path><path d="M12 22c1 2 3 3 5 3"></path></svg>',
  filter:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"></circle><path d="M16 4v24M5.6 10h20.8M5.6 22h20.8"></path></svg>',
  perspective:'<svg viewBox="0 0 32 32"><path d="m7 6 19 3-3 18-17-2Z"></path><circle cx="7" cy="6" r="1.7"></circle><circle cx="26" cy="9" r="1.7"></circle><circle cx="23" cy="27" r="1.7"></circle><circle cx="6" cy="25" r="1.7"></circle></svg>',
  size:'<svg viewBox="0 0 32 32"><path d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7"></path><path d="M11 11h10v10H11z"></path></svg>',
  upscale:'<svg viewBox="0 0 32 32"><path d="M6 18V7h11M15 9l2-2-2-2"></path><path d="M26 14v11H15M17 23l-2 2 2 2"></path><path d="m10 22 12-12"></path></svg>',
  date:'<svg viewBox="0 0 32 32"><rect x="5" y="7" width="22" height="20" rx="4"></rect><path d="M10 4v6M22 4v6M5 13h22"></path><path d="M10 18h4M18 18h4M10 23h4"></path></svg>',
  shape:'<svg viewBox="0 0 32 32"><circle cx="11" cy="11" r="6"></circle><rect x="16" y="16" width="11" height="11" rx="2"></rect></svg>',
  text:'<svg viewBox="0 0 32 32"><path d="M6 8h20M16 8v18M10 26h12"></path></svg>',
  label:'<svg viewBox="0 0 32 32"><path d="M5 8a3 3 0 0 1 3-3h11l8 8-12 14L5 17Z"></path><circle cx="11" cy="11" r="2"></circle></svg>',
  dimension:'<svg viewBox="0 0 32 32"><path d="M5 9v14M27 9v14M7 16h18"></path><path d="m11 12-4 4 4 4M21 12l4 4-4 4"></path></svg>',
  number:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"></circle><path d="M13 12c1-2 6-2 6 1 0 4-6 4-6 8h7"></path></svg>',
  draw:'<svg viewBox="0 0 32 32"><path d="m6 25 3-8L22 4l6 6-13 13Z"></path><path d="m9 17 6 6M20 6l6 6"></path></svg>',
  magnify:'<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="8"></circle><path d="m20 20 7 7M14 10v8M10 14h8"></path></svg>',
  hide:'<svg viewBox="0 0 32 32"><path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z"></path><path d="m6 5 20 22"></path></svg>',
  erase:'<svg viewBox="0 0 32 32"><path d="m7 21 11-15 8 6-11 15H8l-3-3Z"></path><path d="m14 12 8 6M15 27h12"></path></svg>',
  compare:'<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="4"></rect><path d="M16 6v20M9 12h4M19 20h4"></path></svg>',
  blur:'<svg viewBox="0 0 32 32"><circle cx="9" cy="10" r="2"></circle><circle cx="17" cy="8" r="1"></circle><circle cx="24" cy="12" r="2"></circle><circle cx="12" cy="19" r="3"></circle><circle cx="22" cy="22" r="3"></circle></svg>',
  angle:'<svg viewBox="0 0 32 32"><path d="M6 25 16 8l10 17"></path><path d="M12 25a8 8 0 0 1 8-7"></path></svg>',
  textbox:'<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="3"></rect><path d="M9 12h14M16 12v9M12 21h8"></path></svg>',
  bgselect:'<svg viewBox="0 0 32 32"><path d="m7 21 11-15 8 6-11 15H8l-3-3Z"></path><path d="M23 20c3 3 4 5 1 7s-5 0-5-2 2-4 4-5Z"></path></svg>'
};

const toolDefinitions = {
  adjust:[
    ['horizontal','水平','傾きを補正'],['crop','切り抜き','比率を選択'],['rotate','回転','90°回転'],
    ['color','色調整','彩度・明るさ'],['filter','フィルター','ワンタッチ補正'],['perspective','台形補正','四隅を調整'],
    ['size','画像サイズ','pxを変更'],['upscale','高解像度','AIなしで拡大']
  ],
  write:[
    ['date','日付','ワンタッチ'],['shape','図形','○ □ →'],['text','文字','自由入力'],['textbox','文字枠','四角の中に文字'],
    ['label','ラベル','グリグリ選択'],['dimension','寸法','磁石のように吸着'],['angle','角度','3点で記入'],['number','番号','①②③'],
    ['draw','手書き','ペン・マーカー'],['magnify','部分拡大','細部を強調']
  ],
  repair:[
    ['hide','隠す','モザイク等'],['erase','手動切り抜き','背景を消す'],['bgselect','長押し背景抜き','近い色を選択'],['compare','2枚比較','前後を並べる'],['blur','影・反射','手動で調整']
  ]
};

const helpData = [
  ['水平','グリッドと通常の輪郭計算で写真の傾きを直します。'],['台形補正','青い4点を四隅に合わせ、斜めの銘板や書類を正面の形にします。'],
  ['日付','今日の日付をワンタッチで写真へ入れます。'],['図形','円・四角・矢印を写真上へ配置します。'],
  ['ラベル','旧品・交換品・故障部品などを回して選びます。'],['寸法','2点を選び、数値を入力します。端点は強い輪郭へ吸着します。'],
  ['手動切り抜き','背景を指でなぞって透明にします。透明を残す場合はPNGで保存します。'],['2枚比較','現在の写真ともう1枚を、左右または上下にまとめます。'],
  ['色調整','明るさ・コントラスト・彩度・色温度を調整します。'],['隠す','ぼかし・モザイク・塗りつぶしで情報を隠します。'],
  ['角度','頂点と2本の基準線を指定し、写真上の見かけの角度を表示します。'],['文字枠','四角の中へ文字を入れ、背景色と透明度を設定します。'],['長押し背景抜き','同系色がつながる範囲を通常の画像処理で透明にします。'],['保存','JPEG・PNG・WEBPから選び、端末の保存画面へ進みます。']
];

const defaultState = () => ({
  image:null, imageDataUrl:'', originalImage:null, originalDataUrl:'', originalWidth:0, originalHeight:0, workingWidth:0, workingHeight:0,
  angle:0, rotation:0, cropRatio:'original', cropZoom:1, cropX:0, cropY:0, freeCropAspect:1, adjustments:{brightness:100,contrast:100,saturation:100,warmth:0},
  filterPreset:'standard', overlays:[], activeTool:null, drawMode:null, drawStart:null, freePath:null,
  dimensionMode:'free', pendingDimension:null, numberNext:1, zoom:100, outputMode:'original', outputLongEdge:1920,
  compareOriginal:false, history:[], future:[], edgeMap:null, edgeMapDirty:true, selectedLabel:'交換品', perspectivePoints:null, perspectiveDragging:-1, eraseBrush:.035,
  drawOpacity:100,drawLineStyle:'solid',textBoxText:'',textBoxBackground:'#0B63CE',textBoxTextColor:'#FFFFFF',pendingAngle:null,bgTimer:null,bgPoint:null,bgThreshold:38,
  selectedOverlayId:null,selectionDrag:null,cropPointers:new Map(),cropGesture:null
});
let state = defaultState();
const EDITOR_PARAMS=new URLSearchParams(location.search);
function safeReturnUrl(raw){
  if(!raw)return null;
  try{const url=new URL(raw,location.href);return (url.origin===location.origin&&(url.protocol==='http:'||url.protocol==='https:'))?url.href:null}catch(_){return null}
}
const EDITOR_RETURN=safeReturnUrl(EDITOR_PARAMS.get('return'));
let sourcePhotoRecord=null;
let renderQueued = false;
let pendingSnapshot = null;
let toastTimer = null;

function cloneSerializable(includeImage=false){
  const data={angle:state.angle,rotation:state.rotation,cropRatio:state.cropRatio,cropZoom:state.cropZoom,cropX:state.cropX,cropY:state.cropY,freeCropAspect:state.freeCropAspect,adjustments:state.adjustments,filterPreset:state.filterPreset,overlays:state.overlays,outputMode:state.outputMode,outputLongEdge:state.outputLongEdge,numberNext:state.numberNext};
  if(includeImage)Object.assign(data,{imageDataUrl:state.imageDataUrl,originalDataUrl:state.originalDataUrl,originalWidth:state.originalWidth,originalHeight:state.originalHeight,workingWidth:state.workingWidth,workingHeight:state.workingHeight});
  return JSON.parse(JSON.stringify(data));
}
function assignSerializable(s){
  state.angle=s.angle??0;state.rotation=s.rotation??0;state.cropRatio=s.cropRatio||'original';state.cropZoom=s.cropZoom??1;state.cropX=s.cropX??0;state.cropY=s.cropY??0;state.freeCropAspect=s.freeCropAspect||state.freeCropAspect||1;
  state.adjustments={...(s.adjustments||{brightness:100,contrast:100,saturation:100,warmth:0})};state.filterPreset=s.filterPreset||'standard';state.overlays=JSON.parse(JSON.stringify(s.overlays||[]));
  state.outputMode=s.outputMode||'original';state.outputLongEdge=s.outputLongEdge||Math.max(state.originalWidth,state.originalHeight,1920);state.numberNext=s.numberNext||1;state.selectedOverlayId=null;state.edgeMapDirty=true;
}
async function applySnapshot(s){
  if(s.imageDataUrl&&s.imageDataUrl!==state.imageDataUrl){state.image=await loadImage(s.imageDataUrl);state.imageDataUrl=s.imageDataUrl;state.workingWidth=s.workingWidth||state.image.naturalWidth;state.workingHeight=s.workingHeight||state.image.naturalHeight}
  assignSerializable(s);els.imageInfo.textContent=`${state.originalWidth} × ${state.originalHeight}px`;syncOutputControls();render();
}
function checkpoint(includeImage=false){
  state.history.push(cloneSerializable(includeImage));
  if(state.history.length>40) state.history.shift();
  state.future=[];updateHistoryButtons();
}
function updateHistoryButtons(){els.undo.disabled=!state.history.length;els.redo.disabled=!state.future.length}
async function undo(){if(!state.history.length)return;const snap=state.history.pop();state.future.push(cloneSerializable(Boolean(snap.imageDataUrl)));await applySnapshot(snap);updateHistoryButtons();showToast('1つ前に戻しました')}
async function redo(){if(!state.future.length)return;const snap=state.future.pop();state.history.push(cloneSerializable(Boolean(snap.imageDataUrl)));await applySnapshot(snap);updateHistoryButtons();showToast('やり直しました')}

function showToast(message){
  clearTimeout(toastTimer);els.toast.textContent=message;els.toast.hidden=false;toastTimer=setTimeout(()=>els.toast.hidden=true,2200);
}
function escapeHtml(value=''){return value.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function buildHelp(){els.helpGrid.innerHTML=helpData.map(([t,d])=>`<div class="help-item"><strong>${t}</strong><span>${d}</span></div>`).join('')}
function renderToolGrid(category='adjust'){
  els.toolGrid.innerHTML=toolDefinitions[category].map(([id,label,small])=>`<button class="tool-button" type="button" data-tool="${id}">${ICONS[id]}<span>${label}</span><small>${small}</small></button>`).join('');
  $$('.tool-button',els.toolGrid).forEach(btn=>btn.addEventListener('click',()=>openTool(btn.dataset.tool)));
}
function selectCategory(category){
  $$('.tool-tab').forEach(b=>{const on=b.dataset.category===category;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on))});
  renderToolGrid(category);
}
function showEditor(){els.start.hidden=true;els.editor.hidden=false;els.headerBack.hidden=Boolean(EDITOR_RETURN);document.body.classList.add('is-editor');setTimeout(fitCanvasToStage,80)}
function showStart(){cancelActiveTool();closeSheet();els.editor.hidden=true;els.start.hidden=false;els.headerBack.hidden=true;document.body.classList.remove('is-editor')}

async function loadFile(file, sourceRecord=null){
  if(!file || !file.type.startsWith('image/')){showToast('画像ファイルを選んでください');return}
  sourcePhotoRecord=sourceRecord;
  const dataUrl=await fileToDataUrl(file);const img=await loadImage(dataUrl);
  state=defaultState();state.image=img;state.imageDataUrl=dataUrl;state.originalImage=img;state.originalDataUrl=dataUrl;state.originalWidth=img.naturalWidth||img.width;state.originalHeight=img.naturalHeight||img.height;
  const maxEdge=1800;const scale=Math.min(1,maxEdge/Math.max(state.originalWidth,state.originalHeight));state.workingWidth=Math.max(1,Math.round(state.originalWidth*scale));state.workingHeight=Math.max(1,Math.round(state.originalHeight*scale));
  state.freeCropAspect=state.workingWidth/state.workingHeight;state.outputMode='original';state.outputLongEdge=Math.max(state.originalWidth,state.originalHeight);
  els.imageInfo.textContent=`${state.originalWidth} × ${state.originalHeight}px`;
  els.saveFilename.value=`WORK_PHOTO_${formatDate(new Date(),'compact')}`;
  syncOutputControls();showEditor();render();updateHistoryButtons();updateSelectionUi();showToast('写真を読み込みました')
}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src})}

function effectiveFilters(){
  const p=state.filterPreset;let b=state.adjustments.brightness,c=state.adjustments.contrast,s=state.adjustments.saturation,w=state.adjustments.warmth;
  if(p==='bright'){b+=10;c+=4}else if(p==='clear'){c+=18;s+=8}else if(p==='warm'){w+=24;s+=5}else if(p==='cool'){w-=24}else if(p==='mono'){s=0;c+=10}else if(p==='document'){b+=8;c+=30;s=Math.max(0,s-45)}else if(p==='vivid'){s+=25;c+=8}
  return {b:Math.max(0,b),c:Math.max(0,c),s:Math.max(0,s),w};
}
function normalizedRotation(){return ((state.rotation%360)+360)%360}
function orientedWorkingSize(){const swap=normalizedRotation()===90||normalizedRotation()===270;return swap?[state.workingHeight,state.workingWidth]:[state.workingWidth,state.workingHeight]}
function selectedCropAspect(){
  const [ow,oh]=orientedWorkingSize();
  if(state.cropRatio==='original')return ow/oh;
  if(state.cropRatio==='free')return Math.max(.2,Math.min(5,Number(state.freeCropAspect)||ow/oh));
  const [a,b]=String(state.cropRatio).split(':').map(Number);return a>0&&b>0?a/b:ow/oh;
}
function getCanvasDimensions(){
  const [ow,oh]=orientedWorkingSize(),ratio=selectedCropAspect();let w=ow,h=oh;
  if(w/h>ratio)w=h*ratio;else h=w/ratio;
  const scale=Math.min(1,1800/Math.max(w,h));return [Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))]
}
function cropMetrics(width,height){
  const [ow,oh]=orientedWorkingSize();
  const guard=1+Math.abs(state.angle)*.02;
  const scale=Math.max(width/ow,height/oh)*Math.max(1,state.cropZoom||1)*guard;
  const drawnW=ow*scale,drawnH=oh*scale;
  return {scale,drawnW,drawnH,excessX:Math.max(0,(drawnW-width)/2),excessY:Math.max(0,(drawnH-height)/2)};
}
function drawTrueOriginal(targetCtx,width,height){
  const image=state.originalImage||state.image;if(!image)return;
  const iw=state.originalWidth||image.naturalWidth,ih=state.originalHeight||image.naturalHeight,scale=Math.min(width/iw,height/ih),dw=iw*scale,dh=ih*scale;
  targetCtx.save();targetCtx.clearRect(0,0,width,height);targetCtx.filter='none';targetCtx.globalAlpha=1;targetCtx.drawImage(image,(width-dw)/2,(height-dh)/2,dw,dh);targetCtx.restore();
}
function drawBase(targetCtx,width,height,original=false){
  if(!state.image)return;if(original){drawTrueOriginal(targetCtx,width,height);return}
  const rot=normalizedRotation(),m=cropMetrics(width,height),filters=effectiveFilters(),warmth=Math.max(-50,Math.min(50,filters.w));
  const offsetX=Math.max(-1,Math.min(1,state.cropX||0))*m.excessX,offsetY=Math.max(-1,Math.min(1,state.cropY||0))*m.excessY;
  targetCtx.save();targetCtx.clearRect(0,0,width,height);targetCtx.beginPath();targetCtx.rect(0,0,width,height);targetCtx.clip();
  targetCtx.filter=`brightness(${filters.b}%) contrast(${filters.c}%) saturate(${filters.s}%) sepia(${Math.abs(warmth)*0.18}%) hue-rotate(${warmth<0?warmth*0.45:-warmth*0.24}deg)`;
  targetCtx.translate(width/2+offsetX,height/2+offsetY);targetCtx.rotate((rot+state.angle)*Math.PI/180);
  targetCtx.drawImage(state.image,-state.workingWidth*m.scale/2,-state.workingHeight*m.scale/2,state.workingWidth*m.scale,state.workingHeight*m.scale);
  targetCtx.restore();targetCtx.filter='none';
}
function render(){
  if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;renderNow()})
}
function renderNow(){
  if(!state.image)return;const [w,h]=getCanvasDimensions();if(els.canvas.width!==w||els.canvas.height!==h){els.canvas.width=w;els.canvas.height=h;state.edgeMapDirty=true}
  drawBase(ctx,w,h,state.compareOriginal);
  if(!state.compareOriginal) drawOverlays(ctx,w,h);
  if(!state.compareOriginal&&state.activeTool==='perspective'&&state.perspectivePoints)drawPerspectiveGuide(ctx,w,h);
  applyZoom();
}
function ensureOverlayIds(){state.overlays.forEach(o=>{if(!o.id)o.id=uid()})}
function drawOverlays(targetCtx,w,h){
  ensureOverlayIds();let source=null;
  if(state.overlays.some(o=>['mosaic','blur','magnify'].includes(o.type))){source=document.createElement('canvas');source.width=w;source.height=h;source.getContext('2d').drawImage(targetCtx.canvas,0,0,w,h)}
  state.overlays.forEach(o=>drawOverlay(targetCtx,o,w,h,source));if(targetCtx===ctx&&state.selectedOverlayId&&!state.compareOriginal)drawOverlaySelection(targetCtx,w,h)
}
function drawPerspectiveGuide(c,w,h){const pts=state.perspectivePoints;if(!pts)return;c.save();c.strokeStyle='#0B63CE';c.fillStyle='#fff';c.lineWidth=Math.max(3,Math.min(w,h)*.005);c.setLineDash([10,7]);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x*w,p.y*h):c.moveTo(p.x*w,p.y*h));c.closePath();c.stroke();c.setLineDash([]);pts.forEach((p,i)=>{const x=p.x*w,y=p.y*h,r=Math.max(10,Math.min(w,h)*.018);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#0B63CE';c.font=`900 ${Math.max(12,r*.85)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),x,y+1);c.fillStyle='#fff'});c.restore()}
function px(n,w,h){return n*Math.min(w,h)}
function drawOverlay(c,o,w,h,sourceCanvas=null){
  c.save();const center=overlayCenter(o,w,h);if(o.rotation&&isRotatableOverlay(o)){c.translate(center.x*w,center.y*h);c.rotate(o.rotation*Math.PI/180);c.translate(-center.x*w,-center.y*h)}
  c.lineCap='round';c.lineJoin='round';const color=o.color||'#E22636';c.strokeStyle=color;c.fillStyle=color;c.lineWidth=px(o.lineWidth||.006,w,h);c.globalAlpha=(o.opacity??100)/100;const dash=o.lineStyle==='dash'?[14,9]:o.lineStyle==='dot'?[3,8]:o.lineStyle==='chain'?[18,7,3,7]:[];c.setLineDash(dash.map(v=>Math.max(1,px(v/1000,w,h))));
  const X=v=>v*w,Y=v=>v*h;
  if(o.type==='rect'){c.strokeRect(X(o.x),Y(o.y),X(o.w),Y(o.h))}
  else if(o.type==='circle'){c.beginPath();c.ellipse(X(o.x+o.w/2),Y(o.y+o.h/2),Math.abs(X(o.w/2)),Math.abs(Y(o.h/2)),0,0,Math.PI*2);c.stroke()}
  else if(o.type==='arrow'||o.type==='line'){drawArrow(c,X(o.x1),Y(o.y1),X(o.x2),Y(o.y2),o.type==='arrow',false,px(.025,w,h))}
  else if(o.type==='dimension'){
    const x1=X(o.x1),y1=Y(o.y1),x2=X(o.x2),y2=Y(o.y2);drawArrow(c,x1,y1,x2,y2,true,true,px(.024,w,h));
    const mx=(x1+x2)/2,my=(y1+y2)/2;const font=Math.max(16,px(o.fontSize||.04,w,h));c.font=`900 ${font}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='center';c.textBaseline='middle';const text=o.text||'';const tw=c.measureText(text).width;c.fillStyle='rgba(255,255,255,.92)';roundRect(c,mx-tw/2-8,my-font*.62,tw+16,font*1.24,7);c.fill();c.fillStyle=color;c.fillText(text,mx,my)
  }
  else if(['text','date','label'].includes(o.type)){
    const font=Math.max(17,px(o.fontSize||.045,w,h));c.font=`900 ${font}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='left';c.textBaseline='top';const text=o.text||'';
    if(o.type==='label'){const tw=c.measureText(text).width;c.fillStyle=o.background||'#0B63CE';roundRect(c,X(o.x)-8,Y(o.y)-6,tw+16,font*1.45,9);c.fill();c.fillStyle='#fff';c.fillText(text,X(o.x),Y(o.y))}
    else{c.lineWidth=Math.max(2,font*.12);c.strokeStyle='rgba(255,255,255,.92)';c.strokeText(text,X(o.x),Y(o.y));c.fillStyle=color;c.fillText(text,X(o.x),Y(o.y))}
  }
  else if(o.type==='textbox'){
    const x=X(o.x),y=Y(o.y),bw=X(o.w),bh=Y(o.h),font=Math.max(16,px(o.fontSize||.038,w,h));
    c.globalAlpha=(o.fillOpacity??75)/100;c.fillStyle=o.background||'#0B63CE';roundRect(c,x,y,bw,bh,Math.max(8,px(.012,w,h)));c.fill();
    c.globalAlpha=(o.opacity??100)/100;c.strokeStyle=color;c.stroke();c.fillStyle=o.textColor||'#fff';c.font=`800 ${font}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='left';c.textBaseline='top';drawWrappedText(c,o.text||'',x+font*.55,y+font*.42,bw-font*1.1,bh-font*.8,font*1.3)
  }
  else if(o.type==='angle'){
    const cx=X(o.cx),cy=Y(o.cy),x1=X(o.x1),y1=Y(o.y1),x2=X(o.x2),y2=Y(o.y2),a1=Math.atan2(y1-cy,x1-cx),a2=Math.atan2(y2-cy,x2-cx),r=Math.min(Math.hypot(x1-cx,y1-cy),Math.hypot(x2-cx,y2-cy))*.42;
    c.beginPath();c.moveTo(cx,cy);c.lineTo(x1,y1);c.moveTo(cx,cy);c.lineTo(x2,y2);c.stroke();let start=a1,end=a2;while(end<start)end+=Math.PI*2;if(end-start>Math.PI){[start,end]=[a2,a1+Math.PI*2]};c.beginPath();c.arc(cx,cy,r,start,end);c.stroke();let deg=Math.abs((a2-a1)*180/Math.PI);if(deg>180)deg=360-deg;const mid=start+(end-start)/2,tx=cx+Math.cos(mid)*(r+px(.035,w,h)),ty=cy+Math.sin(mid)*(r+px(.035,w,h));const font=Math.max(16,px(o.fontSize||.035,w,h));c.font=`900 ${font}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(o.text||`${Math.round(deg)}°`,tx,ty)
  }
  else if(o.type==='number'){const r=px(o.radius||.036,w,h);c.beginPath();c.arc(X(o.x),Y(o.y),r,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font=`950 ${r*1.15}px ${getComputedStyle(document.body).fontFamily}`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(o.value),X(o.x),Y(o.y)+1)}
  else if(o.type==='freehand'){c.beginPath();o.points.forEach((p,i)=>i?c.lineTo(X(p.x),Y(p.y)):c.moveTo(X(p.x),Y(p.y)));c.globalAlpha=o.marker?.45:1;c.lineWidth=px(o.marker?.025:o.lineWidth||.006,w,h);c.stroke()}
  else if(o.type==='erase'){c.save();c.globalCompositeOperation='destination-out';c.beginPath();o.points.forEach((p,i)=>i?c.lineTo(X(p.x),Y(p.y)):c.moveTo(X(p.x),Y(p.y)));c.lineWidth=px(o.lineWidth||.04,w,h);c.strokeStyle='rgba(0,0,0,1)';c.stroke();c.restore()}
  else if(o.type==='cover'){c.fillStyle=o.color||'#111';c.fillRect(X(o.x),Y(o.y),X(o.w),Y(o.h))}
  else if(o.type==='mosaic'||o.type==='blur'){
    const sx=Math.round(X(o.x)),sy=Math.round(Y(o.y)),sw=Math.max(1,Math.round(X(o.w))),sh=Math.max(1,Math.round(Y(o.h)));
    try{const source=sourceCanvas||c.canvas,temp=document.createElement('canvas');temp.width=sw;temp.height=sh;const tc=temp.getContext('2d');tc.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);if(o.type==='mosaic'){const scale=Math.max(6,Math.round(Math.min(sw,sh)/16));const small=document.createElement('canvas');small.width=Math.max(1,Math.round(sw/scale));small.height=Math.max(1,Math.round(sh/scale));const sc=small.getContext('2d');sc.imageSmoothingEnabled=false;sc.drawImage(temp,0,0,small.width,small.height);c.imageSmoothingEnabled=false;c.drawImage(small,0,0,small.width,small.height,sx,sy,sw,sh);c.imageSmoothingEnabled=true}else{c.save();c.filter=`blur(${Math.max(5,px(.012,w,h))}px)`;c.drawImage(temp,sx,sy);c.restore();c.filter='none'}}catch(e){}
  }
  else if(o.type==='magnify'){
    const source=sourceCanvas||c.canvas,cx=X(o.sourceX),cy=Y(o.sourceY),r=px(o.radius||.11,w,h),lx=X(o.lensX),ly=Y(o.lensY);c.save();c.beginPath();c.arc(lx,ly,r,0,Math.PI*2);c.clip();c.drawImage(source,cx-r/2,cy-r/2,r,r,lx-r,ly-r,r*2,r*2);c.restore();c.beginPath();c.arc(lx,ly,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=px(.008,w,h);c.stroke();c.beginPath();c.moveTo(cx,cy);c.lineTo(lx-r*.7,ly-r*.7);c.stroke()}
  c.restore();
}
function isRotatableOverlay(o){return ['rect','circle','cover','mosaic','blur','textbox','text','date','label','number'].includes(o.type)}
function overlayBounds(o,w=els.canvas.width,h=els.canvas.height){
  if(['rect','circle','cover','mosaic','blur','textbox'].includes(o.type))return {x:o.x,y:o.y,w:o.w,h:o.h};
  if(['arrow','line','dimension'].includes(o.type))return {x:Math.min(o.x1,o.x2),y:Math.min(o.y1,o.y2),w:Math.max(.012,Math.abs(o.x2-o.x1)),h:Math.max(.012,Math.abs(o.y2-o.y1))};
  if(o.type==='angle'){const xs=[o.cx,o.x1,o.x2],ys=[o.cy,o.y1,o.y2];return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(.012,Math.max(...xs)-Math.min(...xs)),h:Math.max(.012,Math.max(...ys)-Math.min(...ys))}}
  if(['text','date','label'].includes(o.type)){const font=px(o.fontSize||.04,w,h),tw=Math.max(font*2,String(o.text||'').length*font*.68);return {x:o.x,y:o.y,w:Math.min(.9,tw/w),h:Math.min(.3,font*1.5/h)}}
  if(o.type==='number'){const r=px(o.radius||.036,w,h);return {x:o.x-r/w,y:o.y-r/h,w:r*2/w,h:r*2/h}}
  if(o.type==='magnify'){const r=px(o.radius||.11,w,h);return {x:o.lensX-r/w,y:o.lensY-r/h,w:r*2/w,h:r*2/h}}
  if((o.type==='freehand'||o.type==='erase')&&o.points?.length){const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(.012,Math.max(...xs)-Math.min(...xs)),h:Math.max(.012,Math.max(...ys)-Math.min(...ys))}}
  return {x:0,y:0,w:.1,h:.1}
}
function overlayCenter(o,w=els.canvas.width,h=els.canvas.height){const b=overlayBounds(o,w,h);return {x:b.x+b.w/2,y:b.y+b.h/2}}
function rotatePoint(p,center,degrees,w=els.canvas.width,h=els.canvas.height){const a=degrees*Math.PI/180,dx=(p.x-center.x)*w,dy=(p.y-center.y)*h;return {x:center.x+(dx*Math.cos(a)-dy*Math.sin(a))/w,y:center.y+(dx*Math.sin(a)+dy*Math.cos(a))/h}}
function inverseOverlayPoint(p,o){return o.rotation&&isRotatableOverlay(o)?rotatePoint(p,overlayCenter(o),-o.rotation):p}
function overlayHandles(o){
  const b=overlayBounds(o),c=overlayCenter(o),handles=[];
  if(['arrow','line','dimension'].includes(o.type))return [{key:'p1',x:o.x1,y:o.y1},{key:'p2',x:o.x2,y:o.y2},{key:'move',x:(o.x1+o.x2)/2,y:(o.y1+o.y2)/2}];
  if(o.type==='angle')return [{key:'center',x:o.cx,y:o.cy},{key:'p1',x:o.x1,y:o.y1},{key:'p2',x:o.x2,y:o.y2}];
  if(o.type==='magnify'){const r=px(o.radius||.11,els.canvas.width,els.canvas.height);return [{key:'source',x:o.sourceX,y:o.sourceY},{key:'move',x:o.lensX,y:o.lensY},{key:'radius',x:o.lensX+r/els.canvas.width,y:o.lensY}]}
  if(o.type==='number'){const r=px(o.radius||.036,els.canvas.width,els.canvas.height);handles.push({key:'move',x:o.x,y:o.y},{key:'scale',x:o.x+r/els.canvas.width,y:o.y})}
  else if(['text','date','label'].includes(o.type))handles.push({key:'move',x:c.x,y:c.y},{key:'scale',x:b.x+b.w,y:b.y+b.h},{key:'rotate',x:c.x,y:b.y-.065});
  else if(['rect','circle','cover','mosaic','blur','textbox'].includes(o.type))handles.push({key:'nw',x:b.x,y:b.y},{key:'ne',x:b.x+b.w,y:b.y},{key:'se',x:b.x+b.w,y:b.y+b.h},{key:'sw',x:b.x,y:b.y+b.h},{key:'move',x:c.x,y:c.y},{key:'rotate',x:c.x,y:b.y-.065});
  else handles.push({key:'move',x:c.x,y:c.y});
  return handles.map(h=>o.rotation&&isRotatableOverlay(o)?{...h,...rotatePoint(h,c,o.rotation)}:h)
}
function drawOverlaySelection(c,w,h){
  const o=state.overlays.find(x=>x.id===state.selectedOverlayId);if(!o)return;const b=overlayBounds(o,w,h),center=overlayCenter(o,w,h),corners=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}].map(p=>o.rotation&&isRotatableOverlay(o)?rotatePoint(p,center,o.rotation,w,h):p);
  c.save();c.strokeStyle='#0b8c89';c.fillStyle='#fff';c.lineWidth=Math.max(3,Math.min(w,h)*.004);c.setLineDash([12,8]);c.beginPath();corners.forEach((p,i)=>i?c.lineTo(p.x*w,p.y*h):c.moveTo(p.x*w,p.y*h));c.closePath();c.stroke();c.setLineDash([]);
  for(const hp of overlayHandles(o)){const x=hp.x*w,y=hp.y*h,r=Math.max(10,Math.min(w,h)*.012);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();if(hp.key==='rotate'){c.fillStyle='#0b8c89';c.beginPath();c.arc(x,y,r*.42,0,Math.PI*2);c.fill();c.fillStyle='#fff'}}c.restore()
}
function screenDistance(a,b){return Math.hypot((a.x-b.x)*els.canvas.clientWidth,(a.y-b.y)*els.canvas.clientHeight)}
function pointSegmentScreenDistance(p,a,b){const ax=a.x*els.canvas.clientWidth,ay=a.y*els.canvas.clientHeight,bx=b.x*els.canvas.clientWidth,by=b.y*els.canvas.clientHeight,pxv=p.x*els.canvas.clientWidth,pyv=p.y*els.canvas.clientHeight,l2=(bx-ax)**2+(by-ay)**2;if(!l2)return Math.hypot(pxv-ax,pyv-ay);const t=Math.max(0,Math.min(1,((pxv-ax)*(bx-ax)+(pyv-ay)*(by-ay))/l2));return Math.hypot(pxv-(ax+t*(bx-ax)),pyv-(ay+t*(by-ay)))}
function hitOverlay(p){
  const selected=state.overlays.find(o=>o.id===state.selectedOverlayId);if(selected){const h=overlayHandles(selected).find(x=>screenDistance(p,x)<=24);if(h)return {overlay:selected,handle:h.key}}
  for(let i=state.overlays.length-1;i>=0;i--){const o=state.overlays[i];if(['arrow','line','dimension'].includes(o.type)&&pointSegmentScreenDistance(p,{x:o.x1,y:o.y1},{x:o.x2,y:o.y2})<=22)return {overlay:o,handle:'move'};if(o.type==='angle'&&(pointSegmentScreenDistance(p,{x:o.cx,y:o.cy},{x:o.x1,y:o.y1})<=22||pointSegmentScreenDistance(p,{x:o.cx,y:o.cy},{x:o.x2,y:o.y2})<=22))return {overlay:o,handle:'move'};const q=inverseOverlayPoint(p,o),b=overlayBounds(o);if(q.x>=b.x-.012&&q.x<=b.x+b.w+.012&&q.y>=b.y-.012&&q.y<=b.y+b.h+.012)return {overlay:o,handle:'move'}}return null
}
function translateOverlay(o,dx,dy){
  for(const k of ['x','x1','x2','cx','sourceX','lensX'])if(Number.isFinite(o[k]))o[k]+=dx;for(const k of ['y','y1','y2','cy','sourceY','lensY'])if(Number.isFinite(o[k]))o[k]+=dy;if(o.points)o.points.forEach(p=>{p.x+=dx;p.y+=dy})
}
function updateAngleText(o){const a1=Math.atan2(o.y1-o.cy,o.x1-o.cx),a2=Math.atan2(o.y2-o.cy,o.x2-o.cx);let d=Math.abs((a2-a1)*180/Math.PI);if(d>180)d=360-d;o.text=`${Math.round(d)}°`}
function updateSelectionUi(){
  const o=state.overlays.find(x=>x.id===state.selectedOverlayId);if(!o){if(!state.activeTool)els.currentTool.textContent='選択・移動';els.applyTool.hidden=true;return}
  els.currentTool.textContent=`選択中：${overlayTypeLabel(o.type)}`;els.applyTool.hidden=false;els.applyTool.textContent='色・文字・順序';els.applyTool.onclick=openOverlayProperties
}
function overlayTypeLabel(type){return ({rect:'四角',circle:'円',arrow:'矢印',line:'線',dimension:'寸法',angle:'角度',text:'文字',date:'日付',label:'ラベル',textbox:'文字枠',number:'番号',freehand:'手書き',erase:'透明化',mosaic:'モザイク',blur:'ぼかし',cover:'塗りつぶし',magnify:'部分拡大'})[type]||type}
function propertyAction(action,message){const before=pendingSnapshot||cloneSerializable();pendingSnapshot=null;state.history.push(before);state.future=[];action();closeSheet(false);updateHistoryButtons();updateSelectionUi();render();showToast(message)}
function openOverlayProperties(){
  const o=state.overlays.find(x=>x.id===state.selectedOverlayId);if(!o)return;beginPreviewChange();const hasText=['text','date','label','textbox','dimension','angle'].includes(o.type),isNumber=o.type==='number';
  openSheet('選択項目を編集',`${overlayTypeLabel(o.type)}の内容と見た目を調整します。`,`${hasText?`<label class="control-group"><strong>文字</strong><input id="propertyText" class="inline-input" maxlength="240" value="${escapeHtml(o.text||'')}"></label>`:''}${isNumber?`<label class="control-group"><strong>番号</strong><input id="propertyNumber" class="inline-input" type="number" min="0" value="${Number(o.value)||0}"></label>`:''}<label class="control-group"><strong>色</strong><input id="propertyColor" type="color" value="${/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:'#E22636'}"></label>${rangeControl('透明度','propertyOpacity',o.opacity??100,5,100,1,'%')}${rangeControl('線の太さ','propertyWidth',Math.max(1,Math.round((o.lineWidth||.006)*1000)),1,30,1,'')}<label class="control-group"><strong>線種</strong><select id="propertyLineStyle" class="inline-input"><option value="solid">実線</option><option value="dash">破線</option><option value="dot">点線</option><option value="chain">一点鎖線</option></select></label><div class="button-row property-action-row"><button id="propertyDuplicate" class="choice-button" type="button">複製</button><button id="propertyFront" class="choice-button" type="button">一番前へ</button><button id="propertyBack" class="choice-button" type="button">一番後ろへ</button><button id="propertyDelete" class="choice-button danger-choice" type="button">削除</button></div><button id="propertyApply" class="sheet-primary" type="button">決定</button>`,'配置後の編集');
  const live=()=>{if($('#propertyText'))o.text=$('#propertyText').value;if($('#propertyNumber'))o.value=Number($('#propertyNumber').value)||0;o.color=$('#propertyColor').value;if(o.type==='label')o.background=o.color;o.opacity=Number($('#propertyOpacityRange').value);o.lineWidth=Number($('#propertyWidthRange').value)/1000;o.lineStyle=$('#propertyLineStyle').value;if(o.type==='angle')updateAngleText(o);render()};
  $('#propertyLineStyle').value=o.lineStyle||'solid';['propertyText','propertyNumber','propertyColor','propertyOpacityRange','propertyWidthRange','propertyLineStyle'].forEach(id=>{const el=$(`#${id}`);if(el)el.oninput=()=>{const out=el.nextElementSibling;if(out&&el.type==='range')out.textContent=`${el.value}${id==='propertyOpacityRange'?'%':''}`;live()}});
  $('#propertyApply').onclick=()=>{live();commitPreviewChange('選択項目を更新しました');updateSelectionUi()};
  $('#propertyDuplicate').onclick=()=>propertyAction(()=>{const n=JSON.parse(JSON.stringify(o));n.id=uid();translateOverlay(n,.025,.025);state.overlays.push(n);state.selectedOverlayId=n.id},'複製しました');
  $('#propertyFront').onclick=()=>propertyAction(()=>{state.overlays=state.overlays.filter(x=>x!==o);state.overlays.push(o)},'一番前へ移動しました');
  $('#propertyBack').onclick=()=>propertyAction(()=>{state.overlays=state.overlays.filter(x=>x!==o);state.overlays.unshift(o)},'一番後ろへ移動しました');
  $('#propertyDelete').onclick=()=>propertyAction(()=>{state.overlays=state.overlays.filter(x=>x!==o);state.selectedOverlayId=null},'削除しました')
}
function drawArrow(c,x1,y1,x2,y2,headEnd=true,headStart=false,headSize=18){
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();const angle=Math.atan2(y2-y1,x2-x1);if(headEnd)arrowHead(c,x2,y2,angle,headSize);if(headStart)arrowHead(c,x1,y1,angle+Math.PI,headSize)
}
function arrowHead(c,x,y,a,s){c.beginPath();c.moveTo(x,y);c.lineTo(x-s*Math.cos(a-.55),y-s*Math.sin(a-.55));c.moveTo(x,y);c.lineTo(x-s*Math.cos(a+.55),y-s*Math.sin(a+.55));c.stroke()}
function roundRect(c,x,y,w,h,r){const rr=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath()}
function drawWrappedText(c,text,x,y,maxW,maxH,lineH){const chars=[...String(text)],lines=[];let line='';for(const ch of chars){if(ch==='\n'){lines.push(line);line='';continue}const t=line+ch;if(c.measureText(t).width>maxW&&line){lines.push(line);line=ch}else line=t}if(line)lines.push(line);for(let i=0;i<lines.length;i++){const yy=y+i*lineH;if(yy+lineH>y+maxH)break;c.fillText(lines[i],x,yy)}}

function applyZoom(){const z=state.zoom/100;els.canvas.style.width=`${els.canvas.width*z}px`;els.canvas.style.height=`${els.canvas.height*z}px`;els.zoomRange.value=state.zoom;els.zoomLabel.textContent=`${state.zoom}%`}
function fitCanvasToStage(){if(!state.image)return;const availableW=Math.max(40,els.stage.clientWidth-30),availableH=Math.max(40,els.stage.clientHeight-30),z=Math.min(1,availableW/els.canvas.width,availableH/els.canvas.height);state.zoom=Math.max(5,Math.min(100,Math.round(z*100)));applyZoom()}

function openTool(id){
  if(!state.image)return;cancelActiveTool(false);$$('.tool-button').forEach(b=>b.classList.toggle('is-active',b.dataset.tool===id));
  const handlers={horizontal:sheetHorizontal,crop:sheetCrop,rotate:rotate90,color:sheetColor,filter:sheetFilter,perspective:sheetPerspective,size:sheetSize,upscale:sheetUpscale,date:sheetDate,shape:sheetShape,text:sheetText,textbox:sheetTextBox,label:sheetLabel,dimension:sheetDimension,angle:sheetAngle,number:activateNumber,draw:sheetDraw,magnify:activateMagnify,hide:sheetHide,erase:sheetErase,bgselect:sheetBgSelect,compare:sheetCompare,blur:sheetShadow};
  handlers[id]?.();
}
function setCurrentTool(label,activeTool=null,hint='',action=null,actionLabel='実行'){state.activeTool=activeTool;els.currentTool.textContent=label;els.cancelTool.hidden=!activeTool;els.applyTool.hidden=!action;els.applyTool.textContent=actionLabel;els.applyTool.onclick=action||null;els.toolHint.hidden=!hint;els.toolHint.textContent=hint;els.canvas.style.cursor=activeTool?'crosshair':'default'}
function cancelActiveTool(resetButtons=true){state.activeTool=null;state.drawMode=null;state.drawStart=null;state.freePath=null;state.pendingDimension=null;state.perspectivePoints=null;state.perspectiveDragging=-1;state.pendingAngle=null;state.previewOverlay=null;if(state.bgTimer){clearTimeout(state.bgTimer);state.bgTimer=null};els.cancelTool.hidden=true;els.toolHint.hidden=true;els.canvas.style.cursor='default';if(resetButtons)$$('.tool-button').forEach(b=>b.classList.remove('is-active'));updateSelectionUi();render()}
function openSheet(title,description,html,eyebrow='写真加工'){
  els.sheetTitle.textContent=title;els.sheetDescription.textContent=description;els.sheetEyebrow.textContent=eyebrow;els.sheetContent.innerHTML=html;els.sheetBackdrop.hidden=false;els.sheet.hidden=false;requestAnimationFrame(()=>els.sheet.scrollTop=0)
}
function beginPreviewChange(){pendingSnapshot=cloneSerializable()}
function closeSheet(revert=true){
  if(revert&&pendingSnapshot){const selected=state.selectedOverlayId;assignSerializable(pendingSnapshot);if(state.overlays.some(o=>o.id===selected))state.selectedOverlayId=selected;syncOutputControls();render()}
  pendingSnapshot=null;els.sheet.hidden=true;els.sheetBackdrop.hidden=true;els.sheetBackdrop.classList.remove('crop-pass-through');
  if(state.activeTool==='cropPan'){state.activeTool=null;state.cropPointers.clear();state.cropGesture=null;updateSelectionUi()}
}
function commitPreviewChange(message=''){
  if(pendingSnapshot){state.history.push(pendingSnapshot);if(state.history.length>40)state.history.shift();state.future=[]}
  pendingSnapshot=null;closeSheet(false);state.edgeMapDirty=true;updateHistoryButtons();render();if(message)showToast(message)
}
function commitSheetChange(){checkpoint();closeSheet(false);state.edgeMapDirty=true;render()}

function sheetHorizontal(){
  beginPreviewChange();openSheet('水平調整','写真の線にグリッドを合わせます。自動は強い水平線から傾きを推定します。',`
  <div class="control-group"><label><span>傾き</span><b class="control-value" id="angleValue">${state.angle.toFixed(1)}°</b></label><input id="angleRange" type="range" min="-10" max="10" step="0.1" value="${state.angle}"></div>
  <div class="button-row"><button class="choice-button" id="autoHorizon" type="button">自動検出</button><button class="choice-button" id="angleMinus" type="button">−0.1°</button><button class="choice-button" id="anglePlus" type="button">＋0.1°</button><button class="choice-button" id="angleReset" type="button">0°</button></div>
  <button class="sheet-primary" id="applyHorizontal" type="button">この傾きで決定</button>`);
  const range=$('#angleRange'),value=$('#angleValue');const update=v=>{state.angle=Number(v);range.value=state.angle;value.textContent=`${state.angle.toFixed(1)}°`;state.edgeMapDirty=true;render()};
  range.oninput=e=>update(e.target.value);$('#angleMinus').onclick=()=>update(state.angle-.1);$('#anglePlus').onclick=()=>update(state.angle+.1);$('#angleReset').onclick=()=>update(0);$('#autoHorizon').onclick=async()=>{showToast('水平線を確認しています');const est=await estimateHorizonAngle();update(est);showToast(`推定 ${est.toFixed(1)}°`)};$('#applyHorizontal').onclick=()=>commitPreviewChange('水平を調整しました')
}
function sheetCrop(){
  beginPreviewChange();const ratios=[['original','元写真','全体'],['free','自由','比率調整'],['1:1','1：1','正方形'],['4:3','4：3','横'],['3:4','3：4','縦'],['16:9','16：9','横長'],['9:16','9：16','縦長']];
  openSheet('切り抜き','枠の中で写真をドラッグし、2本指またはスライダーで拡大します。保存結果と同じ範囲が表示されます。',`<div class="preset-grid crop-ratio-grid">${ratios.map(([v,l,s])=>`<button class="preset-button ${state.cropRatio===v?'is-selected':''}" data-ratio="${v}" type="button"><strong>${l}</strong><small>${s}</small></button>`).join('')}</div>${rangeControl('拡大','cropZoom',Math.round((state.cropZoom||1)*100),100,400,1,'%')}<div id="freeAspectControl" ${state.cropRatio==='free'?'':'hidden'}>${rangeControl('自由比率（横÷縦）','freeAspect',Math.round((state.freeCropAspect||1)*100),20,500,1,'%')}</div><div class="button-row"><button class="choice-button" id="flipCrop" type="button">縦横を入れ替え</button><button class="choice-button" id="resetCrop" type="button">切り抜きをリセット</button></div><button class="sheet-primary" id="applyCrop" type="button">この範囲で決定</button>`);
  els.sheetBackdrop.classList.add('crop-pass-through');state.activeTool='cropPan';state.cropPointers.clear();state.cropGesture=null;els.currentTool.textContent='切り抜き：写真を動かす';els.cancelTool.hidden=true;els.applyTool.hidden=true;
  const refreshCropUi=()=>{$$('[data-ratio]',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x.dataset.ratio===state.cropRatio));$('#freeAspectControl').hidden=state.cropRatio!=='free';render();setTimeout(fitCanvasToStage,20)};
  $$('[data-ratio]',els.sheetContent).forEach(b=>b.onclick=()=>{state.cropRatio=b.dataset.ratio;if(state.cropRatio==='original'){state.cropZoom=1;state.cropX=0;state.cropY=0}refreshCropUi()});
  const zoom=$('#cropZoomRange'),zoomValue=$('#cropZoomValue');zoom.oninput=e=>{state.cropZoom=Math.max(1,Number(e.target.value)/100);zoomValue.textContent=`${e.target.value}%`;render()};
  const aspect=$('#freeAspectRange'),aspectValue=$('#freeAspectValue');aspect.oninput=e=>{state.freeCropAspect=Math.max(.2,Number(e.target.value)/100);aspectValue.textContent=`${e.target.value}%`;render();setTimeout(fitCanvasToStage,20)};
  $('#flipCrop').onclick=()=>{if(state.cropRatio.includes(':')){const [a,b]=state.cropRatio.split(':');state.cropRatio=`${b}:${a}`}else if(state.cropRatio==='free')state.freeCropAspect=1/state.freeCropAspect;else{const [ow,oh]=orientedWorkingSize();state.cropRatio='free';state.freeCropAspect=oh/ow}aspect.value=Math.round(state.freeCropAspect*100);aspectValue.textContent=`${aspect.value}%`;refreshCropUi()};
  $('#resetCrop').onclick=()=>{state.cropRatio='original';state.cropZoom=1;state.cropX=0;state.cropY=0;zoom.value=100;zoomValue.textContent='100%';refreshCropUi()};
  $('#applyCrop').onclick=()=>{commitPreviewChange('切り抜きを反映しました');fitCanvasToStage()}
}
function rotate90(){checkpoint();state.rotation=(state.rotation+90)%360;state.cropX=0;state.cropY=0;state.edgeMapDirty=true;render();setTimeout(fitCanvasToStage,20);showToast('90°回転しました')}
function sheetColor(){
  beginPreviewChange();const a=state.adjustments;openSheet('色調整','写真を見ながら、必要な項目だけ動かします。',`
  ${rangeControl('明るさ','brightness',a.brightness,50,150,1,'%')}${rangeControl('コントラスト','contrast',a.contrast,50,160,1,'%')}${rangeControl('彩度','saturation',a.saturation,0,180,1,'%')}${rangeControl('色温度','warmth',a.warmth,-50,50,1,'')}
  <div class="button-row"><button class="choice-button" id="autoColor" type="button">自然に補正</button><button class="choice-button" id="resetColor" type="button">初期値</button></div><button class="sheet-primary" id="applyColor" type="button">決定</button>`);
  const sync=()=>{for(const k of ['brightness','contrast','saturation','warmth']){const input=$(`#${k}Range`),value=$(`#${k}Value`);input.value=state.adjustments[k];value.textContent=`${state.adjustments[k]}${k==='warmth'?'':'%'}`}state.edgeMapDirty=true;render()};
  ['brightness','contrast','saturation','warmth'].forEach(k=>{const input=$(`#${k}Range`),value=$(`#${k}Value`);input.oninput=e=>{state.adjustments[k]=Number(e.target.value);value.textContent=`${e.target.value}${k==='warmth'?'': '%'}`;state.edgeMapDirty=true;render()}});$('#autoColor').onclick=()=>{state.adjustments={brightness:106,contrast:108,saturation:106,warmth:0};sync()};$('#resetColor').onclick=()=>{state.adjustments={brightness:100,contrast:100,saturation:100,warmth:0};sync()};$('#applyColor').onclick=()=>commitPreviewChange('色調整を反映しました')
}
function rangeControl(label,id,value,min,max,step,suffix){return `<div class="control-group"><label><span>${label}</span><b class="control-value" id="${id}Value">${value}${suffix}</b></label><input id="${id}Range" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`}
function sheetFilter(){
  beginPreviewChange();const presets=[['standard','標準','加工なし'],['bright','明るめ','少し明るく'],['clear','くっきり','輪郭を強調'],['warm','暖色','温かい色'],['cool','寒色','青寄り'],['mono','白黒','モノクロ'],['document','書類向け','文字を見やすく'],['vivid','鮮やか','色を強める']];openSheet('フィルター','プレビューを見ながら1つ選びます。',`<div class="preset-grid">${presets.map(([v,l,s])=>`<button class="preset-button ${state.filterPreset===v?'is-selected':''}" data-filter="${v}" type="button"><strong>${l}</strong><small>${s}</small></button>`).join('')}</div><button class="sheet-primary" id="applyFilter" type="button">決定</button>`);
  $$('.preset-button',els.sheetContent).forEach(b=>b.onclick=()=>{state.filterPreset=b.dataset.filter;$$('.preset-button',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x===b));state.edgeMapDirty=true;render()});$('#applyFilter').onclick=()=>commitPreviewChange('フィルターを反映しました')
}
function sheetPerspective(){openSheet('台形補正','斜めから撮った銘板・書類・操作盤を、四隅を指定して正面の形に整えます。',`<p class="perspective-guide-note">青い1〜4の点を、対象物の左上・右上・右下・左下に合わせます。AIや自動認識は使用しません。</p><button class="sheet-primary" id="startPerspective" type="button">四隅を合わせる</button>`);$('#startPerspective').onclick=()=>{closeSheet();state.perspectivePoints=[{x:.07,y:.07},{x:.93,y:.07},{x:.93,y:.93},{x:.07,y:.93}];setCurrentTool('台形補正：四隅を調整','perspective','青い点を対象の四隅へ動かしてください',applyPerspectiveCorrection,'補正する');render()}}
function currentEditedLongEdge(){const [w,h]=getCanvasDimensions();return Math.max(w,h)}
function outputLongEdge(){if(state.outputMode==='original')return Math.max(state.originalWidth,state.originalHeight);if(state.outputMode==='current')return currentEditedLongEdge();return Math.max(320,Number(state.outputLongEdge)||1920)}
function syncOutputControls(){
  if(!els.saveSize)return;const fixed=['1280','1920','3840'].includes(String(state.outputLongEdge))&&state.outputMode==='fixed';els.saveSize.value=state.outputMode==='original'?'original':state.outputMode==='current'?'current':fixed?String(state.outputLongEdge):'custom';els.saveCustomRow.hidden=els.saveSize.value!=='custom';els.saveCustomLongEdge.value=Math.round(state.outputLongEdge||1920)
}
function sheetSize(){
  openSheet('画像サイズ','保存時の長辺をここと保存画面で共通使用します。縦横比は維持されます。',`<div class="preset-grid">${[['original','元写真',`${Math.max(state.originalWidth,state.originalHeight)}px`],['3840','大','3840px'],['1920','標準','1920px'],['1280','小','1280px'],['current','編集サイズ',`${currentEditedLongEdge()}px`]].map(([v,l,s])=>`<button class="preset-button" data-size="${v}" type="button"><strong>${l}</strong><small>${s}</small></button>`).join('')}</div><div class="control-group"><label><span>長辺を直接入力</span></label><input id="customLongEdge" class="inline-input" type="number" min="320" max="12000" value="${outputLongEdge()}"></div><button class="sheet-primary" id="applySize" type="button">保存サイズに設定</button>`);
  $$('.preset-button',els.sheetContent).forEach(b=>b.onclick=()=>{const v=b.dataset.size;if(v==='original'){state.outputMode='original';state.outputLongEdge=Math.max(state.originalWidth,state.originalHeight)}else if(v==='current'){state.outputMode='current';state.outputLongEdge=currentEditedLongEdge()}else{state.outputMode='fixed';state.outputLongEdge=Number(v)}$('#customLongEdge').value=outputLongEdge();$$('.preset-button',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x===b))});
  $('#customLongEdge').oninput=()=>{state.outputMode='custom';state.outputLongEdge=Math.max(320,Number($('#customLongEdge').value)||1920);$$('.preset-button',els.sheetContent).forEach(x=>x.classList.remove('is-selected'))};
  $('#applySize').onclick=()=>{if(state.outputMode==='custom')state.outputLongEdge=Math.max(320,Number($('#customLongEdge').value)||1920);syncOutputControls();closeSheet(false);showToast(`長辺 ${outputLongEdge()}px で保存します`)}
}
function sheetUpscale(){const base=currentEditedLongEdge();openSheet('高解像度で拡大','AI生成は使わず、通常の補間処理で拡大します。元にない細部は生成しません。',`<div class="preset-grid">${[[1,'1倍'],[2,'2倍'],[4,'4倍']].map(([v,l])=>`<button class="preset-button" data-scale="${v}" type="button"><strong>${l}</strong><small>長辺 ${Math.min(12000,base*v)}px</small></button>`).join('')}</div>`);$$('[data-scale]',els.sheetContent).forEach(b=>b.onclick=()=>{state.outputMode='custom';state.outputLongEdge=Math.min(12000,base*Number(b.dataset.scale));syncOutputControls();closeSheet(false);showToast(`長辺 ${state.outputLongEdge}px で保存します`)})}
function sheetDate(){const today=new Date();const formats=[['dot',formatDate(today,'dot')],['slash',formatDate(today,'slash')],['jp',formatDate(today,'jp')],['short',formatDate(today,'short')]];openSheet('日付','形式を選び、「写真に入れる」を押します。配置後は指で動かせます。',`<div class="preset-grid">${formats.map(([v,l],i)=>`<button class="preset-button ${i===0?'is-selected':''}" data-date="${escapeHtml(l)}" type="button"><strong>${escapeHtml(l)}</strong><small>日付形式</small></button>`).join('')}</div><div class="button-row">${colorButtons()}</div><button class="sheet-primary" id="insertDate" type="button">写真に入れる</button>`);let selected=formats[0][1],color='#E22636';$$('.preset-button',els.sheetContent).forEach(b=>b.onclick=()=>{selected=b.dataset.date;$$('.preset-button',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x===b))});bindColorChoices(c=>color=c);$('#insertDate').onclick=()=>{checkpoint();state.overlays.push({type:'date',text:selected,x:.68,y:.9,color,fontSize:.035});closeSheet();render();showToast('日付を入れました')}}
function colorButtons(){return ['#E22636','#0B63CE','#111111','#FFFFFF'].map((c,i)=>`<button class="choice-button color-choice ${i===0?'is-selected':''}" type="button" data-color="${c}" style="color:${c};${c==='#FFFFFF'?'background:#6B7787':''}">●</button>`).join('')}
function bindColorChoices(callback){$$('.color-choice',els.sheetContent).forEach(b=>b.onclick=()=>{$$('.color-choice',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x===b));callback(b.dataset.color)})}
function sheetShape(){openSheet('図形','図形を選び、色・線種・透明度を設定して写真上を指でなぞります。',`<div class="preset-grid"><button class="preset-button" data-shape="circle" type="button"><strong>○ 円</strong><small>囲む</small></button><button class="preset-button" data-shape="rect" type="button"><strong>□ 四角</strong><small>囲む</small></button><button class="preset-button" data-shape="arrow" type="button"><strong>→ 矢印</strong><small>指す</small></button><button class="preset-button" data-shape="line" type="button"><strong>― 線</strong><small>結ぶ</small></button></div><div class="button-row">${colorButtons()}</div><label class="control-group"><strong>線種</strong><select id="shapeLineStyle" class="inline-input"><option value="solid">実線</option><option value="dash">破線</option><option value="dot">点線</option><option value="chain">一点鎖線</option></select></label>${rangeControl('透明度','shapeOpacity',100,10,100,1,'%')}`);let color='#E22636';bindColorChoices(c=>color=c);$$('[data-shape]',els.sheetContent).forEach(b=>b.onclick=()=>{closeSheet();state.drawMode=b.dataset.shape;state.drawColor=color;state.drawLineStyle=$('#shapeLineStyle')?.value||'solid';state.drawOpacity=Number($('#shapeOpacityRange')?.value||100);setCurrentTool(`図形：${b.textContent.trim()}`,b.dataset.shape,'始点から終点まで指でなぞってください')})}
function sheetText(){openSheet('文字','写真に入れたい文字を入力します。',`<input id="textInput" class="inline-input" maxlength="80" placeholder="例：交換が必要"><div class="button-row">${colorButtons()}</div><button class="sheet-primary" id="insertText" type="button">写真に入れる</button>`);let color='#E22636';bindColorChoices(c=>color=c);$('#insertText').onclick=()=>{const text=$('#textInput').value.trim();if(!text){showToast('文字を入力してください');return}checkpoint();state.overlays.push({type:'text',text,x:.08,y:.08,color,fontSize:.045});closeSheet();render();showToast('文字を入れました')}}
function sheetTextBox(){openSheet('四角の中に文字','文字と背景色・透明度を設定し、写真上を指でなぞって枠を作ります。',`<textarea id="textBoxInput" class="inline-input" maxlength="240" rows="4" placeholder="説明を入力"></textarea><label class="control-group"><strong>背景色</strong><input id="textBoxBg" type="color" value="#0B63CE"></label><label class="control-group"><strong>文字色</strong><input id="textBoxColor" type="color" value="#FFFFFF"></label>${rangeControl('背景の透明度','textBoxOpacity',75,10,100,1,'%')}<button class="sheet-primary" id="startTextBox" type="button">枠を配置する</button>`);$('#startTextBox').onclick=()=>{const text=$('#textBoxInput').value.trim();if(!text){showToast('文字を入力してください');return}state.textBoxText=text;state.textBoxBackground=$('#textBoxBg').value;state.textBoxTextColor=$('#textBoxColor').value;state.drawOpacity=Number($('#textBoxOpacityRange').value);closeSheet();setCurrentTool('文字枠','textbox','枠の左上から右下まで指でなぞってください')}}
function sheetAngle(){openSheet('角度記入','頂点、1本目の線の先、2本目の線の先を順にタップします。',`<div class="dialog-note">表示される値は写真上の見かけの角度です。正確さが必要な場合は、先に台形補正・正面補正を行ってください。</div><div class="button-row">${colorButtons()}</div><button id="startAngle" class="sheet-primary" type="button">角度を配置する</button>`);let color='#E22636';bindColorChoices(c=>color=c);$('#startAngle').onclick=()=>{state.drawColor=color;state.pendingAngle=[];closeSheet();setCurrentTool('角度：3点を選択','angle','頂点をタップしてください')}}
function sheetBgSelect(){openSheet('長押し背景抜き','消したい背景を長押しすると、近い色がつながる範囲を透明にします。AIは使いません。',`${rangeControl('色の許容範囲','bgSelectThreshold',38,5,120,1,'')}<div class="dialog-note">対象物と背景の色が近い場合は、許容範囲を小さくしてください。透明部分を残すにはPNGで保存します。</div><button id="startBgSelect" class="sheet-primary" type="button">写真上で長押しする</button>`);$('#startBgSelect').onclick=()=>{state.bgThreshold=Number($('#bgSelectThresholdRange').value);els.saveFormat.value='image/png';closeSheet();setCurrentTool('長押し背景抜き','bgselect','消したい色の場所を約0.5秒長押ししてください')}}
function sheetLabel(){
  const labels=['旧品','新品','交換品','故障部品','取外し品','取付品','修理前','修理後','交換前','交換後','要交換','要確認','正常','異常','破損','摩耗','漏れ','清掃前','清掃後'];openSheet('ラベル','上下にグリグリ回して、中央の言葉を選びます。',`<div class="wheel-picker" id="labelWheel">${labels.map(l=>`<button class="wheel-option ${l===state.selectedLabel?'is-current':''}" type="button" data-label="${l}">${l}</button>`).join('')}</div><input id="customLabel" class="inline-input" placeholder="自分の言葉を追加して使う"><button class="sheet-primary" id="insertLabel" type="button">選んだ言葉を入れる</button>`);
  const wheel=$('#labelWheel');let selected=state.selectedLabel;const updateWheel=()=>{const center=wheel.scrollTop+wheel.clientHeight/2;let best=null,dist=Infinity;$$('.wheel-option',wheel).forEach(b=>{const d=Math.abs((b.offsetTop+b.offsetHeight/2)-center);if(d<dist){dist=d;best=b}});if(best){selected=best.dataset.label;$$('.wheel-option',wheel).forEach(x=>x.classList.toggle('is-current',x===best))}};wheel.addEventListener('scroll',()=>requestAnimationFrame(updateWheel));$$('.wheel-option',wheel).forEach(b=>b.onclick=()=>{b.scrollIntoView({block:'center',behavior:'smooth'});selected=b.dataset.label});setTimeout(()=>$('.wheel-option.is-current',wheel)?.scrollIntoView({block:'center'}),50);$('#insertLabel').onclick=()=>{const custom=$('#customLabel').value.trim();if(custom)selected=custom;state.selectedLabel=selected;checkpoint();state.overlays.push({type:'label',text:selected,x:.08,y:.08,background:labelColor(selected),fontSize:.04});closeSheet();render();showToast(`${selected} を入れました`)}}
function labelColor(t){if(/故障|異常|要交換|破損|漏れ/.test(t))return '#B62032';if(/新品|交換品|取付/.test(t))return '#0B63CE';if(/正常|修理後|清掃後/.test(t))return '#147A42';return '#66758A'}
function sheetDimension(){openSheet('寸法','横・縦・自由を選び、写真上の始点と終点をタップします。',`<div class="preset-grid"><button class="preset-button" data-dim="horizontal" type="button"><strong>横寸法</strong><small>水平固定</small></button><button class="preset-button" data-dim="vertical" type="button"><strong>縦寸法</strong><small>垂直固定</small></button><button class="preset-button" data-dim="free" type="button"><strong>自由寸法</strong><small>好きな角度</small></button></div><div class="dialog-note">端点は写真内の強い輪郭、画像端、既存図形の端点へ近づくと吸着します。AIではなく輪郭計算を使用します。</div>`);$$('[data-dim]',els.sheetContent).forEach(b=>b.onclick=async()=>{state.dimensionMode=b.dataset.dim;closeSheet();await buildEdgeMap();setCurrentTool('寸法：2点を選択','dimension','始点をタップしてください')})}
function openDimensionInput(p1,p2){state.pendingDimension={p1,p2};openSheet('寸法を入力','数値と単位を入力してください。',`<div class="button-row"><input id="dimensionValue" class="inline-input" inputmode="decimal" placeholder="例：500" style="flex:1"><select id="dimensionUnit" class="inline-input" style="width:110px"><option>mm</option><option>cm</option><option>m</option></select></div><button class="sheet-primary" id="applyDimension" type="button">寸法を入れる</button>`);$('#applyDimension').onclick=()=>{const val=$('#dimensionValue').value.trim();if(!val){showToast('数値を入力してください');return}checkpoint();state.overlays.push({type:'dimension',x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,text:`${val} ${$('#dimensionUnit').value}`,color:'#E22636',lineWidth:.006,fontSize:.037});state.pendingDimension=null;closeSheet();setCurrentTool('寸法：続けて入力','dimension','次の始点をタップしてください');render()}}
function activateNumber(){setCurrentTool(`番号：次は ${state.numberNext}`,'number','番号を置く場所をタップしてください')}
function sheetDraw(){openSheet('手書き・マーカー','種類を選び、写真上を指でなぞります。',`<div class="preset-grid"><button class="preset-button" data-draw="pen" type="button"><strong>ペン</strong><small>はっきり</small></button><button class="preset-button" data-draw="marker" type="button"><strong>マーカー</strong><small>半透明</small></button></div><div class="button-row">${colorButtons()}</div>`);let color='#E22636';bindColorChoices(c=>color=c);$$('[data-draw]',els.sheetContent).forEach(b=>b.onclick=()=>{state.drawColor=color;state.drawMarker=b.dataset.draw==='marker';closeSheet();setCurrentTool(`手書き：${b.textContent.trim()}`,'freehand','指でなぞってください')})}
function activateMagnify(){setCurrentTool('部分拡大','magnify','拡大したい場所をタップしてください')}
function sheetHide(){openSheet('隠す','方法を選び、隠したい範囲を指でなぞります。',`<div class="preset-grid"><button class="preset-button" data-hide="mosaic" type="button"><strong>モザイク</strong><small>しっかり隠す</small></button><button class="preset-button" data-hide="blur" type="button"><strong>ぼかし</strong><small>自然に隠す</small></button><button class="preset-button" data-hide="cover" type="button"><strong>塗りつぶし</strong><small>完全に覆う</small></button></div>`);$$('[data-hide]',els.sheetContent).forEach(b=>b.onclick=()=>{state.drawMode=b.dataset.hide;closeSheet();setCurrentTool(`隠す：${b.textContent.trim()}`,b.dataset.hide,'隠したい範囲を指でなぞってください')})}
function sheetErase(){openSheet('手動切り抜き','自動認識は使わず、指でなぞった部分を透明にします。失敗した場合は「戻す」で復元できます。',`<div class="brush-row"><button class="preset-button" data-brush="0.018" type="button"><strong>細い</strong><small>境界の調整</small></button><button class="preset-button is-selected" data-brush="0.038" type="button"><strong>標準</strong><small>通常の消去</small></button><button class="preset-button" data-brush="0.075" type="button"><strong>太い</strong><small>広い背景</small></button></div><div class="dialog-note">透明部分を保つ場合はPNGで保存します。JPEGでは透明部分が白になります。</div>`);$$('[data-brush]',els.sheetContent).forEach(b=>b.onclick=()=>{state.eraseBrush=Number(b.dataset.brush);els.saveFormat.value='image/png';closeSheet();setCurrentTool(`手動切り抜き：${b.textContent.trim()}`,'eraser','消したい背景を指でなぞってください')})}
function sheetCompare(){openSheet('2枚比較','現在の写真と、もう1枚の写真を左右または上下にまとめます。',`<label class="control-group"><strong>2枚目の写真</strong><input id="compareFileInput" class="inline-input" type="file" accept="image/*"></label><div class="preset-grid"><button class="preset-button is-selected" data-layout="horizontal" type="button"><strong>左右</strong><small>横に並べる</small></button><button class="preset-button" data-layout="vertical" type="button"><strong>上下</strong><small>縦に並べる</small></button></div><label class="control-group"><strong>表示ラベル</strong><select id="compareLabels" class="inline-input"><option value="旧品|交換品">旧品 ／ 交換品</option><option value="故障品|新品">故障品 ／ 新品</option><option value="修理前|修理後">修理前 ／ 修理後</option><option value="清掃前|清掃後">清掃前 ／ 清掃後</option><option value="取外し前|取付後">取外し前 ／ 取付後</option><option value="写真1|写真2">写真1 ／ 写真2</option></select></label><div class="compare-preview"><span><b>現在の写真</b>1枚目</span><strong>＋</strong><span><b id="compareFileName">未選択</b>2枚目</span></div><button class="sheet-primary" id="applyCompare" type="button" disabled>2枚をまとめる</button>`);let layout='horizontal';const fileInput=$('#compareFileInput'),apply=$('#applyCompare');$$('[data-layout]',els.sheetContent).forEach(b=>b.onclick=()=>{layout=b.dataset.layout;$$('[data-layout]',els.sheetContent).forEach(x=>x.classList.toggle('is-selected',x===b))});fileInput.onchange=()=>{const f=fileInput.files[0];$('#compareFileName').textContent=f?f.name:'未選択';apply.disabled=!f};apply.onclick=async()=>{const file=fileInput.files[0];if(!file)return;apply.disabled=true;apply.textContent='作成中…';try{const labels=$('#compareLabels').value.split('|');await createTwoPhotoComparison(file,layout,labels);closeSheet();showToast('2枚の写真をまとめました')}catch(e){console.error(e);showToast('2枚比較を作成できませんでした')}finally{apply.disabled=false;apply.textContent='2枚をまとめる'}}}
function sheetShadow(){beginPreviewChange();openSheet('影・反射の調整','AIで消すのではなく、ハイライト・影・明るさを手動調整します。',`${rangeControl('影を明るく','brightness',state.adjustments.brightness,70,140,1,'%')}${rangeControl('反射を抑える','contrast',state.adjustments.contrast,70,140,1,'%')}<button class="sheet-primary" id="applyShadow" type="button">決定</button>`);['brightness','contrast'].forEach(k=>{const input=$(`#${k}Range`),value=$(`#${k}Value`);input.oninput=e=>{state.adjustments[k]=Number(e.target.value);value.textContent=`${e.target.value}%`;render()}});$('#applyShadow').onclick=()=>commitPreviewChange('調整を反映しました')}


async function removeBackgroundByColor(p){
  if(!state.image)return;checkpoint(true);const keepOverlays=JSON.parse(JSON.stringify(state.overlays));
  const base=document.createElement('canvas');base.width=els.canvas.width;base.height=els.canvas.height;const bc=base.getContext('2d',{willReadFrequently:true});drawBase(bc,base.width,base.height,false);
  const img=bc.getImageData(0,0,base.width,base.height),data=img.data,w=base.width,h=base.height,x=Math.max(0,Math.min(w-1,Math.floor(p.x*w))),y=Math.max(0,Math.min(h-1,Math.floor(p.y*h))),start=(y*w+x)*4,target=[data[start],data[start+1],data[start+2]],seen=new Uint8Array(w*h),stack=[x,y],thr=Number(state.bgThreshold||38);let count=0;
  while(stack.length){const yy=stack.pop(),xx=stack.pop();if(xx<0||yy<0||xx>=w||yy>=h)continue;const pi=yy*w+xx;if(seen[pi])continue;seen[pi]=1;const i=pi*4,dr=data[i]-target[0],dg=data[i+1]-target[1],db=data[i+2]-target[2];if(Math.sqrt(dr*dr+dg*dg+db*db)>thr)continue;data[i+3]=0;count++;stack.push(xx+1,yy,xx-1,yy,xx,yy+1,xx,yy-1)}
  bc.putImageData(img,0,0);await replaceBaseImage(base.toDataURL('image/png'));state.overlays=keepOverlays;els.saveFormat.value='image/png';render();showToast(`${count.toLocaleString()}画素を透明にしました`)
}


function captureEditorCanvas(){
  const active=state.activeTool,selected=state.selectedOverlayId,compare=state.compareOriginal;
  state.activeTool=null;state.selectedOverlayId=null;state.compareOriginal=false;
  renderNow();
  const copy=document.createElement('canvas');copy.width=els.canvas.width;copy.height=els.canvas.height;copy.getContext('2d').drawImage(els.canvas,0,0);
  state.activeTool=active;state.selectedOverlayId=selected;state.compareOriginal=compare;render();
  return copy;
}
async function replaceBaseImage(dataUrl){
  const img=await loadImage(dataUrl),baseW=img.naturalWidth||img.width,baseH=img.naturalHeight||img.height;state.image=img;state.imageDataUrl=dataUrl;
  const maxEdge=1800,scale=Math.min(1,maxEdge/Math.max(baseW,baseH));state.workingWidth=Math.max(1,Math.round(baseW*scale));state.workingHeight=Math.max(1,Math.round(baseH*scale));
  state.angle=0;state.rotation=0;state.cropRatio='original';state.cropZoom=1;state.cropX=0;state.cropY=0;state.freeCropAspect=state.workingWidth/state.workingHeight;state.adjustments={brightness:100,contrast:100,saturation:100,warmth:0};state.filterPreset='standard';state.overlays=[];state.numberNext=1;state.selectedOverlayId=null;state.edgeMap=null;state.edgeMapDirty=true;state.perspectivePoints=null;state.perspectiveDragging=-1;state.pendingAngle=null;if(state.bgTimer){clearTimeout(state.bgTimer);state.bgTimer=null};
  els.imageInfo.textContent=`${baseW} × ${baseH}px（元写真 ${state.originalWidth} × ${state.originalHeight}px）`;render();setTimeout(fitCanvasToStage,30)
}
function pointDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function polygonArea(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y}return Math.abs(a/2)}
function isConvexQuad(points){let sign=0;for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)<1e-6)return false;const s=Math.sign(cross);if(!sign)sign=s;else if(s!==sign)return false}return true}
function solveLinearSystem(matrix,values){
  const n=values.length,A=matrix.map((row,i)=>[...row,values[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;for(let r=col+1;r<n;r++)if(Math.abs(A[r][col])>Math.abs(A[pivot][col]))pivot=r;
    if(Math.abs(A[pivot][col])<1e-10)throw new Error('変換行列を計算できません');
    [A[col],A[pivot]]=[A[pivot],A[col]];const div=A[col][col];for(let j=col;j<=n;j++)A[col][j]/=div;
    for(let r=0;r<n;r++){if(r===col)continue;const factor=A[r][col];if(!factor)continue;for(let j=col;j<=n;j++)A[r][j]-=factor*A[col][j]}
  }
  return A.map(row=>row[n]);
}
function homographyFromRectangleToQuad(width,height,quad){
  const dest=[[0,0],[width-1,0],[width-1,height-1],[0,height-1]],A=[],b=[];
  for(let i=0;i<4;i++){const [u,v]=dest[i],x=quad[i].x,y=quad[i].y;A.push([u,v,1,0,0,0,-u*x,-v*x]);b.push(x);A.push([0,0,0,u,v,1,-u*y,-v*y]);b.push(y)}
  return solveLinearSystem(A,b);
}
function warpPerspective(source,quad,outW,outH){
  const sw=source.width,sh=source.height,sc=source.getContext('2d',{willReadFrequently:true}),src=sc.getImageData(0,0,sw,sh),out=document.createElement('canvas');out.width=outW;out.height=outH;const oc=out.getContext('2d',{willReadFrequently:true}),dst=oc.createImageData(outW,outH),h=homographyFromRectangleToQuad(outW,outH,quad),sd=src.data,dd=dst.data;
  let di=0;for(let y=0;y<outH;y++){for(let x=0;x<outW;x++,di+=4){const den=h[6]*x+h[7]*y+1;if(Math.abs(den)<1e-9)continue;const sx=(h[0]*x+h[1]*y+h[2])/den,sy=(h[3]*x+h[4]*y+h[5])/den;if(sx<0||sy<0||sx>sw-1||sy>sh-1)continue;const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),tx=sx-x0,ty=sy-y0,i00=(y0*sw+x0)*4,i10=(y0*sw+x1)*4,i01=(y1*sw+x0)*4,i11=(y1*sw+x1)*4;for(let c=0;c<4;c++){const top=sd[i00+c]*(1-tx)+sd[i10+c]*tx,bottom=sd[i01+c]*(1-tx)+sd[i11+c]*tx;dd[di+c]=top*(1-ty)+bottom*ty}}}
  oc.putImageData(dst,0,0);return out;
}
async function applyPerspectiveCorrection(){
  const pts=state.perspectivePoints;if(!pts||pts.length!==4)return;
  if(polygonArea(pts)<.025){showToast('四隅をもう少し広く設定してください');return}
  if(!isConvexQuad(pts)){showToast('四隅が交差しないように並べてください');return}
  const source=captureEditorCanvas(),quad=pts.map(p=>({x:p.x*(source.width-1),y:p.y*(source.height-1)}));
  const top=pointDistance(quad[0],quad[1]),bottom=pointDistance(quad[3],quad[2]),left=pointDistance(quad[0],quad[3]),right=pointDistance(quad[1],quad[2]);let outW=Math.max(64,Math.round((top+bottom)/2)),outH=Math.max(64,Math.round((left+right)/2));const scale=Math.min(1,1800/Math.max(outW,outH));outW=Math.max(64,Math.round(outW*scale));outH=Math.max(64,Math.round(outH*scale));
  checkpoint(true);els.applyTool.disabled=true;els.applyTool.textContent='補正中…';await new Promise(r=>requestAnimationFrame(()=>r()));
  try{const corrected=warpPerspective(source,quad,outW,outH);await replaceBaseImage(corrected.toDataURL('image/png'));cancelActiveTool();showToast('台形補正を反映しました')}catch(e){console.error(e);state.history.pop();updateHistoryButtons();showToast('台形補正を完了できませんでした')}finally{els.applyTool.disabled=false;els.applyTool.textContent='実行'}
}
function drawImageContain(c,image,x,y,w,h){const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,scale=Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;c.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
function drawComparisonPanel(c,image,rect,label){c.save();c.fillStyle='#EEF3F8';c.fillRect(rect.x,rect.y,rect.w,rect.h);c.beginPath();c.rect(rect.x,rect.y,rect.w,rect.h);c.clip();drawImageContain(c,image,rect.x+16,rect.y+62,rect.w-32,rect.h-78);c.restore();c.strokeStyle='#B7C8DA';c.lineWidth=2;c.strokeRect(rect.x,rect.y,rect.w,rect.h);c.font='900 30px system-ui,sans-serif';const tw=c.measureText(label).width;c.fillStyle='#0B3976';roundRect(c,rect.x+18,rect.y+14,tw+30,40,12);c.fill();c.fillStyle='#fff';c.textAlign='left';c.textBaseline='middle';c.fillText(label,rect.x+33,rect.y+34)}
async function createTwoPhotoComparison(file,layout,labels){
  const first=captureEditorCanvas(),second=await loadImage(await fileToDataUrl(file)),out=document.createElement('canvas');if(layout==='vertical'){out.width=1200;out.height=1800}else{out.width=1800;out.height=1100}const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);const margin=28,gap=22;let r1,r2;if(layout==='vertical'){const ph=(out.height-margin*2-gap)/2;r1={x:margin,y:margin,w:out.width-margin*2,h:ph};r2={x:margin,y:margin+ph+gap,w:out.width-margin*2,h:ph}}else{const pw=(out.width-margin*2-gap)/2;r1={x:margin,y:margin,w:pw,h:out.height-margin*2};r2={x:margin+pw+gap,y:margin,w:pw,h:out.height-margin*2}}drawComparisonPanel(c,first,r1,labels[0]||'写真1');drawComparisonPanel(c,second,r2,labels[1]||'写真2');checkpoint(true);await replaceBaseImage(out.toDataURL('image/jpeg',.94));els.saveFormat.value='image/jpeg';
}

function formatDate(d,type){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');if(type==='dot')return `${y}.${m}.${day}`;if(type==='slash')return `${y}/${m}/${day}`;if(type==='jp')return `${y}年${Number(m)}月${Number(day)}日`;if(type==='short')return `${Number(m)}月${Number(day)}日`;if(type==='compact')return `${y}${m}${day}`;return `${y}.${m}.${day}`}

function canvasPoint(event){const r=els.canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height)),clientX:event.clientX,clientY:event.clientY}}
function constrainPoint(start,p,mode){if(mode==='horizontal')return {...p,y:start.y};if(mode==='vertical')return {...p,x:start.x};return p}
async function buildEdgeMap(){
  if(!state.edgeMapDirty&&state.edgeMap)return state.edgeMap;const max=320;const ratio=els.canvas.width/els.canvas.height;let w=ratio>=1?max:Math.round(max*ratio),h=ratio>=1?Math.round(max/ratio):max;w=Math.max(60,w);h=Math.max(60,h);const c=document.createElement('canvas');c.width=w;c.height=h;const cc=c.getContext('2d',{willReadFrequently:true});drawBase(cc,w,h,false);const data=cc.getImageData(0,0,w,h).data;const gray=new Float32Array(w*h);for(let i=0,j=0;i<data.length;i+=4,j++)gray[j]=.299*data[i]+.587*data[i+1]+.114*data[i+2];const mag=new Uint16Array(w*h);const ang=new Int16Array(w*h);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;const gx=-gray[i-w-1]-2*gray[i-1]-gray[i+w-1]+gray[i-w+1]+2*gray[i+1]+gray[i+w+1];const gy=-gray[i-w-1]-2*gray[i-w]-gray[i-w+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1];const m=Math.min(65535,Math.hypot(gx,gy));mag[i]=m;ang[i]=Math.round(Math.atan2(gy,gx)*180/Math.PI)}state.edgeMap={w,h,mag,ang};state.edgeMapDirty=false;return state.edgeMap
}
async function estimateHorizonAngle(){const map=await buildEdgeMap();const bins=new Float64Array(81);for(let y=2;y<map.h-2;y++)for(let x=2;x<map.w-2;x++){const i=y*map.w+x,m=map.mag[i];if(m<110)continue;let edgeAngle=map.ang[i]+90;while(edgeAngle>90)edgeAngle-=180;while(edgeAngle<-90)edgeAngle+=180;if(edgeAngle>=-10&&edgeAngle<=10){const b=Math.round((edgeAngle+10)*4);bins[b]+=m}}let best=40;for(let i=0;i<bins.length;i++)if(bins[i]>bins[best])best=i;const angle=(best/4)-10;return Math.max(-10,Math.min(10,-angle))}
async function snapPoint(p,event=null){
  let best={...p},bestDist=.035,found=false;const targets=[];[0,.5,1].forEach(v=>{targets.push({x:v,y:p.y},{x:p.x,y:v})});state.overlays.forEach(o=>{if(o.x1!=null){targets.push({x:o.x1,y:o.y1},{x:o.x2,y:o.y2})}if(o.x!=null){targets.push({x:o.x,y:o.y});if(o.w!=null)targets.push({x:o.x+o.w,y:o.y+o.h})}});targets.forEach(t=>{const d=Math.hypot((t.x-p.x)*els.canvas.width,(t.y-p.y)*els.canvas.height)/Math.max(els.canvas.width,els.canvas.height);if(d<bestDist){best=t;bestDist=d;found=true}});
  const map=await buildEdgeMap();const cx=Math.round(p.x*(map.w-1)),cy=Math.round(p.y*(map.h-1)),rad=8;let maxMag=130,maxX=cx,maxY=cy;for(let y=Math.max(1,cy-rad);y<Math.min(map.h-1,cy+rad);y++)for(let x=Math.max(1,cx-rad);x<Math.min(map.w-1,cx+rad);x++){const m=map.mag[y*map.w+x];if(m>maxMag){maxMag=m;maxX=x;maxY=y}}if(maxMag>130){best={x:maxX/(map.w-1),y:maxY/(map.h-1)};found=true}
  if(found&&event){els.snapBadge.hidden=false;els.snapBadge.style.left=`${event.clientX+10}px`;els.snapBadge.style.top=`${event.clientY-34}px`;clearTimeout(els.snapBadge._timer);els.snapBadge._timer=setTimeout(()=>els.snapBadge.hidden=true,650)}return best
}

function beginCropPointer(e,p){
  state.cropPointers.set(e.pointerId,p);const pts=[...state.cropPointers.values()];
  if(pts.length===1)state.cropGesture={kind:'pan',start:pts[0],cropX:state.cropX,cropY:state.cropY};
  else if(pts.length>=2)state.cropGesture={kind:'pinch',distance:screenDistance(pts[0],pts[1]),zoom:state.cropZoom}
}
function moveCropPointer(e,p){
  if(!state.cropPointers.has(e.pointerId))return;state.cropPointers.set(e.pointerId,p);const pts=[...state.cropPointers.values()],g=state.cropGesture;if(!g)return;
  if(pts.length>=2){const d=screenDistance(pts[0],pts[1]);if(g.kind!=='pinch'){state.cropGesture={kind:'pinch',distance:d,zoom:state.cropZoom};return}state.cropZoom=Math.max(1,Math.min(4,g.zoom*(d/Math.max(1,g.distance))));const slider=$('#cropZoomRange');if(slider){slider.value=Math.round(state.cropZoom*100);$('#cropZoomValue').textContent=`${slider.value}%`}render();return}
  if(g.kind==='pan'&&pts[0]){const m=cropMetrics(els.canvas.width,els.canvas.height),dx=(pts[0].x-g.start.x)*els.canvas.width,dy=(pts[0].y-g.start.y)*els.canvas.height;state.cropX=m.excessX?Math.max(-1,Math.min(1,g.cropX+dx/m.excessX)):0;state.cropY=m.excessY?Math.max(-1,Math.min(1,g.cropY+dy/m.excessY)):0;render()}
}
function endCropPointer(e){state.cropPointers.delete(e.pointerId);const pts=[...state.cropPointers.values()];if(pts.length===1)state.cropGesture={kind:'pan',start:pts[0],cropX:state.cropX,cropY:state.cropY};else if(!pts.length)state.cropGesture=null}
function beginSelection(p,e){ensureOverlayIds();const hit=hitOverlay(p);if(!hit){state.selectedOverlayId=null;state.selectionDrag=null;updateSelectionUi();render();return}state.selectedOverlayId=hit.overlay.id;state.selectionDrag={pointerId:e.pointerId,handle:hit.handle,start:p,original:JSON.parse(JSON.stringify(hit.overlay)),before:cloneSerializable(),moved:false};updateSelectionUi();render()}
function resizeSelectedBox(o,orig,p,handle){const q=inverseOverlayPoint(p,orig),min=.025,right=orig.x+orig.w,bottom=orig.y+orig.h;if(handle==='nw'){o.x=Math.min(q.x,right-min);o.y=Math.min(q.y,bottom-min);o.w=right-o.x;o.h=bottom-o.y}else if(handle==='ne'){o.y=Math.min(q.y,bottom-min);o.w=Math.max(min,q.x-orig.x);o.h=bottom-o.y}else if(handle==='se'){o.w=Math.max(min,q.x-orig.x);o.h=Math.max(min,q.y-orig.y)}else if(handle==='sw'){o.x=Math.min(q.x,right-min);o.w=right-o.x;o.h=Math.max(min,q.y-orig.y)}}
function moveSelection(p){
  const d=state.selectionDrag;if(!d)return;const o=state.overlays.find(x=>x.id===d.original.id);if(!o)return;Object.assign(o,JSON.parse(JSON.stringify(d.original)));const dx=p.x-d.start.x,dy=p.y-d.start.y,h=d.handle;if(Math.hypot(dx,dy)>.002)d.moved=true;
  if(h==='move')translateOverlay(o,dx,dy);else if(['nw','ne','se','sw'].includes(h))resizeSelectedBox(o,d.original,p,h);else if(h==='p1'){o.x1=p.x;o.y1=p.y}else if(h==='p2'){o.x2=p.x;o.y2=p.y}else if(h==='center'){o.cx=p.x;o.cy=p.y;updateAngleText(o)}else if(h==='source'){o.sourceX=p.x;o.sourceY=p.y}else if(h==='radius'){o.radius=Math.max(.025,screenDistance(p,{x:o.lensX,y:o.lensY})/Math.min(els.canvas.clientWidth,els.canvas.clientHeight))}else if(h==='scale'){const c=overlayCenter(d.original),start=Math.max(.001,screenDistance(d.start,c)),factor=Math.max(.3,Math.min(4,screenDistance(p,c)/start));if(o.type==='number')o.radius=Math.max(.018,(d.original.radius||.036)*factor);else o.fontSize=Math.max(.018,(d.original.fontSize||.04)*factor)}else if(h==='rotate'){const c=overlayCenter(d.original),a0=Math.atan2((d.start.y-c.y)*els.canvas.clientHeight,(d.start.x-c.x)*els.canvas.clientWidth),a1=Math.atan2((p.y-c.y)*els.canvas.clientHeight,(p.x-c.x)*els.canvas.clientWidth);o.rotation=(d.original.rotation||0)+(a1-a0)*180/Math.PI}
  if(o.type==='angle')updateAngleText(o);render()
}
async function endSelection(e){
  const d=state.selectionDrag;if(!d||d.pointerId!==e.pointerId)return;const o=state.overlays.find(x=>x.id===d.original.id);if(d.moved&&o){if(['arrow','dimension'].includes(o.type)&&(d.handle==='p1'||d.handle==='p2')){const p=await snapPoint({x:o[d.handle==='p1'?'x1':'x2'],y:o[d.handle==='p1'?'y1':'y2']},e);if(d.handle==='p1'){o.x1=p.x;o.y1=p.y}else{o.x2=p.x;o.y2=p.y}}state.history.push(d.before);if(state.history.length>40)state.history.shift();state.future=[];updateHistoryButtons()}state.selectionDrag=null;render()
}

els.canvas.addEventListener('pointerdown',async e=>{
  e.preventDefault();els.canvas.setPointerCapture?.(e.pointerId);let p=canvasPoint(e);
  if(state.activeTool==='cropPan'){beginCropPointer(e,p);return}
  if(!state.activeTool){beginSelection(p,e);return}
  if(state.activeTool==='perspective'){
    let best=0,dist=Infinity;state.perspectivePoints.forEach((q,i)=>{const d=Math.hypot((q.x-p.x)*els.canvas.clientWidth,(q.y-p.y)*els.canvas.clientHeight);if(d<dist){dist=d;best=i}});state.perspectiveDragging=best;return
  }
  if(state.activeTool==='bgselect'){state.bgPoint=p;state.bgTimer=setTimeout(()=>{state.bgTimer=null;removeBackgroundByColor(p)},480);return}
  if(state.activeTool==='angle'){state.pendingAngle=state.pendingAngle||[];state.pendingAngle.push(p);if(state.pendingAngle.length===1){els.toolHint.textContent='1本目の線の先をタップしてください'}else if(state.pendingAngle.length===2){els.toolHint.textContent='2本目の線の先をタップしてください'}else{const [c,p1,p2]=state.pendingAngle;const a1=Math.atan2(p1.y-c.y,p1.x-c.x),a2=Math.atan2(p2.y-c.y,p2.x-c.x);let d=Math.abs((a2-a1)*180/Math.PI);if(d>180)d=360-d;checkpoint();state.overlays.push({type:'angle',cx:c.x,cy:c.y,x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,text:`${Math.round(d)}°`,color:state.drawColor||'#E22636',lineWidth:.006,fontSize:.035,opacity:100,lineStyle:'solid'});state.pendingAngle=[];els.toolHint.textContent='次の頂点をタップしてください';render()}return}
  if(state.activeTool==='dimension'){
    p=await snapPoint(p,e);if(!state.drawStart){state.drawStart=p;els.toolHint.textContent='終点をタップしてください'}else{let end=constrainPoint(state.drawStart,p,state.dimensionMode);end=await snapPoint(end,e);const start=state.drawStart;state.drawStart=null;openDimensionInput(start,end)}return
  }
  if(state.activeTool==='number'){checkpoint();state.overlays.push({type:'number',x:p.x,y:p.y,value:state.numberNext++,color:'#E22636'});els.currentTool.textContent=`番号：次は ${state.numberNext}`;render();return}
  if(state.activeTool==='magnify'){checkpoint();state.overlays.push({type:'magnify',sourceX:p.x,sourceY:p.y,lensX:Math.min(.82,p.x+.22),lensY:Math.max(.18,p.y-.18),radius:.11,color:'#E22636'});render();showToast('部分拡大を入れました');return}
  if(state.activeTool==='freehand'){checkpoint();state.drawStart=p;state.freePath={type:'freehand',points:[p],color:state.drawColor||'#E22636',lineWidth:.006,marker:state.drawMarker};state.overlays.push(state.freePath);render();return}
  if(state.activeTool==='eraser'){checkpoint();state.drawStart=p;state.freePath={type:'erase',points:[p],lineWidth:state.eraseBrush};state.overlays.push(state.freePath);render();return}
  if(['circle','rect','arrow','line','mosaic','blur','cover','textbox'].includes(state.activeTool)){if(['arrow','line'].includes(state.activeTool))p=await snapPoint(p,e);checkpoint();state.drawStart=p;state.previewOverlay={type:state.activeTool,color:state.drawColor||'#E22636',lineWidth:.006,lineStyle:state.drawLineStyle||'solid',opacity:state.drawOpacity??100,x:p.x,y:p.y,w:0,h:0,x1:p.x,y1:p.y,x2:p.x,y2:p.y,text:state.activeTool==='textbox'?state.textBoxText:'',background:state.textBoxBackground,textColor:state.textBoxTextColor,fillOpacity:state.drawOpacity??75,fontSize:.038};state.overlays.push(state.previewOverlay);render()}
});
els.canvas.addEventListener('pointermove',e=>{
  const p=canvasPoint(e);if(state.activeTool==='cropPan'){moveCropPointer(e,p);return}if(!state.activeTool){moveSelection(p);return}
  if(state.activeTool==='perspective'&&state.perspectiveDragging>=0){state.perspectivePoints[state.perspectiveDragging]={x:Math.max(.005,Math.min(.995,p.x)),y:Math.max(.005,Math.min(.995,p.y))};render();return}
  if(!state.drawStart)return;
  if((state.activeTool==='freehand'||state.activeTool==='eraser')&&state.freePath){state.freePath.points.push(p);render();return}
  const o=state.previewOverlay;if(!o)return;if(['arrow','line'].includes(o.type)){o.x2=p.x;o.y2=p.y}else{o.x=Math.min(state.drawStart.x,p.x);o.y=Math.min(state.drawStart.y,p.y);o.w=Math.abs(p.x-state.drawStart.x);o.h=Math.abs(p.y-state.drawStart.y)}render()
});
els.canvas.addEventListener('pointerup',async e=>{
  if(state.activeTool==='cropPan'){endCropPointer(e);return}if(!state.activeTool){await endSelection(e);return}
  if(state.bgTimer){clearTimeout(state.bgTimer);state.bgTimer=null;showToast('背景を抜く場所を長押ししてください');return}
  if(state.activeTool==='perspective'){state.perspectiveDragging=-1;return}
  if(state.activeTool==='freehand'||state.activeTool==='eraser'){state.freePath=null;state.drawStart=null;state.edgeMapDirty=true;render();return}
  if(state.previewOverlay){const o=state.previewOverlay;if(['arrow','dimension'].includes(o.type)){const end=await snapPoint({x:o.x2,y:o.y2},e);o.x2=end.x;o.y2=end.y}state.previewOverlay=null;state.drawStart=null;state.edgeMapDirty=true;render();showToast('写真に追加しました')}
});
els.canvas.addEventListener('pointercancel',async e=>{if(state.activeTool==='cropPan')endCropPointer(e);else if(!state.activeTool)await endSelection(e)});

function readOutputControls(){const v=els.saveSize.value;if(v==='original'){state.outputMode='original';state.outputLongEdge=Math.max(state.originalWidth,state.originalHeight)}else if(v==='current'){state.outputMode='current';state.outputLongEdge=currentEditedLongEdge()}else if(v==='custom'){state.outputMode='custom';state.outputLongEdge=Math.max(320,Number(els.saveCustomLongEdge.value)||1920)}else{state.outputMode='fixed';state.outputLongEdge=Number(v)}els.saveCustomRow.hidden=v!=='custom'}
function plannedOutputDimensions(){const baseW=els.canvas.width,baseH=els.canvas.height,long=outputLongEdge(),scale=long/Math.max(baseW,baseH);let w=Math.max(1,Math.round(baseW*scale)),h=Math.max(1,Math.round(baseH*scale));const maxPixels=32_000_000;if(w*h>maxPixels){const s=Math.sqrt(maxPixels/(w*h));w=Math.floor(w*s);h=Math.floor(h*s)}return [w,h]}
function downloadFileBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
async function exportImage(){
  const format=els.saveFormat.value,quality=Number(els.saveQuality.value),filename=(els.saveFilename.value.trim()||'WORK_PHOTO').replace(/[\\/:*?"<>|]/g,'_');
  readOutputControls();const requested=outputLongEdge(),[targetW,targetH]=plannedOutputDimensions();if(Math.max(targetW,targetH)<requested)showToast('端末負荷を抑えるためサイズを調整しました');
  const out=document.createElement('canvas');out.width=targetW;out.height=targetH;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';drawBase(oc,targetW,targetH,false);drawOverlays(oc,targetW,targetH);if(format==='image/jpeg'){oc.save();oc.globalCompositeOperation='destination-over';oc.fillStyle='#fff';oc.fillRect(0,0,targetW,targetH);oc.restore()}
  const blob=await new Promise(resolve=>out.toBlob(resolve,format,quality));if(!blob){showToast('保存用データを作成できませんでした');return}
  const ext=format==='image/png'?'png':format==='image/webp'?'webp':'jpg';const file=new File([blob],`${filename}.${ext}`,{type:format});
  if(els.saveToAppAlbum?.checked && window.WorkPhotoDB){
    try{
      await WorkPhotoDB.putPhoto({id:`photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,name:file.name,blob,createdAt:Date.now(),source:'edited',edited:true,parentId:sourcePhotoRecord?.id||null,location:sourcePhotoRecord?.location||null,meta:{...(sourcePhotoRecord?.meta||{})},width:targetW,height:targetH});
      showToast('WORK PHOTOアルバムへ追加しました');
    }catch(err){console.error(err);showToast('アプリ内アルバムへの追加に失敗しました')}
  }
  try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'加工した写真'});showToast('端末の保存画面を開きました')}else{downloadFileBlob(blob,file.name);showToast('画像を保存しました')}}catch(err){if(err?.name!=='AbortError'){downloadFileBlob(blob,file.name);showToast('共有を開けなかったため、ダウンロードしました')}}
}
function updateSaveEstimate(){if(!state.image)return;readOutputControls();const [w,h]=plannedOutputDimensions();els.saveEstimate.innerHTML=`編集画面：${els.canvas.width} × ${els.canvas.height}px<br><strong>保存予定：${w} × ${h}px</strong>`}

function initEvents(){
  els.chooseBtn.onclick=()=>els.chooseInput.click();els.takeBtn.onclick=()=>els.takeInput.click();els.chooseInput.onchange=e=>loadFile(e.target.files[0]);els.takeInput.onchange=e=>loadFile(e.target.files[0]);
  els.brandHome.onclick=()=>{if(EDITOR_RETURN)location.assign(EDITOR_RETURN);else showStart()};els.headerBack.onclick=()=>{if(EDITOR_RETURN)location.assign(EDITOR_RETURN);else showStart()};if(els.returnAlbum){els.returnAlbum.hidden=!EDITOR_RETURN;els.returnAlbum.onclick=()=>location.assign(EDITOR_RETURN)}els.helpButton.onclick=()=>els.helpDialog.showModal();
  $$('.tool-tab').forEach(b=>b.onclick=()=>selectCategory(b.dataset.category));els.closeSheet.onclick=()=>closeSheet(true);els.sheetBackdrop.onclick=()=>closeSheet(true);els.cancelTool.onclick=()=>cancelActiveTool();
  els.undo.onclick=undo;els.redo.onclick=redo;els.compare.addEventListener('pointerdown',()=>{state.compareOriginal=true;render()});['pointerup','pointerleave','pointercancel'].forEach(ev=>els.compare.addEventListener(ev,()=>{state.compareOriginal=false;render()}));
  els.zoomRange.oninput=e=>{state.zoom=Number(e.target.value);applyZoom()};els.zoomOut.onclick=()=>{state.zoom=Math.max(5,state.zoom-10);applyZoom()};els.zoomIn.onclick=()=>{state.zoom=Math.min(180,state.zoom+10);applyZoom()};els.fit.onclick=fitCanvasToStage;
  els.save.onclick=()=>{syncOutputControls();updateSaveEstimate();els.saveDialog.showModal()};[els.saveFormat,els.saveQuality,els.saveSize].forEach(x=>x.onchange=()=>{if(x===els.saveSize)els.saveCustomRow.hidden=els.saveSize.value!=='custom';updateSaveEstimate()});els.saveCustomLongEdge.oninput=updateSaveEstimate;els.cancelSaveTop.onclick=()=>els.saveDialog.close();els.cancelSave.onclick=()=>els.saveDialog.close();els.saveForm.addEventListener('submit',e=>{e.preventDefault();if(e.submitter!==els.confirmSave)return;els.confirmSave.disabled=true;exportImage().finally(()=>{els.confirmSave.disabled=false;els.saveDialog.close()})});
  window.addEventListener('resize',()=>{if(state.image&&window.innerWidth<1100)fitCanvasToStage()});
}

function registerServiceWorker(){if(!('serviceWorker'in navigator))return;window.addEventListener('load',async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){const path=new URL(reg.scope).pathname.replace(/\/+$/,'/');if(path.endsWith('/editor/'))await reg.unregister()}await navigator.serviceWorker.register('../service-worker.js')}catch(err){console.warn('WORK PHOTO service worker setup skipped',err)}})}

async function bootEditor(){
  buildHelp();renderToolGrid('adjust');initEvents();registerServiceWorker();
  const photoId=EDITOR_PARAMS.get('photoId');
  if(photoId && window.WorkPhotoDB){
    try{
      const record=await WorkPhotoDB.getPhoto(photoId);
      if(record?.blob){
        const ext=record.blob.type==='image/png'?'png':record.blob.type==='image/webp'?'webp':'jpg';
        await loadFile(new File([record.blob],record.name||`WORK_PHOTO.${ext}`,{type:record.blob.type||'image/jpeg'}),record);
        if(els.saveFilename)els.saveFilename.value=(record.name||'WORK_PHOTO').replace(/\.[^.]+$/,'')+'_EDIT';
        return;
      }
      showToast('アルバムの写真を読み込めませんでした');
    }catch(err){console.error(err);showToast('写真の読み込みに失敗しました')}
  }
  if(EDITOR_PARAMS.get('demo')==='1'){
    fetch('./demo/sample-photo.png').then(r=>r.blob()).then(b=>loadFile(new File([b],'sample-photo.png',{type:'image/png'}))).catch(()=>{});
  }
}
bootEditor();
