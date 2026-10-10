import test from "node:test";
import assert from "node:assert/strict";
import { scenes, canStand, move, interactionPoint } from "../public/game/world.js";
import { pathTo } from "../public/game/pathfinding.js";

test("bakery, bookstore and tea shop rear lanes are connected without opening their walls", () => {
  const scene = scenes.shanghai;
  for (const id of ["bakery", "books", "tea"]) {
    const shop = scene.scenery.find((o) => o.doorId === id);
    const rearY = shop.y - shop.h * .72;
    const side = id === "tea" ? .52 : .6;
    const start = {x: shop.x - shop.w * side, y: rearY};
    const target = {x: shop.x + shop.w * side, y: rearY};
    const end = move(scene, start, target.x-start.x, 0);
    assert.ok(Math.hypot(end.x-target.x,end.y-target.y)<1, `${id}: full rear crossing`);
    const route = pathTo(scene, scene.spawn, start);
    assert.ok(route.length);
    assert.ok(Math.hypot(route.at(-1).x-start.x,route.at(-1).y-start.y)<25);
    for (let dx=-.35;dx<=.35;dx+=.07) {
      for (let depth=.5;depth>=.05;depth-=.05)
        assert.equal(canStand(scene,shop.x+shop.w*dx,shop.y-shop.h*depth),false,`${id}: interior`);
      const stopped = move(scene,{x:shop.x+shop.w*dx,y:rearY},0,shop.h*.7);
      assert.ok(stopped.y <= shop.y-shop.h*.6-14,`${id}: rear wall`);
    }
    const door = scene.interactables.find((o) => o.id === id);
    const approach = interactionPoint(door);
    assert.ok(canStand(scene,approach.x,approach.y),`${id}: front entrance`);
  }
});
