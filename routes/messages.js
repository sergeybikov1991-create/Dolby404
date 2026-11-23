import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient, SUPABASE_KEY } from "../shared/supabase-client.mjs";


const MARKUP = `<section class="fs-route-messages">
<main class="wrap">
 <header class="chat-head">
  <a class="back" id="back" href="profile.html" aria-label="Назад">‹</a>
  <div class="avatar" id="peer-avatar">◉</div>
  <div class="person"><div class="person-name" id="peer-name">Открываем переписку…</div><div class="person-handle" id="peer-handle"></div></div>
  <button class="game-toggle" id="game-toggle" type="button" hidden>Играть</button>
 </header>
 <section class="chat">
  <div class="messages" id="messages"><div class="empty">Подключаем сообщения…</div></div>
  <iframe class="game-frame" id="game-frame" title="Игра в длинные нарды" hidden loading="lazy"></iframe>
  <div class="notice" id="notice" aria-live="polite"></div>
  <progress class="upload-progress" id="upload-progress" max="100" value="0" hidden aria-label="Прогресс загрузки вложения"></progress>
  <form class="composer" id="composer">
   <input id="attachment-input" type="file" hidden multiple accept="image/*,video/*">
   <input id="camera-input" type="file" hidden accept="image/*" capture="environment">
   <input id="file-input" type="file" hidden multiple>
   <div class="attachment-menu" id="attachment-menu" hidden role="menu" aria-label="Добавить вложение">
    <button type="button" data-attachment-source="gallery" role="menuitem">▧ <span>Галерея</span></button>
    <button type="button" data-attachment-source="camera" role="menuitem">◎ <span>Камера</span></button>
    <button type="button" data-attachment-source="files" role="menuitem">▤ <span>Файлы</span></button>
   </div>
   <div class="composer-preview" id="attachment-preview" hidden aria-label="Выбранные вложения">
    <div class="composer-preview-list" id="attachment-preview-list"></div>
    <div class="composer-preview-count" id="attachment-preview-count"></div>
   </div>
   <div class="composer-controls">
    <button class="attach" id="attach" type="button" aria-label="Добавить вложение" aria-expanded="false">+</button>
    <textarea id="message-input" maxlength="5000" rows="1" placeholder="Написать сообщение…" aria-label="Текст сообщения"></textarea>
    <button class="mic" id="mic" type="button" aria-label="Записать голосовое сообщение">♩</button>
    <button class="voice-cancel" id="voice-cancel" type="button" aria-label="Отменить запись" hidden>×</button>
    <button class="voice-mode-launch" id="voice-mode-launch" type="button" aria-label="Открыть голосовой режим">◖))</button>
    <button class="send" id="send" type="submit" aria-label="Отправить">↑</button>
   </div>
  </form>
 </section>
</main>
<div class="voice-mode" id="voice-mode" hidden role="dialog" aria-modal="true" aria-label="Голосовой режим">
 <button class="voice-mode-close" id="voice-mode-close" type="button" aria-label="Закрыть голосовой режим">×</button>
 <div class="voice-mode-title">FLOUSTREAM VOICE</div>
 <div class="voice-mode-orb" id="voice-mode-orb"><span></span></div>
 <div class="voice-mode-status" id="voice-mode-status">Нажми, чтобы начать запись</div>
 <button class="voice-mode-action" id="voice-mode-action" type="button">Начать</button>
</div>
<div class="photo-viewer" id="photo-viewer" role="dialog" aria-modal="true" aria-label="Просмотр фотографии" hidden>
 <button class="photo-viewer-close" id="photo-viewer-close" type="button" aria-label="Закрыть фотографию">×</button>
 <img id="photo-viewer-image" alt="">
</div>
</section>`;
export const stylesheet = new URL("./styles/messages.css?v=20261123-08", import.meta.url).href;
export const title = "Сообщения · FLOUSTREAM";

