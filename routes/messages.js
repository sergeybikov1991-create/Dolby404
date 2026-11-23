const STYLE = "\n.fs-route-messages{color-scheme:dark;--bg:#090910;--panel:#15121f;--line:#382b4b;--purple:#a66bff;--muted:#aaa0ba;--text:#f5f0ff}\n*{box-sizing:border-box}\n.fs-route-messages{margin:0;min-height:100vh;background:radial-gradient(ellipse at 18% 0%,#281342 0,transparent 38%),var(--bg);color:var(--text);font-family:Arial,sans-serif}\n.wrap{width:min(760px,100%);height:100dvh;min-height:420px;margin:0 auto;padding:16px;display:flex;flex-direction:column}\n.chat{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;border:1px solid #49345f;border-radius:20px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 12px 45px #0007}\n.back{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border:1px solid #65458a;border-radius:12px;background:#21172f;color:#eee2ff;text-decoration:none;font-size:22px}.chat-head{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:14px 16px;margin-bottom:10px;border:1px solid #49345f;border-radius:16px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 8px 28px #0005}\n.avatar{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;overflow:hidden;border:2px solid #b879e8;border-radius:50%;background:#352044;color:#fff;font-weight:800;box-shadow:0 0 12px #a66bff55}\n.avatar img{width:100%;height:100%;object-fit:cover}\n.person{min-width:0;flex:1}.person-name{font-size:15px;font-weight:800;overflow-wrap:anywhere}.person-handle{margin-top:4px;color:#c59aff;font-size:12px}\n.messages{display:flex;flex:1;min-height:0;flex-direction:column;gap:10px;overflow:auto;padding:18px 14px;overscroll-behavior:contain;overflow-anchor:none}\n.empty{margin:auto;padding:24px;text-align:center;color:#a99bbd;line-height:1.6}\n.bubble-row{display:flex;flex:0 0 auto}.bubble-row.mine{justify-content:flex-end}\n.bubble{max-width:min(82%,520px);padding:10px 13px;border:1px solid #49385e;border-radius:15px 15px 15px 4px;background:#21192d;color:#f2eaff;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.5}\n.mine .bubble{border-color:#7952a0;border-radius:15px 15px 4px 15px;background:linear-gradient(135deg,#553078,#342047)}\n.message-media-image{display:block;width:100%;max-width:420px;max-height:360px;object-fit:contain;border-radius:11px;cursor:zoom-in}.bubble:has(.message-media-image){padding:0;border:0;background:transparent;box-shadow:none}.mine .bubble:has(.message-media-image){border:0;background:transparent;box-shadow:none}\n.bubble.photo-message{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}\n.bubble.photo-message .message-media-image{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;padding:0!important}\n.bubble.photo-message .message-media-loading.photo-loading{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;padding:0!important}.photo-viewer{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:#05040af2}.photo-viewer[hidden]{display:none!important}.photo-viewer img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}.photo-viewer-close{position:absolute;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));width:44px;height:44px;border:1px solid #ffffff55;border-radius:50%;background:#171321;color:#fff;font-size:28px;line-height:1;cursor:pointer}.message-media-video{display:block;width:100%;max-width:420px;max-height:360px;border-radius:11px;background:#050509}.message-media-audio[hidden]{display:none!important}.bubble.voice-message-bubble{padding:0!important;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important}.voice-player{display:flex;align-items:center;gap:10px;width:min(340px,100%);min-width:0;padding:8px 10px;border:0!important;outline:0!important;box-shadow:none!important;border-radius:13px;background:linear-gradient(135deg,#21172f,#171321)}.voice-play{display:grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border:0;border-radius:50%;background:linear-gradient(135deg,#a66bff,#6735a4);color:#fff;font-size:15px;cursor:pointer}.voice-wave{display:flex;align-items:center;justify-content:center;gap:2px;min-width:0;flex:1;height:30px;overflow:hidden}.voice-wave span{display:block;width:3px;min-width:2px;border-radius:4px;background:#78658e;opacity:.9}.voice-wave span.played{background:#d3aaff;box-shadow:0 0 5px #a66bff88}.voice-times{display:flex;flex:0 0 auto;gap:4px;color:#c9b5df;font-size:10px;font-variant-numeric:tabular-nums;white-space:nowrap}.voice-times .voice-current{color:#fff}.attachment-preview{padding:10px 12px;border-top:1px solid #382b4b;background:#110e19}.attachment-preview[hidden]{display:none!important}.attachment-preview-list{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}.attachment-preview-item{display:flex;align-items:center;gap:8px;min-width:0;max-width:220px;padding:7px;border:1px solid #49385e;border-radius:10px;background:#171321}.attachment-preview-thumb{display:block;width:44px;height:44px;flex:0 0 44px;object-fit:cover;border-radius:7px;background:#090811}.attachment-preview-meta{min-width:0;flex:1}.attachment-preview-name{display:block;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.attachment-preview-size{display:block;margin-top:3px;color:#aaa0ba;font-size:10px}.attachment-preview-remove{width:28px;height:28px;flex:0 0 28px;border:1px solid #65458a;border-radius:8px;background:#21172f;color:#f2e5ff;font-size:17px;cursor:pointer}.attachment-preview-footer{display:flex;align-items:center;gap:8px}.attachment-preview-count{margin-right:auto;color:#bca9d2;font-size:11px}.attachment-preview-action{min-height:34px;padding:0 12px;border:1px solid #65458a;border-radius:9px;background:#21172f;color:#f2e5ff;font-size:12px;font-weight:700;cursor:pointer}.attachment-preview-action.primary{border-color:#9a69c7;background:linear-gradient(135deg,#7139c9,#48216f);color:#fff}.attachment-preview-action:disabled{opacity:.5}.message-file{display:inline-flex;align-items:center;gap:8px;padding:9px 11px;border:1px solid #8c68ad;border-radius:10px;color:#f1e5ff;text-decoration:none;background:#171021}.attach{width:44px;height:44px;flex:0 0 44px;border:1px solid #65458a;border-radius:13px;background:#21172f;color:#e9d8ff;font-size:25px;cursor:pointer}.attach:disabled{opacity:.5}.time{display:block;margin-top:5px;color:#bca9d2;font-size:10px;text-align:right}\n.composer{display:flex;align-items:flex-end;gap:9px;padding:12px;border-top:1px solid #382b4b;background:#110e19}\n.composer textarea{flex:1;min-height:44px;max-height:130px;resize:vertical;padding:12px;border:1px solid #49385e;border-radius:13px;background:#090811;color:#fff;font:inherit;font-size:14px;line-height:1.4;outline:none}\n.composer textarea:focus{border-color:#a66bff;box-shadow:0 0 0 2px #a66bff22}\n.send{width:46px;height:44px;flex:0 0 46px;border:1px solid #9a69c7;border-radius:13px;background:linear-gradient(135deg,#7139c9,#48216f);color:#fff;font-size:21px;font-weight:800;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}.send.arming{box-shadow:0 0 0 3px #b879e866}.send.recording{background:linear-gradient(135deg,#d34c76,#7d1f4d);border-color:#ff8eaf;box-shadow:0 0 16px #e34f8566;transform:scale(1.04)}\n.send:disabled{opacity:.5;cursor:default}\n.notice{min-height:19px;padding:0 14px 8px;color:#c8a7e8;font-size:11px}.upload-progress{display:block;width:calc(100% - 28px);height:4px;margin:0 14px 8px;accent-color:#b879e8}.upload-progress[hidden]{display:none}.message-media-loading,.message-attachment-retry{display:block;padding:10px 12px;border:1px solid #49385e;border-radius:10px;background:#171321;color:#c8a7e8;font-size:12px}.message-attachment-retry{cursor:pointer}.voice-duration{margin:0 0 4px;color:#c8a7e8;font-size:11px;font-variant-numeric:tabular-nums}\n.inbox-list{display:flex;flex-direction:column;gap:9px;padding:12px;overflow:auto}.inbox-item{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:11px;border:1px solid #392b4b;border-radius:14px;background:linear-gradient(120deg,#21182d,#14111d);color:var(--text);text-align:left;text-decoration:none;cursor:pointer}.inbox-item:active{border-color:#a66bff;background:#2a1c3a}.inbox-avatar{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;overflow:hidden;border:1px solid #9a69c7;border-radius:50%;background:#352044;font-weight:800}.inbox-avatar img{width:100%;height:100%;object-fit:cover}.inbox-copy{display:grid;gap:5px;min-width:0;flex:1}.inbox-name{font-size:14px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.inbox-preview{font-size:12px;color:#b9adc8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.inbox-meta{display:grid;justify-items:end;gap:7px;align-self:stretch}.inbox-time{font-size:10px;color:#a99bbd;white-space:nowrap}.inbox-unread{display:grid;min-width:20px;height:20px;padding:0 5px;place-items:center;border-radius:999px;background:linear-gradient(135deg,#ff4f91,#c51e68);color:white;font-size:11px;font-weight:800}.inbox-unread[hidden]{display:none}.inbox-empty{margin:auto;padding:26px;text-align:center;color:#a99bbd;line-height:1.6}.game-toggle{border:1px solid #8b63b1;border-radius:11px;padding:9px 13px;background:linear-gradient(135deg,#3d2458,#24182f);color:#f2e5ff;font-weight:700;cursor:pointer}.game-toggle[hidden]{display:none}.game-frame{display:block;width:100%;flex:1;min-height:0;border:0;background:#090811}.game-frame[hidden]{display:none}.messages[hidden],.composer[hidden]{display:none!important}@media(max-width:600px){.wrap{height:100dvh;padding:9px}.chat{border-radius:15px}.messages{padding:14px 10px}.composer{padding:9px}}\n";
const MARKUP = "<section class=\"fs-route-messages\">\n<main class=\"wrap\">\n <header class=\"chat-head\">\n  <a class=\"back\" id=\"back\" href=\"profile.html\" aria-label=\"Назад\">‹</a>\n  <div class=\"avatar\" id=\"peer-avatar\">◉</div>\n  <div class=\"person\"><div class=\"person-name\" id=\"peer-name\">Открываем переписку…</div><div class=\"person-handle\" id=\"peer-handle\"></div></div>\n  <button class=\"game-toggle\" id=\"game-toggle\" type=\"button\" hidden>Играть</button>\n </header>\n<section class=\"chat\">\n <div class=\"messages\" id=\"messages\"><div class=\"empty\">Подключаем сообщения…</div></div>\n <iframe class=\"game-frame\" id=\"game-frame\" title=\"Игра в длинные нарды\" hidden loading=\"lazy\"></iframe>\n <div class=\"notice\" id=\"notice\" aria-live=\"polite\"></div>\n <progress class=\"upload-progress\" id=\"upload-progress\" max=\"100\" value=\"0\" hidden aria-label=\"Прогресс загрузки вложения\"></progress>\n <section class=\"attachment-preview\" id=\"attachment-preview\" hidden aria-label=\"Предпросмотр вложений\">\n  <div class=\"attachment-preview-list\" id=\"attachment-preview-list\"></div>\n  <div class=\"attachment-preview-footer\">\n   <span class=\"attachment-preview-count\" id=\"attachment-preview-count\"></span>\n   <button class=\"attachment-preview-action\" id=\"attachment-cancel\" type=\"button\">Отмена</button>\n   <button class=\"attachment-preview-action primary\" id=\"attachment-send\" type=\"button\">Отправить</button>\n  </div>\n </section>\n <form class=\"composer\" id=\"composer\">\n  <input id=\"attachment-input\" type=\"file\" hidden multiple accept=\"image/*,video/*,audio/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.txt\">\n  <button class=\"attach\" id=\"attach\" type=\"button\" aria-label=\"Прикрепить фото, видео, аудио или файл\">+</button>\n  <textarea id=\"message-input\" maxlength=\"5000\" rows=\"1\" placeholder=\"Написать сообщение…\" aria-label=\"Текст сообщения\"></textarea>\n  <button class=\"send\" id=\"send\" type=\"submit\" aria-label=\"Отправить\">➤</button>\n </form>\n</section>\n</main>\n<div class=\"photo-viewer\" id=\"photo-viewer\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Просмотр фотографии\" hidden>\n <button class=\"photo-viewer-close\" id=\"photo-viewer-close\" type=\"button\" aria-label=\"Закрыть фотографию\">×</button>\n <img id=\"photo-viewer-image\" alt=\"\">\n</div>\n</section>";
export const title = "Сообщения · FLOUSTREAM";

