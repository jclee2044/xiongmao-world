import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
test("authenticated APIs, origin checks, paired saves and stale-write conflicts", async (t) => {
  const server = createApp({
    store: new Store(":memory:"),
    providerConfig: { provider: "story" },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(base + "/api/state"),
    cookie = first.headers.get("set-cookie").split(";")[0],
    initial = await first.json();
  assert.match(first.headers.get("set-cookie"), /HttpOnly/);
  const post = (path, body, c = cookie, origin = base) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        cookie: c,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (
      await post(
        "/api/state",
        { revision: 0, state: initial.state },
        cookie,
        "https://evil.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await post("/api/state", { revision: 0, state: initial.state }, ""))
      .status,
    401,
  );
  const code = await post("/api/pair-code", {}).then((r) => r.json());
  const second = await fetch(base + "/api/state"),
    secondCookie = second.headers.get("set-cookie").split(";")[0];
  const paired = await post("/api/pair", { code: code.code }, secondCookie);
  assert.equal(paired.status, 200);
  const pairedCookie = paired.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (
      await fetch(base + "/api/state", {
        headers: { cookie: pairedCookie },
      }).then((r) => r.json())
    ).identity,
    initial.identity,
  );
  initial.state.found = ["momo"];
  assert.equal(
    (await post("/api/state", { revision: 0, state: initial.state })).status,
    200,
  );
  const conflict = await post(
    "/api/state",
    { revision: 0, state: initial.state },
    pairedCookie,
  );
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).revision, 1);
  const dialogue = await post("/api/dialogue", {
    npcId: "mei",
    text: "我想吃面",
    history: [],
  });
  assert.equal(dialogue.status, 200);
  assert.equal((await dialogue.json()).mode, "story");
  assert.equal(
    (
      await post("/api/dialogue", {
        npcId: "mei",
        text: "我想吃面",
        history: [null],
      })
    ).status,
    400,
  );
  assert.equal((await fetch(base + "/server/store.js")).status, 404);
});

test("scene dialogue variations use authenticated origin checks without changing progress", async (t) => {
  const store = new Store(":memory:");
  const server = createApp({ store, providerConfig: { provider: "story", random: () => 0 } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(base + "/api/state");
  const cookie = first.headers.get("set-cookie").split(";")[0];
  const before = await first.json();
  const line = { chinese: "你每天几点起床？", meaning: "What time do you get up every day?", topic: "activities" };
  const post = (origin, body) => fetch(base + "/api/dialogue-variation", { method: "POST", headers: { cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post("https://foreign.example", { line })).status, 403);
  const response = await post(base, { line });
  assert.equal(response.status, 200);
  const answer = await response.json();
  assert.equal(answer.chinese, line.chinese);
  assert.match(answer.pinyin, /qǐ chuáng/);
  assert.equal((await post(base, { line: { chinese: "<script>" } })).status, 400);
  const after = await (await fetch(base + "/api/state", { headers: { cookie } })).json();
  assert.deepEqual(after.state, before.state);
});
