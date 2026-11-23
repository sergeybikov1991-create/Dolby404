import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient, createAnonymousSupabaseClient } from "../shared/supabase-client.mjs";


const MARKUP = "<section class=\"fs-route-public-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link active\" href=\"profile.html\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</a></nav>\n <div class=\"nav-history\"><p class=\"side-drawer-caption\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\"><button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button><div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden><a class=\"drawer-search-option\" href=\"profile.html\"><span>⌕</span>Поиск</a><a class=\"drawer-search-option\" href=\"profile.html\"><span>✧</span>Рекомендации</a></div></section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a><a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">◎</span>Сообщества</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">♫</span>Музыка</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▶</span>Видео</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▧</span>Фото</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">☆</span>Закладки</a></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"public-open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<main class=\"wrap\">\n<section class=\"profile\">\n <div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n <div class=\"identity\"><div class=\"avatar\" id=\"avatar\">◉</div><div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p><p class=\"profile-presence\" id=\"profile-presence\" aria-live=\"polite\"></p></div></div>\n <p class=\"bio\" id=\"bio\"></p>\n <div class=\"profile-actions\" id=\"profile-actions\" hidden><a class=\"contact-cta\" id=\"contact-cta\" href=\"messages.html\"><span class=\"contact-cta-label\">Связаться</span></a><button class=\"friend-cta\" id=\"friend-cta\" type=\"button\"><span aria-hidden=\"true\">♧＋</span><span id=\"friend-cta-label\">В друзья</span></button></div><p class=\"friend-action-status\" id=\"friend-action-status\" aria-live=\"polite\"></p>\n</section>\n<section class=\"public-albums\" id=\"public-albums\" hidden aria-label=\"Публичный видеоальбом\">\n <div class=\"public-album-section\" id=\"public-videos-section\" hidden><h2 class=\"public-album-title\">Видеоальбом</h2><div class=\"public-album-grid\" id=\"public-video-grid\"></div></div>\n</section>\n<section class=\"feed-section\"><h2 class=\"feed-title\">Публикации</h2><div class=\"feed\" id=\"feed\"><div class=\"status\" id=\"status\">Загружаем публикации…</div></div></section>\n</main>\n<div class=\"photo-lightbox\" id=\"photo-lightbox\" aria-hidden=\"true\" role=\"dialog\" aria-label=\"Просмотр фотографии\">\n <button class=\"photo-lightbox-close\" id=\"photo-lightbox-close\" type=\"button\" aria-label=\"Закрыть просмотр\">×</button>\n <img id=\"photo-lightbox-image\" alt=\"Фото во весь экран\">\n <div class=\"avatar-photo-actions\" id=\"avatar-photo-actions\" hidden>\n  <div class=\"avatar-photo-like-summary\"><span id=\"avatar-photo-like-count\">0 лайков</span><span id=\"avatar-photo-like-note\" aria-live=\"polite\"></span></div>\n  <button class=\"avatar-photo-like\" id=\"avatar-photo-like\" type=\"button\">♡ Нравится</button>\n </div>\n</div>\n</section>";
let notificationScriptsPromise = null;
function ensureNotificationScripts() {
  if (window.initFloustreamMessageNotifications && window.initFloustreamFriendNotifications) return Promise.resolve();
  if (!notificationScriptsPromise) {
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(src, import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Не удалось загрузить модуль уведомлений FLOUSTREAM"));
      document.head.appendChild(script);
    });
    notificationScriptsPromise = Promise.all([
      window.initFloustreamMessageNotifications ? Promise.resolve() : load("../message-notifications.js"),
      window.initFloustreamFriendNotifications ? Promise.resolve() : load("../friend-notifications.js")
    ]).catch(error => { notificationScriptsPromise = null; throw error; });
  }
  return notificationScriptsPromise;
}
export const stylesheet = new URL("./styles/public-profile.css?v=1", import.meta.url).href;
export const title = "Профиль · FLOUSTREAM";

