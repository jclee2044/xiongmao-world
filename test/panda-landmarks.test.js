import test from "node:test";
import assert from "node:assert/strict";
import { pandaAreas, landmarkAreas, withinArea } from "../public/data/panda-areas.js";
import { scenes } from "../public/game/world.js";
import { isChineseDialogue } from "../public/data/language.js";
import { createLandmarkPanda } from "../public/game/panda-landmarks.js";
import { landmarkReply } from "../server/panda-landmarks.js";
const scene = scenes.shanghai;
const fountain = landmarkAreas(scene).find((a) => a.id === "fountain");
const outside = { x: 20, y: 20 };
const tick = () => new Promise((r) => setImmediate(r));

test("all authored areas have three Chinese examples", () => {
  assert.equal(Object.keys(pandaAreas).length, 38);
  assert.equal(new Set(landmarkAreas(scene).map((a) => a.id)).size, 12);
  for (const area of Object.values(pandaAreas)) {
    assert.equal(area.examples.length, 3);
    for (const line of area.examples) assert.ok(/\p{Script=Han}/u.test(line), line);
  }
  assert.deepEqual(landmarkAreas(scenes.home), []);
});
test("one-in-two entry roll, no repeated rolls while lingering; margin prevents boundary chatter", () => {
  let rolls = 0;
  const shown = [];
  const panda = createLandmarkPanda({
    random: () => {
      rolls++;
      return 0.6;
    },
    generate: () => assert.fail(),
    show: (x) => shown.push(x),
    hide() {},
  });
  panda.update(scene, fountain);
  panda.update(scene, fountain);
  panda.update(scene, { x: fountain.x + fountain.r + 30, y: fountain.y });
  panda.update(scene, fountain);
  assert.equal(rolls, 1);
  panda.update(scene, outside);
  panda.update(scene, fountain);
  assert.equal(rolls, 2);
  assert.equal(shown.length, 0);
});
test("successful roll uses stored half without calling LLM", () => {
  const draws = [0.2, 0.5, 0.49],
    shown = [];
  const panda = createLandmarkPanda({
    random: () => draws.shift(),
    generate: () => assert.fail(),
    show: (x) => shown.push(x),
    hide() {},
  });
  panda.update(scene, fountain);
  assert.deepEqual(shown, [pandaAreas.fountain.examples[1]]);
});
test("generated half uses provider, falls back on failure, and drops late results after leaving", async () => {
  for (const fail of [false, true]) {
    const shown = [],
      draws = [0.1, 0, 0.5];
    const panda = createLandmarkPanda({
      random: () => draws.shift(),
      generate: async (id) => {
        assert.equal(id, "fountain");
        if (fail) throw Error("offline");
        return { chinese: "水真好看。" };
      },
      show: (x) => shown.push(x),
      hide() {},
    });
    panda.update(scene, fountain);
    await tick();
    assert.deepEqual(shown, [
      fail ? pandaAreas.fountain.examples[0] : "水真好看。",
    ]);
  }
  let finish;
  const shown = [];
  const draws = [0.1, 0, 0.9];
  const panda = createLandmarkPanda({
    random: () => draws.shift(),
    generate: () =>
      new Promise((r) => {
        finish = r;
      }),
    show: (x) => shown.push(x),
    hide() {},
  });
  panda.update(scene, fountain);
  await tick();
  panda.update(scene, outside);
  finish({ chinese: "水真好看。" });
  await tick();
  assert.deepEqual(shown, []);
});
test("quiet indoors, no generic NPC areas, and disabled entry makes no request", () => {
  const panda = createLandmarkPanda({
    random: () => assert.fail(),
    generate: () => assert.fail(),
    show: () => assert.fail(),
    hide() {},
  });
  panda.update(scenes.home, scenes.home.spawn);
  panda.update(scene, fountain, false);
  panda.update(scene, fountain, true);
});
test("family-home comments appear once per visit and update after cleanup", () => {
  const shown = [], completed = [];
  const panda = createLandmarkPanda({
    random: () => 0,
    getCompletedPractice: () => completed,
    generate: () => assert.fail('stored comment selected'),
    show: text => shown.push(text), hide() {},
  });
  const home = scenes['family-home'];
  panda.update(home, home.spawn, false);
  panda.update(home, home.spawn);
  panda.update(home, home.spawn);
  assert.deepEqual(shown,[pandaAreas['family-home-messy'].examples[0]]);
  completed.push('family-rug','family-wash','family-tidy');
  panda.update(home, home.spawn);
  panda.update(home, home.spawn);
  assert.deepEqual(shown,[pandaAreas['family-home-messy'].examples[0],pandaAreas['family-home-tidy'].examples[0]]);
});
test("LLM receives all trusted references; invalid output and provider errors fall back", async () => {
  let payload;
  const good = await landmarkReply(
    { area: "pond-right" },
    {
      provider: "local",
      fetcher: async (url, options) => {
        payload = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({ chinese: "你看，水里的鸭子真可爱。" }),
            },
          }),
        };
      },
    },
  );
  assert.equal(good.mode, "generated");
  const references = JSON.parse(payload.messages[1].content);
  assert.deepEqual(references.examples, pandaAreas["pond-right"].examples);
  for (const fetcher of [
    async () => {
      throw Error("offline");
    },
    async () => ({
      ok: true,
      json: async () => ({
        message: { content: '{"chinese":"invalid English"}' },
      }),
    }),
  ]) {
    const result = await landmarkReply(
      { area: "pond-right" },
      { provider: "local", fetcher, random: () => 0 },
    );
    assert.deepEqual(result, {
      chinese: pandaAreas["pond-right"].examples[0],
      mode: "stored",
    });
  }
  await assert.rejects(landmarkReply({ area: "unknown" }));
});
test("Gemini landmark generation also includes the three reference examples", async () => {
  const result = await landmarkReply(
    { area: "cat" },
    {
      provider: "gemini",
      apiKey: "test-key",
      fetcher: async (url, options) => {
        const body = JSON.parse(options.body);
        assert.deepEqual(
          JSON.parse(body.contents[0].parts[0].text).examples,
          pandaAreas.cat.examples,
        );
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { text: JSON.stringify({ chinese: "这只小猫真可爱。" }) },
                  ],
                },
              },
            ],
          }),
        };
      },
    },
  );
  assert.equal(result.mode, "generated");
});
test("pond banks include their upper and lower corners and roll separately on crossing", () => {
  const left = landmarkAreas(scene).find(a => a.id === "pond-left");
  const right = landmarkAreas(scene).find(a => a.id === "pond-right");
  assert.equal(left.y, right.y);
  assert.equal(left.h, right.h);
  assert.equal(left.x + left.w, right.x);
  const shown = [];
  // .49 must speak now, whereas it would have been silent at one-in-three.
  const draws = [.49, 0, 0, .49, 0, 0];
  const panda = createLandmarkPanda({ random: () => draws.shift(), generate: () => assert.fail(), show: x => shown.push(x), hide() {} });
  const y = left.y + 10;
  panda.update(scene, { x: right.x - 5, y });
  panda.update(scene, { x: right.x + 5, y });
  assert.deepEqual(shown, [pandaAreas["pond-left"].examples[0], pandaAreas["pond-right"].examples[0]]);
  panda.update(scene, { x: right.x - 5, y });
  assert.equal(shown.length, 2);
});
test("each enclosed garden has two distinct spots with authored references", () => {
  for (const id of ["lion-grove", "humble-garden", "tiger-court", "silk-room"]) {
    const areas = landmarkAreas(scenes[id]);
    assert.equal(areas.length, 2);
    assert.notEqual(areas[0].id, areas[1].id);
    for (const area of areas) assert.equal(pandaAreas[area.id].examples.length, 3);
  }
});

