export function initProfilePhotoAlbum({ getClient, getUser, getProfile, $, signal }) {
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
  const profile = new Proxy({}, {
    get(_target, property) {
      return getProfile()?.[property];
    }
  });

async function openPhotoAlbum(){
 $("album-backdrop").hidden=false;
 $("album-file").value="";$("album-status").textContent="";
 $("album-upload-panel").hidden=true;$("album-viewer").hidden=true;
 await loadPhotoAlbum();
}

let privateAlbumItems=[],privateAlbumIndex=0;
async function openPrivateAlbum(){$("private-album-backdrop").hidden=false;await loadPrivateAlbum();}
async function loadPrivateAlbum(){
 const grid=$("private-album-grid"),status=$("private-album-status");grid.replaceChildren();status.textContent="Загружаем приватные фотографии…";
 try{
  const result=await client.from("private_album_photos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;const rows=result.data||[];
  if(!rows.length){privateAlbumItems=[];status.textContent="В приватном альбоме пока нет фотографий.";return;}
  const signed=await client.storage.from("private-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const urls=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  privateAlbumItems=rows.filter(x=>urls.has(x.object_path)).map(x=>({...x,url:urls.get(x.object_path)}));status.textContent="";
  if(!privateAlbumItems.length){status.textContent="Не удалось получить ссылки на приватные фотографии.";return;}
  privateAlbumItems.forEach((item,i)=>{const tile=document.createElement("button");tile.type="button";tile.className="album-item";tile.setAttribute("aria-label","Открыть приватное фото");const img=document.createElement("img");img.alt="Приватная фотография";img.loading="lazy";tile.append(img);queueAlbumThumb(img,item,"private-albums",false);tile.addEventListener("click",()=>showPrivateAlbumPhoto(i));grid.append(tile);});
 }catch(e){privateAlbumItems=[];status.textContent="Не удалось загрузить приватный альбом: "+e.message;}
}
function renderPrivateAlbumThumbnails(){
 const host=$("private-album-thumbnails-track");if(!host)return;host.replaceChildren();
 privateAlbumItems.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className="album-viewer-thumb"+(i===privateAlbumIndex?" active":"");b.setAttribute("aria-label","Перейти к приватному фото "+(i+1));const img=document.createElement("img");img.alt="";img.loading="lazy";b.append(img);queueAlbumThumb(img,item,"private-albums",false);b.addEventListener("click",()=>{showPrivateAlbumPhoto(i);$("private-album-thumbnails").hidden=true;});host.append(b);});
 const active=host.children[privateAlbumIndex];if(active)active.scrollIntoView({block:"nearest",inline:"center"});
}
let privateAlbumDisplayRequest=0,privateAlbumPendingIndex=null;
async function showPrivateAlbumPhoto(i){
 if(!privateAlbumItems.length)return;
 const index=(i+privateAlbumItems.length)%privateAlbumItems.length,item=privateAlbumItems[index],request=++privateAlbumDisplayRequest;
 privateAlbumPendingIndex=index;
 $("private-album-prev").hidden=privateAlbumItems.length<2;$("private-album-next").hidden=privateAlbumItems.length<2;$("private-album-viewer").hidden=false;
 let url=item.url;try{url=await getAlbumDisplayUrl(item,"private-albums");}catch(_){}
 if(request!==privateAlbumDisplayRequest)return;
 try{await preloadAlbumImage(url);}catch(_){url=item.url;try{await preloadAlbumImage(url);}catch(__){}}
 if(request!==privateAlbumDisplayRequest)return;
 privateAlbumIndex=index;privateAlbumPendingIndex=null;
 const image=$("private-album-image");image.src=url;image.alt=item.file_name||"Приватная фотография";
 $("private-album-counter").textContent=(index+1)+" / "+privateAlbumItems.length;
 renderPrivateAlbumThumbnails();preloadAlbumNeighbors(privateAlbumItems,index,"private-albums");
}
function stepPrivateAlbumPhoto(delta){
 const base=privateAlbumPendingIndex===null?privateAlbumIndex:privateAlbumPendingIndex;
 showPrivateAlbumPhoto(base+delta);
}
function closePrivateAlbumViewer(){$("private-album-viewer").hidden=true;$("private-album-image").removeAttribute("src");}
$("album-private-open").addEventListener("click",openPrivateAlbum);
$("private-album-close").addEventListener("click",()=>$("private-album-backdrop").hidden=true);
$("private-album-backdrop").addEventListener("click",e=>{if(e.target===$("private-album-backdrop"))$("private-album-backdrop").hidden=true;});
$("private-album-viewer-close").addEventListener("click",closePrivateAlbumViewer);
$("private-album-prev").addEventListener("click",()=>stepPrivateAlbumPhoto(-1));
$("private-album-next").addEventListener("click",()=>stepPrivateAlbumPhoto(1));
$("private-album-viewer").addEventListener("click",e=>{if(e.target===$("private-album-viewer"))closePrivateAlbumViewer();});
$("private-album-delete").addEventListener("click",async()=>{
 const item=privateAlbumItems[privateAlbumIndex];if(!item)return;if(!confirm("Удалить эту приватную фотографию без возможности восстановления?"))return;
 const b=$("private-album-delete");b.disabled=true;
 try{const a=await client.storage.from("private-albums").remove([item.object_path]);if(a.error)throw a.error;const d=await client.from("private_album_photos").delete().eq("id",item.id).eq("owner_id",user.id);if(d.error)throw d.error;closePrivateAlbumViewer();await loadPrivateAlbum();}
 catch(e){alert("Не удалось удалить приватное фото: "+e.message);}finally{b.disabled=false;}
});
let privateSwipe=null;
$("private-album-viewer").addEventListener("pointerdown",e=>{if(e.target.closest("button")||(e.pointerType==="mouse"&&e.button!==0))return;privateSwipe={id:e.pointerId,x:e.clientX,y:e.clientY};try{$("private-album-viewer").setPointerCapture(e.pointerId);}catch(_){}});
$("private-album-viewer").addEventListener("pointerup",e=>{if(!privateSwipe||privateSwipe.id!==e.pointerId)return;const dx=e.clientX-privateSwipe.x,dy=e.clientY-privateSwipe.y;privateSwipe=null;if(Math.abs(dy)>=55&&Math.abs(dy)>Math.abs(dx)*1.2){if(dy<0){renderPrivateAlbumThumbnails();$("private-album-thumbnails").hidden=false;}else $("private-album-thumbnails").hidden=true;return;}if(Math.abs(dx)>=32&&Math.abs(dx)>=Math.abs(dy)*1.15){$("private-album-thumbnails").hidden=true;stepPrivateAlbumPhoto(dx<0?1:-1);}});
$("private-album-viewer").addEventListener("pointercancel",()=>{privateSwipe=null;});
$("private-album-viewer").addEventListener("lostpointercapture",()=>{privateSwipe=null;});
$("album-add-open").addEventListener("click",()=>{
 $("album-upload-panel").hidden=!$("album-upload-panel").hidden;
 if(!$("album-upload-panel").hidden)$("album-file").focus();
});
$("album-add-cancel").addEventListener("click",()=>{
 $("album-upload-panel").hidden=true;$("album-file").value="";$("album-status").textContent="";
});
let albumViewerItems=[],albumViewerIndex=0,albumTouchStartX=0,albumTouchStartY=0;
function closeAlbumViewer(){$("album-viewer").hidden=true;$("album-viewer-image").removeAttribute("src");}
$("album-share-close").addEventListener("click",()=>{$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;});
$("album-share-backdrop").addEventListener("click",e=>{if(e.target===$("album-share-backdrop")){$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;}});
async function loadAlbumShareFriends(){
 const host=$("album-share-friends");host.replaceChildren();
 try{
  const following=await client.from("follows").select("following_id").eq("follower_id",user.id);
  if(following.error)throw following.error;
  const ids=(following.data||[]).map(x=>x.following_id);
  if(!ids.length){host.innerHTML='<div class="album-empty">Пока нет друзей для отправки.</div>';return;}
  const mutual=await client.from("follows").select("follower_id").eq("following_id",user.id).in("follower_id",ids);
  if(mutual.error)throw mutual.error;
  const friendIds=(mutual.data||[]).map(x=>x.follower_id);
  if(!friendIds.length){host.innerHTML='<div class="album-empty">Пока нет взаимных друзей.</div>';return;}
  const profiles=await client.from("profiles").select("id,username,display_name,avatar_url,last_activity_at,time_zone").in("id",friendIds);
  if(profiles.error)throw profiles.error;
  host.replaceChildren();
  profiles.data.forEach(friend=>{
   const button=document.createElement("button");button.type="button";button.className="album-share-friend";
   const avatar=document.createElement("span");avatar.className="album-share-avatar";
   if(friend.avatar_url){const img=document.createElement("img");img.src=friend.avatar_url;img.alt="";avatar.append(img);}
   else avatar.textContent=(friend.display_name||friend.username||"?").slice(0,1).toUpperCase();
   const name=document.createElement("span");name.textContent=friend.display_name||friend.username||"Пользователь";
   button.append(avatar,name);
   button.addEventListener("click",()=>{
    albumSelectedFriend=friend;
    host.querySelectorAll(".album-share-friend").forEach(x=>x.classList.remove("selected"));
    button.classList.add("selected");$("album-share-send").disabled=false;
   });
   host.append(button);
  });
 }catch(error){host.innerHTML='<div class="album-empty">Не удалось загрузить друзей: '+String(error.message||error).replace(/[<>]/g,"")+'</div>';}
}
$("album-share-send").addEventListener("click",async()=>{
 const friend=albumSelectedFriend,share=albumShareSource,item=share?.item;
 if(!friend||!item||!share?.bucket)return;
 const button=$("album-share-send");button.disabled=true;$("album-share-status").textContent="Отправляем фото…";
 let newPath=null;
 try{
  const downloaded=await client.storage.from(share.bucket).download(item.object_path);
  if(downloaded.error)throw downloaded.error;
  const ext=(item.mime_type||"image/jpeg").split("/")[1]||"jpg";
  newPath=user.id+"/"+crypto.randomUUID()+"."+ext;
  const uploaded=await client.storage.from("message-media").upload(newPath,downloaded.data,{upsert:false,contentType:item.mime_type||"image/jpeg"});
  if(uploaded.error)throw uploaded.error;
  const sent=await client.from("direct_messages").insert({sender_id:user.id,recipient_id:friend.id,content:"",attachment_path:newPath,attachment_name:item.file_name||"Фото",attachment_mime:item.mime_type||"image/jpeg"});
  if(sent.error)throw sent.error;
  $("album-share-status").textContent="Фото отправлено пользователю "+(friend.display_name||friend.username||"");
  button.disabled=true;
  profileTimeout(()=>{$("album-share-backdrop").hidden=true;albumShareSource=null;albumSelectedFriend=null;},900);
 }catch(error){
  if(newPath)await client.storage.from("message-media").remove([newPath]);
  $("album-share-status").textContent="Не удалось отправить фото: "+error.message;button.disabled=false;
 }
});
function renderAlbumViewerThumbnails(){
 const host=$("album-viewer-thumbnails-track");if(!host)return;host.replaceChildren();
 albumViewerItems.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className="album-viewer-thumb"+(i===albumViewerIndex?" active":"");b.setAttribute("aria-label","Перейти к фото "+(i+1));const img=document.createElement("img");img.alt="";img.loading="lazy";b.append(img);queueAlbumThumb(img,item,"photo-albums",true);b.addEventListener("click",()=>{showAlbumViewerPhoto(i);$("album-viewer-thumbnails").hidden=true;});host.append(b);});
 const active=host.children[albumViewerIndex];if(active)active.scrollIntoView({block:"nearest",inline:"center"});
}
let albumDisplayRequest=0,albumViewerPendingIndex=null;
async function showAlbumViewerPhoto(index){
 if(!albumViewerItems.length)return;
 const currentIndex=(index+albumViewerItems.length)%albumViewerItems.length,item=albumViewerItems[currentIndex],request=++albumDisplayRequest;
 albumViewerPendingIndex=currentIndex;
 $("album-viewer-prev").hidden=albumViewerItems.length<2;$("album-viewer-next").hidden=albumViewerItems.length<2;
 let url=item.url;try{url=await getAlbumDisplayUrl(item,"photo-albums");}catch(_){}
 if(request!==albumDisplayRequest)return;
 try{await preloadAlbumImage(url);}catch(_){url=item.url;try{await preloadAlbumImage(url);}catch(__){}}
 if(request!==albumDisplayRequest)return;
 albumViewerIndex=currentIndex;albumViewerPendingIndex=null;
 const image=$("album-viewer-image");image.src=url;image.alt=item.file_name||"Фотография";
 $("album-viewer-counter").textContent=(currentIndex+1)+" / "+albumViewerItems.length;
 renderAlbumViewerThumbnails();preloadAlbumNeighbors(albumViewerItems,currentIndex,"photo-albums");
}
function stepAlbumViewerPhoto(delta){
 const base=albumViewerPendingIndex===null?albumViewerIndex:albumViewerPendingIndex;
 showAlbumViewerPhoto(base+delta);
}
let albumSelectedFriend=null,albumShareSource=null;
async function openAlbumShare(source){if(!source?.item)return;albumShareSource=source;$("album-share-backdrop").hidden=false;$("album-share-status").textContent="";$("album-share-send").disabled=true;albumSelectedFriend=null;await loadAlbumShareFriends();}
$("album-viewer-delete").addEventListener("click",async()=>{
 const item=albumViewerItems[albumViewerIndex];if(!item)return;
 if(!confirm("Удалить эту фотографию без возможности восстановления?"))return;
 const button=$("album-viewer-delete");button.disabled=true;
 try{
  const isCurrentAvatar=profile?.avatar_photo_id===item.id;
  const oldAvatarUrl=isCurrentAvatar?profile.avatar_url:null;
  const row=await client.from("photo_album_photos").delete().eq("id",item.id).eq("owner_id",user.id).select("id").maybeSingle();
  if(row.error)throw row.error;
  if(!row.data)throw new Error("Фотография уже удалена или недоступна.");
  if(isCurrentAvatar){
   profile.avatar_photo_id=null;profile.avatar_url=null;columns=Object.keys(profile);render();
   const marker="/storage/v1/object/public/avatars/";
   const markerIndex=oldAvatarUrl?oldAvatarUrl.indexOf(marker):-1;
   if(markerIndex>=0){
    try{const avatarPath=decodeURIComponent(oldAvatarUrl.slice(markerIndex+marker.length).split("?")[0]);await client.storage.from("avatars").remove([avatarPath]);}catch(_){}
   }
  }
  const removed=await client.storage.from("photo-albums").remove([item.object_path]);
  if(removed.error)console.warn("FLOUSTREAM album file cleanup:",removed.error);
  albumViewerItems.splice(albumViewerIndex,1);
  if(!albumViewerItems.length){closeAlbumViewer();await loadPhotoAlbum();return;}
  if(albumViewerIndex>=albumViewerItems.length)albumViewerIndex=albumViewerItems.length-1;
  await loadPhotoAlbum();
  if(albumViewerItems.length){$("album-viewer").hidden=false;showAlbumViewerPhoto(albumViewerIndex);}else closeAlbumViewer();
 }catch(error){$("album-status").textContent="Не удалось удалить фото: "+error.message;}
 finally{button.disabled=false;}
});
$("album-viewer-share").addEventListener("click",()=>openAlbumShare({item:albumViewerItems[albumViewerIndex],bucket:"photo-albums"}));
$("private-album-share").addEventListener("click",()=>openAlbumShare({item:privateAlbumItems[privateAlbumIndex],bucket:"private-albums"}));
$("album-viewer-close").addEventListener("click",closeAlbumViewer);
$("album-viewer-prev").addEventListener("click",()=>stepAlbumViewerPhoto(-1));
$("album-viewer-next").addEventListener("click",()=>stepAlbumViewerPhoto(1));
$("album-viewer").addEventListener("click",e=>{if(e.target===$("album-viewer"))closeAlbumViewer();});
let albumSwipeStart=null;
$("album-viewer").addEventListener("pointerdown",e=>{
 if($("album-viewer").hidden||e.target.closest("button"))return;
 if(e.pointerType==="mouse"&&e.button!==0)return;
 albumSwipeStart={id:e.pointerId,x:e.clientX,y:e.clientY};
 try{$("album-viewer").setPointerCapture(e.pointerId);}catch(_){}
});
$("album-viewer").addEventListener("pointerup",e=>{
 if(!albumSwipeStart||albumSwipeStart.id!==e.pointerId)return;
 const dx=e.clientX-albumSwipeStart.x,dy=e.clientY-albumSwipeStart.y;albumSwipeStart=null;
 if(Math.abs(dy)>=55&&Math.abs(dy)>Math.abs(dx)*1.2){if(dy<0){renderAlbumViewerThumbnails();$("album-viewer-thumbnails").hidden=false;}else $("album-viewer-thumbnails").hidden=true;return;}
 if(Math.abs(dx)<32||Math.abs(dx)<Math.abs(dy)*1.15)return;
 $("album-viewer-thumbnails").hidden=true;stepAlbumViewerPhoto(dx<0?1:-1);
});
$("album-viewer").addEventListener("pointercancel",()=>{albumSwipeStart=null;});
$("album-viewer").addEventListener("lostpointercapture",()=>{albumSwipeStart=null;});
document.addEventListener("keydown",e=>{if($("album-viewer").hidden)return;if(e.key==="Escape")closeAlbumViewer();else if(e.key==="ArrowLeft")stepAlbumViewerPhoto(1);else if(e.key==="ArrowRight")stepAlbumViewerPhoto(-1);},{signal});

