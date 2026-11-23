import { attachRouteStyles } from "../shared/route-styles.mjs";
import { getSupabaseClient } from "../shared/supabase-client.mjs";


export const stylesheet = new URL("./styles/friends.css?v=1", import.meta.url).href;
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

export async function mount(root, { signal, navigate }) {
root.innerHTML = "<section class=\"fs-route-friends\">\n<header class=\"topbar\"><a class=\"back\" href=\"profile.html\" aria-label=\"Назад\">‹</a><div class=\"brand\">FLOUSTREAM</div></header>\n<main class=\"wrap\">\n<h1 class=\"page-title\">Друзья</h1><p class=\"subtitle\">Приглашения и люди, с которыми вы уже подружились.</p>\n<div class=\"notice\" id=\"notice\" aria-live=\"polite\"></div>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Входящие приглашения</h2><span class=\"count\" id=\"incoming-count\">0</span></div><div class=\"list\" id=\"incoming-list\"><div class=\"empty\">Загружаем приглашения…</div></div></section>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Мои друзья</h2><span class=\"count\" id=\"friends-count\">0</span></div><div class=\"list\" id=\"friends-list\"><div class=\"empty\">Загружаем друзей…</div></div></section>\n<section class=\"panel\"><div class=\"panel-head\"><h2>Отправленные приглашения</h2><span class=\"count\" id=\"outgoing-count\">0</span></div><div class=\"list\" id=\"outgoing-list\"><div class=\"empty\">Загружаем…</div></div></section>\n</main>\n</section>";
  const style = await attachRouteStyles(root, stylesheet, "friends", signal);
  if (!style) return;

  let channel = null;
  const $ = id => root.querySelector("#" + id);
  let client, viewer, refreshing = false;

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
    client=await getSupabaseClient({signal});if(signal.aborted)return;
    const stored=await client.auth.getSession();if(signal.aborted)return;if(stored.error)throw stored.error;
    if(!stored.data?.session)throw new Error("Сессия не найдена в хранилище браузера. Вернись на страницу входа и авторизуйся снова.");
    const auth=await client.auth.getUser();if(signal.aborted)return;if(auth.error)throw auth.error;viewer=auth.data.user;
    if(!viewer){navigate("portal.html");return;}
    await ensureFriendNotifications();if(signal.aborted)return;
    window.initFloustreamFriendNotifications?.(client,viewer.id,{signal});
    await loadAll();if(signal.aborted)return;
    channel=client.channel("floustream-friends-page-"+viewer.id).on("postgres_changes",{event:"*",schema:"public",table:"friend_requests"},()=>loadAll()).subscribe();
   }catch(error){if(!signal.aborted)notice("Не удалось открыть раздел друзей: "+error.message,true);}
  }
  start();

  return async () => {
    if(channel&&client) await client.removeChannel(channel);
style.remove();
    root.replaceChildren();
  };
}
