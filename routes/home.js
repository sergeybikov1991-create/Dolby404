import { cachedRequest, invalidateCachedRequests } from "../shared/request-cache.mjs";
import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient } from "../shared/supabase-client.mjs";


const MARKUP = "<section class=\"fs-route-home\">\n<header class=\"topbar\">\n  <button class=\"menu-toggle\" id=\"menu-toggle\" type=\"button\" aria-label=\"Открыть меню\" aria-expanded=\"false\">☰</button>\n  <div class=\"logo\">FLOUSTREAM</div>\n  <div class=\"account\"><span id=\"user-email\">Проверяем аккаунт…</span><button class=\"logout\" id=\"logout-button\" hidden>Выйти</button></div>\n</header>\n<div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<div class=\"layout\" id=\"app\" hidden>\n  <aside class=\"sidebar\" id=\"sidebar\">\n    <nav class=\"nav\">\n      <a class=\"active\" href=\"home.html\">⌂ Главная</a>\n      <a href=\"#messages\" data-soon=\"Сообщения\">✉ Сообщения</a>\n      <a href=\"#communities\" data-soon=\"Паблики\">◎ Паблики</a>\n      <a href=\"#saved\" data-soon=\"Сохранённое\">♡ Сохранённое</a>\n      <a href=\"profile.html\">◉ Профиль</a>\n      <a href=\"backgammon.html\">🎲 Длинные нарды</a>\n    </nav>\n  </aside>\n  <main class=\"main\">\n    <section class=\"welcome\">\n      <div class=\"eyebrow\">ТВОЁ ЦИФРОВОЕ ПРОСТРАНСТВО</div>\n      <h1>Добро пожаловать в FLOUSTREAM</h1>\n      <p>Здесь будут твои публикации, общение, музыка, фото, видео и сообщества. Мы постепенно превращаем каждый раздел в настоящую работающую функцию.</p>\n      <div id=\"status\"></div>\n    </section>\n    <h2 class=\"section-title\">Твоё пространство</h2>\n    <section class=\"grid\">\n      <article class=\"tile\"><div class=\"tile-icon\">✉️</div><h3>Сообщения</h3><p>Личные переписки и обмен файлами — следующий этап разработки.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🎥</div><h3>Аудио и видеозвонки</h3><p>Подготовим звонки между пользователями после запуска личных сообщений.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🎵</div><h3>Медиатека</h3><p>Сохранённые фотографии, видео и музыкальные материалы.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🌐</div><h3>Паблики</h3><p>Публичные сообщества, подписчики, публикации и обсуждения.</p></article>\n    </section>\n    <h2 class=\"section-title\">Лента публикаций</h2>\n    <section class=\"feed\" id=\"feed\" aria-live=\"polite\">\n      <div id=\"feed-list\"></div>\n      <div class=\"feed-loading\" id=\"feed-loading\">Загружаем публикации…</div>\n      <div class=\"feed-empty\" id=\"feed-empty\" hidden><strong>Пока публикаций нет</strong>Здесь появятся записи пользователей FLOUSTREAM.</div>\n      <div class=\"feed-error\" id=\"feed-error\" hidden></div>\n      <div id=\"feed-sentinel\" aria-hidden=\"true\"></div>\n      <button class=\"feed-more\" id=\"feed-more\" type=\"button\" hidden>Показать ещё</button>\n    </section>\n  </main>\n</div>\n<div id=\"loading\" style=\"max-width:560px;margin:18vh auto;padding:25px;text-align:center;color:#c9b7ee\">Подключаем FLOUSTREAM…</div>\n</section>";
export const stylesheet = new URL("./styles/home.css?v=1", import.meta.url).href;
export const title = "FLOUSTREAM — Главная";

