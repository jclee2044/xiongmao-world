import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
import { Store } from "../server/store.js";
import { createStationInteractions } from "../public/game/station-interactions.js";
import { stationJourneyAction, stationBoardingProgress } from "../public/data/station-journey.js";
import { goalCards } from "../public/game/goals.js";
import { newAdventure } from "../public/data/adventure.js";

test("dev mode requires a configured password, same origin and session; saves never grant it", async t => {
  const server = createApp({ store: new Store(":memory:"), devModePassword: "test-only-secret" });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(base + "/api/state");
  const cookie = first.headers.get("set-cookie").split(";")[0];
  const initial = await first.json();
  const post = (body, c = cookie, origin = base, path = "/api/dev-mode") => fetch(base + path, {
    method: "POST", headers: { cookie: c, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const read = async () => (await fetch(base + "/api/state", { headers: { cookie } })).json();
  assert.equal(initial.devMode, false);
  assert.equal((await post({enabled:true,password:"test-only-secret"}, "")).status, 401);
  assert.equal((await post({enabled:true,password:"test-only-secret"}, cookie, "https://other.example")).status, 403);
  assert.equal((await post({enabled:true,password:"incorrect"})).status, 403);
  assert.equal((await read()).devMode, false);
  assert.equal((await post({enabled:"true",password:"test-only-secret"})).status, 400);
  initial.state.devMode = true;
  assert.equal((await post({revision:0,state:initial.state}, cookie, base, "/api/state")).status, 200);
  assert.equal((await read()).devMode, false);
  assert.deepEqual(await (await post({enabled:true,password:"test-only-secret"})).json(), {enabled:true});
  assert.equal((await read()).devMode, true);
  assert.equal((await (await fetch(base + "/api/state")).json()).devMode, false, "another browser is still locked");
  assert.equal((await read()).state.adventure.xp, 0);
  assert.deepEqual(await (await post({enabled:false})).json(), {enabled:false});
  assert.equal((await read()).devMode, false);
  assert.equal((await fetch(base + "/.env")).status, 404);
});

test("missing dev password fails closed", async t => {
  const server = createApp({ store: new Store(":memory:"), devModePassword: "" });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(base + "/api/state");
  const cookie = first.headers.get("set-cookie").split(";")[0];
  const response = await fetch(base + "/api/dev-mode", { method:"POST", headers:{cookie,Origin:base,"Content-Type":"application/json"},body:JSON.stringify({enabled:true,password:"anything"}) });
  assert.equal(response.status, 503);
});

test("dev mode bypasses XP without changing XP or skipping station gameplay, and rechecks stale confirmations", () => {
  const adventure = newAdventure();
  assert.equal(goalCards(adventure).some(g => g.key === "departure"), false);
  assert.equal(goalCards(adventure, true).some(g => g.key === "departure"), true);
  assert.equal(stationBoardingProgress(0, true).earned, 0);
  assert.equal(stationBoardingProgress(0, true).ready, true);
  assert.equal(stationBoardingProgress(0).ready, false);
  const ready = {booked:true,entry:"ready",revision:5};
  assert.equal(stationJourneyAction({...ready,entry:"public"}, "board", 0, true).boarding, undefined);
  let enabled = true, reply;
  const state = {xp:0,stationJourney:ready};
  const interact = createStationInteractions({state:()=>state,change:fn=>fn(state),devMode:()=>enabled,line:(...args)=>{reply=args;},world:()=>({syncStationInterior(){}})});
  interact({id:"station-boarding-check"});
  assert.match(reply[6], /Dev mode/);
  const confirm = reply[4].find(([id])=>id === "station-boarding-confirm")[2];
  enabled = false;
  confirm();
  assert.equal(state.stationJourney.boarding, undefined);
  enabled = true;
  interact({id:"station-boarding-check"});
  reply[4].find(([id])=>id === "station-boarding-confirm")[2]();
  assert.equal(state.stationJourney.boarding, true);
  assert.equal(state.xp, 0);
});
