(function(){
"use strict";
const STYLE_ID="floustream-message-notification-style";
function installStyles(){
 if(document.getElementById(STYLE_ID))return;
 const style=document.createElement("style");style.id=STYLE_ID;
 style.textContent=".side-drawer-link#messages-nav-link{position:relative}.message-unread-badge{display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;margin-left:auto;padding:0 6px;border:1px solid #ff9abf;border-radius:999px;background:linear-gradient(135deg,#ff4f91,#c51e68);box-shadow:0 0 12px #ff4f9166;color:#fff;font-size:11px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}.message-unread-badge[hidden]{display:none}";
 document.head.append(style);
}
function makeTone(){
 const AudioContext=window.AudioContext||window.webkitAudioContext;
 if(!AudioContext)return null;
 try{
  const context=new AudioContext();
  const play=async function(){
   try{
    if(context.state==="suspended")await context.resume();
    const now=context.currentTime;
    [0,0.19].forEach((offset,index)=>{
     const oscillator=context.createOscillator(),gain=context.createGain();
     oscillator.type="sine";oscillator.frequency.value=index?880:660;
     gain.gain.setValueAtTime(0.0001,now+offset);
     gain.gain.exponentialRampToValueAtTime(0.11,now+offset+0.018);
     gain.gain.exponentialRampToValueAtTime(0.0001,now+offset+0.14);
     oscillator.connect(gain);gain.connect(context.destination);
     oscillator.start(now+offset);oscillator.stop(now+offset+0.15);
    });
   }catch(_){}
  };
  play.unlock=()=>{try{if(context.state==="suspended")return context.resume();}catch(_){}};
  return play;
 }catch(_){return null;}
}
window.initFloustreamMessageNotifications=function(client,userId){
 if(!client||!userId||window.__floustreamMessageNotificationsUser===userId)return;
 window.__floustreamMessageNotificationsUser=userId;
 installStyles();
 const nav=document.getElementById("messages-nav-link");
 let badge=null;
 if(nav){
  badge=document.createElement("span");badge.className="message-unread-badge";badge.id="message-unread-count";badge.hidden=true;badge.setAttribute("aria-label","Непрочитанные сообщения");nav.append(badge);
  nav.addEventListener("click",function(){
   if("Notification"in window&&Notification.permission==="default")Notification.requestPermission().catch(()=>{});
  });
 }
 const playTone=makeTone();
 let audioUnlocked=false;
 const unlockAudio=()=>{if(audioUnlocked)return;audioUnlocked=true;if(playTone?.unlock)playTone.unlock();};
 document.addEventListener("pointerdown",unlockAudio,{once:true,passive:true});
 document.addEventListener("keydown",unlockAudio,{once:true});
 async function refreshCount(){
  const result=await client.from("direct_messages").select("id",{count:"exact",head:true})
   .eq("recipient_id",userId).is("read_at",null).neq("sender_id",userId);
  if(result.error){console.warn("FLOUSTREAM unread message count:",result.error);return;}
  const count=result.count||0;
  if(badge){badge.hidden=count===0;badge.textContent=count>99?"99+":String(count);badge.title=count+" непрочитанных сообщений";}
 }
 function announce(row){
  if(!row||!row.id)return;
  if(playTone&&audioUnlocked)playTone();
  if("Notification"in window&&Notification.permission==="granted"){
   try{
    const notification=new Notification("FLOUSTREAM · Новое сообщение",{body:"У вас новое непрочитанное сообщение",tag:"floustream-message-"+row.id});
    notification.onclick=()=>{window.focus();location.href="messages.html?with="+encodeURIComponent(row.sender_id);notification.close();};
   }catch(_){}
  }
 }
 refreshCount();
 const channel=client.channel("floustream-unread-"+userId)
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:"recipient_id=eq."+userId},payload=>{
   const row=payload.new;
   if(row&&row.recipient_id===userId&&!row.read_at){announce(row);refreshCount();}
  }).on("postgres_changes",{event:"UPDATE",schema:"public",table:"direct_messages",filter:"recipient_id=eq."+userId},()=>refreshCount())
  .subscribe(status=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.warn("FLOUSTREAM message notifications realtime:",status);});
 window.addEventListener("pageshow",refreshCount);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshCount();});
 window.addEventListener("beforeunload",()=>{client.removeChannel(channel);},{once:true});
};
})();