test("uncollected stuffie always gives a spoiler-free hint, then stops after collection", async () => {
  const stuffie = landmarkAreas(scene).find(a => a.id === "stuffie");
  let found = false;
  const shown = [];
  const panda = createLandmarkPanda({
    getFound: id => id === "momo" && found,
    random: (() => { const draws = [.99, .49]; return () => draws.shift() ?? .99; })(),
    generate: () => assert.fail("The preset half must not generate a hint"),
    show: text => shown.push(text), hide() {},
  });
  panda.update(scene, stuffie, false);
  panda.update(scene, stuffie);
  assert.deepEqual(shown, [pandaAreas.stuffie.examples[2]]);
  panda.update(scene, stuffie);
  assert.equal(shown.length, 1);
  found = true;
  panda.update(scene, stuffie);
  panda.update(scene, outside);
  panda.update(scene, stuffie);
  assert.equal(shown.length, 1);
  for (const line of pandaAreas.stuffie.examples) {
    assert.doesNotMatch(line, /猫|狐狸|玩具|毛绒|布偶/);
  }
  const response = await landmarkReply({ area: "stuffie" }, {
    provider: "story", random: () => 0,
    fetcher: () => assert.fail("The server must preserve the spoiler-free references"),
  });
  assert.deepEqual(response, { chinese: pandaAreas.stuffie.examples[0], mode: "stored" });
});
test("stuffie stored hint repeats on a new visit before collection", () => {
  const stuffie = landmarkAreas(scene).find(a => a.id === "stuffie");
  const shown = [];
  const panda = createLandmarkPanda({
    random: () => 0, generate: () => assert.fail(),
    show: text => shown.push(text), hide() {},
  });
  panda.update(scene, stuffie);
  panda.update(scene, outside);
  panda.update(scene, stuffie);
  assert.deepEqual(shown, [pandaAreas.stuffie.examples[0], pandaAreas.stuffie.examples[0]]);
});

