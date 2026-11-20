(()=>{"use strict";
if(document.getElementById("fs-side-drawer"))return;
const root=document.createElement("div");
root.innerHTML=`<button type="button" class="fs-drawer-menu-button" id="fs-drawer-menu-button" aria-label="Открыть меню" aria-controls="fs-side-drawer" aria-expanded="false"><span class="fs-drawer-signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>
<div class="fs-drawer-edge" id="fs-drawer-edge" aria-hidden="true"></div><div class="fs-drawer-backdrop" id="fs-drawer-backdrop"></div>
<aside class="fs-side-drawer" id="fs-side-drawer" aria-label="Навигация FLOUSTREAM" aria-hidden="true">
<div class="fs-side-drawer-head"><div class="fs-side-drawer-logo">FLOUSTREAM</div><button type="button" class="fs-side-drawer-close" id="fs-drawer-close" aria-label="Закрыть меню">×</button></div>
<p class="fs-side-drawer-caption">Навигация</p><nav class="fs-side-drawer-links">
<a class="fs-side-drawer-link" href="profile.html"><span class="fs-side-drawer-icon">◉</span>Мой профиль</a>
</nav>
<div class="fs-side-drawer-divider"></div><p class="fs-side-drawer-caption">Медиа и общение</p><nav class="fs-side-drawer-links">
<a class="fs-side-drawer-link" href="friends.html?v=20261114-1"><span class="fs-side-drawer-icon">♧</span>Друзья</a>
<a class="fs-side-drawer-link" href="messages.html?v=20261119-realtime-2"><span class="fs-side-drawer-icon">✉</span>Сообщения</a>
<a class="fs-side-drawer-link" href="backgammon.html"><span class="fs-side-drawer-icon">⚄</span>Нарды</a>
</nav><div class="fs-side-drawer-foot">FLOUSTREAM · твоя цифровая территория</div></aside>`;
while(root.firstChild)document.body.appendChild(root.firstChild);
const d=document.getElementById("fs-side-drawer"),shade=document.getElementById("fs-drawer-backdrop"),edge=document.getElementById("fs-drawer-edge"),btn=document.getElementById("fs-drawer-menu-button"),close=document.getElementById("fs-drawer-close");
let opened=false,g=null;const width=()=>d.getBoundingClientRect().width,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function paint(x){const w=width(),v=clamp(x,-w,0),p=(v+w)/w;d.style.setProperty("--fs-drawer-x",v+"px");shade.style.opacity=String(p*.68);shade.classList.toggle("visible",p>.01)}
function toggle(v){opened=v;d.classList.remove("dragging");d.style.setProperty("--fs-drawer-x",v?"0px":"-100%");shade.style.opacity=v?".68":"0";shade.classList.toggle("visible",v);d.setAttribute("aria-hidden",String(!v));btn.setAttribute("aria-expanded",String(v));btn.classList.toggle("is-hidden",v);btn.setAttribute("aria-hidden",String(v));document.body.style.overflow=v?"hidden":""}
function down(e,fromEdge){if(e.pointerType==="mouse"&&e.button!==0)return;if(fromEdge&&!opened&&e.clientX>28)return;if(!fromEdge&&!opened)return;g={id:e.pointerId,x:e.clientX,y:e.clientY,last:e.clientX,t:performance.now(),vel:0,edge:fromEdge,drag:false};try{(fromEdge?edge:d).setPointerCapture(e.pointerId)}catch(_){}}
function move(e){if(!g||g.id!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.drag){if(Math.abs(dy)>Math.abs(dx)*1.15&&Math.abs(dy)>8){g=null;return}if(Math.abs(dx)<4)return;if((g.edge&&dx<0)||(!g.edge&&dx>0)){g=null;return}g.drag=true;d.classList.add("dragging")}const now=performance.now();g.vel=(e.clientX-g.last)/Math.max(1,now-g.t);g.last=e.clientX;g.t=now;paint(g.edge?-width()+Math.max(0,dx):Math.min(0,dx))}
function up(e){if(!g||g.id!==e.pointerId)return;const q=g;g=null;if(!q.drag){d.classList.remove("dragging");return}const x=parseFloat(d.style.getPropertyValue("--fs-drawer-x"))||-width();toggle((x+width())/width()>.42||q.vel>.45)}
edge.addEventListener("pointerdown",e=>down(e,true));d.addEventListener("pointerdown",e=>down(e,false));[edge,d].forEach(el=>{el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",()=>{g=null;toggle(opened)})});
btn.addEventListener("click",()=>toggle(!opened));close.addEventListener("click",()=>toggle(false));shade.addEventListener("click",()=>toggle(false));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&opened)toggle(false)});toggle(false);
const here=location.pathname.split("/").pop();d.querySelectorAll("a").forEach(a=>{if(a.getAttribute("href").split("?")[0]===here)a.classList.add("active")});
})();