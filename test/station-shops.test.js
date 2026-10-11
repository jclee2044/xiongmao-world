import test from "node:test";
import assert from "node:assert/strict";
import { shops, shopContext } from "../public/data/shops.js";
import { npcs } from "../public/data/content.js";
import { scenes } from "../public/game/world.js";
import { storyReply, reply } from "../server/dialogue.js";
import { newState } from "../server/store.js";

for (const id of ["station-cafe", "station-snacks"]) {
  test(`${id} has a clickable counter, distinct seller, varied greetings and priced products`, () => {
    const shop = shops[id];
    assert.equal(scenes["station-waiting"].interactables.find(o => o.id === id).shopId, id);
    assert.ok(npcs[shop.seller]);
    assert.equal(new Set(shop.openings.map(o => o.chinese)).size, 3);
    assert.equal(shop.items.length, 3);
    assert.match(shopContext(id), /explicit purchase buttons/);
    const state = newState(); state.scene = "station-waiting";
    const first = storyReply(shop.seller, "你好", state, id, {random: () => 0});
    const next = storyReply(shop.seller, "你好", state, id, {random: () => 0, currentLine:first});
    assert.notEqual(first.chinese, next.chinese);
  });
}