export async function mount(root, { signal, navigate, url }) {
  const style = await attachRouteStyles(root, stylesheet, "public-profile", signal);
  if (!style) return;
  root.innerHTML = "<section class=\"fs-route-public-profile\">\n<button type=\"button\" class=\"drawer-menu-button\" id=\"drawer-menu-button\" aria-label=\"Открыть меню\" aria-controls=\"side-drawer\" aria-expanded=\"false\"><span class=\"sound-signal\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i></span></button>\n<div class=\"drawer-edge\" id=\"drawer-edge\" aria-hidden=\"true\"></div><div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<aside class=\"side-drawer\" id=\"side-drawer\" aria-label=\"Навигация FLOUSTREAM\" aria-hidden=\"true\">\n <div class=\"drawer-shell\"><div class=\"side-drawer-head\"><div class=\"side-drawer-logo\">FLOUSTREAM</div><button type=\"button\" class=\"side-drawer-close\" id=\"drawer-close\" aria-label=\"Закрыть меню\">×</button></div>\n <p class=\"side-drawer-caption\">Навигация</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link active\" href=\"profile.html\"><span class=\"side-drawer-icon\">◉</span>Мой профиль</a></nav>\n <div class=\"nav-history\"><p class=\"side-drawer-caption\">Недавно посещали</p><div class=\"nav-profile-visits\" id=\"nav-profile-visits\"><span class=\"nav-history-empty\">Пока пусто</span></div></div>\n <section class=\"drawer-search\" aria-label=\"Поиск FLOUSTREAM\"><button type=\"button\" class=\"drawer-search-toggle\" id=\"drawer-search-toggle\" aria-expanded=\"false\" aria-controls=\"drawer-search-options\"><span aria-hidden=\"true\">⌕</span> Поиск <span class=\"drawer-search-chevron\" aria-hidden=\"true\">⌄</span></button><div class=\"drawer-search-options\" id=\"drawer-search-options\" hidden><a class=\"drawer-search-option\" href=\"profile.html\"><span>⌕</span>Поиск</a><a class=\"drawer-search-option\" href=\"profile.html\"><span>✧</span>Рекомендации</a></div></section>\n <div class=\"side-drawer-divider\"></div><p class=\"side-drawer-caption\">Медиа и общение</p><nav class=\"side-drawer-links\"><a class=\"side-drawer-link\" id=\"friends-nav-link\" href=\"friends.html?v=20261114-1\"><span class=\"side-drawer-icon\">♧</span>Друзья</a><a class=\"side-drawer-link\" id=\"messages-nav-link\" href=\"messages.html?v=20261119-realtime-2\"><span class=\"side-drawer-icon\">✉</span>Сообщения</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">◎</span>Сообщества</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">♫</span>Музыка</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▶</span>Видео</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">▧</span>Фото</a><a class=\"side-drawer-link\" href=\"profile.html\"><span class=\"side-drawer-icon\">☆</span>Закладки</a></nav>\n <div class=\"drawer-bottom\"><button type=\"button\" class=\"side-drawer-link drawer-settings-button\" id=\"public-open-settings\"><span class=\"side-drawer-icon\">⚙</span>Настройки</button><button type=\"button\" class=\"drawer-logout-button\" id=\"drawer-logout\">↪ Выйти</button><div class=\"side-drawer-foot\">FLOUSTREAM · твоя цифровая территория</div></div></div>\n</aside>\n\n<main class=\"wrap\">\n<section class=\"profile\">\n <div class=\"cover\" id=\"cover\"><img class=\"cover-photo\" id=\"cover-photo\" alt=\"Обложка профиля\" hidden></div>\n <div class=\"identity\"><div class=\"avatar\" id=\"avatar\">◉</div><div class=\"name\"><h1 id=\"display-name\">Загружаем профиль…</h1><p id=\"username\"></p><p class=\"profile-presence\" id=\"profile-presence\" aria-live=\"polite\"></p></div></div>\n <p class=\"bio\" id=\"bio\"></p>\n <div class=\"profile-actions\" id=\"profile-actions\" hidden><a class=\"contact-cta\" id=\"contact-cta\" href=\"messages.html\"><span class=\"contact-cta-label\">Связаться</span></a><button class=\"friend-cta\" id=\"friend-cta\" type=\"button\"><span aria-hidden=\"true\">♧＋</span><span id=\"friend-cta-label\">В друзья</span></button></div><p class=\"friend-action-status\" id=\"friend-action-status\" aria-live=\"polite\"></p>\n</section>\n<section class=\"public-albums\" id=\"public-albums\" hidden aria-label=\"Публичный видеоальбом\">\n <div class=\"public-album-section\" id=\"public-videos-section\" hidden><h2 class=\"public-album-title\">Видеоальбом</h2><div class=\"public-album-grid\" id=\"public-video-grid\"></div></div>\n</section>\n<section class=\"feed-section\"><h2 class=\"feed-title\">Публикации</h2><div class=\"feed\" id=\"feed\"><div class=\"status\" id=\"status\">Загружаем публикации…</div></div></section>\n</main>\n<div class=\"photo-lightbox\" id=\"photo-lightbox\" aria-hidden=\"true\" role=\"dialog\" aria-label=\"Просмотр фотографии\">\n <button class=\"photo-lightbox-close\" id=\"photo-lightbox-close\" type=\"button\" aria-label=\"Закрыть просмотр\">×</button>\n <img id=\"photo-lightbox-image\" alt=\"Фото во весь экран\">\n <div class=\"avatar-photo-actions\" id=\"avatar-photo-actions\" hidden>\n  <div class=\"avatar-photo-like-summary\"><span id=\"avatar-photo-like-count\">0 лайков</span><span id=\"avatar-photo-like-note\" aria-live=\"polite\"></span></div>\n  <button class=\"avatar-photo-like\" id=\"avatar-photo-like\" type=\"button\">♡ Нравится</button>\n </div>\n</div>\n</section>";
  const profileRoot = root.querySelector(".fs-route-public-profile");
  let presenceChannel = null;
  let client = null;
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
let viewer,target;

function safeUrl(value){if(!value)return "";try{const url=new URL(value,location.href);return ["http:","https:"].includes(url.protocol)?url.href:"";}catch(_){return "";}}
function dateText(value){if(!value)return "";const d=new Date(value);return Number.isNaN(d.getTime())?"":d.toLocaleString("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function showError(message){$("feed").replaceChildren();const box=document.createElement("div");box.className="status error";box.textContent=message;$("feed").append(box);}
function renderTargetPresence(online){
 const host=$("profile-presence");if(!host||!target)return;
 host.replaceChildren();
 if(online){
  const dot=document.createElement("span");dot.className="dolby-online-indicator is-online";dot.setAttribute("role","img");dot.setAttribute("aria-label","В сети");
  host.append(dot,document.createTextNode("В сети"));
  return;
 }
 if(!target.last_activity_at){host.textContent="Время последнего визита пока неизвестно";return;}
 const zone=target.time_zone||"UTC";
 let formatted="";
 try{formatted=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:zone}).format(new Date(target.last_activity_at));}
 catch(_){formatted=new Date(target.last_activity_at).toLocaleString("ru-RU");}
 host.textContent="Был(а) в сети: "+formatted;
}
function watchTargetPresence(){
 if(!client||!target)return;
 presenceChannel=client.channel("dolby404:online");
 const refresh=async()=>{
  const state=presenceChannel.presenceState()||{};
  const online=Object.values(state).some(entries=>(entries||[]).some(entry=>entry?.userId===target.id));
  if(online){renderTargetPresence(true);return;}
  const latest=await client.from("profiles").select("last_activity_at,time_zone").eq("id",target.id).maybeSingle();
  if(!latest.error&&latest.data)Object.assign(target,latest.data);
  renderTargetPresence(false);
 };
 presenceChannel.on("presence",{event:"sync"},refresh);
 presenceChannel.subscribe(status=>{if(status==="SUBSCRIBED")refresh();});
}
let avatarPhotoViewerOpen=false;
function openPhotoViewer(src,options={}){
 const viewer=$("photo-lightbox"),image=$("photo-lightbox-image"),actions=$("avatar-photo-actions");
 if(!viewer||!image||!src)return;
 avatarPhotoViewerOpen=!!options.profilePhoto;
 if(actions)actions.hidden=!avatarPhotoViewerOpen;
 image.src=src;viewer.classList.add("is-open");viewer.setAttribute("aria-hidden","false");profileRoot.classList.add("lightbox-open");setScrollLock(true);
 if(avatarPhotoViewerOpen)refreshAvatarPhotoLikes();
}
function closePhotoViewer(){
 const viewer=$("photo-lightbox"),image=$("photo-lightbox-image"),actions=$("avatar-photo-actions");
 if(!viewer||!image)return;
 viewer.classList.remove("is-open");viewer.setAttribute("aria-hidden","true");image.removeAttribute("src");profileRoot.classList.remove("lightbox-open");setScrollLock(false);
 avatarPhotoViewerOpen=false;if(actions)actions.hidden=true;
}
async function resolveAvatarSource(profile){
 if(!profile)return "";
 // The avatar copy lives in the public "avatars" bucket. Prefer it for guest display;
 // the original photo-album object is private and may only be readable under album policy.
 const publicAvatar=safeUrl(profile.avatar_url);
 if(publicAvatar)return publicAvatar;
 if(profile.avatar_photo_id){
  try{
   const photo=await client.from("photo_album_photos").select("object_path").eq("id",profile.avatar_photo_id).eq("owner_id",profile.id).maybeSingle();
   if(photo.error)throw photo.error;
   if(photo.data?.object_path){
    const signed=await client.storage.from("photo-albums").createSignedUrl(photo.data.object_path,3600);
    if(signed.error)throw signed.error;
    if(signed.data?.signedUrl)return safeUrl(signed.data.signedUrl);
   }
  }catch(error){console.warn("FLOUSTREAM profile avatar source:",error);}
 }
 return "";
}
async function openAvatarOriginal(){
 if(!target)return;
 const src=await resolveAvatarSource(target);
 if(src)openPhotoViewer(src,{profilePhoto:true});
}
function formatAvatarPhotoLikeCount(count){const value=Math.abs(Number(count)||0),lastTwo=value%100,last=value%10,word=lastTwo>=11&&lastTwo<=14?"лайков":last===1?"лайк":last>=2&&last<=4?"лайка":"лайков";return value+" "+word;}
async function refreshAvatarPhotoLikes(){
 const actions=$("avatar-photo-actions"),button=$("avatar-photo-like"),count=$("avatar-photo-like-count"),note=$("avatar-photo-like-note");
 if(!actions||!button||!count||!note||!target)return;
 let loaded=false;button.disabled=true;note.textContent="Загружаем…";
 try{
  const rows=await client.from("profile_photo_likes").select("user_id,created_at").eq("profile_id",target.id).order("created_at",{ascending:false});
  if(rows.error)throw rows.error;
  const likes=rows.data||[];loaded=true;
  count.textContent=formatAvatarPhotoLikeCount(likes.length);
  if(!viewer){button.textContent="♡ Нравится";button.dataset.liked="false";button.disabled=true;note.textContent="Войдите, чтобы поставить лайк";return;}
  const mine=likes.some(row=>row.user_id===viewer.id);
  button.textContent=mine?"♥ Нравится":"♡ Нравится";button.dataset.liked=mine?"true":"false";button.classList.toggle("liked",mine);note.textContent="";
 }catch(error){note.textContent="Не удалось загрузить лайки";console.warn("FLOUSTREAM avatar likes:",error);}
 finally{button.disabled=!viewer||!loaded;}
}
$("avatar-photo-like").addEventListener("click",async()=>{
 if(!viewer||!target)return;
 const button=$("avatar-photo-like"),note=$("avatar-photo-like-note"),liked=button.dataset.liked==="true";
 button.disabled=true;note.textContent="Сохраняем…";
 try{
  if(liked){
   const result=await client.from("profile_photo_likes").delete().eq("profile_id",target.id).eq("user_id",viewer.id);
   if(result.error)throw result.error;
  }else{
   const result=await client.from("profile_photo_likes").insert({profile_id:target.id,user_id:viewer.id});
   if(result.error&&result.error.code!=="23505")throw result.error;
  }
  await refreshAvatarPhotoLikes();
 }catch(error){note.textContent="Не удалось поставить лайк";button.disabled=false;console.warn("FLOUSTREAM avatar like:",error);}
});
$("avatar").addEventListener("click",()=>{if($("avatar").classList.contains("has-original"))openAvatarOriginal();});
$("avatar").addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&$("avatar").classList.contains("has-original")){event.preventDefault();openAvatarOriginal();}});
$("photo-lightbox-close").addEventListener("click",closePhotoViewer);
$("photo-lightbox").addEventListener("click",event=>{if(event.target===$("photo-lightbox"))closePhotoViewer();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("photo-lightbox").classList.contains("is-open"))closePhotoViewer();},{signal});

