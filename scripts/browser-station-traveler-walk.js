import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
await mkdir("test-results",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const result=await page.evaluate(async()=>{
    const {draw,prepareArt}=await import("/game/render.js");
    const {stationGroundForJourney,groundPoint:p}=await import("/data/station-interior.js");
    const {travelerWalkArt}=await import("/data/station-traveler-walk-art.js");
    const {travelerArt}=await import("/data/station-traveler-art.js");
    const ground=stationGroundForJourney({entry:"ready"});
    await prepareArt(ground);
    const canvas=document.createElement("canvas");canvas.width=1440;canvas.height=1000;canvas.id="walk-check";
    document.body.replaceChildren(canvas);
    const ctx=canvas.getContext("2d"),original=ctx.drawImage.bind(ctx),calls=[];
    ctx.drawImage=(img,...args)=>{
      if(/station-travelers-(?:a|b|walk(?:-a)?-v1)\./.test(img.src||"")) calls.push({src:img.src,crop:args.slice(0,4),flip:ctx.getTransform().a<0});
      original(img,...args);
    };
    const results=[];
    for(const [id,art] of Object.entries(travelerWalkArt)) {
      const actor={id,type:"npc",appearance:id,artHeight:163,...ground.interactables.find(o=>o.id===id),...p(400,1000),playRoute:undefined,bubbles:undefined,moving:true,facing:1};
      const fixture={...ground,interactables:[actor]};
      await prepareArt({...fixture,interactables:[{...actor,playRoute:[]}]});
      for(const distance of [0,18,36]) {
        actor.distance=distance;calls.length=0;
        draw(ctx,canvas,fixture,p(500,1030),p(540,1070),{time:0,animate:true,settings:{motion:true}});
        results.push({id,kind:"walk",distance,calls:structuredClone(calls)});
      }
      actor.facing=-1;calls.length=0;
      draw(ctx,canvas,fixture,p(500,1030),p(540,1070),{time:0,animate:true,settings:{motion:true}});
      results.push({id,kind:"left",calls:structuredClone(calls)});
      for(const kind of ["rest","reduced"]) {
        actor.moving=kind!=="rest";calls.length=0;
        draw(ctx,canvas,fixture,p(500,1030),p(540,1070),{time:0,animate:true,settings:{motion:kind!=="reduced"}});
        results.push({id,kind,calls:structuredClone(calls)});
      }
    }
    const preview={...ground,interactables:ground.interactables.filter(o=>o.playRoute).map((o,i)=>({
      ...o,...p(200+i*145,1110),playRoute:undefined,bubbles:undefined,moving:true,distance:18,facing:1,
    }))};
    draw(ctx,canvas,preview,p(500,1200),p(540,1240),{time:0,animate:true,settings:{motion:true}});
    return {results,walk:travelerWalkArt,idle:travelerArt};
  });
  for(const row of result.results) {
    assert.equal(row.calls.length,1,`${row.id}: ${row.kind}`);
    const call=row.calls[0];
    if(["rest","reduced"].includes(row.kind)) {
      assert.ok(call.src.includes(`station-travelers-${result.idle[row.id].sheet === "travelersA" ? "a" : "b"}.`));
      assert.ok(result.idle[row.id].frames.some(f=>[f.x,f.y,f.w,f.h].join()===call.crop.join()));
    } else {
      assert.ok(call.src.includes(result.walk[row.id].sheet === "travelersWalkA" ? "station-travelers-walk-a-v1.webp" : "station-travelers-walk-v1.webp"));
      const f=result.walk[row.id].frames[row.kind==="left"?2:row.distance/18];
      assert.deepEqual(call.crop,[f.x,f.y,f.w,f.h]);
      assert.equal(call.flip,row.kind==="left");
    }
  }
  await page.locator("#walk-check").screenshot({path:"test-results/station-traveler-walk-render.png"});
  assert.deepEqual(errors,[]);
  console.log("Six travelers: 18 dedicated walk sprites rendered, left-facing mirroring, idle restoration and reduced motion passed.");
} finally {await browser.close();await new Promise(r=>server.close(r));}