export function mount(root, { signal, navigate, url }) {
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "messages";
  style.textContent = STYLE;
  root.innerHTML = MARKUP;
  root.appendChild(style);
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

  
const SUPABASE_URL="https://qhpobdktlbhdqsnajypr.supabase.co";
const SUPABASE_KEY="sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
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
async function loadLibrary(){
 if(window.supabase?.createClient)return;
 const sources=[
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://unpkg.com/@supabase/supabase-js@2"
 ];
 let lastError;
 for(const src of sources){
  try{
   await new Promise((resolve,reject)=>{
    const script=document.createElement("script");let settled=false;
    const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);if(error){script.remove();reject(error);}else resolve();};
    const timer=setTimeout(()=>finish(new Error("Тайм-аут загрузки Supabase: "+src)),8000);
    script.src=src;script.onload=()=>window.supabase?.createClient?finish():finish(new Error("Библиотека загружена без createClient"));
    script.onerror=()=>finish(new Error("Не удалось загрузить библиотеку: "+src));
    document.head.append(script);
   });
   if(window.supabase?.createClient)return;
  }catch(error){lastError=error;console.warn("FLOUSTREAM Supabase CDN:",error);}
 }
 throw lastError||new Error("Не удалось загрузить библиотеку Supabase");
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
     try{const metadata=JSON.parse(item.metadata?.metadata||"{}");return item.metadata?.bucketName==="message-media"&&item.metadata?.objectName&&metadata.senderId===viewer.id&&metadata.recipientId===peerId&&metadata.messageId;}catch(_){return false;}
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
  const isPhotoAttachment=(row.attachment_mime||"").toLowerCase().startsWith("image/"),isAudioAttachment=(row.attachment_mime||"").toLowerCase().startsWith("audio/");if(isPhotoAttachment)bubble.classList.add("photo-message");if(isAudioAttachment)bubble.classList.add("voice-message-bubble");
  if(row.attachment_path){const placeholder=document.createElement("div");placeholder.className="message-media-loading"+(isPhotoAttachment?" photo-loading":"");placeholder.textContent="Подготавливаем вложение…";bubble.append(placeholder);pendingAttachments.push({row,placeholder,host});}
  if(row.content&&row.content!==row.attachment_name&&!isVoiceMessage(row)){const body=document.createElement("div");body.textContent=row.content;bubble.append(body);}
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
  const result=await withTimeout(client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_path,attachment_name,attachment_mime,created_at").or(filter).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(200),15000,"Запрос переписки к Supabase не ответил за 15 секунд.");
  if(result.error)throw result.error;
  const rows=(result.data||[]).sort((a,b)=>{
   const timeA=Date.parse(a.created_at)||0,timeB=Date.parse(b.created_at)||0;
   return timeA-timeB||String(a.id||"").localeCompare(String(b.id||""));
  });
  const newest=rows[rows.length-1]?.id||"";
  // Render the conversation independently from read-receipt permissions/network state.
  if(!silent||forceRender||newest!==lastMessageId)await renderMessages(rows);
  if(rows.length){
   try{
    const marked=await client.from("direct_messages").update({read_at:new Date().toISOString()}).eq("recipient_id",viewer.id).eq("sender_id",peerId).is("read_at",null);
    if(marked.error)console.warn("FLOUSTREAM read receipt update:",marked.error);
   }catch(markError){console.warn("FLOUSTREAM read receipt update:",markError);}
  }
 }catch(error){if(!silent){showNotice("Не удалось загрузить сообщения: "+(error.message||String(error)),true);const host=$("messages");host.replaceChildren();const failed=document.createElement("div");failed.className="empty";failed.textContent="Не удалось загрузить переписку. "+(error.message||String(error));host.append(failed);}}
 finally{loading=false;if(pendingMessageReload){pendingMessageReload=false;loadMessages(true,true);}}
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
  const preview=document.createElement("div");preview.className="inbox-preview";preview.textContent=(thread.last.sender_id===viewer.id?"Вы: ":"")+(thread.last.content||("📎 "+(thread.last.attachment_name||"Вложение")));
  const meta=document.createElement("div");meta.className="inbox-meta";const time=document.createElement("div");time.className="inbox-time";time.textContent=timeText(thread.last.created_at);
  const unread=document.createElement("span");unread.className="inbox-unread";unread.hidden=!thread.unread;unread.textContent=thread.unread>99?"99+":String(thread.unread);
  meta.append(time,unread);copy.append(name,preview);link.append(avatar,copy,meta);host.append(link);
 }
}
async function loadInbox(){
 if(inboxLoading){pendingInboxReload=true;return;}inboxLoading=true;
 try{const result=await client.from("direct_messages").select("id,sender_id,recipient_id,content,attachment_name,created_at,read_at").or("sender_id.eq."+viewer.id+",recipient_id.eq."+viewer.id).order("created_at",{ascending:false}).limit(500);
  if(result.error)throw result.error;const rows=result.data||[];const ids=[...new Set(rows.map(row=>row.sender_id===viewer.id?row.recipient_id:row.sender_id).filter(Boolean))];let profiles=[];
  if(ids.length){const people=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);if(people.error)throw people.error;profiles=people.data||[];}renderInbox(rows,profiles);
 }catch(error){showNotice("Не удалось загрузить список сообщений: "+error.message,true);}finally{inboxLoading=false;if(pendingInboxReload){pendingInboxReload=false;queueMicrotask(()=>loadInbox());}}
}
async function start(){
 try{
  showNotice("Подключаем библиотеку чата…");
  await loadLibrary();client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"sb-qhpobdktlbhdqsnajypr-auth-token"}});
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
   let voiceHoldTimer=null,voiceTimer=null,voicePointerActive=false,voiceHoldTriggered=false,voiceRecording=false,voiceCancelled=false,voiceRecorder=null,voiceStream=null,voiceChunks=[],voiceStartedAt=0,voiceStartX=0,voiceAttempt=0,voiceStartError="",voiceSuppressSubmitUntil=0;