function avatarNode(url,name){const node=document.createElement("div");node.className="post-avatar";const src=safeUrl(url);if(src){const img=document.createElement("img");img.src=src;img.alt="";node.append(img);}else node.textContent=(name||"◉").trim().slice(0,1).toUpperCase();return node;}

async function attachPublicPostInteractions(post,card){
 const bar=document.createElement("div");bar.className="post-social-actions";
 const reactionWrap=document.createElement("div");reactionWrap.className="post-reaction-wrap";
 const reactionToggle=document.createElement("button");reactionToggle.type="button";reactionToggle.className="post-social-button";reactionToggle.textContent="＋ 0";reactionToggle.setAttribute("aria-label","Выбрать реакцию");reactionToggle.setAttribute("aria-expanded","false");
 const reactionPanel=document.createElement("div");reactionPanel.className="post-reaction-picker";reactionPanel.hidden=true;
 const reactionNote=document.createElement("div");reactionNote.className="post-comment-note";
 const reactionOptions=[
  {key:"fire",emoji:"🔥",name:"Огонь"},{key:"love",emoji:"❤️",name:"Любовь"},{key:"lol",emoji:"😂",name:"Смешно"},{key:"cool",emoji:"😎",name:"Круто"},
  {key:"mind",emoji:"🤯",name:"Взрыв"},{key:"sad",emoji:"😢",name:"Грустно"},{key:"rock",emoji:"🤘",name:"Рок"},{key:"respect",emoji:"👏",name:"Респект"},
  {key:"wow",emoji:"⚡",name:"Вау"},{key:"dark",emoji:"🖤",name:"Dark"},{key:"eyes",emoji:"👀",name:"Смотрю"},{key:"diamond",emoji:"💎",name:"Бриллиант"}
 ];
 const optionButtons={};
 for(const item of reactionOptions){const button=document.createElement("button");button.type="button";button.className="post-reaction-option";button.dataset.reaction=item.key;button.title=item.name;button.setAttribute("aria-label",item.name);const emoji=document.createElement("span");emoji.className="reaction-emoji";emoji.textContent=item.emoji;const count=document.createElement("span");count.className="reaction-count";count.textContent="0";button.append(emoji,count);reactionPanel.append(button);optionButtons[item.key]={button,count};}
 reactionWrap.append(reactionToggle,reactionPanel);
 const like=document.createElement("button");like.type="button";like.className="post-social-button";like.textContent="♡ 0";
 const commentsToggle=document.createElement("button");commentsToggle.type="button";commentsToggle.className="post-social-button";commentsToggle.textContent="💬 0";commentsToggle.setAttribute("aria-expanded","false");
 const flow=document.createElement("button");flow.type="button";flow.className="flow-button";flow.textContent="FLOW";
 bar.append(reactionWrap,like,commentsToggle,flow);card.append(bar,reactionNote);
 const panel=document.createElement("section");panel.className="post-comments-panel";panel.hidden=true;
 const header=document.createElement("div");header.className="post-comments-header";const heading=document.createElement("span");heading.textContent="Комментарии";
 const close=document.createElement("button");close.type="button";close.className="post-comments-close";close.textContent="Свернуть";header.append(heading,close);
 const list=document.createElement("div");list.className="post-comments-list";
 const form=document.createElement("form");form.className="post-comment-form";
 const input=document.createElement("textarea");input.maxLength=2000;input.rows=2;input.placeholder="Написать комментарий…";
 const send=document.createElement("button");send.type="submit";send.textContent="Отправить";
 const commentNote=document.createElement("div");commentNote.className="post-comment-note";
 form.append(input,send);panel.append(header,list,form,commentNote);card.append(panel);
 let liked=false,activeFlow=false,ownReaction=null;
 const refresh=async()=>{
  const [likes,ownLike,comments,totalFlow,ownFlow,reactions,mine]=await Promise.all([
   client.from("likes").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   viewer?client.from("likes").select("id").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null}),
   client.from("comments").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   client.from("reposts").select("id",{count:"exact",head:true}).eq("post_id",post.id),
   viewer?client.from("reposts").select("id").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null}),
   client.from("post_reactions").select("reaction_key").eq("post_id",post.id),
   viewer?client.from("post_reactions").select("id,reaction_key").eq("post_id",post.id).eq("user_id",viewer.id).maybeSingle():Promise.resolve({data:null})
  ]);
  const err=[likes,comments,totalFlow,reactions,mine].find(x=>x.error);if(err){commentNote.textContent="Не удалось загрузить действия: "+err.error.message;return;}
  liked=!!ownLike.data;activeFlow=!!ownFlow.data;ownReaction=mine.data||null;
  like.textContent=(liked?"♥ ":"♡ ")+(likes.count||0);like.classList.toggle("is-active",liked);
  commentsToggle.textContent="💬 "+(comments.count||0);
  flow.textContent="FLOW · "+(totalFlow.count||0);flow.classList.toggle("active",activeFlow);flow.setAttribute("aria-pressed",String(activeFlow));flow.title=activeFlow?"Отменить FLOW":"Добавить оригинальную публикацию в свои публикации";
  const counts={};for(const row of reactions.data||[])counts[row.reaction_key]=(counts[row.reaction_key]||0)+1;
  const total=Object.values(counts).reduce((a,b)=>a+b,0),selected=reactionOptions.find(x=>x.key===ownReaction?.reaction_key);
  reactionToggle.textContent=(selected?selected.emoji:"＋")+" "+total;reactionToggle.classList.toggle("is-active",!!selected);reactionToggle.setAttribute("aria-label",selected?"Твоя реакция: "+selected.name+". Изменить реакцию":"Выбрать реакцию");
  for(const item of reactionOptions){const option=optionButtons[item.key];option.count.textContent=String(counts[item.key]||0);option.button.classList.toggle("is-active",ownReaction?.reaction_key===item.key);option.button.setAttribute("aria-pressed",String(ownReaction?.reaction_key===item.key));}
 };
 if(!viewer){for(const button of [like,commentsToggle,flow,reactionToggle]){button.disabled=true;button.title="Войди в аккаунт, чтобы взаимодействовать с публикациями";}commentNote.textContent="Войди в аккаунт, чтобы ставить лайки, выбирать реакции и комментировать.";form.hidden=true;}
 await refresh();
 reactionToggle.addEventListener("click",()=>{if(!viewer)return;reactionPanel.hidden=!reactionPanel.hidden;reactionToggle.setAttribute("aria-expanded",String(!reactionPanel.hidden));});
 document.addEventListener("click",event=>{if(!reactionWrap.contains(event.target)&&!reactionPanel.hidden){reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}},{signal});
 for(const item of reactionOptions){optionButtons[item.key].button.addEventListener("click",async()=>{
  if(!viewer)return;for(const x of Object.values(optionButtons))x.button.disabled=true;reactionNote.textContent="";
  let result;if(ownReaction?.reaction_key===item.key)result=await client.from("post_reactions").delete().eq("post_id",post.id).eq("user_id",viewer.id);
  else if(ownReaction)result=await client.from("post_reactions").update({reaction_key:item.key,updated_at:new Date().toISOString()}).eq("post_id",post.id).eq("user_id",viewer.id);
  else result=await client.from("post_reactions").insert({post_id:post.id,user_id:viewer.id,reaction_key:item.key});
  if(result.error)reactionNote.textContent="Не удалось изменить реакцию: "+result.error.message;else{reactionPanel.hidden=true;reactionToggle.setAttribute("aria-expanded","false");}
  await refresh();for(const x of Object.values(optionButtons))x.button.disabled=false;
 });}
 like.addEventListener("click",async()=>{if(!viewer)return;like.disabled=true;const result=liked?await client.from("likes").delete().eq("post_id",post.id).eq("user_id",viewer.id):await client.from("likes").insert({post_id:post.id,user_id:viewer.id});if(result.error)commentNote.textContent="Не удалось изменить лайк: "+result.error.message;await refresh();like.disabled=false;});
 flow.addEventListener("click",async()=>{if(!viewer)return;flow.disabled=true;const result=activeFlow?await client.from("reposts").delete().eq("post_id",post.id).eq("user_id",viewer.id):await client.from("reposts").insert({post_id:post.id,user_id:viewer.id});if(result.error)commentNote.textContent="Не удалось выполнить FLOW: "+result.error.message;await refresh();flow.disabled=false;});
 async function loadComments(){
  list.replaceChildren();const loading=document.createElement("div");loading.className="post-comment-note";loading.textContent="Загружаем комментарии…";list.append(loading);
  const result=await client.from("comments").select("id,user_id,content,created_at").eq("post_id",post.id).order("created_at",{ascending:true}).limit(100);
  if(result.error){loading.textContent="Не удалось загрузить комментарии: "+result.error.message;return;}
  list.replaceChildren();const ids=[...new Set((result.data||[]).map(x=>x.user_id).filter(Boolean))];
  const profiles=ids.length?await client.from("profiles").select("id,username,display_name").in("id",ids):{data:[],error:null};
  const byId=new Map((profiles.data||[]).map(x=>[x.id,x]));
  if(!result.data?.length){const empty=document.createElement("div");empty.className="post-comment-note";empty.textContent="Пока нет комментариев. Будь первым!";list.append(empty);return;}
  for(const item of result.data){const row=document.createElement("article");row.className="post-comment";const name=document.createElement("strong");const profile=byId.get(item.user_id)||{};name.textContent=profile.display_name||profile.username||"Пользователь";const body=document.createElement("div");body.textContent=item.content;const time=document.createElement("time");time.textContent=dateText(item.created_at);row.append(name,body,time);list.append(row);}
 }
 commentsToggle.addEventListener("click",async()=>{if(!viewer)return;panel.hidden=!panel.hidden;commentsToggle.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden){await loadComments();input.focus();}});
 close.addEventListener("click",()=>{panel.hidden=true;commentsToggle.setAttribute("aria-expanded","false");});
 form.addEventListener("submit",async event=>{event.preventDefault();if(!viewer)return;const content=input.value.trim();if(!content)return;send.disabled=true;commentNote.textContent="Отправляем…";const result=await client.from("comments").insert({post_id:post.id,user_id:viewer.id,content});if(result.error){commentNote.textContent="Не удалось отправить комментарий: "+result.error.message;send.disabled=false;return;}input.value="";commentNote.textContent="Комментарий добавлен.";await loadComments();await refresh();send.disabled=false;});
}

