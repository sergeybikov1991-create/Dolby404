const STYLE = "\n*{box-sizing:border-box}\n.fs-route-home{--bg:#090910;--panel:#12121d;--line:#29283a;--purple:#a66bff;--muted:#9291a8;--text:#f7f4ff}\n .fs-route-home{width:100%;margin:0;background:radial-gradient(ellipse at 15% 0%,#20123b 0,transparent 38%),var(--bg);color:var(--text);font-family:Arial,sans-serif;min-height:100vh}\nbutton,a{font:inherit}\nbutton{cursor:pointer}\n.topbar{height:68px;position:sticky;top:0;z-index:5;background:#0b0b13ed;backdrop-filter:blur(14px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 max(calc((100% - 1120px)/2),20px)}\n.logo{font-size:25px;font-weight:900;letter-spacing:3px;color:#fff;text-shadow:0 0 18px #7b4bff}\n.account{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:13px}\n.logout{border:1px solid #554078;background:#211632;color:#e7d8ff;border-radius:20px;padding:9px 14px}\n.layout{max-width:1120px;margin:34px auto;padding:0 20px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:26px}\n.sidebar,.panel,.welcome{background:linear-gradient(145deg,#171522,#101019);border:1px solid var(--line);border-radius:18px}\n.sidebar{padding:16px;height:max-content;position:sticky;top:88px}\n.nav{display:flex;flex-direction:column;gap:7px}\n.nav a{color:#c9c4d7;text-decoration:none;padding:12px;border-radius:11px;font-size:14px}\n.nav a.active,.nav a:hover{background:#302044;color:#fff}\n.main{min-width:0}\n.welcome{padding:25px;margin-bottom:20px;background:radial-gradient(ellipse at 85% 15%,#4c2674 0,transparent 45%),linear-gradient(120deg,#191629,#11111b)}\n.eyebrow{color:#c4a2ff;text-transform:uppercase;letter-spacing:3px;font-size:10px}\nh1{font-size:clamp(25px,5vw,36px);margin:12px 0 8px}\n.welcome p{color:#b6b0c6;line-height:1.55;margin:0}\n.section-title{font-size:17px;margin:26px 0 13px}\n.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}\n.tile{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:18px;min-height:132px}\n.tile-icon{font-size:25px;margin-bottom:12px}\n.tile h3{font-size:15px;margin:0 0 7px}\n.tile p{font-size:12px;color:var(--muted);line-height:1.45;margin:0}\n.feed-empty{padding:28px;text-align:center;background:var(--panel);border:1px dashed #45405a;border-radius:15px;color:var(--muted);line-height:1.6}\n.feed-empty strong{display:block;color:#eee5ff;margin-bottom:7px}\n#status{font-size:13px;color:#bda1ff;margin-top:16px;min-height:18px}\n@media(max-width:700px){.topbar{height:60px;padding:0 14px}.logo{font-size:20px}.account{gap:7px;font-size:11px}.layout{display:block;margin:18px auto;padding:0 12px}.sidebar{position:static;margin-bottom:15px;padding:8px}.nav{flex-direction:row;overflow-x:auto}.nav a{white-space:nowrap;padding:10px;font-size:12px}.grid{grid-template-columns:1fr}.welcome{padding:20px}.logout{padding:8px 10px}}\n\n.feed{display:flex;flex-direction:column;gap:14px}\n.post{background:linear-gradient(145deg,#171522,#101019);border:1px solid var(--line);border-radius:16px;padding:17px;overflow:hidden}\n.post-head{display:flex;align-items:center;gap:11px;margin-bottom:13px;min-width:0}\n.post-avatar{width:42px;height:42px;border-radius:50%;background:#302044;border:1px solid #62458b;display:grid;place-items:center;overflow:hidden;flex-shrink:0;color:#e7d8ff;font-weight:bold}\n.post-avatar img{width:100%;height:100%;object-fit:cover}\n.post-author{font-size:14px;font-weight:700;overflow-wrap:anywhere}\n.post-date{font-size:11px;color:var(--muted);margin-top:4px}\n.post-content{font-size:14px;line-height:1.6;color:#e9e4f2;white-space:pre-wrap;overflow-wrap:anywhere}\n.post-image{display:block;width:100%;max-height:520px;object-fit:contain;border-radius:12px;margin-top:13px;background:#090910}\n.feed-loading,.feed-error{padding:16px;text-align:center;color:var(--muted);font-size:13px}\n.feed-error{color:#ffb4c0}\n.feed-more{align-self:center;border:1px solid #62458b;border-radius:22px;padding:10px 18px;background:#2a1b3d;color:#f1e7ff}\n#feed-sentinel{height:1px}\n\n\n/* Mobile edge-swipe navigation */\n.menu-toggle{display:none;width:40px;height:40px;border:1px solid #49345f;border-radius:12px;background:#171321;color:#e9d9ff;font-size:21px;line-height:1}\n.drawer-backdrop{display:none}\n@media(max-width:700px){\n  .fs-route-home{touch-action:pan-y}\n  .topbar{z-index:30;justify-content:flex-start;gap:12px}\n  .menu-toggle{display:grid;place-items:center;flex-shrink:0}\n  .account{margin-left:auto}\n  .layout{display:block;margin:18px auto;padding:0 12px}\n  .sidebar{\n    display:block;position:fixed;z-index:25;left:0;top:0;bottom:0;\n    width:min(82vw,300px);height:100dvh;margin:0;padding:76px 14px 20px;\n    border-radius:0 20px 20px 0;border-left:0;\n    background:linear-gradient(160deg,#1b1729,#0e0d16 78%);\n    box-shadow:12px 0 45px #0008;\n    transform:translate3d(-105%,0,0);transition:transform .24s cubic-bezier(.2,.75,.25,1);\n    will-change:transform;overflow-y:auto;overscroll-behavior:contain;\n  }\n  .sidebar.dragging{transition:none}\n  .nav{flex-direction:column;gap:8px}\n  .nav a{padding:15px 14px;font-size:15px}\n  .drawer-backdrop{\n    display:block;position:fixed;z-index:20;inset:0;background:#05040bc7;\n    opacity:0;visibility:hidden;transition:opacity .24s ease,visibility .24s;\n    touch-action:pan-y\n  }\n  .drawer-backdrop.visible{opacity:1;visibility:visible}\n  .fs-route-home.drawer-open{overflow:hidden}\n  .grid{grid-template-columns:1fr}\n  .welcome{padding:20px}\n  .logout{padding:8px 10px}\n}\n\n\n.post-social-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:11px;border-top:1px solid #342943}\n.post-social-button{min-height:36px;padding:7px 13px;border:1px solid #49385e;border-radius:11px;background:#171321;color:#d9c9f0;font-size:13px}\n.post-social-button.is-active{border-color:#a66bff;background:#38204e;color:#fff;box-shadow:0 0 12px #9d5bff22}\n.post-comments-panel{margin-top:10px;padding:12px;border:1px solid #3c2d50;border-radius:13px;background:#0e0c16}\n.post-comments-panel[hidden]{display:none}\n.post-comments-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow:auto}\n.post-comment{padding:9px 10px;border:1px solid #302640;border-radius:10px;background:#171321;color:#e9e1f5;font-size:13px;overflow-wrap:anywhere}\n.post-comment strong{display:block;margin-bottom:5px;color:#d7baff}\n.post-comment time{display:block;margin-top:5px;color:#8f879d;font-size:10px}\n.post-comment-form{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px;margin-top:10px}\n.post-comment-form textarea{min-height:40px;max-height:110px;margin:0;padding:10px;border:1px solid #403653;border-radius:10px;background:#090811;color:#fff;font:inherit;resize:vertical}\n.post-comment-form button{padding:9px 12px;border-radius:10px;font-size:12px}\n.post-comment-note{margin-top:7px;color:#bda1ff;font-size:11px;overflow-wrap:anywhere}\n@media(max-width:380px){.post-social-actions{gap:6px}.post-social-button{padding:7px 10px;font-size:12px}.post-comment-form{grid-template-columns:1fr}.post-comment-form button{justify-self:end}}\n\n\n/* FLOUSTREAM PULSE online status */\n.dolby-online-indicator{position:relative;display:inline-block;vertical-align:middle;width:8px;height:8px;flex:0 0 8px;margin-left:8px;border-radius:50%;background:#716b7b;box-shadow:0 0 0 1px #a69bb8;transition:background .2s ease,box-shadow .2s ease}\n.dolby-online-indicator.is-online{background:#69ffd1;box-shadow:0 0 0 1px #b7ffe9,0 0 8px #4effc5,0 0 15px #936bff;animation:dolbyPulseCore 1.8s ease-in-out infinite}\n.dolby-online-indicator.is-online::after{content:\"\";position:absolute;inset:-5px;border:1px solid #a66bff;border-radius:50%;opacity:0;animation:dolbyPulseRing 1.8s ease-out infinite}\n@keyframes dolbyPulseCore{0%,100%{filter:brightness(.9)}50%{filter:brightness(1.45)}}\n@keyframes dolbyPulseRing{0%{transform:scale(.55);opacity:.75}85%,100%{transform:scale(1.8);opacity:0}}\n@media(prefers-reduced-motion:reduce){.dolby-online-indicator.is-online,.dolby-online-indicator.is-online::after{animation:none}.dolby-online-indicator.is-online::after{opacity:.35;transform:scale(1.2)}}\n\n";
const MARKUP = "<section class=\"fs-route-home\">\n<header class=\"topbar\">\n  <button class=\"menu-toggle\" id=\"menu-toggle\" type=\"button\" aria-label=\"Открыть меню\" aria-expanded=\"false\">☰</button>\n  <div class=\"logo\">FLOUSTREAM</div>\n  <div class=\"account\"><span id=\"user-email\">Проверяем аккаунт…</span><button class=\"logout\" id=\"logout-button\" hidden>Выйти</button></div>\n</header>\n<div class=\"drawer-backdrop\" id=\"drawer-backdrop\"></div>\n<div class=\"layout\" id=\"app\" hidden>\n  <aside class=\"sidebar\" id=\"sidebar\">\n    <nav class=\"nav\">\n      <a class=\"active\" href=\"home.html\">⌂ Главная</a>\n      <a href=\"#messages\" data-soon=\"Сообщения\">✉ Сообщения</a>\n      <a href=\"#communities\" data-soon=\"Паблики\">◎ Паблики</a>\n      <a href=\"#saved\" data-soon=\"Сохранённое\">♡ Сохранённое</a>\n      <a href=\"profile.html\">◉ Профиль</a>\n      <a href=\"backgammon.html\">🎲 Длинные нарды</a>\n    </nav>\n  </aside>\n  <main class=\"main\">\n    <section class=\"welcome\">\n      <div class=\"eyebrow\">ТВОЁ ЦИФРОВОЕ ПРОСТРАНСТВО</div>\n      <h1>Добро пожаловать в FLOUSTREAM</h1>\n      <p>Здесь будут твои публикации, общение, музыка, фото, видео и сообщества. Мы постепенно превращаем каждый раздел в настоящую работающую функцию.</p>\n      <div id=\"status\"></div>\n    </section>\n    <h2 class=\"section-title\">Твоё пространство</h2>\n    <section class=\"grid\">\n      <article class=\"tile\"><div class=\"tile-icon\">✉️</div><h3>Сообщения</h3><p>Личные переписки и обмен файлами — следующий этап разработки.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🎥</div><h3>Аудио и видеозвонки</h3><p>Подготовим звонки между пользователями после запуска личных сообщений.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🎵</div><h3>Медиатека</h3><p>Сохранённые фотографии, видео и музыкальные материалы.</p></article>\n      <article class=\"tile\"><div class=\"tile-icon\">🌐</div><h3>Паблики</h3><p>Публичные сообщества, подписчики, публикации и обсуждения.</p></article>\n    </section>\n    <h2 class=\"section-title\">Лента публикаций</h2>\n    <section class=\"feed\" id=\"feed\" aria-live=\"polite\">\n      <div id=\"feed-list\"></div>\n      <div class=\"feed-loading\" id=\"feed-loading\">Загружаем публикации…</div>\n      <div class=\"feed-empty\" id=\"feed-empty\" hidden><strong>Пока публикаций нет</strong>Здесь появятся записи пользователей FLOUSTREAM.</div>\n      <div class=\"feed-error\" id=\"feed-error\" hidden></div>\n      <div id=\"feed-sentinel\" aria-hidden=\"true\"></div>\n      <button class=\"feed-more\" id=\"feed-more\" type=\"button\" hidden>Показать ещё</button>\n    </section>\n  </main>\n</div>\n<div id=\"loading\" style=\"max-width:560px;margin:18vh auto;padding:25px;text-align:center;color:#c9b7ee\">Подключаем FLOUSTREAM…</div>\n</section>";
export const title = "FLOUSTREAM — Главная";

