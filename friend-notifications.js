(function(){
"use strict";
const STYLE_ID="floustream-friend-notification-style";
function installStyles(root){
 root=root||document;
 if(root.querySelector("#"+STYLE_ID))return;
 const style=document.createElement("style");style.id=STYLE_ID;
 style.textContent=".side-drawer-link#friends-nav-link{position:relative}.friend-request-badge{display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;margin-left:auto;padding:0 6px;border:1px solid #ff9abf;border-radius:999px;background:linear-gradient(135deg,#ff4f91,#c51e68);box-shadow:0 0 12px #ff4f9166;color:#fff;font-size:11px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}.friend-request-badge[hidden]{display:none}";
 (root===document?document.head:root).append(style);
}
window.initFloustreamFriendNotifications=function(client,userId,options){
 options=options||{};
 if(!client||!userId)return null;
 const previous=window.__floustreamFriendNotificationsState;
 if(previous&&previous.userId===userId&&!previous.disposed)return previous.dispose;
 if(previous&&typeof previous.dispose==="function")previous.dispose();
 const root=options.root||document;
 window.__floustreamFriendNotificationsUser=userId;installStyles(root);
 const nav=root.querySelector("#friends-nav-link");let badge=null,disposed=false;
 if(nav){badge=document.createElement("span");badge.className="friend-request-badge";badge.id="friend-request-count";badge.hidden=true;badge.setAttribute("aria-label","Новые заявки в друзья");nav.append(badge);}
 async function refreshCount(){
  if(disposed)return;
  const result=await client.from("friend_requests").select("id",{count:"exact",head:true}).eq("recipient_id",userId).eq("status","pending");
  if(disposed)return;
  if(result.error){console.warn("FLOUSTREAM friend request count:",result.error);return;}
  const count=result.count||0;if(badge){badge.hidden=count===0;badge.textContent=count>99?"99+":String(count);badge.title=count+" приглашений в друзья";}
 }
 const channel=client.channel("floustream-friend-requests-"+userId)
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"friend_requests",filter:"recipient_id=eq."+userId},payload=>{
   refreshCount();
   if(payload.new&&"Notification"in window&&Notification.permission==="granted"){
    try{const n=new Notification("FLOUSTREAM · Приглашение в друзья",{body:"Кто-то предложил вам дружбу",tag:"floustream-friend-"+payload.new.id});n.onclick=()=>{window.focus();location.href="friends.html";n.close();};}catch(_){}
   }
  })
  .on("postgres_changes",{event:"UPDATE",schema:"public",table:"friend_requests",filter:"recipient_id=eq."+userId},refreshCount)
  .on("postgres_changes",{event:"DELETE",schema:"public",table:"friend_requests"},refreshCount)
  .subscribe(status=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.warn("FLOUSTREAM friend notifications realtime:",status);});
 const onPageShow=()=>refreshCount();
 const onVisibility=()=>{if(!document.hidden)refreshCount();};
 function dispose(){
  if(disposed)return;
  disposed=true;
  window.removeEventListener("pageshow",onPageShow);
  document.removeEventListener("visibilitychange",onVisibility);
  window.removeEventListener("beforeunload",dispose);
  if(badge)badge.remove();
  try{client.removeChannel(channel);}catch(error){console.warn("FLOUSTREAM friend notifications cleanup:",error);}
  if(window.__floustreamFriendNotificationsState===state){
   window.__floustreamFriendNotificationsState=null;
   delete window.__floustreamFriendNotificationsUser;
  }
 }
 const state={userId,dispose,get disposed(){return disposed;}};
 window.__floustreamFriendNotificationsState=state;
 window.addEventListener("pageshow",onPageShow);
 document.addEventListener("visibilitychange",onVisibility);
 window.addEventListener("beforeunload",dispose,{once:true});
 if(options.signal){
  if(options.signal.aborted)dispose();
  else options.signal.addEventListener("abort",dispose,{once:true});
 }
 refreshCount();
 return dispose;
};
})();