// Миниатюры обычного альбома хранятся в Cache API браузера между посещениями.
// Приватные миниатюры остаются только в памяти текущего сеанса.
const albumThumbMemory=new Map();
const albumDisplayUrlMemory=new Map();
let albumThumbQueue=[],albumThumbActive=0;
function runAlbumThumbQueue(){
 while(albumThumbActive<4&&albumThumbQueue.length){
  const task=albumThumbQueue.shift();albumThumbActive++;
  Promise.resolve().then(task).finally(()=>{albumThumbActive--;runAlbumThumbQueue();});
 }
}
const albumImagePreloadCache=new Map();
function preloadAlbumImage(url){
 if(albumImagePreloadCache.has(url))return albumImagePreloadCache.get(url);
 const promise=new Promise((resolve,reject)=>{
  const probe=new Image();probe.decoding="async";
  probe.onload=async()=>{try{if(probe.decode)await probe.decode();resolve(probe);}catch(_){resolve(probe);}};
  probe.onerror=()=>{albumImagePreloadCache.delete(url);reject(new Error("Не удалось загрузить фотографию"));};
  probe.src=url;if(probe.complete&&probe.naturalWidth)resolve(probe);
 });
 albumImagePreloadCache.set(url,promise);return promise;
}
async function getAlbumDisplayUrl(item,bucket){
 const key=user.id+"|"+bucket+"|"+item.object_path;
 if(albumDisplayUrlMemory.has(key))return albumDisplayUrlMemory.get(key);
 const signed=await client.storage.from(bucket).createSignedUrl(item.object_path,3600,{transform:{width:1600,height:1600,resize:"contain",quality:82}});
 if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error("Не удалось подготовить фотографию");
 albumDisplayUrlMemory.set(key,signed.data.signedUrl);return signed.data.signedUrl;
}
function preloadAlbumNeighbors(items,index,bucket){
 [index-1,index+1].forEach(n=>{
  const item=items[(n+items.length)%items.length];if(!item)return;
  getAlbumDisplayUrl(item,bucket).then(preloadAlbumImage).catch(()=>{});
 });
}
const albumThumbCacheName="floustream-album-thumbnails-v1";
async function getAlbumThumbUrl(item,bucket,persist){
 const key=user.id+"|"+bucket+"|"+item.object_path;
 const remembered=albumThumbMemory.get(key);
 if(remembered){
  if(typeof remembered==="string")return remembered;
  if(remembered.expiresAt>Date.now())return remembered.url;
  albumThumbMemory.delete(key);
 }
 const cacheKey=new URL("/__floustream_thumb_cache__/"+encodeURIComponent(user.id)+"/"+encodeURIComponent(bucket)+"/"+encodeURIComponent(item.object_path),location.origin).href;
 try{
  if(persist&&"caches" in window){
   const cache=await caches.open(albumThumbCacheName);
   const cached=await cache.match(cacheKey);
   if(cached){
    const cachedUrl=URL.createObjectURL(await cached.blob());
    albumThumbMemory.set(key,cachedUrl);
    return cachedUrl;
   }
  }
 }catch(_){}
 const signed=await client.storage.from(bucket).createSignedUrl(item.object_path,3600,{transform:{width:180,height:180,resize:"cover",quality:55}});
 if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error("Не удалось создать миниатюру");
 const url=signed.data.signedUrl;
 // Показываем подписанный URL сразу: браузер сам загружает изображение одним запросом.
 // Не делаем второй fetch/blob-запрос перед отображением.
 albumThumbMemory.set(key,{url,expiresAt:Date.now()+50*60*1000});
 return url;
}
function queueAlbumThumb(img,item,bucket,persist){
 const load=()=>{
  albumThumbQueue.push(async()=>{
   if(!img.isConnected)return;
   try{const src=await getAlbumThumbUrl(item,bucket,persist);if(img.isConnected)img.src=src;}
   catch(_){if(img.isConnected)img.src=item.url;}
  });
  runAlbumThumbQueue();
 };
 if("IntersectionObserver" in window){
  if(!window.albumThumbObserver)window.albumThumbObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){window.albumThumbObserver.unobserve(entry.target);entry.target._loadAlbumThumb?.();}}),{rootMargin:"180px"});
  if(!profileObservers.includes(window.albumThumbObserver))profileObservers.push(window.albumThumbObserver);
  img._loadAlbumThumb=load;window.albumThumbObserver.observe(img);
 }else load();
}

