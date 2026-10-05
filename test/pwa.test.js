import test from "node:test";
import assert from "node:assert/strict";
import { registerPwa } from "../public/game/pwa.js";

test("a waiting PWA update stays visible after installing becomes null", async (t) => {
  const originals = new Map(
    ["navigator", "window", "location"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const registration = new EventTarget();
  const worker = new EventTarget();
  const serviceWorker = new EventTarget();
  const messages = [];
  worker.state = "installing";
  worker.postMessage = (message) => messages.push(message);
  registration.installing = worker;
  registration.waiting = null;
  serviceWorker.controller = {};
  serviceWorker.register = async () => registration;
  let activate,
    reloads = 0;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { serviceWorker },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { isSecureContext: true },
  });
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { reload: () => reloads++ },
  });
  await registerPwa({
    onUpdate: (callback) => {
      activate = callback;
    },
    onStatus: assert.fail,
  });
  registration.dispatchEvent(new Event("updatefound"));
  registration.installing = null;
  registration.waiting = worker;
  worker.state = "installed";
  worker.dispatchEvent(new Event("statechange"));
  assert.equal(typeof activate, "function");
  assert.deepEqual(messages, [], "An update waits for the player's action");
  activate();
  assert.deepEqual(messages, [{ type: "ACTIVATE_UPDATE" }]);
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(reloads, 1);
});
