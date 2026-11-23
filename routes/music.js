import { attachRouteStyles } from "../shared/route-styles.mjs";



export const stylesheet = new URL("./styles/music.css?v=1", import.meta.url).href;
export const title = "FLOUSTREAM — Sound of Home";

export async function mount(root, { signal }) {
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
  const style = await attachRouteStyles(root, stylesheet, "music", signal);
  if (!style) return;

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
