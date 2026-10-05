export async function registerPwa({ onUpdate, onStatus }) {
  if (!("serviceWorker" in navigator) || !window.isSecureContext)
    return onStatus(
      "Offline installation requires HTTPS (localhost works on this PC).",
    );
  try {
    const wasControlled = !!navigator.serviceWorker.controller;
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });
    const announce = () => {
      if (registration.waiting)
        onUpdate(() =>
          registration.waiting?.postMessage({ type: "ACTIVATE_UPDATE" }),
        );
    };
    announce();
    registration.addEventListener("updatefound", () =>
      registration.installing?.addEventListener("statechange", () => {
        if (registration.installing?.state === "installed") announce();
      }),
    );
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (wasControlled && !reloading) {
        reloading = true;
        location.reload();
      }
    });
  } catch {
    onStatus("Offline cache is unavailable; keep using the online game.");
  }
}
