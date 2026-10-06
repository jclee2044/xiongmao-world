import test from "node:test";
import assert from "node:assert/strict";
import { createMusicOwnership } from "../server/music-ownership.js";

const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
test("music handoff waits for silence; mute revokes every player until explicit unmute", () => {
  let time = 100;
  const request = createMusicOwnership(() => time);
  const send = (player, action, device = "local") =>
    request(device, { player, action });
  assert.equal(send(a, "claim").granted, true);
  assert.equal(send(b, "claim").granted, false);
  assert.equal(send(a, "renew").granted, false);
  assert.equal(
    send(b, "renew").granted,
    false,
    "Old player has not confirmed silence yet",
  );
  send(a, "release");
  assert.equal(send(b, "renew").granted, true);
  assert.equal(send(a, "renew").granted, false);
  send(a, "mute");
  assert.equal(send(b, "renew").granted, false);
  assert.equal(send(b, "renew").muted, true);
  send(b, "release");
  assert.equal(
    send(a, "renew").granted,
    false,
    "An old heartbeat cannot undo mute",
  );
  assert.equal(send(a, "claim").granted, true);
  assert.equal(send(b, "claim", "other-device").granted, true);
  assert.equal(send(b, "claim").granted, false);
  time += 4001;
  assert.equal(
    send(b, "renew").granted,
    true,
    "A closed preview cannot hold ownership forever",
  );
  assert.equal(send(a, "renew").granted, false);
  assert.equal(request("local", { player: "bad", action: "mute" }), null);
});

import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { request } from "node:http";

test("local preview ports and isolated sessions share music ownership with origin checks", async (t) => {
  const server = createApp({ store: new Store(":memory:") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function preview(host) {
    const session = await fetch(base + "/api/state");
    const cookie = session.headers.get("set-cookie").split(";")[0];
    return (body, origin = `http://${host}`) =>
      new Promise((resolve, reject) => {
        const req = request(
          base + "/api/music-owner",
          {
            method: "POST",
            headers: {
              Host: host,
              Cookie: cookie,
              Origin: origin,
              "Content-Type": "application/json",
            },
          },
          (res) => {
            let text = "";
            res.on("data", (chunk) => (text += chunk));
            res.on("end", () =>
              resolve({ status: res.statusCode, body: JSON.parse(text) }),
            );
          },
        );
        req.on("error", reject);
        req.end(JSON.stringify(body));
      });
  }
  const first = await preview("localhost:57913");
  const second = await preview("localhost:57914");
  assert.equal(
    (await first({ player: a, action: "claim" })).body.granted,
    true,
  );
  assert.equal(
    (await second({ player: b, action: "claim" })).body.granted,
    false,
  );
  assert.equal(
    (await first({ player: a, action: "renew" })).body.granted,
    false,
  );
  await first({ player: a, action: "release" });
  assert.equal(
    (await second({ player: b, action: "renew" })).body.granted,
    true,
  );
  assert.equal(
    (await first({ player: a, action: "mute" }, "https://evil.example")).status,
    403,
  );
  assert.equal(
    (await second({ player: b, action: "renew" })).body.granted,
    true,
  );
  await first({ player: a, action: "mute" });
  assert.equal(
    (await second({ player: b, action: "renew" })).body.granted,
    false,
  );
  assert.equal(
    (await second({ player: "invalid", action: "claim" })).status,
    400,
  );
});
