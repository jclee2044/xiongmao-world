import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
await mkdir("test-results/station-escalators", { recursive: true });
const server = createApp({ store: new Store(":memory:"), providerConfig: { provider: "story" } });
await new Promise(r => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1260, height: 720 }, serviceWorkers: "block" });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result = await page.evaluate(async () => {
    const { paintStationEscalators, STEP_PITCH, STEP_SPEED } = await import("/game/station-escalators.js");
    const { draw, prepareArt } = await import("/game/render.js");
    const { stationGround } = await import("/data/station-interior.js");
    const image = new Image(); image.src = "/assets/optimized/station-ground-v3.webp"; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width=1024; canvas.height=1536;
    const ctx=canvas.getContext("2d", {willReadFrequently:true});
    function frame(time, painted=true) {
      ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,1024,1536);
      if(painted)ctx.drawImage(image,0,0);
      ctx.save(); ctx.scale(1/1.5,1/1.5); paintStationEscalators(ctx,image,time); ctx.restore();
      return ctx.getImageData(0,0,1024,1536).data;
    }
    const a=frame(.17), b=frame(.17+STEP_PITCH/STEP_SPEED), moved=frame(.37);
    let periodic=0, changed=0;
    for(let i=0;i<a.length;i++){periodic+=Math.abs(a[i]-b[i]);if(a[i]!==moved[i])changed++;}
    const overlay=frame(.17,false);let leaks=0;
    for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)if(overlay[(y*1024+x)*4+3]&&(x<291||x>403||y<108||y>281))leaks++;
    const before=frame(STEP_PITCH/STEP_SPEED-.0001),after=frame(STEP_PITCH/STEP_SPEED+.0001);
    let seam=0;for(let i=0;i<before.length;i++)seam+=Math.abs(before[i]-after[i]);
    const board=document.createElement("canvas");board.id="escalator-review";board.width=1260;board.height=690;
    board.style.cssText="position:absolute;left:0;top:0;width:1260px;height:690px;max-width:none;max-height:none;z-index:99999";
    document.body.append(board);const out=board.getContext("2d");
    out.fillStyle="#f7e6c6";out.fillRect(0,0,1260,690);
    for(const [i,time] of [0,.2,.4].entries()){
      frame(time);out.drawImage(canvas,255,75,180,230,i*420,40,414,620);
      out.fillStyle="#493726";out.font="20px sans-serif";out.fillText(`Left ↓ / Right ↑ · ${time.toFixed(1)} s`,i*420+12,26);
    }
    // Exercise the actual renderer's reduced-motion branch, not just the helper.
    await prepareArt(stationGround);
    const c=document.createElement("canvas");c.style.cssText="width:1200px;height:800px";document.body.append(c);
    const cx=c.getContext("2d");
    const render=(time)=>{draw(cx,c,stationGround,{x:600,y:480},{x:760,y:520},{time,settings:{motion:false,outfit:"#b4a6c3",hair:"bun"},adventure:{}});return cx.getImageData(0,0,c.width,c.height).data;};
    const r1=render(0),r2=render(9);let reduced=0;for(let i=0;i<r1.length;i++)if(r1[i]!==r2[i])reduced++;
    return {periodic,changed,leaks,seam,reduced};
  });
  assert.equal(result.periodic,0,"identical image after a full tread cycle");
  assert.ok(result.changed>1000,"both tread surfaces animate");
  assert.equal(result.leaks,0,"animation stays inside the tread lanes");
  assert.ok(result.seam<2000,`no visible discontinuity at wrap: ${result.seam}`);
  assert.equal(result.reduced,0,"reduced motion is still");
  await page.locator("#escalator-review").screenshot({path:"test-results/station-escalators/frames.png"});
  console.log("Escalator direction, rendered cycle, wrap continuity, clipping and reduced motion passed.",result);
} finally { await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r)); }
