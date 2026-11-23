const STYLE = "\n.fs-route-friends{--bg:#090910;--panel:#15121f;--line:#382b4b;--purple:#a66bff;--muted:#aaa0ba;--text:#f5f0ff;width:100%;min-height:100vh;background:radial-gradient(ellipse at 18% 0%,#281342 0,transparent 38%),#090910;color:#f5f0ff;font-family:Arial,sans-serif}\n.fs-route-friends,.fs-route-friends *{box-sizing:border-box}\n.fs-route-friends .topbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px max(calc((100% - 760px)/2),16px);border-bottom:1px solid var(--line);background:#0b0a12ed;backdrop-filter:blur(12px)}\n.fs-route-friends .back{width:40px;height:40px;display:grid;place-items:center;border:1px solid #65458a;border-radius:12px;background:#21172f;color:#eee2ff;text-decoration:none;font-size:22px}\n.fs-route-friends .brand{font-size:18px;font-weight:900;letter-spacing:3px;color:#e9d8ff;text-shadow:0 0 18px #7b4bff}\n.fs-route-friends .wrap{width:min(760px,100%);margin:0 auto;padding:18px 16px 40px}.fs-route-friends .page-title{margin:4px 0 6px;font-size:25px}.fs-route-friends .subtitle{margin:0 0 18px;color:var(--muted);font-size:13px}\n.fs-route-friends .panel{margin:0 0 14px;padding:15px;border:1px solid #49345f;border-radius:18px;background:linear-gradient(145deg,#171321,#0e0d16);box-shadow:0 12px 45px #0005}\n.fs-route-friends .panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px}.fs-route-friends .panel h2{margin:0;font-size:16px}.fs-route-friends .count{min-width:22px;height:22px;display:grid;place-items:center;padding:0 6px;border-radius:99px;background:#342044;color:#e7caff;font-size:11px;font-weight:800}\n.fs-route-friends .list{display:grid;gap:10px}.fs-route-friends .empty{padding:20px 8px;text-align:center;color:#a99bbd;font-size:13px;line-height:1.6}\n.fs-route-friends .person{display:flex;align-items:center;gap:12px;padding:11px;border:1px solid #392b4b;border-radius:14px;background:linear-gradient(120deg,#21182d,#14111d)}\n.fs-route-friends .avatar{width:52px;height:52px;flex:0 0 52px;display:grid;place-items:center;overflow:hidden;border:1px solid #9a69c7;border-radius:50%;background:#352044;font-weight:800;color:white}.fs-route-friends .avatar img{width:100%;height:100%;object-fit:cover}\n.fs-route-friends .copy{display:grid;gap:5px;min-width:0;flex:1}.fs-route-friends .name{font-size:14px;font-weight:800;overflow-wrap:anywhere}.fs-route-friends .handle{font-size:11px;color:#c59aff}.fs-route-friends .meta{font-size:11px;color:#a99bbd}\n.fs-route-friends .actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.fs-route-friends .person-main{flex:1;min-width:0}\n.fs-route-friends button,.fs-route-friends .profile-link{min-height:37px;padding:8px 12px;border:1px solid #76519a;border-radius:11px;background:#281b38;color:#f3eaff;font-size:12px;font-weight:750;cursor:pointer;text-decoration:none}\n.fs-route-friends button.primary{border-color:#a879df;background:linear-gradient(135deg,#7139c9,#48216f);color:#fff}\n.fs-route-friends button.danger{border-color:#75405a;background:#301a2a;color:#ffdce9}\n.fs-route-friends button:disabled{opacity:.55;cursor:default}\n.fs-route-friends .notice{min-height:20px;margin:0 0 10px;color:#c8a7e8;font-size:12px}.fs-route-friends .error{color:#ff9db8}\n@media(max-width:560px){.fs-route-friends .person{align-items:flex-start;flex-wrap:wrap}.fs-route-friends .person-main{min-width:calc(100% - 70px)}.fs-route-friends .actions{width:100%;padding-left:64px}.fs-route-friends .topbar{padding:10px 12px}.fs-route-friends .wrap{padding:14px 10px 32px}}\n";
export const title = "Друзья · FLOUSTREAM";

function ensureFriendNotifications() {
  if (window.initFloustreamFriendNotifications) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("../friend-notifications.js", import.meta.url).href;
    script.onload = () => window.initFloustreamFriendNotifications ? resolve() : reject(new Error("Модуль уведомлений друзей не инициализирован"));
    script.onerror = () => reject(new Error("Не удалось загрузить уведомления друзей"));
    document.head.appendChild(script);
  });
}

