(()=>{"use strict";
if(document.getElementById("fs-side-drawer"))return;
const root=document.createElement("div");
root.innerHTML=`<button type="button" class="fs-drawer-menu-button" id="fs-drawer-menu-button" aria-label="Открыть меню" aria-controls="fs-side-drawer" aria-expanded="false"><span class="fs-drawer-signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>
<div class="fs-drawer-edge" id="fs-drawer-edge" aria-hidden="true"></div><div class="fs-drawer-backdrop" id="fs-drawer-backdrop"></div>
<aside class="fs-side-drawer" id="fs-side-drawer" aria-label="Навигация FLOUSTREAM" aria-hidden="true">
<div class="fs-side-drawer-head"><div class="fs-side-drawer-logo">FLOUSTREAM</div><button type="button" class="fs-side-drawer-close" id="fs-drawer-close" aria-label="Закрыть меню">×</button></div>
<p class="fs-side-drawer-caption">Навигация</p><nav class="fs-side-drawer-links">
<a class="fs-side-drawer-link" href="home.html"><span class="fs-side-drawer-icon">⌂</span>Главная</a>
<a class="fs-side-drawer-link" href="profile.html"><span class="fs-side-drawer-icon">◉</span>Мой профиль</a>
</nav><div class="fs-side-drawer-divider"></div><p class="fs-side-drawer-caption">Медиа и общение</p><nav class="fs-side-drawer-links">
<a class="fs-side-drawer-link" href="friends.html?v=20261114-1"><span class="fs-side-drawer-icon">♧</span>Друзья</a>
<a class="fs-side-drawer-link" href="messages.html?v=20261119-realtime-2"><span class="fs-side-drawer-icon">✉</span>Сообщения</a>
<a class="fs-side-drawer-link" href="music.html"><span class="fs-side-drawer-icon">♫</span>Музыка</a>
<a class="fs-side-drawer-link" href="backgammon.html"><span class="fs-side-drawer-icon">⚄</span>Нарды</a>
</nav><div class="fs-side-drawer-foot">FLOUSTREAM · твоя цифровая территория</div></aside>`;
while(root.firstChild)document.body.appendChild(root.firstChild);
const d=document.getElementById("fs-side-drawer"),shade=document.getElementById("fs-drawer-backdrop"),edge=document.getElementById("fs-drawer-edge"),btn=document.getElementById("fs-drawer-menu-button"),close=document.getElementById("fs-drawer-close");
let opened=false,gesture=null;
const width=()=>d.getBoundingClientRect().width,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function setOpen(value){opened=!!value;d.classList.remove("dragging");d.style.setProperty("--fs-drawer-x",opened?"0px":"-100%");shade.style.opacity=opened?".68":"0";shade.classList.toggle("visible",opened);d.setAttribute("aria-hidden",String(!opened));btn.setAttribute("aria-expanded",String(opened));btn.classList.toggle("is-hidden",opened);btn.setAttribute("aria-hidden",String(opened));document.body.style.overflow=opened?"hidden":"";}
function paint(x){const w=width(),v=clamp(x,-w,0),p=(v+w)/w;d.style.setProperty("--fs-drawer-x",v+"px");shade.style.opacity=String(p*.68);shade.classList.toggle("visible",p>.01);}
function begin(x,y,fromEdge,id){if(fromEdge&&!opened&&x>28)return;if(!fromEdge&&!opened)return;gesture={x,y,lastX:x,lastT:Date.now(),velocity:0,fromEdge,id};}
function update(x,y,id,event){if(!gesture||gesture.id!==id)return;const dx=x-gesture.x,dy=y-gesture.y;if(Math.abs(dy)>Math.abs(dx)*1.2&&Math.abs(dy)>10){gesture=null;return;}if(Math.abs(dx)<4)return;if((gesture.fromEdge&&dx<0)||(!gesture.fromEdge&&dx>0)){gesture=null;return;}if(event&&event.cancelable)event.preventDefault();d.classList.add("dragging");const now=Date.now();gesture.velocity=(x-gesture.lastX)/Math.max(1,now-gesture.lastT);gesture.lastX=x;gesture.lastT=now;paint(gesture.fromEdge?-width()+Math.max(0,dx):Math.min(0,dx));}
function finish(id){if(!gesture||gesture.id!==id)return;const g=gesture;gesture=null;const current=parseFloat(d.style.getPropertyValue("--fs-drawer-x"));const x=Number.isFinite(current)?current:(opened?0:-width());setOpen((x+width())/width()>.42||g.velocity>.45);}
function touchStart(fromEdge,e){if(e.touches.length!==1)return;const t=e.touches[0];begin(t.clientX,t.clientY,fromEdge,"touch");}
function touchMove(e){if(!gesture||gesture.id!=="touch"||e.touches.length!==1)return;const t=e.touches[0];update(t.clientX,t.clientY,"touch",e);}
function touchEnd(){if(gesture&&gesture.id==="touch")finish("touch");}
edge.addEventListener("touchstart",e=>touchStart(true,e),{passive:true});d.addEventListener("touchstart",e=>touchStart(false,e),{passive:true});
[edge,d].forEach(el=>{el.addEventListener("touchmove",touchMove,{passive:false});el.addEventListener("touchend",touchEnd,{passive:true});el.addEventListener("touchcancel",()=>{if(gesture&&gesture.id==="touch"){gesture=null;setOpen(opened);}} ,{passive:true});});
function pointerDown(fromEdge,e){if(e.pointerType==="touch")return;if(e.button!==0)return;begin(e.clientX,e.clientY,fromEdge,e.pointerId);}
edge.addEventListener("pointerdown",e=>pointerDown(true,e));d.addEventListener("pointerdown",e=>pointerDown(false,e));
[edge,d].forEach(el=>{el.addEventListener("pointermove",e=>{if(e.pointerType!=="touch")update(e.clientX,e.clientY,e.pointerId,e);});el.addEventListener("pointerup",e=>{if(e.pointerType!=="touch")finish(e.pointerId);});el.addEventListener("pointercancel",e=>{if(gesture&&gesture.id===e.pointerId){gesture=null;setOpen(opened);}});});
btn.addEventListener("click",()=>setOpen(!opened));close.addEventListener("click",()=>setOpen(false));shade.addEventListener("click",()=>setOpen(false));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&opened)setOpen(false);});
const here=location.pathname.split("/").pop();d.querySelectorAll("a").forEach(a=>{if(a.getAttribute("href").split("?")[0]===here)a.classList.add("active");});
setOpen(false);
})();