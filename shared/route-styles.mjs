const stylesheetTextPromises = new Map();

function loadStylesheetText(href) {
  if (!stylesheetTextPromises.has(href)) {
    const request = fetch(href, { cache: "default" }).then(response => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    }).catch(error => {
      stylesheetTextPromises.delete(href);
      throw error;
    });
    stylesheetTextPromises.set(href, request);
  }
  return stylesheetTextPromises.get(href);
}

export function prefetchRouteStylesheet(href) {
  if (typeof href !== "string" || !href) return Promise.resolve("");
  return loadStylesheetText(href);
}

export async function attachRouteStyles(root, href, name, signal) {
  if (signal?.aborted) return null;
  const style = document.createElement("style");
  style.dataset.floustreamRouteStyle = name;
  try {
    const css = await loadStylesheetText(href);
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