const voiceHoldDuration=Number(window.__FLOUSTREAM_TEST_HOLD_MS)||3000;
function formatVoiceDuration(seconds){return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function resetVoiceButton(){const button=$("send");button.classList.remove("arming","recording");button.textContent="➤";button.setAttribute("aria-label","Отправить");}
function releaseVoiceResources(){clearInterval(voiceTimer);voiceTimer=null;if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());voiceStream=null;voiceRecorder=null;voiceRecording=false;voiceChunks=[];resetVoiceButton();}
function updateVoiceNotice(){const seconds=Math.max(0,Math.floor((Date.now()-voiceStartedAt)/1000));showNotice("Запись "+formatVoiceDuration(seconds)+" · отпусти для отправки · свайп отменяет");}
async function startVoiceRecording(){
 const attempt=++voiceAttempt;if(!voicePointerActive||voiceCancelled)return;
 voiceStartError="";
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){voiceStartError="этот браузер не поддерживает запись аудио";showNotice("Не удалось начать запись: "+voiceStartError,true);return;}
 showNotice("Запрашиваем доступ к микрофону…");
 try{
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}catch(error){if(error.name!=="OverconstrainedError"&&error.name!=="TypeError")throw error;stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  if(attempt!==voiceAttempt||!voicePointerActive||voiceCancelled){stream.getTracks().forEach(track=>track.stop());return;}
  voiceStream=stream;
  const supported=["audio/webm;codecs=opus","audio/mp4","audio/webm","audio/ogg;codecs=opus"].find(type=>MediaRecorder.isTypeSupported?.(type));
  const recorder=supported?new MediaRecorder(stream,{mimeType:supported}):new MediaRecorder(stream);
  voiceRecorder=recorder;voiceChunks=[];voiceRecording=true;voiceStartedAt=Date.now();
  recorder.ondataavailable=event=>{if(event.data?.size)voiceChunks.push(event.data);};
  recorder.onerror=()=>{voiceCancelled=true;voiceStartError="ошибка записи аудио";if(recorder.state!=="inactive")recorder.stop();};
  recorder.onstop=()=>{
   const chunks=voiceChunks.slice(),type=recorder.mimeType||"audio/webm",duration=Math.max(1,Math.floor((Date.now()-voiceStartedAt)/1000)),cancelled=voiceCancelled,blob=new Blob(chunks,{type});
   releaseVoiceResources();voicePointerActive=false;voiceHoldTriggered=false;voiceCancelled=false;
   if(cancelled){showNotice(voiceStartError?"Ошибка записи: "+voiceStartError:"Запись отменена.",!!voiceStartError);voiceStartError="";return;}
   if(blob.size<256){showNotice("Запись слишком короткая. Попробуй ещё раз.",true);return;}
   const uploadType=type.split(";")[0].trim().toLowerCase()||"audio/webm",extension=uploadType==="audio/mp4"?"m4a":uploadType==="audio/ogg"?"ogg":uploadType==="audio/mpeg"?"mp3":"webm";
   const file=new File([blob],"voice-message-"+duration+"s."+extension,{type:uploadType,lastModified:Date.now()});
   void sendAttachmentFile(file,{successMessage:"Голосовое сообщение отправлено.",content:formatVoiceDuration(duration)});
  };
  recorder.start(250);
  const button=$("send");button.classList.remove("arming");button.classList.add("recording");button.textContent="●";button.setAttribute("aria-label","Отпустить, чтобы отправить голосовое сообщение");
  updateVoiceNotice();voiceTimer=setInterval(updateVoiceNotice,1000);
 }catch(error){
  if(attempt!==voiceAttempt||voiceCancelled||!voicePointerActive){if(voiceStream)releaseVoiceResources();return;}
  if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());voiceStream=null;voiceRecorder=null;voiceRecording=false;voiceChunks=[];
  voiceStartError=error.message||"проверь разрешение на микрофон";showNotice("Не удалось начать запись: "+voiceStartError,true);$("send").classList.remove("arming");
 }
}
function cancelVoiceRecording(){
 if(!voicePointerActive&&!voiceRecording)return;
 voiceCancelled=true;voicePointerActive=false;voiceAttempt++;voiceSuppressSubmitUntil=Date.now()+1200;clearTimeout(voiceHoldTimer);voiceHoldTimer=null;
 if(voiceRecorder&&voiceRecorder.state!=="inactive"){voiceRecorder.stop();return;}
 if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());voiceStream=null;voiceRecorder=null;voiceChunks=[];voiceRecording=false;voiceHoldTriggered=false;clearInterval(voiceTimer);voiceTimer=null;resetVoiceButton();showNotice("Запись отменена.");
}
function finishVoicePointer(){
 if(!voicePointerActive)return;
 voicePointerActive=false;clearTimeout(voiceHoldTimer);voiceHoldTimer=null;
 if(!voiceHoldTriggered){resetVoiceButton();if($("notice").textContent.startsWith("Удерживай"))showNotice("");return;}
 voiceSuppressSubmitUntil=Date.now()+1200;
 if(voiceRecording&&voiceRecorder&&voiceRecorder.state!=="inactive"){voiceRecorder.stop();return;}
 voiceCancelled=true;voiceAttempt++;clearInterval(voiceTimer);voiceTimer=null;resetVoiceButton();
 if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());voiceStream=null;voiceHoldTriggered=false;
 showNotice(voiceStartError?"Не удалось начать запись: "+voiceStartError:"Запись отменена: микрофон не успел запуститься.",true);
}
$("composer").addEventListener("submit",async event=>{
 event.preventDefault();if(attachmentSending||Date.now()<voiceSuppressSubmitUntil)return;
 const input=$("message-input"),content=input.value.trim();if(!content)return;
 const button=$("send");if(button.disabled)return;button.disabled=true;showNotice("Отправляем…");
 try{const result=await client.from("direct_messages").insert({sender_id:viewer.id,recipient_id:peerId,content});if(result.error)throw result.error;input.value="";showNotice("Сообщение отправлено.");await loadMessages();}
 catch(error){showNotice("Не удалось отправить: "+(error.message||"ошибка соединения"),true);}
 finally{button.disabled=false;input.focus();}
});
const sendButton=$("send");
sendButton.addEventListener("pointerdown",event=>{
 if(attachmentSending||sendButton.disabled||event.isPrimary===false||(event.pointerType==="mouse"&&event.button!==0))return;
 voicePointerActive=true;voiceHoldTriggered=false;voiceCancelled=false;voiceStartError="";voiceStartX=event.clientX;clearTimeout(voiceHoldTimer);
 try{sendButton.setPointerCapture(event.pointerId);}catch(_){ }
 sendButton.classList.add("arming");showNotice("Удерживай 3 секунды для записи голосового сообщения.");
 voiceHoldTimer=setTimeout(()=>{if(!voicePointerActive||voiceCancelled)return;voiceHoldTriggered=true;void startVoiceRecording();},voiceHoldDuration);
});
sendButton.addEventListener("pointerup",finishVoicePointer);
sendButton.addEventListener("pointercancel",()=>{if(voiceHoldTriggered||voiceRecording)cancelVoiceRecording();else{voicePointerActive=false;clearTimeout(voiceHoldTimer);voiceHoldTimer=null;resetVoiceButton();if($("notice").textContent.startsWith("Удерживай"))showNotice("");}});
sendButton.addEventListener("pointermove",event=>{if(voicePointerActive&&voiceHoldTriggered&&Math.abs(event.clientX-voiceStartX)>90)cancelVoiceRecording();});
sendButton.addEventListener("contextmenu",event=>event.preventDefault());
signal.addEventListener("abort",()=>{voiceCancelled=true;clearTimeout(voiceHoldTimer);clearInterval(voiceTimer);if(voiceRecorder&&voiceRecorder.state!=="inactive")voiceRecorder.stop();if(voiceStream)voiceStream.getTracks().forEach(track=>track.stop());},{once:true});
   $("message-input").addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();$("composer").requestSubmit();}});
   $("attach").addEventListener("click",()=>$("attachment-input").click());
   async function attachmentFingerprint(file){
 const partSize=65536;
 try{
  const first=await file.slice(0,Math.min(partSize,file.size)).arrayBuffer();
  const last=file.size>partSize?await file.slice(Math.max(partSize,file.size-partSize)).arrayBuffer():new ArrayBuffer(0);
  const bytes=new Uint8Array(first.byteLength+last.byteLength);bytes.set(new Uint8Array(first),0);bytes.set(new Uint8Array(last),first.byteLength);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  const hash=Array.from(new Uint8Array(digest)).map(value=>value.toString(16).padStart(2,"0")).join("");
  return file.name+"|"+file.size+"|"+(file.type||"")+"|"+hash;
 }catch(_){return file.name+"|"+file.size+"|"+(file.type||"")+"|"+file.lastModified;}
}
async function sendAttachmentFile(file,options={}){
 if(!file||attachmentSending)return false;
 attachmentSending=true;
 const button=$("attach"),input=$("attachment-input"),sendButton=$("send");button.disabled=true;input.disabled=true;sendButton.disabled=true;
 let path=null,uploadCompleted=false,keepUploaded=false,pendingKey=null;
 try{
  if(file.size<=0)throw new Error("Файл пустой.");
  if(file.size>50*1024*1024)throw new Error("Файл больше 50 МБ.");
  const safeName=file.name.replace(/[^A-Za-z0-9._-]/g,"_").slice(0,100)||"attachment";
  const fingerprint=await attachmentFingerprint(file);pendingKey="floustream-pending-attachment:"+viewer.id+":"+peerId+":"+encodeURIComponent(fingerprint);
  let pending=null;try{pending=JSON.parse(sessionStorage.getItem(pendingKey)||"null");}catch(_){pending=null;}
  if(!pending?.path||!pending?.messageId||Date.now()-(pending.updatedAt||0)>86400000){pending={path:viewer.id+"/"+crypto.randomUUID()+"_"+safeName,messageId:crypto.randomUUID(),uploaded:false,updatedAt:Date.now()};try{sessionStorage.setItem(pendingKey,JSON.stringify(pending));}catch(_){}}
  path=pending.path;let messageId=pending.messageId;
  if(!pending.uploaded){setUploadProgress(0);showNotice("Подготавливаем защищённую загрузку…");const uploaded=await uploadFileResumable(file,path,messageId);path=uploaded.path;messageId=uploaded.messageId;uploadCompleted=true;pending={path,messageId,uploaded:true,updatedAt:Date.now()};try{sessionStorage.setItem(pendingKey,JSON.stringify(pending));}catch(_){}}
  else{uploadCompleted=true;setUploadProgress(100);showNotice("Проверяем результат предыдущей отправки…");}
  const row={id:messageId,sender_id:viewer.id,recipient_id:peerId,content:options.content||"",attachment_path:path,attachment_name:file.name,attachment_mime:file.type||"application/octet-stream"};
  try{const sent=await withTimeout(client.from("direct_messages").insert(row),15000,"Сервер не подтвердил отправку сообщения за 15 секунд.");if(sent.error)throw sent.error;}
  catch(insertError){
   let confirmation;
   try{confirmation=await withTimeout(client.from("direct_messages").select("id,attachment_path").eq("id",messageId).maybeSingle(),8000,"Не удалось проверить результат отправки.");}
   catch(checkError){keepUploaded=true;throw new Error("Файл загружен, но подтверждение сообщения не получено. Не отправляй его повторно — обнови переписку через несколько секунд.");}
   if(confirmation.error){keepUploaded=true;throw new Error("Не удалось проверить запись сообщения. Файл оставлен в хранилище, чтобы не повредить возможную отправку. Обнови переписку через несколько секунд.");}
   if(!confirmation.data?.id||confirmation.data.attachment_path!==path){const ambiguous=insertError.message==="Сервер не подтвердил отправку сообщения за 15 секунд."||!Number.isFinite(Number(insertError.status))||Number(insertError.status)>=500;if(ambiguous){keepUploaded=true;throw new Error("Сервер пока не подтвердил отправку. Файл оставлен в хранилище — не отправляй его повторно, обнови переписку через несколько секунд.");}throw insertError;}
  }
  try{sessionStorage.removeItem(pendingKey);}catch(_){ }
  showNotice(options.successMessage||"Вложение отправлено.");await loadMessages();return true;
 }catch(error){
  if(uploadCompleted&&path&&!keepUploaded){try{await withTimeout(client.storage.from("message-media").remove([path]),10000,"Тайм-аут очистки неиспользованного файла.");}catch(cleanupError){console.warn("FLOUSTREAM orphan attachment cleanup:",cleanupError);}try{if(pendingKey)sessionStorage.removeItem(pendingKey);}catch(_){}}
  showNotice("Не удалось отправить файл: "+(error.message||"ошибка соединения"),true);return false;
 }finally{attachmentSending=false;button.disabled=false;input.disabled=false;input.value="";sendButton.disabled=false;setUploadProgress(null);}
}
function revokeGalleryPreviewUrls(){
 for(const url of galleryPreviewUrls)URL.revokeObjectURL(url);
 galleryPreviewUrls=[];
}
function formatFileSize(bytes){
 if(bytes<1024)return bytes+" Б";
 if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" КБ";
 return (bytes/(1024*1024)).toFixed(1)+" МБ";
}
function renderGalleryPreview(){
 const host=$("attachment-preview-list");revokeGalleryPreviewUrls();host.replaceChildren();
 pendingGalleryFiles.forEach((file,index)=>{
  const item=document.createElement("div");item.className="attachment-preview-item";
  const mime=(file.type||"").toLowerCase();
  if(mime.startsWith("image/")||mime.startsWith("video/")){
   const url=URL.createObjectURL(file);galleryPreviewUrls.push(url);
   const media=document.createElement(mime.startsWith("video/")?"video":"img");media.className="attachment-preview-thumb";media.src=url;media.alt=mime.startsWith("image/")?file.name:"";if(media.tagName==="VIDEO"){media.muted=true;media.playsInline=true;media.preload="metadata";}
   item.append(media);
  }else{
   const icon=document.createElement("span");icon.className="attachment-preview-thumb";icon.textContent="📄";icon.style.display="grid";icon.style.placeItems="center";item.append(icon);
  }
  const meta=document.createElement("div");meta.className="attachment-preview-meta";
  const name=document.createElement("span");name.className="attachment-preview-name";name.textContent=file.name;
  const size=document.createElement("span");size.className="attachment-preview-size";size.textContent=formatFileSize(file.size);
  meta.append(name,size);
  const remove=document.createElement("button");remove.type="button";remove.className="attachment-preview-remove";remove.textContent="×";remove.setAttribute("aria-label","Убрать "+file.name);
  remove.addEventListener("click",()=>{pendingGalleryFiles.splice(index,1);renderGalleryPreview();});
  item.append(meta,remove);host.append(item);
 });
 $("attachment-preview-count").textContent=pendingGalleryFiles.length?"Выбрано файлов: "+pendingGalleryFiles.length:"";
 $("attachment-preview").hidden=pendingGalleryFiles.length===0;
 $("attachment-send").disabled=pendingGalleryFiles.length===0||attachmentSending;
 $("attachment-cancel").disabled=attachmentSending;
}
async function sendAttachmentFiles(files){
 const selected=Array.from(files||[]);
 for(let index=0;index<selected.length;index++){
  const successMessage=selected.length>1?"Отправлено вложение "+(index+1)+" из "+selected.length+".":undefined;
  const sent=await sendAttachmentFile(selected[index],{successMessage});
  if(!sent){pendingGalleryFiles=selected.slice(index);renderGalleryPreview();return false;}
 }
 return true;
}
$("attachment-cancel").addEventListener("click",()=>{pendingGalleryFiles=[];$("attachment-input").value="";renderGalleryPreview();});
$("attachment-send").addEventListener("click",async()=>{
 if(!pendingGalleryFiles.length||attachmentSending)return;
 $("attachment-send").disabled=true;$("attachment-cancel").disabled=true;
 const sent=await sendAttachmentFiles(pendingGalleryFiles);
 if(sent)pendingGalleryFiles=[];
 renderGalleryPreview();$("attachment-cancel").disabled=false;
});
$("attachment-input").addEventListener("change",event=>{
 const files=Array.from(event.target.files||[]);event.target.value="";
 if(files.length){pendingGalleryFiles=files;renderGalleryPreview();}
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
    try { await client?.auth?.stopAutoRefresh?.(); } catch (_) {}
    root.replaceChildren();
  };
}