export function mount(root, { signal }) {
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "friends";
  style.textContent = STYLE;
  document.head.appendChild(style);
  root.innerHTML = "<section class=\"fs-route-friends\">\n<header class=\"topbar\"><a class=\"back\" href=\"profile.html\" aria-label=\"Назад\">‹</a><div class=\"brand\">FLOUSTREAM</div></header>\n<main class=\"wrap\">\n<h1 class=\"page-title\">Друзья</h1><p class=\"subtitle\">Приглашения и люди, с которыми вы уже подружились.</p>\n<div class=\"notice\" id=\"notice\" aria-live=\"polite\"></div>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Входящие приглашения</h2><span class=\"count\" id=\"incoming-count\">0</span></div><div class=\"list\" id=\"incoming-list\"><div class=\"empty\">Загружаем приглашения…</div></div></section>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Мои друзья</h2><span class=\"count\" id=\"friends-count\">0</span></div><div class=\"list\" id=\"friends-list\"><div class=\"empty\">Загружаем друзей…</div></div></section>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Отправленные приглашения</h2><span class=\"count\" id=\"outgoing-count\">0</span></div><div class=\"list\" id=\"outgoing-list\"><div class=\"empty\">Загружаем…</div></div></section>\n</main>\n</section>";

  let channel = null;
  const SUPABASE_URL = "https://qhpobdktlbhdqsnajypr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";
  const $ = id => root.querySelector("#" + id);
  let client, viewer, refreshing = false;

  function loadLibrary(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient)return resolve();const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=()=>window.supabase?.createClient?resolve():reject(new Error("Supabase не загрузился"));s.onerror=()=>reject(new Error("Нет подключения к Supabase"));document.head.append(s);});}
  function notice(message,error){$("notice").textContent=message||"";$("notice").classList.toggle("error",!!error);}
  function profileCard(profile,sub,buttons){
   const card=document.createElement("article");card.className="person";
   const avatar=document.createElement("div");avatar.className="avatar";
   if(profile.avatar_url){const img=document.createElement("img");img.src=profile.avatar_url;img.alt="";img.loading="lazy";avatar.append(img);}else avatar.textContent=(profile.display_name||profile.username||"◉").slice(0,1).toUpperCase();
   const main=document.createElement("div");main.className="person-main";const copy=document.createElement("div");copy.className="copy";
   const name=document.createElement("div");name.className="name";name.textContent=profile.display_name||profile.username||"Пользователь";
   const handle=document.createElement("div");handle.className="handle";handle.textContent=profile.username?"@"+profile.username:"";
   const meta=document.createElement("div");meta.className="meta";meta.textContent=sub||"Участник FLOUSTREAM";
   copy.append(name,handle,meta);main.append(copy);
   const actions=document.createElement("div");actions.className="actions";
   const link=document.createElement("a");link.className="profile-link";link.href="public-profile.html?id="+encodeURIComponent(profile.id);link.textContent="Профиль";actions.append(link);
   (buttons||[]).forEach(spec=>{const b=document.createElement("button");b.type="button";b.textContent=spec.label;b.className=spec.kind||"";b.addEventListener("click",spec.run);actions.append(b);});
   card.append(avatar,main,actions);return card;
  }
  function showEmpty(host,message){const e=document.createElement("div");e.className="empty";e.textContent=message;host.append(e);}
  async function loadAll(){
   if(signal.aborted||refreshing||!client||!viewer)return;refreshing=true;
   try{
    const [incoming,outgoing,accepted]=await Promise.all([
     client.from("friend_requests").select("id,requester_id,recipient_id,created_at,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,avatar_url)").eq("recipient_id",viewer.id).eq("status","pending").order("created_at",{ascending:false}),
     client.from("friend_requests").select("id,requester_id,recipient_id,created_at,recipient:profiles!friend_requests_recipient_id_fkey(id,username,display_name,avatar_url)").eq("requester_id",viewer.id).eq("status","pending").order("created_at",{ascending:false}),
     client.from("friend_requests").select("id,requester_id,recipient_id,user_low_id,user_high_id,created_at").eq("status","accepted").or("user_low_id.eq."+viewer.id+",user_high_id.eq."+viewer.id).order("updated_at",{ascending:false})
    ]);
    if(signal.aborted)return;
    for(const r of [incoming,outgoing,accepted])if(r.error)throw r.error;
    $("incoming-list").replaceChildren();$("outgoing-list").replaceChildren();$("friends-list").replaceChildren();
    $("incoming-count").textContent=(incoming.data||[]).length;$("outgoing-count").textContent=(outgoing.data||[]).length;
    if(!(incoming.data||[]).length)showEmpty($("incoming-list"),"Пока нет новых приглашений.");
    for(const row of incoming.data||[]){
     const p=row.requester;if(!p)continue;
     const card=profileCard(p,"Предлагает стать друзьями",[
      {label:"Добавить",kind:"primary",run:async e=>{const b=e.currentTarget;b.disabled=true;const r=await client.from("friend_requests").update({status:"accepted"}).eq("id",row.id).eq("recipient_id",viewer.id).eq("status","pending").select("id").maybeSingle();if(r.error||!r.data){notice(r.error?.message||"Приглашение уже обработано.",true);b.disabled=false;return;}notice("Теперь вы друзья!");await loadAll();}},
      {label:"Отказать",kind:"danger",run:async e=>{const b=e.currentTarget;b.disabled=true;const r=await client.from("friend_requests").delete().eq("id",row.id).eq("recipient_id",viewer.id);if(r.error){notice(r.error.message,true);b.disabled=false;return;}notice("Приглашение отклонено.");await loadAll();}}
     ]);$("incoming-list").append(card);
    }
    if(!(accepted.data||[]).length)showEmpty($("friends-list"),"Здесь появятся пользователи, с которыми вы станете друзьями.");
    if((accepted.data||[]).length){
     const ids=[...new Set((accepted.data||[]).map(r=>r.requester_id===viewer.id?r.recipient_id:r.requester_id))];
     const profiles=await client.from("profiles").select("id,username,display_name,avatar_url").in("id",ids);if(signal.aborted)return;if(profiles.error)throw profiles.error;
     const byId=new Map((profiles.data||[]).map(p=>[p.id,p]));$("friends-count").textContent=ids.length;
     for(const id of ids){const p=byId.get(id);if(!p)continue;const row=(accepted.data||[]).find(r=>r.requester_id===id||r.recipient_id===id);
      const card=profileCard(p,"Ваш друг",[{label:"Удалить из друзей",kind:"danger",run:async e=>{const b=e.currentTarget;b.disabled=true;const r=await client.from("friend_requests").delete().eq("id",row.id).eq("status","accepted");if(r.error){notice(r.error.message,true);b.disabled=false;return;}notice("Пользователь удалён из друзей.");await loadAll();}}]);$("friends-list").append(card);
     }
    }else $("friends-count").textContent="0";
    if(!(outgoing.data||[]).length)showEmpty($("outgoing-list"),"Нет отправленных приглашений.");
    for(const row of outgoing.data||[]){const p=row.recipient;if(!p)continue;const card=profileCard(p,"Ожидает вашего приглашения",[{label:"Отменить",kind:"danger",run:async e=>{const b=e.currentTarget;b.disabled=true;const r=await client.from("friend_requests").delete().eq("id",row.id).eq("requester_id",viewer.id).eq("status","pending");if(r.error){notice(r.error.message,true);b.disabled=false;return;}notice("Приглашение отменено.");await loadAll();}}]);$("outgoing-list").append(card);}
   }catch(error){if(!signal.aborted)notice("Не удалось загрузить друзей: "+error.message,true);}
   finally{refreshing=false;}
  }
  async function start(){
   try{
    await loadLibrary();if(signal.aborted)return;
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:"sb-qhpobdktlbhdqsnajypr-auth-token"}});
    const stored=await client.auth.getSession();if(signal.aborted)return;if(stored.error)throw stored.error;
    if(!stored.data?.session)throw new Error("Сессия не найдена в хранилище браузера. Вернись на страницу входа и авторизуйся снова.");
    const auth=await client.auth.getUser();if(signal.aborted)return;if(auth.error)throw auth.error;viewer=auth.data.user;
    if(!viewer){location.replace("portal.html");return;}
    await ensureFriendNotifications();if(signal.aborted)return;
    window.initFloustreamFriendNotifications?.(client,viewer.id,{signal});
    await loadAll();if(signal.aborted)return;
    channel=client.channel("floustream-friends-page-"+viewer.id).on("postgres_changes",{event:"*",schema:"public",table:"friend_requests"},()=>loadAll()).subscribe();
    signal.addEventListener("abort",()=>{if(channel)client.removeChannel(channel);},{once:true});
   }catch(error){if(!signal.aborted)notice("Не удалось открыть раздел друзей: "+error.message,true);}
  }
  start();

  return async () => {
    if(channel&&client) await client.removeChannel(channel);
    style.remove();
    root.replaceChildren();
  };
}