async function renderPost(post,authors,flowMeta){
 const author=authors.get(post.user_id)||{};const authorName=author.display_name||author.username||"Пользователь";
 const card=document.createElement("article");card.className="post";
 if(flowMeta){const banner=document.createElement("div");banner.className="flow-banner";banner.textContent="FLOW · "+(target.display_name||target.username||"Пользователь")+(flowMeta.created_at?" · "+dateText(flowMeta.created_at):"");card.append(banner);}
 const head=document.createElement("div");head.className="post-head";head.append(avatarNode(author.avatar_url,authorName));
 const identity=document.createElement("div"),name=document.createElement("div"),date=document.createElement("div");if(flowMeta){const authorLabel=document.createElement("div");authorLabel.className="post-author-label";authorLabel.textContent="Автор оригинала";identity.append(authorLabel);}name.className="post-author";name.textContent=authorName;date.className="post-date";date.textContent=dateText(post.created_at);identity.append(name,date);head.append(identity);card.append(head);
 if(post.content){const body=document.createElement("div");body.className="post-content";body.textContent=post.content;card.append(body);}
 const media=Array.isArray(post.media)&&post.media.length?post.media:(post.image_url?[{type:"photo",url:post.image_url}]:[]);
 if(media.length){const box=document.createElement("div");box.className="post-media";for(const item of media){let url=safeUrl(item.url||item.public_url||item.signedUrl);if(!url&&item.object_path){const signed=await client.storage.from("posts").createSignedUrl(item.object_path,3600);if(!signed.error)url=safeUrl(signed.data?.signedUrl);}if(!url)continue;let node;if(item.type==="photo"){const photoButton=document.createElement("button");photoButton.type="button";photoButton.className="post-photo-open";photoButton.setAttribute("aria-label","Открыть фотографию на весь экран");node=document.createElement("img");node.alt="Фото публикации";node.loading="lazy";node.decoding="async";node.src=url;photoButton.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();openPhotoViewer(node.currentSrc||node.src);});photoButton.append(node);box.append(photoButton);continue;}else if(item.type==="music"){node=document.createElement("audio");node.controls=true;}else{node=document.createElement("video");node.controls=true;node.playsInline=true;node.preload="metadata";if(item.mime_type||item.mimeType)node.setAttribute("type",item.mime_type||item.mimeType);}node.src=url;node.load();box.append(node);}if(box.children.length)card.append(box);}
 attachPublicPostInteractions(post,card);
 return card;
}
async function loadProfileVisitHistory(){
 const host=$("nav-profile-visits");if(!host||!client||!viewer)return;
 try{
  const visits=await client.from("profile_visits").select("visited_profile_id,last_visited_at").eq("visitor_id",viewer.id).order("last_visited_at",{ascending:false}).limit(5);
  if(visits.error)throw visits.error;
  const rows=visits.data||[];host.replaceChildren();if(!rows.length){const empty=document.createElement("span");empty.className="nav-history-empty";empty.textContent="Пока пусто";host.append(empty);return;}
  const ids=rows.map(row=>row.visited_profile_id);
  const profiles=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);
  if(profiles.error)throw profiles.error;
  const byId=new Map((profiles.data||[]).map(profile=>[profile.id,profile]));
  rows.forEach(row=>{
   const profile=byId.get(row.visited_profile_id);if(!profile)return;
   const name=profile.display_name||profile.username||"Пользователь";
   const link=document.createElement("a");link.className="nav-profile-visit";link.href="public-profile.html?id="+encodeURIComponent(profile.id);
   if(profile.avatar_url){const avatar=document.createElement("img");avatar.className="nav-profile-visit-avatar";avatar.src=profile.avatar_url;avatar.alt="";avatar.loading="lazy";link.append(avatar);}
   else{const avatar=document.createElement("span");avatar.className="nav-profile-visit-avatar";avatar.style.display="grid";avatar.style.placeItems="center";avatar.textContent=name.slice(0,1).toUpperCase();link.append(avatar);}
   const copy=document.createElement("span");copy.className="nav-profile-visit-copy";
   const title=document.createElement("span");title.className="nav-profile-visit-name";title.textContent=name;
   const time=document.createElement("span");time.className="nav-profile-visit-time";time.textContent=row.last_visited_at?new Date(row.last_visited_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
   copy.append(title,time);link.append(copy);host.append(link);
  });
 }catch(error){console.warn("FLOUSTREAM visit history:",error);}
}
window.addEventListener("pageshow",()=>{if(viewer&&client)loadProfileVisitHistory();},{signal});
async function loadPublicAlbums(){
 const host=$("public-albums"),videoSection=$("public-videos-section"),videoGrid=$("public-video-grid");
 videoGrid.replaceChildren();videoSection.hidden=true;host.hidden=true;
 try{
  // Photo albums are owner-only. Public profiles expose videos only; profile avatars remain a separate public profile asset.
  const videoResult=await client.from("video_album_videos").select("id,object_path,file_name,created_at").eq("owner_id",target.id).order("created_at",{ascending:false}).limit(18);
  if(videoResult.error)throw videoResult.error;
  const videos=videoResult.data||[];
  if(videos.length){
   const signed=await client.storage.from("video-albums").createSignedUrls(videos.map(item=>item.object_path),3600);
   if(signed.error)throw signed.error;
   const urls=new Map((signed.data||[]).filter(item=>item.signedUrl&&!item.error).map(item=>[item.path,item.signedUrl]));
   for(const item of videos){const url=urls.get(item.object_path);if(!url)continue;const card=document.createElement("article");card.className="public-album-video";const video=document.createElement("video");video.src=url;video.controls=true;video.playsInline=true;video.preload="metadata";video.setAttribute("aria-label",item.file_name||"Видео");const name=document.createElement("div");name.className="public-album-video-name";name.textContent=item.file_name||"Видео";card.append(video,name);videoGrid.append(card);}
   videoSection.hidden=!videoGrid.childElementCount;
  }
  host.hidden=videoSection.hidden;
 }catch(error){console.warn("FLOUSTREAM public videos:",error);host.hidden=true;}
}

