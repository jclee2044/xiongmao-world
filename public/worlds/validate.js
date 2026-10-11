// Build-time validation only. Runtime scene objects remain mutable and retain identity.
export function validateWorlds({ worlds, casts, activities, assetGroups, exists = () => true }) {
  const errors = [], sceneIds = new Set(), characterIds = new Set(), sources = new Set(), outputs = new Map();
  const fail = message => errors.push(message);
  const point = p => Number.isFinite(p?.x) && Number.isFinite(p?.y);
  const activityIds = new Set(activities.map(activity => activity.id));
  for (const [cast, definitions] of Object.entries(casts)) for (const id of Object.keys(definitions)) {
    if (characterIds.has(id)) fail(`${cast}: duplicate character ${id}`);
    characterIds.add(id);
  }
  for (const [id, world] of Object.entries(worlds)) {
    if (world.id !== id) fail(`${id}: world key and ID differ`);
    for (const [key, scene] of Object.entries(world.scenes)) {
      if (key !== scene.id) fail(`${id}/${key}: scene key and ID differ`);
      if (sceneIds.has(key)) fail(`${id}: duplicate scene ${key}`);
      sceneIds.add(key);
    }
  }
  for (const world of Object.values(worlds)) for (const scene of Object.values(world.scenes)) {
    if (!(Number.isFinite(scene.width) && scene.width > 0 && Number.isFinite(scene.height) && scene.height > 0))
      fail(`${scene.id}: invalid dimensions`);
    if (!point(scene.spawn)) fail(`${scene.id}: invalid spawn`);
    const placements = new Set();
    for (const object of scene.interactables || []) {
      const label = `${scene.id}/${object.id}`;
      if (!object.id || placements.has(object.id)) fail(`${label}: duplicate or missing placement ID`);
      placements.add(object.id);
      if (!point(object)) fail(`${label}: invalid position`);
      if (object.target && !sceneIds.has(object.target)) fail(`${label}: missing target ${object.target}`);
      if (object.returnPoint && !point(object.returnPoint)) fail(`${label}: invalid return point`);
      if (object.dialogueId && !characterIds.has(object.dialogueId)) fail(`${label}: missing character ${object.dialogueId}`);
      if (object.type === "npc" && !object.dialogueId && !characterIds.has(object.id) && !world.scriptedCharacters?.includes(object.id))
        fail(`${label}: missing character or scripted interaction`);
      if (object.activity && !activityIds.has(object.activity)) fail(`${label}: missing activity ${object.activity}`);
    }
  }
  for (const [role, descriptors] of Object.entries(assetGroups)) for (const asset of descriptors) {
    if (sources.has(asset.source)) fail(`${role}: duplicate asset ${asset.source}`);
    sources.add(asset.source);
    for (const path of [asset.source, asset.output].filter(Boolean)) {
      if (!path.startsWith("/assets/") || path.includes("..")) fail(`${role}: invalid asset URL ${path}`);
      else if (!exists(path)) fail(`${role}: missing asset ${path}`);
    }
    // A direct reference to an existing optimized file is an alias, not another producer.
    if (asset.output && asset.source !== asset.output) {
      if (outputs.has(asset.output)) fail(`${role}: output collision ${asset.output}`);
      outputs.set(asset.output, asset.source);
    }
  }
  return errors;
}