export async function mount(root, { signal, navigate }) {
root.innerHTML = MARKUP;
  const style = await attachRouteStyles(root, stylesheet, "home", signal);
  if (!style) return;
  const homeRoot = root.querySelector(".fs-route-home");
  let client = null;
  let feedObserver = null;

  
const loading = root.querySelector("#loading");
const app = root.querySelector("#app");
const status = root.querySelector("#status");


const dolbyOnlineUsers = new Set();
let dolbyOnlineChannel = null;
function refreshDolbyOnlineIndicators(){
 root.querySelectorAll(".dolby-online-indicator[data-user-id]").forEach(dot=>{
  const active=dolbyOnlineUsers.has(dot.dataset.userId);
  dot.classList.toggle("is-online",active);
  dot.title=active?"В сети":"Не в сети";
  dot.setAttribute("aria-label",active?"В сети":"Не в сети");
 });
}
function appendDolbyOnlineIndicator(element,userId){
 if(!element||!userId)return;
 element.querySelectorAll(":scope > .dolby-online-indicator").forEach(dot=>dot.remove());
 const dot=document.createElement("span");
 dot.className="dolby-online-indicator";
 dot.dataset.userId=userId;
 dot.setAttribute("role","img");
 element.appendChild(dot);
 refreshDolbyOnlineIndicators();
}
function startDolbyOnlinePresence(client,userId){
 if(!client||!userId||dolbyOnlineChannel)return;
 const channel=client.channel("dolby404:online");
 channel.on("presence",{event:"sync"},()=>{
  dolbyOnlineUsers.clear();
  const state=channel.presenceState()||{};
  Object.values(state).forEach(entries=>(entries||[]).forEach(entry=>{
   if(entry?.userId)dolbyOnlineUsers.add(entry.userId);
  }));
  refreshDolbyOnlineIndicators();
 });
 dolbyOnlineChannel=channel;
 channel.subscribe(async status=>{
  if(status==="SUBSCRIBED"){
   const tracked=await channel.track({userId,onlineAt:new Date().toISOString()});
   if(tracked?.error)console.warn("FLOUSTREAM presence:",tracked.error);
  }
 });
 window.addEventListener("pagehide",()=>{channel.untrack();},{once:true,signal});
}

async function start(){
  try{
    client = await getSupabaseClient({ signal });
    if (signal.aborted) return;

    const {data,error}=await client.auth.getSession();
    if(signal.aborted)return;
    if(error) throw error;
    if(!data.session){
      navigate("portal.html");
      return;
    }
    const user=data.session.user;
    root.querySelector("#user-email").textContent=user.email||"Мой аккаунт";
    root.querySelector("#logout-button").hidden=false;
    loading.hidden=true;
    app.hidden=false;
    status.textContent="Аккаунт подключён. Ты вошёл в систему.";
    startDolbyOnlinePresence(client,user.id);
    initFeed(client);
    root.querySelector("#logout-button").addEventListener("click",async()=>{
      const button=root.querySelector("#logout-button");
      button.disabled=true;
      const {error}=await client.auth.signOut();
      if(error){status.textContent="Не удалось выйти: "+error.message;button.disabled=false;return;}
      invalidateCachedRequests(`home-feed:${user.id}:`);
      navigate("portal.html");
    });
    root.querySelectorAll("[data-soon]").forEach(link=>{
      link.addEventListener("click",event=>{
        event.preventDefault();
        status.textContent="Раздел «"+link.dataset.soon+"» добавим следующим этапом.";
      });
    });
  }catch(error){
    if(signal.aborted)return;
    loading.textContent="Не удалось подключить FLOUSTREAM: "+error.message;
  }
}

async function initFeed(client){
  const list=root.querySelector("#feed-list");
  const loading=root.querySelector("#feed-loading");
  const empty=root.querySelector("#feed-empty");
  const errorBox=root.querySelector("#feed-error");
  const more=root.querySelector("#feed-more");
  const sentinel=root.querySelector("#feed-sentinel");
  const auth=await client.auth.getUser();
  if(signal.aborted)return;
  const userId=auth.data.user?.id;
  const seen=new Set();
  let offset=0, pendingBatch=null, loadingMore=false, finished=false;
  const batchSize=5;
  function showError(message){
    errorBox.hidden=false;errorBox.textContent="Не удалось загрузить ленту: "+message;
    loading.hidden=true;more.hidden=false;
  }
  async function fetchBatch(from){
    const cacheKey=`home-feed:${userId||"anonymous"}:${from}:${batchSize}`;
    return cachedRequest(cacheKey,async()=>{
      const result=await client.from("posts").select("*").order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,from+batchSize-1);
      if(result.error)throw result.error;
      const posts=result.data||[];let profilesById={};
      const userIds=[...new Set(posts.map(p=>p.user_id).filter(Boolean))];
      if(userIds.length){
        const profiles=await client.from("profiles").select("*").in("id",userIds);
        if(!profiles.error)for(const profile of (profiles.data||[]))profilesById[profile.id]=profile;
      }
      return {posts,profilesById};
    },{ttlMs:20000,maxEntries:32});
  }
  function formatDate(value){
    if(!value)return "";const date=new Date(value);
    return Number.isNaN(date.getTime())?"":date.toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  }
  function safeImageUrl(value){
    if(!value)return "";
    try{const url=new URL(value,location.href);return ["http:","https:"].includes(url.protocol)?url.href:"";}catch(_){return "";}
  }

 function attachPostActions(post,card){
  const bar=document.createElement("div");bar.className="post-social-actions";
  const like=document.createElement("button");like.type="button";like.className="post-social-button";like.textContent="♡ 0";
  const commentToggle=document.createElement("button");commentToggle.type="button";commentToggle.className="post-social-button";commentToggle.textContent="💬 0";
  const repost=document.createElement("button");repost.type="button";repost.className="post-social-button";repost.textContent="↻ 0";
  const panel=document.createElement("section");panel.className="post-comments-panel";panel.hidden=true;
  const list=document.createElement("div");list.className="post-comments-list";
  const form=document.createElement("form");form.className="post-comment-form";
  const input=document.createElement("textarea");input.maxLength=2000;input.rows=2;input.placeholder="Написать комментарий…";
  const send=document.createElement("button");send.type="submit";send.className="primary";send.textContent="Отправить";
  const note=document.createElement("div");note.className="post-comment-note";
  form.append(input,send);panel.append(list,form,note);bar.append(like,commentToggle,repost);card.append(bar,panel);
  let liked=false,reposted=false,likesCount=0,commentsCount=0,repostsCount=0;
  async function refreshCounts(){
   const [likes,ownLike,comments,reposts,ownRepost]=await Promise.all([
    client.from("likes").select("id",{count:"exact",head:true}).eq("post_id",post.id),
    client.from("likes").select("id").eq("post_id",post.id).eq("user_id",userId).maybeSingle(),
    client.from("comments").select("id",{count:"exact",head:true}).eq("post_id",post.id),
    client.from("reposts").select("id",{count:"exact",head:true}).eq("post_id",post.id),
    client.from("reposts").select("id").eq("post_id",post.id).eq("user_id",userId).maybeSingle()
   ]);
   if(likes.error||comments.error||reposts.error){note.textContent="Не удалось загрузить счётчики взаимодействий.";return;}
   likesCount=likes.count||0;commentsCount=comments.count||0;repostsCount=reposts.count||0;
   liked=!!ownLike.data;reposted=!!ownRepost.data;
   like.textContent=(liked?"♥ ":"♡ ")+likesCount;like.classList.toggle("is-active",liked);
   commentToggle.textContent="💬 "+commentsCount;
   repost.textContent=(reposted?"✓ ":"↻ ")+repostsCount;repost.classList.toggle("is-active",reposted);
  }
  like.addEventListener("click",async()=>{
   like.disabled=true;note.textContent="";
   const result=liked
    ?await client.from("likes").delete().eq("post_id",post.id).eq("user_id",userId)
    :await client.from("likes").insert({post_id:post.id,user_id:userId});
   if(result.error)note.textContent="Не удалось изменить лайк: "+result.error.message;
   await refreshCounts();like.disabled=false;
  });
  repost.addEventListener("click",async()=>{
   repost.disabled=true;note.textContent="";
   const result=reposted
    ?await client.from("reposts").delete().eq("post_id",post.id).eq("user_id",userId)
    :await client.from("reposts").insert({post_id:post.id,user_id:userId});
   if(result.error)note.textContent="Не удалось изменить репост: "+result.error.message;
   await refreshCounts();repost.disabled=false;
  });
  async function loadComments(){
   list.replaceChildren();const loading=document.createElement("div");loading.className="post-comment-note";loading.textContent="Загружаем комментарии…";list.append(loading);
   const result=await client.from("comments").select("id,user_id,content,created_at").eq("post_id",post.id).order("created_at",{ascending:true}).limit(100);
   if(result.error){loading.textContent="Не удалось загрузить комментарии: "+result.error.message;return;}
   list.replaceChildren();
   const ids=[...new Set((result.data||[]).map(x=>x.user_id).filter(Boolean))];let profiles={};
   if(ids.length){const p=await client.from("profiles").select("id,username,display_name").in("id",ids);if(!p.error)for(const item of p.data||[])profiles[item.id]=item;}
   if(!result.data?.length){const empty=document.createElement("div");empty.className="post-comment-note";empty.textContent="Пока нет комментариев. Будь первым!";list.append(empty);return;}
   for(const item of result.data){
    const row=document.createElement("article");row.className="post-comment";
    const author=document.createElement("strong");const p=profiles[item.user_id]||{};author.textContent=p.display_name||p.username||"Пользователь";appendDolbyOnlineIndicator(author,item.user_id);
    const body=document.createElement("div");body.textContent=item.content;
    const time=document.createElement("time");time.textContent=new Date(item.created_at).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    row.append(author,body,time);list.append(row);
   }
  }
  commentToggle.addEventListener("click",async()=>{panel.hidden=!panel.hidden;if(!panel.hidden){await loadComments();input.focus();}});
  form.addEventListener("submit",async event=>{
   event.preventDefault();const content=input.value.trim();if(!content)return;
   send.disabled=true;note.textContent="Отправляем…";
   const result=await client.from("comments").insert({post_id:post.id,user_id:userId,content});
   if(result.error){note.textContent="Не удалось отправить комментарий: "+result.error.message;send.disabled=false;return;}
   input.value="";note.textContent="Комментарий добавлен.";await loadComments();await refreshCounts();send.disabled=false;
  });
  refreshCounts();
 }

  function makePost(post,profilesById){
    const profile=profilesById[post.user_id]||{};
    const author=profile.name||profile.display_name||profile.full_name||profile.username||"Пользователь";
    const avatar=safeImageUrl(profile.avatar_url||profile.avatar);
    const card=document.createElement("article");card.className="post";
    const head=document.createElement("div");head.className="post-head";
    const avatarBox=document.createElement("div");avatarBox.className="post-avatar";
    if(avatar){const image=document.createElement("img");image.src=avatar;image.alt="";image.loading="lazy";avatarBox.appendChild(image);}
    else avatarBox.textContent=(String(author).trim()[0]||"◉").toUpperCase();
    const identity=document.createElement("div");identity.style.minWidth="0";
    const authorEl=document.createElement("div");authorEl.className="post-author";authorEl.textContent=author;appendDolbyOnlineIndicator(authorEl,post.user_id);
    const dateEl=document.createElement("div");dateEl.className="post-date";dateEl.textContent=formatDate(post.created_at);
    identity.append(authorEl,dateEl);head.append(avatarBox,identity);card.appendChild(head);
    if(post.content){const content=document.createElement("div");content.className="post-content";content.textContent=post.content;card.appendChild(content);}
    const imageUrl=safeImageUrl(post.image_url);
    if(imageUrl){const image=document.createElement("img");image.className="post-image";image.src=imageUrl;image.alt="Фото публикации";image.loading="lazy";image.decoding="async";card.appendChild(image);}
    if(userId)attachPostActions(post,card);
    return card;
  }
  function appendBatch(batch){
    let added=0;
    for(const post of batch.posts){if(seen.has(post.id))continue;seen.add(post.id);list.appendChild(makePost(post,batch.profilesById));added++;}
    return added;
  }
  async function prefetch(){
    if(finished||pendingBatch)return;
    try{const batch=await fetchBatch(offset);pendingBatch=batch;if(batch.posts.length<batchSize)finished=true;}
    catch(e){showError(e.message);}
  }
  async function loadMore(){
    if(loadingMore||(finished&&!pendingBatch))return;
    loadingMore=true;more.hidden=true;loading.hidden=false;
    try{
      let batch=pendingBatch;if(batch)pendingBatch=null;else batch=await fetchBatch(offset);
      offset+=batch.posts.length;const added=appendBatch(batch);
      if(batch.posts.length===0||batch.posts.length<batchSize)finished=true;
      if(list.children.length===0&&finished)empty.hidden=false;
      if(added===0&&!finished){loadingMore=false;await loadMore();return;}
      loading.hidden=true;if(!finished)await prefetch();more.hidden=finished;
    }catch(e){showError(e.message);more.hidden=false;}
    finally{loadingMore=false;}
  }
  more.addEventListener("click",loadMore);
  try{
    const first=await fetchBatch(0);if(signal.aborted)return;offset=first.posts.length;appendBatch(first);
    if(first.posts.length===0){finished=true;empty.hidden=false;loading.hidden=true;return;}
    if(first.posts.length<batchSize){finished=true;loading.hidden=true;return;}
    loading.hidden=true;prefetch();
    if("IntersectionObserver" in window){
      feedObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))loadMore();},{rootMargin:"500px 0px"});
      observer.observe(sentinel);
    }else more.hidden=false;
  }catch(e){showError(e.message);}
}


