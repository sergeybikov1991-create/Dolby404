const STYLE = `
.fs-route-music{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;color:#fff;font-family:Arial,sans-serif;text-align:center;background:linear-gradient(-45deg,#050817,#102b83,#5420a8,#006b9f,#10104a);background-size:500% 500%;animation:fsMusicGradient 12s ease infinite}
@keyframes fsMusicGradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.fs-music-content{width:100%;max-width:420px}.fs-music-logo{font-size:clamp(42px,11vw,72px);font-weight:900;letter-spacing:6px;text-shadow:0 0 15px #168cff,0 0 35px #5420ff,0 0 70px #006bff}
.fs-music-subtitle{margin:14px 0 28px;color:#9299a8;font-size:13px;letter-spacing:2px}.fs-music-track{margin:0 auto 18px;color:#c8d8ee;font-size:17px}
.fs-music-player{width:320px;max-width:100%;aspect-ratio:16/9;margin:0 auto 18px;overflow:hidden;border:1px solid rgba(150,190,255,.35);border-radius:14px;box-shadow:0 0 24px rgba(22,108,255,.25);background:rgba(5,8,23,.6)}
.fs-music-player iframe{display:block;width:100%;height:100%;border:0}.fs-music-content button,.fs-music-login{display:inline-block;width:100%;max-width:320px;margin-top:12px;padding:15px 22px;border:1px solid #63baff;border-radius:30px;color:#fff;background:linear-gradient(90deg,#1749c9,#7025bd);font-size:16px;text-decoration:none;cursor:pointer;box-shadow:0 0 22px rgba(23,107,255,.5)}
.fs-music-login{border-color:rgba(185,217,255,.35);background:rgba(5,8,23,.45);box-shadow:none}.fs-music-status{min-height:20px;margin:14px 0 0;color:#aebbd0;font-size:13px}
`;

export const title = "FLOUSTREAM — Sound of Home";

export function mount(root, { signal }) {
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = "music";
  style.textContent = STYLE;
  document.head.appendChild(style);

  root.innerHTML = `
    <section class="fs-route-music">
      <div class="fs-music-content">
        <div class="fs-music-logo">FLOUSTREAM</div>
        <div class="fs-music-subtitle">ENTER THE DIGITAL WORLD</div>
        <div class="fs-music-track">♪ Eva Poklonskaya — Home</div>
        <div class="fs-music-player">
          <iframe id="fs-home-player" src="https://rutube.ru/play/embed/9c6a51b3ef66e35ec41c0dda9bc93ce1/" title="Eva Poklonskaya — Home" allow="clipboard-write; autoplay" allowfullscreen></iframe>
        </div>
        <button id="fs-continue" type="button">Продолжить — включить музыку</button>
        <a class="fs-music-login" href="portal.html">Перейти ко входу</a>
        <p class="fs-music-status" id="fs-music-status" aria-live="polite">Нажми «Продолжить», чтобы запустить песню.</p>
      </div>
    </section>`;

  const player = root.querySelector("#fs-home-player");
  const button = root.querySelector("#fs-continue");
  const status = root.querySelector("#fs-music-status");
  const onContinue = () => {
    player.contentWindow?.postMessage(JSON.stringify({ type: "player:play", data: {} }), "*");
    status.textContent = "Отправлена команда запуска. Если музыка не началась, нажми Play в плеере.";
  };
  button.addEventListener("click", onContinue, { signal });

  return () => {
    style.remove();
    root.replaceChildren();
  };
}