async function start(){
 try{
  client=await getSupabaseClient({signal});if(signal.aborted)return;
  // Public profiles must remain readable when there is no signed-in user.
  // getUser() without a session returns "Auth session missing!" and must never gate guest access.
  try{
   const stored=await client.auth.getSession();
   if(signal.aborted)return;
   if(stored.error)throw stored.error;
   if(stored.data?.session){
    const auth=await client.auth.getUser();
    if(signal.aborted)return;
    if(auth.error)throw auth.error;
    viewer=auth.data.user;
   }else viewer=null;
  }catch(authError){
   console.warn("FLOUSTREAM optional profile viewer session:",authError);
   // A stale/broken local token must not block public profile reads. Keep local storage untouched.
   client=await createAnonymousSupabaseClient({signal});if(signal.aborted)return;
   viewer=null;
  }
  if(viewer){
   await ensureNotificationScripts();if(signal.aborted)return;
   window.initFloustreamMessageNotifications?.(client,viewer.id,{signal,root});
   window.initFloustreamFriendNotifications?.(client,viewer.id,{signal,root});
  }
  const targetId=new URLSearchParams(url.search).get("id");if(!targetId){showError("Не указан профиль для просмотра.");return;}
  if(viewer&&targetId===viewer.id){navigate("profile.html");return;}
  const profileResult=await client.from("profiles").select("id,username,display_name,bio,avatar_url,avatar_photo_id,cover_url,last_activity_at,time_zone").eq("id",targetId).maybeSingle();
  if(signal.aborted)return;if(profileResult.error)throw profileResult.error;if(!profileResult.data){showError("Профиль не найден или недоступен.");return;}
  target=profileResult.data;
  await loadPublicAlbums();if(signal.aborted)return;
  renderTargetPresence(false);
  watchTargetPresence();
  if(viewer){
   const recorded=await client.from("profile_visits").upsert({visitor_id:viewer.id,visited_profile_id:target.id,last_visited_at:new Date().toISOString()},{onConflict:"visitor_id,visited_profile_id"});
   if(recorded.error)console.warn("FLOUSTREAM visit recording:",recorded.error);
   loadProfileVisitHistory();
  }
  const contact=$("contact-cta"),actions=$("profile-actions"),friendButton=$("friend-cta"),friendLabel=$("friend-cta-label"),friendStatus=$("friend-action-status");
  if(viewer&&viewer.id!==target.id){
   contact.href="messages.html?with="+encodeURIComponent(target.id);actions.hidden=false;
   const low=viewer.id<target.id?viewer.id:target.id,high=viewer.id<target.id?target.id:viewer.id;
   async function refreshFriendState(){
    const result=await client.from("friend_requests").select("id,requester_id,recipient_id,status").eq("user_low_id",low).eq("user_high_id",high).maybeSingle();
    if(result.error)throw result.error;const row=result.data;
    friendButton.disabled=false;friendButton.onclick=null;friendStatus.textContent="";
    if(!row){friendLabel.textContent="В друзья";friendButton.onclick=sendFriendRequest;}
    else if(row.status==="accepted"){friendLabel.textContent="Вы друзья";friendButton.disabled=true;}
    else if(row.requester_id===viewer.id){friendLabel.textContent="Заявка отправлена";friendButton.onclick=cancelFriendRequest;}
    else{friendLabel.textContent="Принять приглашение";friendButton.onclick=acceptFriendRequest;}
   }
   async function sendFriendRequest(){
    friendButton.disabled=true;friendStatus.textContent="Отправляем приглашение…";
    const result=await client.from("friend_requests").insert({requester_id:viewer.id,recipient_id:target.id,user_low_id:low,user_high_id:high});
    if(result.error){friendStatus.textContent=result.error.code==="23505"?"Приглашение уже существует.":result.error.message;friendButton.disabled=false;await refreshFriendState();return;}
    friendStatus.textContent="Приглашение отправлено.";await refreshFriendState();
   }
   async function cancelFriendRequest(){
    friendButton.disabled=true;const current=await client.from("friend_requests").select("id").eq("user_low_id",low).eq("user_high_id",high).eq("requester_id",viewer.id).eq("status","pending").maybeSingle();
    if(current.error||!current.data){friendStatus.textContent=current.error?.message||"Заявка уже обработана.";await refreshFriendState();return;}
    const result=await client.from("friend_requests").delete().eq("id",current.data.id).eq("requester_id",viewer.id);
    if(result.error){friendStatus.textContent=result.error.message;friendButton.disabled=false;return;}
    friendStatus.textContent="Приглашение отменено.";await refreshFriendState();
   }
   async function acceptFriendRequest(){
    friendButton.disabled=true;const current=await client.from("friend_requests").select("id").eq("user_low_id",low).eq("user_high_id",high).eq("recipient_id",viewer.id).eq("status","pending").maybeSingle();
    if(current.error||!current.data){friendStatus.textContent=current.error?.message||"Заявка уже обработана.";await refreshFriendState();return;}
    const result=await client.from("friend_requests").update({status:"accepted"}).eq("id",current.data.id).eq("recipient_id",viewer.id).eq("status","pending");
    if(result.error){friendStatus.textContent=result.error.message;friendButton.disabled=false;return;}
    friendStatus.textContent="Теперь вы друзья!";await refreshFriendState();
   }
   try{await refreshFriendState();}catch(error){friendStatus.textContent="Не удалось проверить статус дружбы: "+error.message;}
  }
    $("display-name").textContent=target.display_name||target.username||"Пользователь";
  $("username").textContent=target.username?"@"+target.username:"";
  $("bio").textContent=target.bio||"";
  const avatar=await resolveAvatarSource(target);if(avatar){$("avatar").replaceChildren();const img=document.createElement("img");img.src=avatar;img.alt="Аватар";img.onerror=()=>{img.remove();$("avatar").textContent=(target.display_name||target.username||"◉").slice(0,1).toUpperCase();};$("avatar").append(img);$("avatar").classList.add("has-original");$("avatar").setAttribute("role","button");$("avatar").tabIndex=0;$("avatar").setAttribute("aria-label","Открыть оригинал фотографии профиля");}else{$("avatar").textContent=(target.display_name||target.username||"◉").slice(0,1).toUpperCase();$("avatar").classList.remove("has-original");$("avatar").removeAttribute("role");$("avatar").removeAttribute("tabindex");$("avatar").removeAttribute("aria-label");}
  const cover=safeUrl(target.cover_url),coverImage=$("cover-photo");if(cover){coverImage.onerror=()=>{coverImage.hidden=true;};coverImage.onload=()=>{coverImage.hidden=false;};coverImage.src=cover;coverImage.hidden=false;}else{coverImage.removeAttribute("src");coverImage.hidden=true;}
  const [ownPosts,flows]=await Promise.all([
   client.from("posts").select("*").eq("user_id",targetId).order("created_at",{ascending:false}).limit(50),
   client.from("reposts").select("id,user_id,post_id,created_at").eq("user_id",targetId).order("created_at",{ascending:false}).limit(50)
  ]);
  if(ownPosts.error)throw ownPosts.error;if(flows.error)throw flows.error;
  const flowRows=flows.data||[],flowIds=flowRows.map(row=>row.post_id).filter(Boolean);
  const flowPosts=flowIds.length?await client.from("posts").select("*").in("id",flowIds):{data:[],error:null};
  if(flowPosts.error)throw flowPosts.error;
  const flowById=new Map(flowRows.map(row=>[String(row.post_id),row])),merged=new Map();
  for(const post of ownPosts.data||[])merged.set(String(post.id),{post,sortAt:post.created_at||"",flowMeta:null});
  for(const post of flowPosts.data||[]){const meta=flowById.get(String(post.id));if(!meta)continue;const key=String(post.id),existing=merged.get(key);if(!existing||new Date(meta.created_at||0)>new Date(existing.sortAt||0))merged.set(key,{post,sortAt:meta.created_at||post.created_at||"",flowMeta:meta});}
  const entries=[...merged.values()].sort((a,b)=>new Date(b.sortAt||0)-new Date(a.sortAt||0));
  if(!entries.length){$("feed").replaceChildren();const empty=document.createElement("div");empty.className="empty";empty.textContent="Пока нет доступных публикаций."; $("feed").append(empty);return;}
  const authorIds=[...new Set(entries.map(x=>x.post.user_id).filter(Boolean))];
  const authorResult=authorIds.length?await client.from("profiles").select("id,username,display_name,avatar_url").in("id",authorIds):{data:[],error:null};
  if(authorResult.error)throw authorResult.error;
  const authors=new Map((authorResult.data||[]).map(p=>[p.id,p]));$("feed").replaceChildren();
  for(const entry of entries)$("feed").append(await renderPost(entry.post,authors,entry.flowMeta));
 }catch(error){showError("Не удалось открыть страницу: "+error.message);}
}
(function initPublicSideDrawer(){
 const button=$("drawer-menu-button"),drawer=$("side-drawer"),backdrop=$("drawer-backdrop"),edge=$("drawer-edge"),close=$("drawer-close");
 if(!button||!drawer||!backdrop||!close)return;
 let opened=false;
 function setOpen(value){opened=!!value;drawer.style.setProperty("--drawer-x",opened?"0%":"-100%");backdrop.classList.toggle("visible",opened);backdrop.style.opacity=opened?"1":"0";button.classList.toggle("is-hidden",opened);button.setAttribute("aria-expanded",String(opened));drawer.setAttribute("aria-hidden",String(!opened));setScrollLock(opened);}
 button.addEventListener("click",()=>setOpen(!opened));close.addEventListener("click",()=>setOpen(false));backdrop.addEventListener("click",()=>setOpen(false));
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&opened)setOpen(false);},{signal});
 const searchToggle=$("drawer-search-toggle"),searchOptions=$("drawer-search-options");if(searchToggle&&searchOptions)searchToggle.addEventListener("click",()=>{const expanded=searchToggle.getAttribute("aria-expanded")==="true";searchToggle.setAttribute("aria-expanded",String(!expanded));searchOptions.hidden=expanded;});
  const settingsButton=$("public-open-settings");if(settingsButton)settingsButton.addEventListener("click",()=>{navigate("profile.html?openSettings=1");});
  const logoutButton=$("drawer-logout");if(logoutButton)logoutButton.addEventListener("click",async()=>{if(!client)return;logoutButton.disabled=true;const result=await client.auth.signOut();if(result.error){logoutButton.disabled=false;logoutButton.title="Не удалось выйти: "+result.error.message;return;}navigate("portal.html");});
 let startX=null;edge.addEventListener("touchstart",event=>{startX=event.touches[0].clientX;},{passive:true});edge.addEventListener("touchend",event=>{if(startX!==null&&event.changedTouches[0].clientX-startX>45)setOpen(true);startX=null;},{passive:true});
})();
void start();


  return async () => {
    setScrollLock(false);
    if (presenceChannel && client) {
      try { await client.removeChannel(presenceChannel); } catch (_) {}
      presenceChannel = null;
    }
root.querySelectorAll("video,audio").forEach(media => {
      try { media.pause(); media.removeAttribute("src"); media.load(); } catch (_) {}
    });
    root.replaceChildren();
  };
}
