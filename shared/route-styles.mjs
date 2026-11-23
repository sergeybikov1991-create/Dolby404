export async function attachRouteStyles(root, href, name, signal) {
  if (signal?.aborted) return null;
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = name;
  try {
    const response = await fetch(href, { signal, cache: "default" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const css = await response.text();
    if (signal?.aborted) return null;
    style.textContent = css;
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") return null;
    console.error("FLOUSTREAM stylesheet failed:", name, error);
    style.textContent = "";
  }
  if (signal?.aborted) return null;
  root.appendChild(style);
  return style;
}
