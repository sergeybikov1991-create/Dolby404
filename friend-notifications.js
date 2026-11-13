(function(){
"use strict";
const STYLE_ID="floustream-friend-notification-style";
function installStyles(){
 if(document.getElementById(STYLE_ID))return;
 const style=document.createElement("style");style.id=STYLE_ID;
 style.textContent=".side-drawer-link#friends-nav-link{position:relative}.friend-request-badge{display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;margin-left:auto;padding:0 6px;border:1px solid #ff9abf;border-radius:999px;background:linear-gradient(135deg,#ff4f91,#c51e68);box-shadow:0 0 12px #ff4f9166;color:#fff;font-size:11px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}.friend-request-badge[hidden]{display:none}";
 document.head.append(style);
}
window.initFloustreamFriendNotifications=function(client,userId){
 if(!client||!userId||window.__floustreamFriendNotificationsUser===userId)return;
 window.__floustreamFriendNotificationsUser=userId;installStyles();
 const nav=document.getElementById("friends-nav-link");let badge=null;
 if(nav){badge=document.createElement("span");badge.className="friend-request-badge";badge.id="friend-request-count";badge.hidden=true;badge.setAttribute("aria-label","Новые заявки в друзья");nav.append(badge);}
 async function refreshCount(){
  const result=await client.from("friend_requests").select("id",{count:"exact",head:true}).eq("recipient_id",userId).eq("status","pending");
  if(result.error){console.warn("FLOUSTREAM friend request count:",result.error);return;}
  const count=result.count||0;if(badge){badge.hidden=count===0;badge.textContent=count>99?"99+":String(count);badge.title=count+" приглашений в друзья";}
 }
 refreshCount();
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
 window.addEventListener("pageshow",refreshCount);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshCount();});
 window.addEventListener("beforeunload",()=>client.removeChannel(channel),{once:true});
};
})();