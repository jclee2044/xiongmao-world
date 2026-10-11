import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { Store } from "../server/store.js";
import { createApp } from "../server/index.js";
await mkdir("test-results/station-waiting-layers",{recursive:true});
const server=createApp({store:new Store(":memory:"),providerConfig:{provider:"story"}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",headless:true,args:["--no-sandbox","--mute-audio"]});
const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:"block"});const errors=[];page.on("pageerror",e=>errors.push(e.message));
try{
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(async()=>{
    const {draw,prepareArt}=await import("/game/render.js"),{canStand}=await import("/game/world.js"),{stationWaitingForJourney,waitingPoint}=await import("/data/station-waiting.js");
    const scene=stationWaitingForJourney({booked:true,entry:"ready",boarding:true});await prepareArt(scene);
    document.body.innerHTML='<canvas id="qa" style="width:1440px;height:1000px;max-width:none;max-height:none;position:fixed;inset:0"></canvas>';
    const image=new Image();image.src="/assets/optimized/station-waiting-v5.webp";await image.decode();
    window.qa={draw,canStand,scene,p:waitingPoint,image};
  });
  for(const [id,x,y]of[["help-desk",277,567],["gate-behind",1279,410],["gate-front",1279,509],["gate-lane",1307,455],["planter-behind",662,476],["planter-front",662,516],["departure-lettering",955,365],["mural-lettering",1160,365],["water-behind",411,496],["water-front",411,576],["sleeper-front",530,484],["sleeper-beside-bag",628,460],["bench-behind",780,425],["bench-front",800,578],["live-bags",692,486],["massage",187,744],["arrival-rail",455,333],["boarding-partition",1260,555],["front-balustrade",600,778]]){
    const valid=await page.evaluate(({x,y})=>{const {draw,canStand,scene,p}=qa,player=p(x,y);const panda=[[45,8],[0,-38],[-45,0],[0,0]].map(([dx,dy])=>({x:player.x+dx,y:player.y+dy})).find(q=>canStand(scene,q.x,q.y));
      const canvas=document.querySelector("#qa");draw(canvas.getContext("2d"),canvas,scene,player,panda,{settings:{motion:false},adventure:{stationTraveler:"entered",stationJourney:{booked:true,entry:"ready",boarding:true}}});return canStand(scene,player.x,player.y)&&!!panda;
    },{x,y});assert.ok(valid,`${id} reachable`);await page.screenshot({path:`test-results/station-waiting-layers/${id}.png`});
  }
  // The leftmost legal foot position in the nook used to expose half the
  // character through the mural's wooden post.
  await page.evaluate(()=>{
    const {draw,canStand,scene,p}=qa,canvas=document.querySelector("#qa"),player=p(1098,260);
    if(!canStand(scene,player.x,player.y))throw new Error("Mural nook edge must remain reachable");
    draw(canvas.getContext("2d"),canvas,scene,player,p(1180,260),{settings:{motion:false}});
  });
  await page.screenshot({path:"test-results/station-waiting-layers/mural-left-post.png"});
  const masks=await page.evaluate(async()=>{
    const {stationLayer}=await import("/game/station-layers.js"),{scene,image}=qa;
    return [["waiting-mural",1080,200,255],["waiting-mural",1085,260,255],["waiting-mural",1292,260,255],
      ["waiting-bench-0",530,440,255],["waiting-bench-0",600,450,255],["waiting-bench-0",530,466,0],["waiting-bench-0",450,432,0],
      ["hot-water-dispensers",390,505,255],["hot-water-dispensers",420,535,255],["hot-water-dispensers",420,480,255],["hot-water-dispensers",376,470,0],["waiting-bench-4",775,514,255],["waiting-bench-4",795,557,0],["front-balustrade",600,789,255],["front-balustrade",600,820,0]].map(([id,x,y,expected])=>{const prop=scene.scenery.find(o=>o.id===id).prop,{canvas,left,top}=stationLayer(image,prop);return {id,x,y,expected,actual:canvas.getContext("2d").getImageData(x-left,y-top,1,1).data[3]};});
  });for(const s of masks)assert.equal(s.actual,s.expected,JSON.stringify(s));
  const ordering=await page.evaluate(()=>{
    const {draw,scene,p}=qa,canvas=document.querySelector("#qa"),ctx=canvas.getContext("2d"),prop=scene.scenery.find(o=>o.id==="waiting-bench-4");
    return [["behind",780,522],["front",800,578]].map(([side,x,y])=>{const player=p(x,y),panda=p(630,610),options={settings:{motion:false}};
      draw(ctx,canvas,{...scene,interactables:[],scenery:[]},player,panda,options);const original=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      draw(ctx,canvas,{...scene,interactables:[],scenery:[prop]},player,panda,options);const masked=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let changed=0;for(let i=0;i<original.length;i+=4)if(Math.abs(original[i]-masked[i])+Math.abs(original[i+1]-masked[i+1])+Math.abs(original[i+2]-masked[i+2])>8)changed++;
      return {side,changed};});
  });assert.ok(ordering[0].changed>50);assert.equal(ordering[1].changed,0);
  const waterOrdering=await page.evaluate(()=>{
    const {draw,scene,p}=qa,canvas=document.querySelector("#qa"),ctx=canvas.getContext("2d"),prop=scene.scenery.find(o=>o.id==="hot-water-dispensers");
    return ["player","panda"].flatMap(actor=>[496,576].map(y=>{
      const player=actor==="player"?p(411,y):p(470,580),panda=actor==="panda"?p(411,y):p(470,580);
      const options={settings:{motion:false}};
      draw(ctx,canvas,{...scene,interactables:[],scenery:[]},player,panda,options);
      const before=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      draw(ctx,canvas,{...scene,interactables:[],scenery:[prop]},player,panda,options);
      const after=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let changed=0;for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>8)changed++;
      return {actor,y,changed};
    }));
  });
  for(const result of waterOrdering)assert.ok(result.y===496?result.changed>50:result.changed===0,JSON.stringify(result));
  const planterOrdering=await page.evaluate(()=>{
    const {draw,scene,p,canStand}=qa,canvas=document.querySelector("#qa"),ctx=canvas.getContext("2d");
    return scene.scenery.filter(o=>o.id.startsWith("waiting-plant-")).flatMap(prop=>{
      const [[left,bottom],[right]]=prop.prop.frontEdge,x=(left+right)/2;
      if(canStand(scene,x*2,(bottom-7)*2))throw new Error(`${prop.id}: pot is walkable`);
      return ["player","panda"].flatMap(actor=>["behind","front"].map(side=>{
        const y=bottom+(side==="behind"?-26:14);
        if(!canStand(scene,x*2,y*2))throw new Error(`${prop.id}: ${side} is unreachable`);
        const player=actor==="player"?p(x,y):p(x+90,y),panda=actor==="panda"?p(x,y):p(x+90,y);
        const options={settings:{motion:false}};
        draw(ctx,canvas,{...scene,interactables:[],scenery:[]},player,panda,options);
        const before=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        draw(ctx,canvas,{...scene,interactables:[],scenery:[prop]},player,panda,options);
        const after=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let changed=0;for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>8)changed++;
        return {id:prop.id,actor,side,changed};
      }));
    });
  });
  for(const result of planterOrdering)assert.ok(result.side==="behind"?result.changed>50:result.changed===0,JSON.stringify(result));
  const animation=await page.evaluate(async()=>{
    const {paintStationEscalators}=await import("/game/station-escalators.js"),{waitingEscalators}=await import("/data/station-waiting.js");const c=document.createElement("canvas");c.width=1536;c.height=1024;const ctx=c.getContext("2d");
    const snap=t=>{ctx.clearRect(0,0,c.width,c.height);paintStationEscalators(ctx,qa.image,t,waitingEscalators,1);return ctx.getImageData(0,0,c.width,c.height).data;};const a=snap(0.1),b=snap(0.3);
    let left=0,right=0,outside=0;for(let y=0;y<1024;y++)for(let x=0;x<1536;x++){const i=(y*1536+x)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])<8)continue;
      if(x>=526&&x<=571&&y>=255&&y<=342)left++;else if(x>=583&&x<=624&&y>=255&&y<=342)right++;else outside++;}return {left,right,outside};
  });assert.ok(animation.left>100&&animation.right>100);assert.equal(animation.outside,0);
  await page.setViewportSize({width:1536,height:1024});
  await page.evaluate(()=>{
    const {draw,scene,p}=qa,canvas=document.querySelector("#qa");canvas.style.width="1536px";canvas.style.height="1024px";
    draw(canvas.getContext("2d"),canvas,{...scene,cameraRegion:undefined,cameraWidth:scene.width,cameraHeight:scene.height},p(790,385),p(819,386),{
      settings:{motion:false},adventure:{stationTraveler:"entered",stationJourney:{booked:true,entry:"ready"}},
    });
  });
  await page.screenshot({path:"test-results/station-waiting-layers/overview.png"});
  await page.evaluate(async()=>{
    const {paintWaitingSigns}=await import("/game/station-waiting-art.js");
    const art=document.createElement("canvas");art.width=1536;art.height=1024;
    const paint=art.getContext("2d");paint.drawImage(qa.image,0,0);
    paint.save();paint.scale(0.5,0.5);paintWaitingSigns(paint,{boarding:true});paint.restore();
    const canvas=document.querySelector("#qa");canvas.width=1332;canvas.height=519;
    canvas.style.width="1332px";canvas.style.height="519px";
    canvas.getContext("2d").drawImage(art,830,163,444,173,0,0,1332,519);
  });
  await page.locator("#qa").screenshot({path:"test-results/station-waiting-layers/lettering-detail.png"});
  assert.deepEqual(errors,[]);console.log("2F layering: fifteen reachable views, transparent bench/luggage/rail masks, player/Panda planter and water-dispenser and actor front/behind compositing and confined paired escalator animation passed.");
}finally{await browser.close();await new Promise(r=>server.close(r));}
