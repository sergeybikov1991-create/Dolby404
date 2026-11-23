export async function attachRouteStyles(root, href, name, signal) {
  if (signal?.aborted) return null;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.floustreamRouteStyle = name;
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) { link.remove(); resolve(null); }
      else resolve(link);
    };
    const onAbort = () => finish();
    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", () => {
      console.error("FLOUSTREAM stylesheet failed:", name);
      finish();
    }, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
    root.appendChild(link);
    if (link.sheet) finish();
  });
}
