export async function registerPwa({ onUpdate, onStatus }) {
  if (!("serviceWorker" in navigator) || !window.isSecureContext)
    return onStatus(
      "Offline play requires HTTPS or localhost on this computer.",
    );
  try {
    const wasControlled = !!navigator.serviceWorker.controller;
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
      type: "module",
    });
    const announce = () => {
      if (registration.waiting)
        onUpdate?.(() =>
          registration.waiting?.postMessage({ type: "ACTIVATE_UPDATE" }),
        );
    };
    announce();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") announce();
      });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (wasControlled && !reloading) {
        reloading = true;
        location.reload();
      }
    });
  } catch {
    onStatus("Offline play is unavailable. Keep your internet connection on.");
  }
}