async function loadPhotoAlbum(){
 const grid=$("album-grid");grid.replaceChildren();
 const loading=document.createElement("div");loading.className="album-empty";loading.textContent="Загружаем фотографии…";grid.append(loading);
 try{
  // Обычный альбом изолирован: секретные фото здесь никогда не запрашиваются.
  const result=await client.from("photo_album_photos").select("id,object_path,file_name,mime_type,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
  if(result.error)throw result.error;
  const rows=result.data||[];
  if(!rows.length){albumViewerItems=[];grid.replaceChildren();const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Здесь пока нет фотографий. Добавь первую!";grid.append(empty);return;}
  // Один пакетный запрос вместо последовательного запроса URL для каждого файла.
  const signed=await client.storage.from("photo-albums").createSignedUrls(rows.map(item=>item.object_path),3600);
  if(signed.error)throw signed.error;
  const byPath=new Map((signed.data||[]).filter(x=>x.signedUrl&&!x.error).map(x=>[x.path,x.signedUrl]));
  albumViewerItems=rows.filter(item=>byPath.has(item.object_path)).map(item=>({...item,url:byPath.get(item.object_path),thumbUrl:byPath.get(item.object_path)}));
  grid.replaceChildren();
  if(!albumViewerItems.length){const empty=document.createElement("div");empty.className="album-empty";empty.textContent="Не удалось получить ссылки на фотографии. Попробуй обновить альбом.";grid.append(empty);return;}
  albumViewerItems.forEach((item,index)=>{
   const tile=document.createElement("button");tile.type="button";tile.className="album-item";tile.setAttribute("aria-label","Открыть фотографию: "+(item.file_name||"фотография"));tile.style.padding="0";tile.style.width="100%";tile.style.cursor="zoom-in";
   const img=document.createElement("img");img.alt=item.file_name||"Фотография";img.loading="lazy";img.decoding="async";
   tile.append(img);queueAlbumThumb(img,item,"photo-albums",true);
   tile.addEventListener("click",()=>{$("album-viewer").hidden=false;showAlbumViewerPhoto(index);});
   grid.append(tile);
  });
 }catch(e){albumViewerItems=[];grid.replaceChildren();const error=document.createElement("div");error.className="album-empty";error.textContent="Не удалось загрузить фотоальбом: "+e.message;grid.append(error);}
}
$("album-close").addEventListener("click",()=>$("album-backdrop").hidden=true);
$("album-backdrop").addEventListener("click",e=>{if(e.target===$("album-backdrop"))$("album-backdrop").hidden=true;});
$("album-upload-button").addEventListener("click",async()=>{
 const files=Array.from($("album-file").files||[]);
 if(!files.length){$("album-status").textContent="Сначала выбери одну или несколько фотографий.";return;}
 const invalid=files.find(file=>!["image/jpeg","image/png","image/webp"].includes(file.type));
 if(invalid){$("album-status").textContent="Файл «"+invalid.name+"» имеет неподдерживаемый формат. Подойдут JPG, PNG и WebP.";return;}
 const tooLarge=files.find(file=>file.size>50*1024*1024);
 if(tooLarge){$("album-status").textContent="Файл «"+tooLarge.name+"» больше 50 МБ.";return;}
 const bucket="photo-albums";
 const table="photo_album_photos";
 const button=$("album-upload-button");button.disabled=true;
 let uploadedCount=0;const failures=[];
 try{
  for(let index=0;index<files.length;index++){
   const file=files[index];
   $("album-status").textContent="Загружаем "+(index+1)+" из "+files.length+": "+file.name;
   const ext=file.type==="image/jpeg"?"jpg":file.type.split("/")[1];
   const path=user.id+"/"+Date.now()+"-"+crypto.randomUUID()+"."+ext;
   try{
    const uploaded=await client.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
    if(uploaded.error)throw uploaded.error;
    const saved=await client.from(table).insert({owner_id:user.id,object_path:path,file_name:file.name,mime_type:file.type});
    if(saved.error){await client.storage.from(bucket).remove([path]);throw saved.error;}
    uploadedCount++;
   }catch(error){failures.push(file.name+": "+error.message);}
  }
  $("album-file").value="";
  $("album-status").textContent="Добавлено фотографий: "+uploadedCount+" из "+files.length+(failures.length?". Не удалось загрузить: "+failures.length+".":"." );
  if(failures.length)$("album-status").title=failures.join("\n");
  await loadPhotoAlbum();
  if(uploadedCount===files.length)$("album-upload-panel").hidden=true;
 }catch(error){$("album-status").textContent="Ошибка загрузки: "+error.message;}
 finally{button.disabled=false;}
});
let activeMessageFriend=null;
async 
  return {
    openPhotoAlbum,
    dispose() {
      try { closeAlbumViewer(); } catch (_) {}
      try { closePrivateAlbumViewer(); } catch (_) {}
      if (window.albumThumbObserver) {
        try { window.albumThumbObserver.disconnect(); } catch (_) {}
        delete window.albumThumbObserver;
      }
    }
  };
}