export async function mount(root, { signal, navigate, url }) {
  root.innerHTML = MARKUP;
  const style = await attachRouteStyles(root, stylesheet, "messages", signal);
  if (!style) return;
  let realtimeChannels = [];
  let activeTusUpload = null;
  let scrollLocked = false;
  let previousHtmlOverflow = "";
  function setScrollLock(locked) {
    if (locked && !scrollLocked) {
      previousHtmlOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      scrollLocked = true;
    } else if (!locked && scrollLocked) {
      document.documentElement.style.overflow = previousHtmlOverflow;
      scrollLocked = false;
    }
  }

  
const $=id=>root.querySelector("#"+id);
let client,viewer,peerId,lastMessageId="",loading=false,inboxLoading=false,pendingMessageReload=false,pendingInboxReload=false,attachmentSending=false,tusLibraryPromise=null,activeVoiceAudio=null,pendingGalleryFiles=[],galleryPreviewUrls=[];
const mediaUrlCache=new Map();
const mediaObjectUrls=new Map();
function chatMediaCacheRequest(path){
 return new Request(new URL("/__floustream_chat_media_cache__/"+encodeURIComponent(viewer.id)+"/"+encodeURIComponent(path),location.origin).href);
}
function chatLegacyImageCacheRequest(path){
 return new Request(new URL("/__floustream_chat_image_cache__/"+encodeURIComponent(viewer.id)+"/"+encodeURIComponent(path),location.origin).href);
}
async function openChatMediaCache(){
 if(!("caches" in window)||!viewer?.id)return null;
 return caches.open("floustream-chat-media-v1-"+viewer.id);
}
async function getCachedChatMediaUrl(path,mime){
 if(mediaObjectUrls.has(path))return mediaObjectUrls.get(path);
 try{
  const cache=await openChatMediaCache();if(!cache)return null;
  let response=await cache.match(chatMediaCacheRequest(path));
  // Keep photos saved by the previous photo-only cache when upgrading.
  if(!response&&String(mime||"").toLowerCase().startsWith("image/")&&"caches" in window){
   const legacy=await caches.open("floustream-chat-images-v1-"+viewer.id);
   response=await legacy.match(chatLegacyImageCacheRequest(path));
   if(response)try{await cache.put(chatMediaCacheRequest(path),response.clone());}catch(migrationError){console.warn("FLOUSTREAM photo cache migration:",migrationError);}
  }
  if(!response)return null;
  const blob=await response.blob();if(!blob.size)return null;
  const url=URL.createObjectURL(blob);mediaObjectUrls.set(path,url);return url;
 }catch(error){console.warn("FLOUSTREAM local media cache read:",error);return null;}
}
async function cacheChatMedia(path,signedUrl,mime){
 const existing=await getCachedChatMediaUrl(path,mime);if(existing)return existing;
 try{
  const response=await fetch(signedUrl,{mode:"cors",credentials:"omit"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const blob=await response.blob();if(!blob.size)throw new Error("Пустой файл вложения");
  const url=URL.createObjectURL(blob);mediaObjectUrls.set(path,url);
  try{
   const cache=await openChatMediaCache();
   if(cache){
    await cache.put(chatMediaCacheRequest(path),new Response(blob,{headers:{"Content-Type":blob.type||mime||"application/octet-stream","Cache-Control":"private, max-age=31536000"}}));
    const keys=await cache.keys();
    for(let index=0;index<keys.length-250;index++)await cache.delete(keys[index]);
   }
  }catch(cacheError){console.warn("FLOUSTREAM local media cache write:",cacheError);}
  return url;
 }catch(error){console.warn("FLOUSTREAM media download for local cache:",error);return signedUrl;}
}

async function loadTusLibrary(){
 if(window.tus?.Upload)return window.tus;
 if(!tusLibraryPromise){
  tusLibraryPromise=(async()=>{
   const sources=["https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/dist/tus.min.js","https://unpkg.com/tus-js-client@4.3.1/dist/tus.min.js"];
   let lastError;
   for(const src of sources){
    try{
     await new Promise((resolve,reject)=>{
      const script=document.createElement("script");let settled=false;
      const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);if(error){script.remove();reject(error);}else resolve();};
      const timer=setTimeout(()=>finish(new Error("Тайм-аут загрузки TUS-библиотеки")),10000);
      script.src=src;script.onload=()=>window.tus?.Upload?finish():finish(new Error("TUS-библиотека загружена без Upload"));
      script.onerror=()=>finish(new Error("Не удалось загрузить TUS-библиотеку"));document.head.append(script);
     });
     return window.tus;
    }catch(error){lastError=error;console.warn("FLOUSTREAM TUS CDN:",error);}
   }
   throw lastError||new Error("Не удалось загрузить resumable-загрузчик");
  })().catch(error=>{tusLibraryPromise=null;throw error;});
 }
 return tusLibraryPromise;
}
function setUploadProgress(value){
 const progress=$("upload-progress");if(!progress)return;
 if(value===null){progress.hidden=true;progress.value=0;return;}
 progress.hidden=false;progress.value=Math.max(0,Math.min(100,Number(value)||0));
}
function withTimeout(promise,ms,message){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]).finally(()=>clearTimeout(timer));
}
function safeUrl(value){if(!value)return "";try{const u=new URL(value,location.href);return ["http:","https:"].includes(u.protocol)?u.href:"";}catch(_){return "";}}
function timeText(value){const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}
function scrollToNewestMessage(host){
 const items=[...host.querySelectorAll(".bubble-row[data-created-at]")];
 if(!items.length)return;
 const newest=items.reduce((latest,item)=>{
  const time=Date.parse(item.dataset.createdAt)||0;
  const latestTime=Date.parse(latest.dataset.createdAt)||0;
  return time>latestTime||(time===latestTime&&item.dataset.messageId>latest.dataset.messageId)?item:latest;
 });
 const hostRect=host.getBoundingClientRect();
 const messageRect=newest.getBoundingClientRect();
 host.scrollTop+=messageRect.bottom-hostRect.bottom;
}
function showNotice(message,error=false){$("notice").textContent=message||"";$("notice").style.color=error?"#ffb4c0":"#c8a7e8";}
function openPhotoViewer(url,alt){const viewer=$("photo-viewer"),image=$("photo-viewer-image");image.src=url;image.alt=alt||"Фотография";viewer.hidden=false;setScrollLock(true);$("photo-viewer-close").focus();}
function closePhotoViewer(){const viewer=$("photo-viewer");if(viewer.hidden)return;viewer.hidden=true;$("photo-viewer-image").removeAttribute("src");setScrollLock(false);}
window.openPhotoViewer=openPhotoViewer;
$("photo-viewer-close").addEventListener("click",closePhotoViewer);
$("photo-viewer").addEventListener("click",event=>{if(event.target===$("photo-viewer"))closePhotoViewer();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closePhotoViewer();},{signal});
async function uploadFileResumable(file,initialPath,initialMessageId){
 const sessionResult=await withTimeout(client.auth.getSession(),10000,"Не удалось проверить сессию перед загрузкой.");
 if(sessionResult.error)throw sessionResult.error;
 const accessToken=sessionResult.data?.session?.access_token;
 if(!accessToken)throw new Error("Сессия завершилась. Войди снова и повтори отправку.");
 const tusLibrary=await loadTusLibrary();
 let path=initialPath,messageId=initialMessageId;
 return new Promise((resolve,reject)=>{
  let upload=null,settled=false,totalTimer=null,stallTimer=null;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(totalTimer);clearTimeout(stallTimer);if(error)reject(error);else resolve(value);};
  const abortAndFail=message=>{if(upload)Promise.resolve(upload.abort(false)).catch(()=>{}).finally(()=>finish(new Error(message)));else finish(new Error(message));};
  const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>abortAndFail("Передача остановлена: хранилище не отвечало 90 секунд. Выбери тот же файл ещё раз — загрузка продолжится."),90000);};
  const timeoutMs=Math.min(15*60*1000,Math.max(120000,Math.ceil(file.size/(96*1024)*1000)+60000));
  try{
   upload=new tusLibrary.Upload(file,{
    endpoint:"https://qhpobdktlbhdqsnajypr.storage.supabase.co/storage/v1/upload/resumable",
    retryDelays:[0,3000,5000,10000,20000],
    headers:{authorization:"Bearer "+accessToken,apikey:SUPABASE_KEY,"x-upsert":"false"},
    metadata:{bucketName:"message-media",objectName:path,contentType:file.type||"application/octet-stream",cacheControl:"3600",metadata:JSON.stringify({senderId:viewer.id,recipientId:peerId,messageId})},
    uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,chunkSize:6*1024*1024,
    onProgress:(bytesUploaded,bytesTotal)=>{armStall();const percent=bytesTotal?Math.floor(bytesUploaded/bytesTotal*100):0;setUploadProgress(percent);showNotice("Загружаем вложение… "+percent+"%");},
    onChunkComplete:(chunkSize,bytesAccepted,bytesTotal)=>{const percent=bytesTotal?Math.floor(bytesAccepted/bytesTotal*100):0;setUploadProgress(percent);showNotice("Передано в хранилище… "+percent+"%");},
    onError:error=>{const message=String(error?.message||error);let status=0;try{status=error?.originalRequest?.getStatus?.()||0;}catch(_){}if(status===409||/409|already exists|asset already exists/i.test(message)){withTimeout(client.storage.from("message-media").createSignedUrl(path,60),8000,"Не удалось проверить уже загруженное вложение.").then(result=>{if(!result.error&&result.data?.signedUrl)finish(null,{path,messageId});else finish(error instanceof Error?error:new Error(message));}).catch(()=>finish(error instanceof Error?error:new Error(message)));}else finish(error instanceof Error?error:new Error(message));},
    onSuccess:()=>finish(null,{path,messageId})
   });
   totalTimer=setTimeout(()=>abortAndFail("Загрузка превысила допустимое время. Попробуй ещё раз — незавершённая передача будет продолжена."),timeoutMs);
   upload.findPreviousUploads().then(previousUploads=>{
    if(settled)return;
    const matching=(previousUploads||[]).filter(item=>{
     try{const metadata=JSON.parse(item.metadata?.metadata||"{}");return item.metadata?.bucketName==="message-media"&&item.metadata?.objectName&&metadata.senderId===viewer.id&&metadata.recipientId===peerId&&metadata.messageId&&item.metadata.objectName===path;}catch(_){return false;}
    }).sort((a,b)=>(Date.parse(b.creationTime)||0)-(Date.parse(a.creationTime)||0));
    if(matching.length){const previous=matching[0],metadata=JSON.parse(previous.metadata.metadata);path=previous.metadata.objectName;messageId=metadata.messageId;upload.resumeFromPreviousUpload(previous);}
    armStall();upload.start();
   }).catch(error=>finish(error));
  }catch(error){finish(error);}
 });
}
function formatAudioTime(seconds){
 const value=Math.max(0,Math.floor(Number(seconds)||0));
 return Math.floor(value/60)+":"+String(value%60).padStart(2,"0");
}
function createVoiceMessagePlayer(row,url){
 const player=document.createElement("div");player.className="voice-player";
 const button=document.createElement("button");button.type="button";button.className="voice-play";button.textContent="▶";button.setAttribute("aria-label","Воспроизвести голосовое сообщение");
 const waveform=document.createElement("div");waveform.className="voice-wave";waveform.setAttribute("aria-hidden","true");
 const bars=[];
 for(let index=0;index<28;index++){const bar=document.createElement("span");bar.style.height=(7+((index*13+index*index*3)%19))+"px";waveform.append(bar);bars.push(bar);}
 const times=document.createElement("div");times.className="voice-times";
 const current=document.createElement("span");current.className="voice-current";current.textContent="0:00";
 const durationLabel=document.createElement("span");durationLabel.className="voice-total";durationLabel.textContent="0:00";
 times.append(current,document.createTextNode("/"),durationLabel);
 const audio=document.createElement("audio");audio.className="message-media-audio";audio.src=url;audio.preload="metadata";audio.hidden=true;
 const match=String(row.content||"").match(/^(\d+):(\d{2})$/);
 const fallbackDuration=match?Number(match[1])*60+Number(match[2]):0;
 const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:fallbackDuration;
 function sync(){
  const total=duration(),position=Math.max(0,Number(audio.currentTime)||0),ratio=total>0?Math.min(1,position/total):0;
  current.textContent=formatAudioTime(position);durationLabel.textContent=formatAudioTime(total);
  bars.forEach((bar,index)=>bar.classList.toggle("played",index/bars.length<ratio));
  const playing=!audio.paused&&!audio.ended;button.textContent=playing?"Ⅱ":"▶";button.setAttribute("aria-label",playing?"Приостановить голосовое сообщение":"Воспроизвести голосовое сообщение");
 }
 button.addEventListener("click",async()=>{
  if(!audio.paused){audio.pause();return;}
  if(activeVoiceAudio&&activeVoiceAudio!==audio){activeVoiceAudio.pause();activeVoiceAudio.currentTime=0;}
  if(audio.ended||(duration()>0&&audio.currentTime>=duration()))audio.currentTime=0;
  try{await audio.play();}catch(error){showNotice("Не удалось воспроизвести голосовое сообщение. Попробуй ещё раз.",true);}
 });
 audio.addEventListener("loadedmetadata",sync);audio.addEventListener("durationchange",sync);audio.addEventListener("timeupdate",sync);
 audio.addEventListener("play",()=>{activeVoiceAudio=audio;sync();});
 audio.addEventListener("pause",()=>{if(activeVoiceAudio===audio)activeVoiceAudio=null;sync();});
 audio.addEventListener("ended",()=>{audio.currentTime=0;if(activeVoiceAudio===audio)activeVoiceAudio=null;sync();});
 player.append(button,waveform,times,audio);sync();return player;
}
function isVoiceMessage(row){const mime=String(row.attachment_mime||"").toLowerCase(),name=String(row.attachment_name||"").toLowerCase(),duration=String(row.content||"").trim();return mime.startsWith("audio/")&&(name.startsWith("voice-message-")||/^\d{1,2}:\d{2}$/.test(duration));}
function createAttachmentElement(row,url,host){
 const mime=(row.attachment_mime||"").toLowerCase();
 if(mime.startsWith("image/")){
  const media=document.createElement("img");media.className="message-media-image";media.src=url;media.alt=row.attachment_name||"Изображение";media.loading="lazy";
  media.addEventListener("load",()=>scrollToNewestMessage(host),{once:true});
  media.addEventListener("click",()=>openPhotoViewer(media.currentSrc||url,media.alt));
  media.tabIndex=0;media.setAttribute("role","button");media.setAttribute("aria-label","Открыть фотографию на весь экран");
  media.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openPhotoViewer(media.currentSrc||url,media.alt);}});
  return media;
 }
 if(mime.startsWith("video/")){const media=document.createElement("video");media.className="message-media-video";media.src=url;media.controls=true;media.playsInline=true;media.preload="metadata";return media;}
 if(mime.startsWith("audio/"))return createVoiceMessagePlayer(row,url);
 const link=document.createElement("a");link.className="message-file";link.href=url;link.target="_blank";link.rel="noopener";link.download=row.attachment_name||"";link.textContent="📄 "+(row.attachment_name||"Открыть файл");return link;
}
async function loadAttachmentUrls(items){
 const connected=items.filter(item=>item.placeholder.isConnected);
 const paths=[...new Set(connected.map(item=>item.row.attachment_path))];
 for(const item of connected){
  const path=item.row.attachment_path,mime=(item.row.attachment_mime||"").toLowerCase();
  const inMemory=mediaUrlCache.get(path);if(inMemory&&inMemory.expiresAt>Date.now())continue;
  if(/^(image|video|audio)\//.test(mime)){
   const localUrl=await getCachedChatMediaUrl(path,mime);
   if(localUrl)mediaUrlCache.set(path,{url:localUrl,expiresAt:Number.MAX_SAFE_INTEGER});
  }
 }
 const missing=paths.filter(path=>{const cached=mediaUrlCache.get(path);return !cached||cached.expiresAt<=Date.now();});
 if(missing.length){
  try{
   const result=await withTimeout(client.storage.from("message-media").createSignedUrls(missing,3600),12000,"Хранилище не выдало ссылки на вложения за 12 секунд.");
   if(result.error)throw result.error;
   const rowByPath=new Map(connected.map(item=>[item.row.attachment_path,item.row]));
   for(const item of result.data||[]){
    if(!item.path||!item.signedUrl)continue;
    const row=rowByPath.get(item.path),mime=(row?.attachment_mime||"").toLowerCase();
    const cacheable=row&&/^(image|video|audio)\//.test(mime);
    const url=cacheable?await cacheChatMedia(item.path,item.signedUrl,mime):item.signedUrl;
    mediaUrlCache.set(item.path,{url,expiresAt:url.startsWith("blob:")?Number.MAX_SAFE_INTEGER:Date.now()+55*60*1000});
   }
  }catch(error){console.warn("FLOUSTREAM signed media URLs:",error);}
 }
 for(const item of connected){
  const placeholder=item.placeholder;if(!placeholder.isConnected)continue;
  const cached=mediaUrlCache.get(item.row.attachment_path);
  if(!cached||cached.expiresAt<=Date.now()){
   const retry=document.createElement("button");retry.type="button";retry.className="message-attachment-retry";retry.textContent="📎 "+(item.row.attachment_name||"Вложение")+" — повторить загрузку";
   retry.addEventListener("click",()=>loadAttachmentUrls([{row:item.row,placeholder:retry}]));placeholder.replaceWith(retry);continue;
  }
  placeholder.replaceWith(createAttachmentElement(item.row,cached.url,item.host));
 }
}
function rowAttachments(row){
 const list=Array.isArray(row.attachments)?row.attachments.filter(item=>item&&item.path):[];
 if(list.length)return list.map(item=>({attachment_path:item.path,attachment_name:item.name||"Вложение",attachment_mime:item.mime||"application/octet-stream"}));
 return row.attachment_path?[{attachment_path:row.attachment_path,attachment_name:row.attachment_name||"Вложение",attachment_mime:row.attachment_mime||"application/octet-stream"}]:[];
}
function renderMessages(rows){
 const host=$("messages");
 const existingIds=new Set([...host.querySelectorAll(".bubble-row")].map(node=>node.dataset.messageId));
 if(!existingIds.size)host.replaceChildren();
 if(!rows.length){const empty=document.createElement("div");empty.className="empty";empty.textContent="Это начало вашей переписки. Отправь первое сообщение!";host.replaceChildren(empty);lastMessageId="";return;}
 const pendingAttachments=[];
 for(const row of rows){
  const id=String(row.id||"");if(existingIds.has(id))continue;existingIds.add(id);
  const line=document.createElement("div");line.className="bubble-row"+(row.sender_id===viewer.id?" mine":"");line.dataset.createdAt=row.created_at||"";line.dataset.messageId=id;
  const bubble=document.createElement("div");bubble.className="bubble";
  const attachments=rowAttachments(row),hasVoice=attachments.some(item=>(item.attachment_mime||"").startsWith("audio/"));
  if(attachments.length===1&&(attachments[0].attachment_mime||"").toLowerCase().startsWith("image/"))bubble.classList.add("photo-message");
  if(hasVoice&&attachments.length===1)bubble.classList.add("voice-message-bubble");
  if(attachments.length){
   const group=document.createElement("div");group.className=attachments.length>1?"message-media-grid":"message-media-stack";
   attachments.forEach(item=>{
    const placeholder=document.createElement("div");placeholder.className="message-media-loading"+((item.attachment_mime||"").toLowerCase().startsWith("image/")?" photo-loading":"");placeholder.textContent="Подготавливаем вложение…";group.append(placeholder);pendingAttachments.push({row:item,placeholder,host});
   });
   bubble.append(group);
  }
  if(row.content&&row.content!==row.attachment_name&&!isVoiceMessage(row)){const body=document.createElement("div");body.className="message-caption";body.textContent=row.content;bubble.append(body);}
  const time=document.createElement("span");time.className="time";time.textContent=timeText(row.created_at);bubble.append(time);line.append(bubble);host.append(line);
 }
 if(pendingAttachments.length)loadAttachmentUrls(pendingAttachments);
 scrollToNewestMessage(host);requestAnimationFrame(()=>requestAnimationFrame(()=>scrollToNewestMessage(host)));
 lastMessageId=rows[rows.length-1]?.id||lastMessageId;
}
async function loadMessages(silent=false,forceRender=false){
 if(loading){pendingMessageReload=true;return;}loading=true;
 try{
  const filter="and(sender_id.eq."+viewer.id+",recipient_id.eq."+peerId+"),and(sender_id.eq."+peerId+",recipient_id.eq."+viewer.id+")";
  const result=await withTimeout(client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,attachment_mime,attachments,created_at").or(filter).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(200),15000,"Запрос переписки к Supabase не ответил за 15 секунд.");
  if(signal.aborted)return;
  if(result.error)throw result.error;
  const rows=(result.data||[]).sort((a,b)=>{
   const timeA=Date.parse(a.created_at)||0,timeB=Date.parse(b.created_at)||0;
   return timeA-timeB||String(a.id||"").localeCompare(String(b.id||""));
  });
  const newest=rows[rows.length-1]?.id||"";
  // Render the conversation independently from read-receipt permissions/network state.
  if(!silent||forceRender||newest!==lastMessageId)await renderMessages(rows);
  if(signal.aborted)return;
  if(rows.length){
   try{
    const marked=await client.from("direct_messages").update({read_at:new Date().toISOString()}).eq("recipient_id",viewer.id).eq("sender_id",peerId).is("read_at",null);
    if(marked.error)console.warn("FLOUSTREAM read receipt update:",marked.error);
   }catch(markError){console.warn("FLOUSTREAM read receipt update:",markError);}
  }
 }catch(error){if(!signal.aborted&&!silent){showNotice("Не удалось загрузить сообщения: "+(error.message||String(error)),true);const host=$("messages");host.replaceChildren();const failed=document.createElement("div");failed.className="empty";failed.textContent="Не удалось загрузить переписку. "+(error.message||String(error));host.append(failed);}}
 finally{loading=false;if(!signal.aborted&&pendingMessageReload){pendingMessageReload=false;loadMessages(true,true);}}
}
function renderInbox(rows,profiles){
 const host=$("messages");host.replaceChildren();host.classList.add("inbox-list");
 if(!rows.length){const empty=document.createElement("div");empty.className="inbox-empty";empty.textContent="Здесь появятся люди, с которыми ты переписываешься. Когда тебе напишут, диалог появится в этом списке.";host.append(empty);return;}
 const profileMap=new Map((profiles||[]).map(p=>[p.id,p]));const threads=new Map();
 for(const row of rows){const other=row.sender_id===viewer.id?row.recipient_id:row.sender_id;if(!threads.has(other))threads.set(other,{last:row,unread:0});if(row.recipient_id===viewer.id&&row.sender_id===other&&!row.read_at)threads.get(other).unread++;}
 for(const [id,thread] of threads){
  const deletedAccount=!profileMap.has(id);const person=profileMap.get(id)||{};const link=document.createElement("a");link.className="inbox-item";link.href="messages.html?v=20261123-1&with="+encodeURIComponent(id);
  const avatar=document.createElement("div");avatar.className="inbox-avatar";const avatarUrl=safeUrl(person.avatar_url);
  if(avatarUrl){const img=document.createElement("img");img.src=avatarUrl;img.alt="";avatar.append(img);}else avatar.textContent=((person.display_name||person.username||"◉").trim()[0]||"◉").toUpperCase();
  const copy=document.createElement("div");copy.className="inbox-copy";const name=document.createElement("div");name.className="inbox-name";name.textContent=deletedAccount?"Удалённый аккаунт":(person.display_name||person.username||"Пользователь");
  const preview=document.createElement("div");preview.className="inbox-preview";preview.textContent=(thread.last.sender_id===viewer.id?"Вы: ":"")+(thread.last.content||("📎 "+(rowAttachments(thread.last).length+" влож.")));
  const meta=document.createElement("div");meta.className="inbox-meta";const time=document.createElement("div");time.className="inbox-time";time.textContent=timeText(thread.last.created_at);
  const unread=document.createElement("span");unread.className="inbox-unread";unread.hidden=!thread.unread;unread.textContent=thread.unread>99?"99+":String(thread.unread);
  meta.append(time,unread);copy.append(name,preview);link.append(avatar,copy,meta);host.append(link);
 }
}
async function loadInbox(){
 if(signal.aborted)return;
 if(inboxLoading){pendingInboxReload=true;return;}inboxLoading=true;
 try{const result=await client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_name,attachments,created_at,read_at").or("sender_id.eq."+viewer.id+",recipient_id.eq."+viewer.id).order("created_at",{ascending:false}).limit(500);
  if(signal.aborted)return;
  if(result.error)throw result.error;const rows=result.data||[];const ids=[...new Set(rows.map(row=>row.sender_id===viewer.id?row.recipient_id:row.sender_id).filter(Boolean))];let profiles=[];
  if(ids.length){const people=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);if(signal.aborted)return;if(people.error)throw people.error;profiles=people.data||[];}if(!signal.aborted)renderInbox(rows,profiles);
 }catch(error){if(!signal.aborted)showNotice("Не удалось загрузить список сообщений: "+error.message,true);}finally{inboxLoading=false;if(!signal.aborted&&pendingInboxReload){pendingInboxReload=false;queueMicrotask(()=>loadInbox());}}
}
async function start(){
 try{
  showNotice("Подключаем библиотеку чата…");
  client=await getSupabaseClient({signal});if(signal.aborted)return;
  showNotice("Проверяем вход в аккаунт…");
  const stored=await withTimeout(client.auth.getSession(),12000,"Не удалось восстановить сессию браузера за 12 секунд.");if(stored.error)throw stored.error;if(!stored.data?.session)throw new Error("Сессия не найдена в хранилище браузера. Вернись на страницу входа и авторизуйся снова.");const auth=await withTimeout(client.auth.getUser(),12000,"Проверка входа в аккаунт не ответила за 12 секунд.");
  if(auth.error)throw auth.error;viewer=auth.data.user;
  if(!viewer){navigate("portal.html");return;}
  peerId=new URLSearchParams(url.search).get("with");
  if(!peerId){$("peer-name").textContent="Сообщения";$("peer-handle").textContent="Все диалоги";$("peer-avatar").textContent="✉";$("composer").hidden=true;await loadInbox();
   const inboxChannel=client.channel("floustream-inbox-"+viewer.id)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages"},payload=>{
     const row=payload.new||{};
     if(row.sender_id===viewer.id||row.recipient_id===viewer.id)loadInbox();
    })
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"direct_messages"},payload=>{
     const row=payload.new||{};
     if(row.sender_id===viewer.id||row.recipient_id===viewer.id)loadInbox();
    })
    .subscribe(status=>{
     if(status==="SUBSCRIBED"){showNotice("");loadInbox();}
     else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")showNotice("Восстанавливаем связь со списком диалогов…",true);
    });
   realtimeChannels.push(inboxChannel);
   return;}
  if(peerId===viewer.id){showNotice("Открой профиль другого пользователя, чтобы начать переписку.",true);$("composer").hidden=true;return;}
  showNotice("Загружаем профиль собеседника…");
  const profile=await withTimeout(client.from("profiles").select("id,username,display_name,avatar_url").eq("id",peerId).maybeSingle(),12000,"Профиль собеседника не ответил за 12 секунд. Проверь подключение и повтори.");
  if(signal.aborted)return;
  if(profile.error)throw profile.error;
  const deletedAccount=!profile.data;
  $("back").href=deletedAccount?"messages.html":"public-profile.html?id="+encodeURIComponent(peerId);
  const p=profile.data||{};
  $("peer-name").textContent=deletedAccount?"Удалённый аккаунт":(p.display_name||p.username||"Пользователь");
  $("peer-handle").textContent=deletedAccount?"История переписки сохранена":(p.username?"@"+p.username:"");
  const avatar=safeUrl(p.avatar_url);if(avatar){const img=document.createElement("img");img.src=avatar;img.alt="";$("peer-avatar").replaceChildren(img);}else $("peer-avatar").textContent=($("peer-name").textContent.trim()[0]||"◉").toUpperCase();
  if(!deletedAccount){
   const gameToggle=$("game-toggle"),gameFrame=$("game-frame");
   gameToggle.hidden=false;
   gameToggle.addEventListener("click",()=>{
    const opening=gameFrame.hidden;
    if(opening&&!gameFrame.src)gameFrame.src="backgammon.html?embed=1&opponent="+encodeURIComponent(peerId);
    gameFrame.hidden=!opening;
    $("messages").hidden=opening;
    $("composer").hidden=opening;
    $("notice").hidden=opening;
    gameToggle.textContent=opening?"Вернуться в чат":"Играть";
    gameToggle.setAttribute("aria-pressed",String(opening));
   });
  }
  $("composer").hidden=deletedAccount;
  if(deletedAccount)showNotice("Этот аккаунт удалён. История переписки сохранена; отправлять новые сообщения нельзя.");
  await loadMessages();
  if(!deletedAccount){
   let voiceRecorder=null,voiceStream=null,voiceChunks=[],voiceStartedAt=0,voiceTimer=null,voiceRecording=false,voiceModeOpen=false;
function formatVoiceDuration(seconds){return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function stopVoiceStream(){if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());voiceStream=null;}
async function beginVoiceRecording(fromMode=false){
 if(voiceRecording){await finishVoiceRecording(false);return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){showNotice("Этот браузер не поддерживает запись аудио.",true);return;}
 try{
  voiceStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  const type=["audio/webm;codecs=opus","audio/mp4","audio/webm","audio/ogg;codecs=opus"].find(value=>MediaRecorder.isTypeSupported?.(value));
  voiceRecorder=type?new MediaRecorder(voiceStream,{mimeType:type}):new MediaRecorder(voiceStream);voiceChunks=[];voiceStartedAt=Date.now();voiceRecording=true;
  voiceRecorder.ondataavailable=event=>{if(event.data?.size)voiceChunks.push(event.data);};
  voiceRecorder.onerror=()=>{showNotice("Ошибка записи голосового сообщения.",true);void finishVoiceRecording(true);};
  voiceRecorder.start(250);
  $("mic").classList.add("recording");$("mic").setAttribute("aria-label","Остановить запись");$("voice-cancel").hidden=false;
  if(fromMode){$("voice-mode-orb").classList.add("recording");$("voice-mode-status").textContent="Идёт запись… нажми Стоп, чтобы прикрепить голос";$("voice-mode-action").textContent="Стоп и прикрепить";}
  else showNotice("Запись голосового сообщения… нажми микрофон ещё раз, чтобы закончить.");
  clearInterval(voiceTimer);voiceTimer=setInterval(()=>{
   const duration=formatVoiceDuration((Date.now()-voiceStartedAt)/1000);
   if(fromMode)$("voice-mode-status").textContent="Запись "+duration+" · нажми Стоп, чтобы прикрепить";
   else showNotice("Запись "+duration+" · нажми микрофон, чтобы закончить");
  },500);
 }catch(error){stopVoiceStream();voiceRecording=false;showNotice("Не удалось начать запись: "+(error.message||"проверь разрешение на микрофон"),true);}
}
async function finishVoiceRecording(cancelled=false){
 if(!voiceRecording||!voiceRecorder)return;
 const recorder=voiceRecorder;voiceRecording=false;clearInterval(voiceTimer);voiceTimer=null;
 const blobPromise=new Promise(resolve=>{recorder.addEventListener("stop",()=>resolve(new Blob(voiceChunks,{type:recorder.mimeType||"audio/webm"})),{once:true});});
 try{if(recorder.state!=="inactive")recorder.stop();}catch(_){}
 const blob=await blobPromise;stopVoiceStream();voiceRecorder=null;voiceChunks=[];
 $("mic").classList.remove("recording");$("mic").setAttribute("aria-label","Записать голосовое сообщение");$("voice-cancel").hidden=true;$("voice-mode-orb").classList.remove("recording");
 if(cancelled){showNotice("Запись отменена.");return;}
 if(blob.size<256){showNotice("Запись слишком короткая. Попробуй ещё раз.",true);return;}
 const seconds=Math.max(1,Math.floor((Date.now()-voiceStartedAt)/1000)),mime=(blob.type||"audio/webm").split(";")[0],ext=mime==="audio/mp4"?"m4a":mime==="audio/ogg"?"ogg":"webm";
 const file=new File([blob],"voice-message-"+seconds+"s."+ext,{type:mime,lastModified:Date.now()});
 pendingGalleryFiles.push(file);renderGalleryPreview();showNotice("Голосовое сообщение прикреплено. Нажми отправку, чтобы отправить.");
 if(voiceModeOpen){$("voice-mode-status").textContent="Голосовое сообщение прикреплено";$("voice-mode-action").textContent="Готово";$("voice-mode-action").disabled=true;}
}
$("mic").addEventListener("click",()=>voiceRecording?void finishVoiceRecording(false):void beginVoiceRecording(false));
$("voice-cancel").addEventListener("click",()=>void finishVoiceRecording(true));
$("voice-mode-launch").addEventListener("click",()=>{$("voice-mode").hidden=false;voiceModeOpen=true;$("voice-mode-action").disabled=false;$("voice-mode-action").textContent="Начать";$("voice-mode-status").textContent="Нажми, чтобы начать запись";});
$("voice-mode-close").addEventListener("click",()=>{if(voiceRecording)void finishVoiceRecording(true);$("voice-mode").hidden=true;voiceModeOpen=false;});
$("voice-mode-action").addEventListener("click",()=>{if(voiceRecording)void finishVoiceRecording(false);else if(!$("voice-mode-action").disabled)void beginVoiceRecording(true);});
signal.addEventListener("abort",()=>{clearInterval(voiceTimer);if(voiceRecorder&&voiceRecorder.state!=="inactive")try{voiceRecorder.stop();}catch(_){}stopVoiceStream();},{once:true});
   $("message-input").addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();$("composer").requestSubmit();}});
   function openAttachmentMenu(open){const menu=$("attachment-menu"),button=$("attach");menu.hidden=!(open??menu.hidden);button.setAttribute("aria-expanded",String(!menu.hidden));}
   $("attach").addEventListener("click",()=>openAttachmentMenu($("attachment-menu").hidden));
   $("attachment-menu").addEventListener("click",event=>{
    const button=event.target.closest("[data-attachment-source]");if(!button)return;
    const source=button.dataset.attachmentSource;openAttachmentMenu(false);
    if(source==="gallery")$("attachment-input").click();else if(source==="camera")$("camera-input").click();else $("file-input").click();
   });
   document.addEventListener("click",event=>{if(!event.composedPath().includes($("composer")))openAttachmentMenu(false);},{signal});
   function revokeGalleryPreviewUrls(){for(const url of galleryPreviewUrls)URL.revokeObjectURL(url);galleryPreviewUrls=[];}
   function formatFileSize(bytes){if(bytes<1024)return bytes+" Б";if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" КБ";return (bytes/(1024*1024)).toFixed(1)+" МБ";}
   function renderGalleryPreview(){
    const host=$("attachment-preview-list");revokeGalleryPreviewUrls();host.replaceChildren();
    pendingGalleryFiles.forEach((file,index)=>{
     const item=document.createElement("div");item.className="composer-preview-item";
     const mime=(file.type||"").toLowerCase();
     if(mime.startsWith("image/")||mime.startsWith("video/")){
      const objectUrl=URL.createObjectURL(file);galleryPreviewUrls.push(objectUrl);
      const media=document.createElement(mime.startsWith("video/")?"video":"img");media.className="composer-preview-thumb";media.src=objectUrl;media.alt=mime.startsWith("image/")?file.name:"";if(media.tagName==="VIDEO"){media.muted=true;media.playsInline=true;media.preload="metadata";}
      item.append(media);
     }else if(mime.startsWith("audio/")){
      const audio=document.createElement("audio");audio.className="composer-preview-audio";const objectUrl=URL.createObjectURL(file);galleryPreviewUrls.push(objectUrl);audio.src=objectUrl;audio.controls=true;item.append(audio);
     }else{const icon=document.createElement("span");icon.className="composer-preview-file";icon.textContent="▤";item.append(icon);}
     const remove=document.createElement("button");remove.type="button";remove.className="composer-preview-remove";remove.textContent="×";remove.setAttribute("aria-label","Убрать "+file.name);remove.addEventListener("click",()=>{pendingGalleryFiles.splice(index,1);renderGalleryPreview();});item.append(remove);host.append(item);
    });
    $("attachment-preview-count").textContent=pendingGalleryFiles.length?pendingGalleryFiles.length+" вложений · "+formatFileSize(pendingGalleryFiles.reduce((sum,file)=>sum+file.size,0)):"";
    $("attachment-preview").hidden=pendingGalleryFiles.length===0;
    $("send").disabled=attachmentSending;
   }
   async function attachmentFingerprint(file){
    const partSize=65536;
    try{const first=await file.slice(0,Math.min(partSize,file.size)).arrayBuffer(),last=file.size>partSize?await file.slice(Math.max(partSize,file.size-partSize)).arrayBuffer():new ArrayBuffer(0);const bytes=new Uint8Array(first.byteLength+last.byteLength);bytes.set(new Uint8Array(first),0);bytes.set(new Uint8Array(last),first.byteLength);const digest=await crypto.subtle.digest("SHA-256",bytes);return file.name+"|"+file.size+"|"+(file.type||"")+"|"+Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,"0")).join("");}catch(_){return file.name+"|"+file.size+"|"+(file.type||"")+"|"+file.lastModified;}
   }
   async function sendAttachmentFiles(files,options={}){
    const selected=Array.from(files||[]);if(!selected.length||attachmentSending)return false;
    if(selected.length>10){showNotice("Можно отправить не более 10 вложений за раз.",true);return false;}
    if(selected.some(file=>!file.size||file.size>50*1024*1024)){showNotice("Каждый файл должен быть больше 0 и не превышать 50 МБ.",true);return false;}
    attachmentSending=true;$("attach").disabled=true;$("mic").disabled=true;$("send").disabled=true;
    const uploaded=[],pendingKeys=[];let keepUploaded=false,messageId="";
    try{
     const fingerprints=[];for(const file of selected)fingerprints.push(await attachmentFingerprint(file));
     const batchKey="floustream-pending-batch:"+viewer.id+":"+peerId+":"+encodeURIComponent(fingerprints.join("||"));
     let batch=null;try{batch=JSON.parse(sessionStorage.getItem(batchKey)||"null");}catch(_){}
     if(!batch?.messageId||Date.now()-(batch.updatedAt||0)>86400000)batch={messageId:crypto.randomUUID(),updatedAt:Date.now()};
     messageId=batch.messageId;try{sessionStorage.setItem(batchKey,JSON.stringify(batch));}catch(_){}
     for(let index=0;index<selected.length;index++){
      const file=selected[index],safeName=file.name.replace(/[^A-Za-z0-9._-]/g,"_").slice(0,100)||"attachment";
      const pendingKey="floustream-pending-attachment:"+viewer.id+":"+peerId+":"+encodeURIComponent(fingerprints[index]);pendingKeys.push(pendingKey);
      let pending=null;try{pending=JSON.parse(sessionStorage.getItem(pendingKey)||"null");}catch(_){}
      if(!pending?.path||pending.messageId!==messageId||Date.now()-(pending.updatedAt||0)>86400000)pending={path:viewer.id+"/"+messageId+"/"+crypto.randomUUID()+"_"+safeName,messageId,updatedAt:Date.now(),uploaded:false};
      let path=pending.path;try{sessionStorage.setItem(pendingKey,JSON.stringify(pending));}catch(_){}
      if(!pending.uploaded){
       setUploadProgress(Math.floor(index/selected.length*100));showNotice("Загружаем вложение "+(index+1)+" из "+selected.length+"…");
       const result=await uploadFileResumable(file,path,messageId);path=result.path;pending={path,messageId,uploaded:true,updatedAt:Date.now()};try{sessionStorage.setItem(pendingKey,JSON.stringify(pending));}catch(_){}
      }
      uploaded.push({path,name:file.name,mime:file.type||"application/octet-stream"});setUploadProgress(Math.floor((index+1)/selected.length*100));
     }
     const row={id:messageId,sender_id:viewer.id,recipient_id:peerId,content:options.content||"",attachments:uploaded};
     try{const sent=await withTimeout(client.from("direct_messages").insert(row),15000,"Сервер не подтвердил отправку сообщения за 15 секунд.");if(sent.error)throw sent.error;}
     catch(insertError){
      let confirmation;try{confirmation=await withTimeout(client.from("direct_messages").select("id,attachments").eq("id",messageId).maybeSingle(),8000,"Не удалось проверить результат отправки.");}catch(_){keepUploaded=true;throw new Error("Файлы загружены, но подтверждение сообщения не получено. Не отправляй повторно — обнови переписку.");}
      if(confirmation.error){keepUploaded=true;throw new Error("Не удалось проверить запись сообщения. Файлы сохранены в хранилище.");}
      const confirmed=confirmation.data?.id===messageId&&Array.isArray(confirmation.data.attachments)&&confirmation.data.attachments.length===uploaded.length;
      if(!confirmed){if(insertError.message==="Сервер не подтвердил отправку сообщения за 15 секунд."||!Number.isFinite(Number(insertError.status))||Number(insertError.status)>=500){keepUploaded=true;throw new Error("Сервер пока не подтвердил отправку. Файлы оставлены в хранилище — обнови переписку.");}throw insertError;}
     }
     pendingKeys.forEach(key=>{try{sessionStorage.removeItem(key);}catch(_){}});try{sessionStorage.removeItem(batchKey);}catch(_){}
     showNotice(options.successMessage||"Сообщение отправлено.");await loadMessages();return true;
    }catch(error){
     if(uploaded.length)keepUploaded=true;
     if(!keepUploaded&&uploaded.length){try{await withTimeout(client.storage.from("message-media").remove(uploaded.map(item=>item.path)),10000,"Тайм-аут очистки файлов.");}catch(cleanupError){console.warn("FLOUSTREAM orphan attachments:",cleanupError);}}
     showNotice("Не удалось отправить: "+(error.message||"ошибка соединения"),true);return false;
    }finally{attachmentSending=false;$("attach").disabled=false;$("mic").disabled=false;$("send").disabled=false;setUploadProgress(null);}
   }
   async function sendAttachmentFile(file,options={}){return sendAttachmentFiles([file],options);}
   for(const inputId of ["attachment-input","camera-input","file-input"]){
    $(inputId).addEventListener("change",event=>{
     const files=Array.from(event.target.files||[]);event.target.value="";
     if(!files.length)return;
     const merged=[...pendingGalleryFiles,...files],unique=new Map(merged.map(file=>[file.name+"|"+file.size+"|"+file.lastModified,file]));pendingGalleryFiles=[...unique.values()].slice(0,10);
     renderGalleryPreview();showNotice("Вложения добавлены. Добавь подпись и нажми отправку.");
    });
   }
   $("composer").addEventListener("submit",async event=>{
    event.preventDefault();if(attachmentSending)return;
    const input=$("message-input"),content=input.value.trim();
    if(pendingGalleryFiles.length){
     const sent=await sendAttachmentFiles(pendingGalleryFiles,{content});if(sent){pendingGalleryFiles=[];input.value="";renderGalleryPreview();}return;
    }
    if(!content)return;
    const button=$("send");if(button.disabled)return;button.disabled=true;showNotice("Отправляем…");
    try{const result=await client.from("direct_messages").insert({sender_id:viewer.id,recipient_id:peerId,content});if(result.error)throw result.error;input.value="";showNotice("Сообщение отправлено.");await loadMessages();}
    catch(error){showNotice("Не удалось отправить: "+(error.message||"ошибка соединения"),true);}
    finally{button.disabled=false;input.focus();}
   });

  }
  let wasSubscribed=false;
  const chatChannel=client.channel("floustream-direct-"+[viewer.id,peerId].sort().join("-"))
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages"},payload=>{
    const row=payload.new||{};
    if((row.sender_id===viewer.id&&row.recipient_id===peerId)||(row.sender_id===peerId&&row.recipient_id===viewer.id))loadMessages(true);
   })
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"direct_messages"},payload=>{
    const row=payload.new||{};
    if((row.sender_id===viewer.id&&row.recipient_id===peerId)||(row.sender_id===peerId&&row.recipient_id===viewer.id))loadMessages(true);
   })
   .subscribe(status=>{
    if(status==="SUBSCRIBED"){
     if(wasSubscribed)loadMessages(true);
     wasSubscribed=true;
     showNotice("");
    }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){
     showNotice("Восстанавливаем соединение…",true);
    }
   });
  realtimeChannels.push(chatChannel);
 }catch(error){$("peer-name").textContent="Не удалось открыть переписку";showNotice(error.message,true);$("messages").replaceChildren();}
}
void start();

  return async () => {
    setScrollLock(false);
    if (window.openPhotoViewer === openPhotoViewer) delete window.openPhotoViewer;
    if (activeTusUpload) {
      try { await activeTusUpload.abort(false); } catch (_) {}
      activeTusUpload = null;
    }
    for (const channel of realtimeChannels) {
      try { await client?.removeChannel(channel); } catch (_) {}
    }
    realtimeChannels = [];
    try { activeVoiceAudio?.pause(); } catch (_) {}
    for (const url of mediaObjectUrls.values()) URL.revokeObjectURL(url);
    mediaObjectUrls.clear();
    mediaUrlCache.clear();
    revokeGalleryPreviewUrls();
    pendingGalleryFiles = [];
    const gameFrame = $("game-frame");
    if (gameFrame) { gameFrame.src = "about:blank"; gameFrame.hidden = true; }
root.replaceChildren();
  };
}