export function mount(root, { signal, navigate }) {
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "home";
  style.textContent = STYLE;
  root.innerHTML = MARKUP;
  root.appendChild(style);
  const homeRoot = root.querySelector(".fs-route-home");
  let client = null;
  let feedObserver = null;

  
const SUPABASE_URL = "https://qhpobdktlbhdqsnajypr.supabase.co";
const SUPABASE_KEY = "sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
const loading = root.querySelector("#loading");
const app = root.querySelector("#app");
const status = root.querySelector("#status");
function loadSupabase(){
  return new Promise((resolve,reject)=>{
    if(window.supabase?.createClient){resolve();return;}
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload=()=>window.supabase?.createClient?resolve():reject(new Error("Supabase не загрузился"));
    script.onerror=()=>reject(new Error("Не удалось загрузить библиотеку Supabase"));
    document.head.appendChild(script);
  });
}

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
    await loadSupabase();
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"sb-qhpobdktlbhdqsnajypr-auth-token"}});
    const {data,error}=await client.auth.getSession();
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
      window.location.replace("portal.html");
    });
    root.querySelectorAll("[data-soon]").forEach(link=>{
      link.addEventListener("click",event=>{
        event.preventDefault();
        status.textContent="Раздел «"+link.dataset.soon+"» добавим следующим этапом.";
      });
    });
  }catch(error){
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
  const userId=auth.data.user?.id;
  const seen=new Set();
  let offset=0, pendingBatch=null, loadingMore=false, finished=false;
  const batchSize=5;
  function showError(message){
    errorBox.hidden=false;errorBox.textContent="Не удалось загрузить ленту: "+message;
    loading.hidden=true;more.hidden=false;
  }
  async function fetchBatch(from){
    const result=await client.from("posts").select("*").order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,from+batchSize-1);
    if(result.error)throw result.error;
    const posts=result.data||[];let profilesById={};
    const userIds=[...new Set(posts.map(p=>p.user_id).filter(Boolean))];
    if(userIds.length){
      const profiles=await client.from("profiles").select("*").in("id",userIds);
      if(!profiles.error)for(const profile of (profiles.data||[]))profilesById[profile.id]=profile;
    }
    return {posts,profilesById};
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
    const first=await fetchBatch(0);offset=first.posts.length;appendBatch(first);
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
  document.addEventListener("pointerdown",event=>{
    if(!mobile()||event.button!==0)return;
    const x=event.clientX;
    if(!opened&&x<=24)begin(x,event.pointerId);
    else if(opened&&sidebar.contains(event.target))begin(x,event.pointerId);
  },{passive:true,signal});
  document.addEventListener("pointermove",event=>move(event.clientX,event.pointerId,event),{passive:false});
  document.addEventListener("pointerup",event=>finish(event.pointerId),{passive:true});
  document.addEventListener("pointercancel",event=>finish(event.pointerId),{passive:true});
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
    try { await client?.auth?.stopAutoRefresh?.(); } catch (_) {}
    dolbyOnlineUsers.clear();
    style.remove();
    root.replaceChildren();
  };
}
