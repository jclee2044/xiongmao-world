import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";

await mkdir("test-results/station-ground-layers", { recursive: true });
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(async () => {
    const { draw, prepareArt } = await import("/game/render.js");
    const { canStand } = await import("/game/world.js");
    const { stationGroundForJourney, groundPoint } = await import("/data/station-interior.js");
    const scene = stationGroundForJourney({ entry: "ready" });
    await prepareArt(scene);
    document.body.innerHTML = '<canvas id="qa" style="width:1440px;height:1000px;position:fixed;inset:0"></canvas>';
    window.qa = { draw, canStand, scene, groundPoint };
  });
  for (const [id, x, y, entry] of [
    ["bench-front", 145, 840, "public"], ["bench-side", 210, 758, "public"],
    ["map-front", 667, 808, "public"], ["map-behind", 663, 730, "public"],
    ["ticket-counter", 300, 1071, "public"], ["scanner-input-bag", 312, 630, "bags"],
    ["security-counter", 581, 617, "public"],
    ["scanner-output-bag", 313, 342, "screened"], ["detector-open", 455, 480, "bags"],
    ["security-exit-railing", 280, 340, "ready"],
  ]) {
    const result = await page.evaluate(({ id, x, y, entry }) => {
      const { draw, canStand, scene, groundPoint: p } = window.qa;
      const player = p(x, y);
      const panda = [[50, 8], [0, 35], [-45, 0], [0, 0]].map(([dx,dy]) => ({ x: player.x + dx, y: player.y + dy })).find(q => canStand(scene, q.x, q.y));
      const canvas = document.querySelector("#qa");
      const view = draw(canvas.getContext("2d"), canvas, scene, player, panda, {
        hover: scene.interactables.find(o => o.id === (id === "scanner-output-bag" ? "station-bag-collect" : id === "scanner-input-bag" ? "station-bag-drop" : null)),
        settings: { motion: false }, adventure: { stationTraveler: "entered", travelLuggage: { packed: true, items: [] }, stationJourney: { booked: true, entry } },
      });
      return { valid: canStand(scene, player.x, player.y), x: (player.x-view.camX+view.ox)*view.scale, y: (player.y-view.camY+view.oy)*view.scale };
    }, { id, x, y, entry });
    assert.ok(result.valid, `${id} uses reachable floor`);
    await page.screenshot({ path: `test-results/station-ground-layers/${id}.png`, clip: {
      x: Math.max(0, Math.min(840, result.x-300)), y: Math.max(0, Math.min(450, result.y-350)), width: 600, height: 550,
    } });
  }
  await page.evaluate(async () => {
    const { optimizedArt } = await import("/data/optimized-art.js");
    const image = new Image(); image.src = optimizedArt[window.qa.scene.backgroundPath]; await image.decode();
    window.qa.plate = image;
    const canvas = document.querySelector("#qa"), ctx = canvas.getContext("2d");
    ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = "#fff"; ctx.fillRect(0,0,1440,1000);
    ctx.drawImage(image,220,905,92,135,0,0,552,810);
    ctx.drawImage(image,550,450,117,124,600,0,585,620);
  });
  await page.screenshot({ path: "test-results/station-ground-layers/counter-source-detail.png" });
  const equipmentMasks = await page.evaluate(async () => {
    const { stationLayer } = await import("/game/station-layers.js");
    const { plate,scene } = window.qa;
    return [["ticket-windows",256,960,0],["ticket-windows",280,955,255],
      ["security-desk",590,473,0],["security-desk",590,493,255]].map(([id,x,y,expected]) => {
      const prop=scene.scenery.find(o=>o.id===id).prop;
      const {canvas,left,top}=stationLayer(plate,prop);
      return {id,x,y,expected,actual:canvas.getContext("2d").getImageData(x-left,y-top,1,1).data[3]};
    });
  });
  for(const sample of equipmentMasks) assert.equal(sample.actual,sample.expected,`counter mask: ${sample.id} ${sample.x},${sample.y}`);
  const desktopChanges = await page.evaluate(() => {
    const {draw,scene,groundPoint:p}=window.qa;
    const canvas=document.querySelector("#qa"),ctx=canvas.getContext("2d");
    const actor=p(581,617),panda=p(550,630);
    const options={settings:{motion:false},adventure:{stationJourney:{entry:"ready"}}};
    const view=draw(ctx,canvas,scene,actor,panda,options);
    const withOfficer=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    draw(ctx,canvas,{...scene,interactables:scene.interactables.filter(o=>o.id!=="station-entry-check")},actor,panda,options);
    const withoutOfficer=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let changed=0;
    // This strip is exposed desktop between the monitor and document reader.
    // Adding the officer must never paint any of his jacket onto this surface.
    for(let x=604;x<=623;x+=0.5) for(let y=492;y<=498;y+=0.5) {
      const q=p(x,y),px=Math.floor((q.x-view.camX+view.ox)*view.scale),py=Math.floor((q.y-view.camY+view.oy)*view.scale);
      const i=(py*canvas.width+px)*4;
      if(Math.abs(withOfficer[i]-withoutOfficer[i])+Math.abs(withOfficer[i+1]-withoutOfficer[i+1])+Math.abs(withOfficer[i+2]-withoutOfficer[i+2])>6) changed++;
    }
    return changed;
  });
  assert.equal(desktopChanges,0,"the officer's jacket must not overlap the desktop");
  const ordering = await page.evaluate(() => {
    const { draw, scene, groundPoint: p } = window.qa;
    const canvas = document.querySelector("#qa"), ctx = canvas.getContext("2d");
    return [["public-bench",210,758],["map-board",667,808],["map-board",663,730]].map(([id,x,y]) => {
      const prop = scene.scenery.find(o => o.id === id), actor = p(x,y), companion = p(450,700);
      const options = { settings: { motion: false }, adventure: { stationJourney: { entry: "ready" } } };
      draw(ctx,canvas,{...scene,interactables:[],scenery:[]},actor,companion,options);
      const unmasked = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      draw(ctx,canvas,{...scene,interactables:[],scenery:[prop]},actor,companion,options);
      const masked = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let changed = 0;
      for(let i=0;i<masked.length;i+=4)
        if(Math.abs(masked[i]-unmasked[i])+Math.abs(masked[i+1]-unmasked[i+1])+Math.abs(masked[i+2]-unmasked[i+2])>6) changed++;
      return changed;
    });
  });
  assert.equal(ordering[0],0,"the bench does not erase a player beside its diagonal front edge");
  assert.equal(ordering[1],0,"the map does not erase a player in front");
  assert.ok(ordering[2]>100,"the map conceals the player behind its display");
  assert.deepEqual(errors,[]);
  console.log("Ground-floor layers: nine reachable player/Panda views, counter staff/equipment masks, live seated alignment, luggage at both conveyor ends, and bench/map front-behind compositing passed.");
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