test("boat introduction is limited to the first visit, including reloads and quiet entries", () => {
  const boat = landmarkAreas(scene).find(a => a.id === "boat");
  for (const firstEntry of ["spoken", "randomly quiet", "disabled"]) {
    let visited = false, visits = 0;
    const shown = [];
    const create = () => createLandmarkPanda({
      getBoatVisited: () => visited,
      onBoatVisit: () => { visited = true; visits++; },
      random: () => firstEntry === "randomly quiet" ? 0.9 : 0,
      generate: () => assert.fail("Boat should use the stored line"),
      show: text => shown.push(text),
      hide() {},
    });
    const panda = create();
    panda.update(scene, boat, firstEntry !== "disabled");
    assert.equal(visited, true);
    assert.equal(shown.length, firstEntry === "spoken" ? 1 : 0);
    panda.update(scene, outside);
    panda.update(scene, boat);
    panda.update(scenes.home, scenes.home.spawn);
    panda.update(scene, boat);
    create().update(scene, boat);
    assert.equal(visits, 1);
    assert.equal(shown.length, firstEntry === "spoken" ? 1 : 0);
  }
});

test("station arrival moments always speak in order, defer while disabled, and survive repeat visits", () => {
  const station = scenes.shantang;
  const plaza = { x: 700 * 1.8, y: 565 * 1.8 };
  const moments = [], shown = [];
  const create = () => createLandmarkPanda({
    getPandaMoments: () => moments,
    onPandaMoment: id => moments.push(id),
    random: () => 0.99,
    generate: () => assert.fail("First arrivals must use authored lines"),
    show: text => shown.push(text), hide() {},
  });
  const panda = create();
  panda.update(station, station.spawn, false);
  assert.deepEqual(moments, []);
  panda.update(station, station.spawn);
  assert.deepEqual(shown, [pandaAreas["station-quay-arrival"].examples[2]]);
  assert.deepEqual(moments, ["station-quay-arrival"]);
  panda.update(station, station.spawn);
  assert.equal(shown.length, 1, "No ambient line replaces the first moment while lingering");
  panda.update(station, plaza, false);
  assert.equal(moments.length, 1);
  panda.update(station, plaza);
  assert.deepEqual(shown, [pandaAreas["station-quay-arrival"].examples[2], pandaAreas["station-plaza-arrival"].examples[2]]);
  assert.deepEqual(moments, ["station-quay-arrival", "station-plaza-arrival"]);
  panda.update(scenes.shanghai, outside);
  panda.update(station, station.spawn);
  panda.update(station, plaza);
  const reloaded = create();
  reloaded.update(station, station.spawn);
  reloaded.update(station, plaza);
  assert.equal(shown.length, 2, "Later visits use the optional ambient roll");
  assert.equal(moments.length, 2);
});

test("later station visits can speak stored ambient lines at both quay and plaza", () => {
  const station = scenes.shantang;
  const shown = [];
  const panda = createLandmarkPanda({
    getPandaMoments: () => ["station-quay-arrival", "station-plaza-arrival"],
    onPandaMoment: () => assert.fail("First-time progress must not be repeated"),
    random: () => 0,
    generate: () => assert.fail(), show: text => shown.push(text), hide() {},
  });
  panda.update(station, station.spawn, false);
  panda.update(station, station.spawn);
  panda.update(station, station.spawn);
  panda.update(station, { x: 700 * 1.8, y: 565 * 1.8 });
  panda.update(station, { x: 700 * 1.8, y: 565 * 1.8 });
  assert.deepEqual(shown, [pandaAreas["station-quay"].examples[0], pandaAreas["station-plaza"].examples[0]]);
});

test("later quay visits support generated variations without repeating the arrival", async () => {
  const shown = [], draws = [0, 0, 0.9];
  const panda = createLandmarkPanda({
    getPandaMoments: () => ["station-quay-arrival"],
    random: () => draws.shift(),
    generate: async id => {
      assert.equal(id, "station-quay");
      return { chinese: "河边的树真好看。" };
    },
    show: text => shown.push(text), hide() {},
  });
  panda.update(scenes.shantang, scenes.shantang.spawn);
  await tick();
  assert.deepEqual(shown, ["河边的树真好看。"]);
});

test("the station plaza moment starts after the bridge and never on the canal promenade", () => {
  const station = scenes.shantang;
  const areas = landmarkAreas(station);
  const at = (x, y) => areas.filter(area => withinArea(area, { x: x * 1.8, y: y * 1.8 })).map(area => area.id);
  assert.deepEqual(at(355, 813), ["station-quay"]);
  assert.deepEqual(at(530, 500), ["station-quay"]);
  assert.deepEqual(at(620, 550), ["station-plaza"]);
  assert.deepEqual(at(700, 565), ["station-plaza"]);
  assert.deepEqual(at(650, 320), []);
});

test("station arrival and ambient lines use beginner Chinese; first moments never call AI", async () => {
  for (const id of ["station-quay-arrival", "station-plaza-arrival", "station-quay", "station-plaza"])
    for (const line of pandaAreas[id].examples) assert.ok(isChineseDialogue(line), line);
  for (const area of ["station-quay-arrival", "station-plaza-arrival"]) {
    const reply = await landmarkReply({ area }, {
      provider: "local", random: () => 0,
      fetcher: () => assert.fail("The first-time sentiment must stay authored"),
    });
    assert.deepEqual(reply, { chinese: pandaAreas[area].examples[0], mode: "stored" });
  }
});
