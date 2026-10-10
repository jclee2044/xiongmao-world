import { marketColliders } from "../public/data/market-colliders.js";
import { pathTo } from "../public/game/pathfinding.js";
import test from "node:test";
import assert from "node:assert/strict";
import { marketForeground, behindMarketForeground } from "../public/data/market-foreground.js";
import { scenes, canStand, move, pointInPolygon } from "../public/game/world.js";

test("market occlusion follows the sloping shop front and the final plate transform", () => {
  const p = scenes.shanghai.marketPlate;
  const masks = marketForeground(p);
  const noodles = masks.find((m) => m.id.endsWith("noodles")).polygon;
  const behind = (x, y) => behindMarketForeground(noodles,
    p.x + x * p.w / 1536, p.y + y * p.h / 1024);
  assert.equal(behind(1100, 570), true, "Characters behind the roof are obscured");
  assert.equal(behind(890, 760), true, "The bushes cover passing characters");
  assert.equal(behind(1100, 985), false, "Characters in front remain visible");
  const cook = scenes.shanghai.interactables.find((o) => o.id === "market-cook");
  assert.equal(behindMarketForeground(noodles, cook.x, cook.y), false,
    "The cook stands in front of the sloping counter");
  assert.deepEqual(marketForeground(undefined), []);
});


test("market walls, furniture and planters stop walking while the lane stays open", () => {
  const scene = scenes.shanghai, p = scene.marketPlate;
  const point = (x, y) => ({x: p.x + x * p.w / 1536, y: p.y + y * p.h / 1024});
  for (const [x, y] of [[980, 660], [1070, 635], [820, 680],
    [875, 825], [1130, 925], [1185, 900], [1020, 475]]) {
    const target = point(x, y);
    assert.equal(canStand(scene, target.x, target.y), false, `Solid prop ${x},${y}`);
  }
  for (const [from, to] of [
    [[870, 680], [815, 680]], // side table
    [[1070, 565], [1070, 700]], // rear wall under roof
    [[875, 740], [875, 845]], // pots below the foliage
    [[1130, 970], [1130, 885]], // stool at the counter
  ]) {
    const start = point(...from), target = point(...to);
    assert.ok(canStand(scene, start.x, start.y));
    const end = move(scene, start, target.x - start.x, target.y - start.y);
    assert.ok(canStand(scene, end.x, end.y));
    assert.ok(Math.hypot(end.x - target.x, end.y - target.y) > 20,
      `Movement stops before ${to}`);
  }
});

test("roof greenery and edge overlaps are included in the noodle foreground", () => {
  const polygon = marketForeground({x: 0, y: 0, w: 1536, h: 1024})
    .find((m) => m.id.endsWith("noodles")).polygon;
  for (const [x, y] of [[945, 574], [979, 568], [1165, 542], [1058, 480]])
    assert.ok(pointInPolygon(x, y, polygon), `Roof edge ${x},${y}`);
  assert.equal(behindMarketForeground(polygon, 824, 760, 25), true,
    "Shoulders beside the outline are still occluded");
});


