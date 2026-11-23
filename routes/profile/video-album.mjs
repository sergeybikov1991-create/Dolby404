import { SUPABASE_URL, SUPABASE_KEY } from "../../shared/supabase-client.mjs";

export function initProfileVideoAlbum({ getClient, getUser, $ }) {
  const client = new Proxy({}, {
    get(_target, property) {
      const current = getClient();
      const value = current?.[property];
      return typeof value === "function" ? value.bind(current) : value;
    }
  });
  const user = new Proxy({}, {
    get(_target, property) {
      return getUser()?.[property];
    }
  });

let videoAlbumItems=[],videoAlbumIndex=0,privateVideoItems=[],privateVideoIndex=0;
function videoAlbumMessage(id,message){const node=$(id);if(node)node.textContent=message||"";}
function addVideoFrameThumbnail(tile,item){
 const frame=document.createElement("video");
 frame.className="video-album-frame";
 frame.muted=true;frame.defaultMuted=true;frame.playsInline=true;
 frame.preload="metadata";frame.setAttribute("aria-hidden","true");
 frame.addEventListener("loadedmetadata",()=>{
  if(!Number.isFinite(frame.duration)||frame.duration<=0)return;
  try{frame.currentTime=Math.min(0.25,frame.duration/2);}catch(_){}
 },{once:true});
 frame.addEventListener("error",()=>{frame.removeAttribute("src");frame.load();},{once:true});
 frame.src=item.url;
 tile.append(frame);
}
function stopVideoPlayer(id){const player=$(id);if(player){player.pause();player.removeAttribute("src");player.load();}}
async function openVideoAlbum(){
 $("video-album-backdrop").hidden=false;
 $("video-album-upload-panel").hidden=true;
 $("video-album-viewer").hidden=true;
 $("video-album-file").value="";
 $("video-album-private").checked=false;
 videoAlbumMessage("video-album-status","");
 await loadVideoAlbum();
}
async function loadVideoAlbum(){
 const grid=$("video-album-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем видео…";grid.append(loading);
 try{
  const result=await client.from("video_album_videos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){videoAlbumItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Здесь пока нет видео. Добавь первое!";grid.append(empty);return;}
  const signed=await client.storage.from("video-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  videoAlbumItems=rows.filter(item=>urls.has(item.object_path)).map(item=>({...item,url:urls.get(item.object_path)}));
  grid.replaceChildren();
  if(!videoAlbumItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на видео. Попробуй обновить альбом.";grid.append(empty);return;}
  videoAlbumItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="video-album-item";tile.setAttribute("aria-label","Открыть видео: "+(item.file_name||"видео"));
   addVideoFrameThumbnail(tile,item);
   tile.addEventListener("click",()=>showVideoAlbumItem(index,false,true));grid.append(tile);
  });
  videoAlbumMessage("video-album-status","");
 }catch(error){grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось загрузить видео: "+error.message;grid.append(empty);}
}
async function loadPrivateVideoAlbum(){
 const grid=$("private-video-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем приватные видео…";grid.append(loading);
 try{
  const result=await client.from("private_video_album_videos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){privateVideoItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="В приватном видеоальбоме пока нет видео.";grid.append(empty);return;}
  const signed=await client.storage.from("private-video-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  privateVideoItems=rows.filter(item=>urls.has(item.object_path)).map(item=>({...item,url:urls.get(item.object_path)}));
  grid.replaceChildren();
  if(!privateVideoItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на приватные видео.";grid.append(empty);return;}
  privateVideoItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="video-album-item";tile.setAttribute("aria-label","Открыть приватное видео");
   addVideoFrameThumbnail(tile,item);
   tile.addEventListener("click",()=>showVideoAlbumItem(index,true,true));grid.append(tile);
  });
  videoAlbumMessage("private-video-status","");
 }catch(error){grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось открыть приватный видеоальбом: "+error.message;grid.append(empty);}
}
async function openPrivateVideoAlbum(){
 $("private-video-backdrop").hidden=false;
 await loadPrivateVideoAlbum();
}
function showVideoAlbumItem(index,isPrivate,openFullscreen=false){
 const items=isPrivate?privateVideoItems:videoAlbumItems;
 if(!items.length)return;
 const next=Math.max(0,Math.min(index,items.length-1));
 if(isPrivate)privateVideoIndex=next;else videoAlbumIndex=next;
 const item=items[next],player=$(isPrivate?"private-video-player":"video-album-player");
 player.pause();player.src=item.url;player.load();
 $(isPrivate?"private-video-viewer-counter":"video-album-viewer-counter").textContent=(next+1)+" / "+items.length;
 $(isPrivate?"private-video-viewer":"video-album-viewer").hidden=false;
 if(openFullscreen){
  const playRequest=player.play();
  if(playRequest&&typeof playRequest.catch==="function")playRequest.catch(()=>{});
 }
}
function bindVideoSwipe(viewerId,playerId,isPrivate){
 const stage=$(viewerId).querySelector(".video-viewer-stage");
 if(!stage||stage.dataset.swipeBound)return;
 stage.dataset.swipeBound="true";
 let start=null;
 stage.addEventListener("touchstart",event=>{
  if(event.touches.length!==1)return;
  const touch=event.touches[0];start={x:touch.clientX,y:touch.clientY};
 },{passive:true});
 stage.addEventListener("touchend",event=>{
  if(!start||!event.changedTouches.length)return;
  const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;start=null;
  if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;
  const items=isPrivate?privateVideoItems:videoAlbumItems;
  const current=isPrivate?privateVideoIndex:videoAlbumIndex;
  const next=current+(dx<0?1:-1);
  if(next<0||next>=items.length)return;
  showVideoAlbumItem(next,isPrivate,true);
 },{passive:true});
}
bindVideoSwipe("video-album-viewer","video-album-player",false);
bindVideoSwipe("private-video-viewer","private-video-player",true);
function closeVideoAlbumViewer(isPrivate){
 const viewer=isPrivate?"private-video-viewer":"video-album-viewer";
 const player=isPrivate?"private-video-player":"video-album-player";
 $(viewer).hidden=true;stopVideoPlayer(player);
}
async function deleteCurrentVideo(isPrivate){
 const items=isPrivate?privateVideoItems:videoAlbumItems;
 const index=isPrivate?privateVideoIndex:videoAlbumIndex;
 const item=items[index];if(!item)return;
 if(!confirm("Удалить это видео без возможности восстановления?"))return;
 const button=$(isPrivate?"private-video-viewer-delete":"video-album-viewer-delete");button.disabled=true;
 const bucket=isPrivate?"private-video-albums":"video-albums";
 const table=isPrivate?"private_video_album_videos":"video_album_videos";
 try{
  const removed=await client.storage.from(bucket).remove([item.object_path]);if(removed.error)throw removed.error;
  const deleted=await client.from(table).delete().eq("id",item.id).eq("owner_id",user.id);if(deleted.error)throw deleted.error;
  closeVideoAlbumViewer(isPrivate);
  if(isPrivate)await loadPrivateVideoAlbum();else await loadVideoAlbum();
 }catch(error){alert("Не удалось удалить видео: "+error.message);}
 finally{button.disabled=false;}
}
$("video-album-close").addEventListener("click",()=>{$("video-album-backdrop").hidden=true;closeVideoAlbumViewer(false);});
$("video-album-backdrop").addEventListener("click",e=>{if(e.target===$("video-album-backdrop"))$("video-album-backdrop").hidden=true;});
$("video-album-add-open").addEventListener("click",()=>{$("video-album-upload-panel").hidden=!$("video-album-upload-panel").hidden;if(!$("video-album-upload-panel").hidden)$("video-album-file").focus();});
$("video-album-add-cancel").addEventListener("click",()=>{$("video-album-upload-panel").hidden=true;$("video-album-file").value="";videoAlbumMessage("video-album-status","");});
$("video-album-private").addEventListener("change",()=>{videoAlbumMessage("video-album-privacy-note",$("video-album-private").checked?"🔒 Видео сохранится в закрытом хранилище. Только твой аккаунт сможет его открыть.":"Обычные видео будут доступны в профиле согласно настройкам приватности. Если включить галочку, выбранные ролики попадут в секретный видеоальбом.");});
let tusLibraryPromise=null;
function loadTusLibrary(){
 if(window.tus&&window.tus.Upload)return Promise.resolve();
 if(!tusLibraryPromise){
  tusLibraryPromise=new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   script.src="https://cdn.jsdelivr.net/npm/tus-js-client@4/dist/tus.min.js";
   script.onload=()=>window.tus&&window.tus.Upload?resolve():reject(new Error("Библиотека возобновляемой загрузки не загрузилась."));
   script.onerror=()=>reject(new Error("Не удалось загрузить модуль загрузки видео."));
   document.head.appendChild(script);
  });
 }
 return tusLibraryPromise;
}
async function uploadVideoResumable(bucket,path,file,onProgress){
 await loadTusLibrary();
 const sessionResult=await client.auth.getSession();
 if(sessionResult.error)throw sessionResult.error;
 const token=sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.access_token;
 if(!token)throw new Error("Сессия истекла. Войди в аккаунт заново.");
 const ext=(file.name.split(".").pop()||"mp4").toLowerCase();
 const contentType=file.type||"video/"+(ext==="mov"?"quicktime":ext);
 const endpoint=SUPABASE_URL.replace(".supabase.co",".storage.supabase.co")+"/storage/v1/upload/resumable";
 return await new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;error?reject(error):resolve(value);};
  const upload=new window.tus.Upload(file,{
   endpoint,
   retryDelays:[0,3000,5000,10000,20000],
   headers:{authorization:"Bearer "+token,apikey:SUPABASE_KEY},
   metadata:{bucketName:bucket,objectName:path,contentType,cacheControl:"3600"},
   chunkSize:6*1024*1024,
   uploadDataDuringCreation:true,
   removeFingerprintOnSuccess:true,
   onError:error=>finish(error),
   onProgress:(uploaded,total)=>onProgress(uploaded,total),
   onSuccess:()=>finish(null,path)
  });
  upload.findPreviousUploads().then(previous=>{
   const match=previous.find(item=>item.metadata&&item.metadata.bucketName===bucket&&item.metadata.objectName&&item.metadata.objectName.startsWith(user.id+"/"));
   if(match){
    path=match.metadata.objectName;
    upload.resumeFromPreviousUpload(match);
   }
   upload.start();
  }).catch(error=>finish(error));
 });
}
$("video-album-upload-button").addEventListener("click",async()=>{
 const files=Array.from($("video-album-file").files||[]);
 if(!files.length){videoAlbumMessage("video-album-status","Сначала выбери одно или несколько видео.");return;}
 const allowed=["video/mp4","video/webm","video/quicktime"];
 const extAllowed=/\.(mp4|webm|mov)$/i;
 const invalid=files.find(file=>!(allowed.includes(file.type)||(!file.type&&extAllowed.test(file.name))));
 if(invalid){videoAlbumMessage("video-album-status","Файл «"+invalid.name+"» имеет неподдерживаемый формат. Подойдут MP4, WebM и MOV.");return;}
 const tooLarge=files.find(file=>file.size>50*1024*1024);
 if(tooLarge){videoAlbumMessage("video-album-status","Файл «"+tooLarge.name+"» превышает лимит бесплатного тарифа — 50 МБ.");return;}
 const isPrivate=$("video-album-private").checked;
 const bucket=isPrivate?"private-video-albums":"video-albums";
 const table=isPrivate?"private_video_album_videos":"video_album_videos";
 const button=$("video-album-upload-button");button.disabled=true;let count=0;const failures=[];
 try{
  for(let i=0;i<files.length;i++){
   const file=files[i];videoAlbumMessage("video-album-status","Подготавливаем загрузку "+(i+1)+" из "+files.length+": "+file.name);
   const ext=(file.name.split(".").pop()||"mp4").toLowerCase();
   let path=user.id+"/"+Date.now()+"-"+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2))+"."+ext;
   try{
    path=await uploadVideoResumable(bucket,path,file,(uploaded,total)=>{
     const percent=total?Math.floor(uploaded/total*100):0;
     const mb=(uploaded/1024/1024).toFixed(1),totalMb=(total/1024/1024).toFixed(1);
     videoAlbumMessage("video-album-status","Загружаем "+(i+1)+" из "+files.length+": "+file.name+" — "+percent+"% ("+mb+" / "+totalMb+" МБ)");
    });
    const saved=await client.from(table).insert({owner_id:user.id,object_path:path,file_name:file.name,mime_type:file.type||null});
    if(saved.error){await client.storage.from(bucket).remove([path]);throw saved.error;}
    count++;
   }catch(error){failures.push(file.name+": "+error.message);}
  }
  $("video-album-file").value="";$("video-album-upload-panel").hidden=true;
  videoAlbumMessage("video-album-status",(count?"Загружено видео: "+count+". ":"")+(failures.length?"Ошибки: "+failures.join(" | "):"Готово!"));
  if(isPrivate)await loadPrivateVideoAlbum();else await loadVideoAlbum();
 }catch(error){videoAlbumMessage("video-album-status","Не удалось загрузить видео: "+error.message);}
 finally{button.disabled=false;}
});
$("private-video-open").addEventListener("click",openPrivateVideoAlbum);
$("private-video-close").addEventListener("click",()=>{$("private-video-backdrop").hidden=true;closeVideoAlbumViewer(true);});
$("private-video-backdrop").addEventListener("click",e=>{if(e.target===$("private-video-backdrop"))$("private-video-backdrop").hidden=true;});
$("video-album-viewer-close").addEventListener("click",()=>closeVideoAlbumViewer(false));
$("private-video-viewer-close").addEventListener("click",()=>closeVideoAlbumViewer(true));
$("video-album-viewer-delete").addEventListener("click",()=>deleteCurrentVideo(false));
$("private-video-viewer-delete").addEventListener("click",()=>deleteCurrentVideo(true));
$("video-album-viewer").addEventListener("click",e=>{if(e.target===$("video-album-viewer"))closeVideoAlbumViewer(false);});
$("private-video-viewer").addEventListener("click",e=>{if(e.target===$("private-video-viewer"))closeVideoAlbumViewer(true);});


  return {
    openVideoAlbum,
    dispose() {
      stopVideoPlayer("video-album-player");
      stopVideoPlayer("private-video-player");
    }
  };
}
