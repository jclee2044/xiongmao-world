export async function registerPwa({ onUpdate, onStatus }) {
  if (!("serviceWorker" in navigator) || !window.isSecureContext)
    return onStatus(
      "要用 HTTPS 地址，才能离线玩。在这台电脑上也可以用 localhost。",
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
    onStatus("现在还不能离线玩，先连着网络玩吧。");
  }
}