test("all market buildings have connected rear lanes, solid walls and foreground roofs", () => {
  const scene = scenes.shanghai, p = scene.marketPlate;
  const point = ([x, y]) => ({ x: p.x + x * p.w / 1536, y: p.y + y * p.h / 1024 });
  const masks = marketForeground(p);
  for (const [id, lane, wall] of [
    ["breakfast", [[300, 100], [430, 80], [600, 90]], [430, 240]],
    ["souvenirs", [[900, 75], [1050, 90], [1250, 115]], [1050, 260]],
    ["produce", [[1400, 350], [1480, 430]], [1300, 480]],
    ["bakery", [[300, 585], [450, 575], [600, 530], [740, 550]], [450, 730]],
  ]) {
    const mask = masks.find((m) => m.id === `market-foreground-${id}`);
    assert.ok(mask, id);
    for (const pixel of lane) {
      const target = point(pixel);
      assert.ok(canStand(scene, target.x, target.y), `${id} rear lane ${pixel}`);
      assert.ok(behindMarketForeground(mask.polygon, target.x, target.y, 60), `${id} covers characters behind it`);
      const route = pathTo(scene, scene.spawn, target);
      assert.ok(route.length);
      assert.ok(Math.hypot(route.at(-1).x - target.x, route.at(-1).y - target.y) < 25);
    }
    const target = point(wall), start = point(lane[1]);
    assert.equal(canStand(scene, target.x, target.y), false, `${id} wall stays solid`);
    const end = move(scene, start, target.x - start.x, target.y - start.y);
    assert.ok(Math.hypot(end.x - target.x, end.y - target.y) > 20, `${id} stops walking`);
  }
  for (const [id, building] of [["market-baker", "breakfast"],
    ["silk-host", "souvenirs"], ["wei", "produce"],
    ["snack-host", "bakery"], ["market-cook", "noodles"]]) {
    const npc = scene.interactables.find((o) => o.id === id);
    const mask = masks.find((m) => m.id === `market-foreground-${building}`);
    assert.equal(behindMarketForeground(mask.polygon, npc.x, npc.y), false,
      `${id} remains in front of ${mask.id}`);
  }
});


test("painted shop interiors and exposed props have no walkable holes", () => {
  const scene = scenes.shanghai, p = scene.marketPlate;
  const point = (x,y) => ({x: p.x+x*p.w/1536, y: p.y+y*p.h/1024});
  // Independent rectangular samples inside visible walls and counters, not
  // generated from the collider definitions.
  for (const [name,x0,y0,x1,y1] of [
    ["gift doorway", 940, 315, 975, 392],
    ["gift shelves", 1010, 300, 1060, 399],
    ["gift east room", 1170, 200, 1320, 310],
    ["fruit west room", 1170, 400, 1220, 495],
    ["fruit interior and counter", 1260, 405, 1400, 555],
    ["fruit east wall", 1410, 450, 1440, 550],
    ["breakfast interior", 280, 190, 490, 370],
    ["bakery interior", 350, 670, 650, 795],
    ["noodle interior", 1000, 690, 1240, 850],
  ]) {
    for(let x=x0;x<=x1;x+=8) for(let y=y0;y<=y1;y+=8) {
      const q=point(x,y);
      assert.equal(canStand(scene,q.x,q.y),false,`${name}: ${x},${y}`);
    }
  }
  for(const [x,y] of [[854,403],[900,422],[995,450],[1028,474],
    [1108,415],[1170,515],[1230,553],[1370,610],[1455,560],
    [590,340],[822,677],[450,851],[523,885],[1128,921]]) {
    const q=point(x,y); assert.equal(canStand(scene,q.x,q.y),false,`Prop ${x},${y}`);
  }
});

test("movement cannot cross any exposed market collider edge", () => {
  const scene=scenes.shanghai,p=scene.marketPlate;
  const point=([x,y])=>({x:p.x+x*p.w/1536,y:p.y+y*p.h/1024});
  let approaches=0;
  for(const collider of marketColliders) {
    const vertices=collider.polygon.map(point);
    for(let i=0;i<vertices.length;i++) {
      const a=vertices[i],b=vertices[(i+1)%vertices.length];
      const length=Math.hypot(b.x-a.x,b.y-a.y);
      const nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length;
      for(const t of [.2,.5,.8]) for(const sign of [-1,1]) {
        const mid={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
        const start={x:mid.x+nx*50*sign,y:mid.y+ny*50*sign};
        const target={x:mid.x-nx*25*sign,y:mid.y-ny*25*sign};
        if(!canStand(scene,start.x,start.y)||canStand(scene,target.x,target.y)) continue;
        approaches++;
        let current=start;
        for(let step=0;step<20;step++) {
          current=move(scene,current,(target.x-start.x)/20,(target.y-start.y)/20);
          assert.ok(canStand(scene,current.x,current.y),`${collider.id} edge ${i}`);
        }
        assert.ok(Math.hypot(current.x-target.x,current.y-target.y)>10,collider.id);
      }
    }
  }
  assert.ok(approaches>150,`Swept ${approaches} exposed edge approaches`);
});