function initMobileDrawer(){
  const sidebar=root.querySelector("#sidebar");
  const backdrop=root.querySelector("#drawer-backdrop");
  const toggle=root.querySelector("#menu-toggle");
  if(!sidebar||!backdrop||!toggle)return;
  const mobile=()=>window.matchMedia("(max-width:700px)").matches;
  let opened=false,tracking=false,dragging=false,startX=0,lastX=0,lastTime=0,startTime=0,startProgress=0;
  let panelWidth=0,progress=0,pointerId=null;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function paint(value,animate){
    progress=clamp(value,0,1);
    sidebar.classList.toggle("dragging",!animate);
    sidebar.style.transform="translate3d("+(-panelWidth*(1-progress))+"px,0,0)";
    backdrop.style.opacity=String(progress*.72);
    backdrop.classList.toggle("visible",progress>0);
    backdrop.style.visibility=progress>0?"visible":"hidden";
  }
  function setOpen(value){
    opened=value;
    panelWidth=sidebar.getBoundingClientRect().width||Math.min(window.innerWidth*.82,300);
    sidebar.classList.remove("dragging");
    sidebar.style.transition="";
    sidebar.style.transform=value?"translate3d(0,0,0)":"";
    backdrop.style.opacity="";
    backdrop.style.visibility="";
    backdrop.classList.toggle("visible",value);
    homeRoot.classList.toggle("drawer-open",value);
    toggle.setAttribute("aria-expanded",String(value));
    toggle.setAttribute("aria-label",value?"Закрыть меню":"Открыть меню");
    toggle.textContent=value?"×":"☰";
    progress=value?1:0;
  }
  function begin(x,id){
    if(!mobile())return;
    panelWidth=sidebar.getBoundingClientRect().width||Math.min(window.innerWidth*.82,300);
    tracking=true;dragging=false;pointerId=id;startX=x;lastX=x;
    startTime=lastTime=performance.now();startProgress=opened?1:0;
  }
  function move(x,id,event){
    if(!tracking||id!==pointerId)return;
    const dx=x-startX;
    if(!dragging&&Math.abs(dx)>7){
      if((opened&&dx<0)||(!opened&&dx>0)){dragging=true;sidebar.classList.add("dragging");}
      else if(Math.abs(dx)>18){tracking=false;return;}
    }
    if(!dragging)return;
    if(event.cancelable)event.preventDefault();
    const next=opened?1+dx/panelWidth:dx/panelWidth;
    paint(next,false);
    const now=performance.now();lastX=x;lastTime=now;
  }
  function finish(id){
    if(!tracking||id!==pointerId)return;
    tracking=false;pointerId=null;
    if(!dragging)return;
    const elapsed=Math.max(1,performance.now()-lastTime);
    const velocity=(lastX-startX)/Math.max(1,performance.now()-startTime);
    const shouldOpen=progress>.38||(progress>.08&&velocity>.45);
    setOpen(shouldOpen);
    dragging=false;
  }
  root.addEventListener("pointerdown",event=>{
    if(!mobile()||event.button!==0)return;
    const x=event.clientX;
    if(!opened&&x<=24)begin(x,event.pointerId);
    else if(opened&&sidebar.contains(event.target))begin(x,event.pointerId);
  },{passive:true,signal});
  document.addEventListener("pointermove",event=>move(event.clientX,event.pointerId,event),{passive:false,signal});
  document.addEventListener("pointerup",event=>finish(event.pointerId),{passive:true,signal});
  document.addEventListener("pointercancel",event=>finish(event.pointerId),{passive:true,signal});
  toggle.addEventListener("click",()=>setOpen(!opened));
  backdrop.addEventListener("click",()=>setOpen(false));
  sidebar.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{if(mobile())setOpen(false);}));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&opened)setOpen(false);},{signal});
  window.addEventListener("resize",()=>{if(!mobile()){setOpen(false);sidebar.style.transform="";}},{signal});
  setOpen(false);
}

initMobileDrawer();
start();


  return async () => {
    if (feedObserver) feedObserver.disconnect();
    if (dolbyOnlineChannel && client) {
      try { await dolbyOnlineChannel.untrack(); } catch (_) {}
      try { await client.removeChannel(dolbyOnlineChannel); } catch (_) {}
      dolbyOnlineChannel = null;
    }
dolbyOnlineUsers.clear();
    style.remove();
    root.replaceChildren();
  };
}
