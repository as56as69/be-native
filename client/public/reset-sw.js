/* Hard-reset breadcrumb: nukes the old PWA service worker + caches.
 * Causes: stale SW serving an old bundle -> white screen after updates. */
const swReset = (() => {
  const done = [];
  const mark = (label) => {
    done.push(label);
    try {
      document.getElementById("state").textContent = done.join(" -> ");
    } catch (e) {}
  };

  async function unregisterAll() {
    if (!("serviceWorker" in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) await reg.unregister();
    mark("sw-unregistered " + regs.length);
  }

  async function clearCaches() {
    if (!("caches" in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    mark("caches-cleared " + keys.length);
  }

  async function clearStorage() {
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    mark("storage-cleared");
  }

  async function run() {
    try { await unregisterAll(); } catch (e) { console.error(e); }
    try { await clearCaches(); } catch (e) { console.error(e); }
    try { await clearStorage(); } catch (e) { console.error(e); }
    mark("done");
    setTimeout(() => { window.location.replace("/"); }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    void run();
  }
  return { run };
})();
