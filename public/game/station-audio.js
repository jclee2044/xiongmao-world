import { MusicTrack } from "./music-track.js";

// Freely licensed CC0 Chinese field recordings. Keep the traffic
// recording separate: it must never become a general station ambience bed.
export const stationRecordings = {
  hall: "/assets/audio/station-hall.mp3",
  pa: "/assets/audio/station-pa.mp3",
  traffic: "/assets/audio/station-forecourt.mp3",
};

const clamp = (value) => Math.max(0, Math.min(1, value));

// Painting coordinates: the plaza begins at the east end of the bridge.
// Distance to the doorway makes the sound grow along either approach path.
export function stationApproach(scene, player) {
  if (scene?.id !== "shantang" || scene.interior || !player) return 0;
  const x = player.x / 1.8, y = player.y / 1.8;
  const boundary = clamp((x - 560) / 80) * clamp(Math.min(y - 400, 850 - y) / 40);
  const proximity = clamp((720 - Math.hypot(x - 1215, y - 448)) / 640);
  return boundary * proximity;
}

export function stationSoundscape(scene, player) {
  if (scene?.id === "station-platform") return { hall: 0.18, pa: 0.4, traffic: 0 };
  if (["station-ticketing", "station-waiting"].includes(scene?.id))
    return { hall: 0.45, pa: 0.65, traffic: 0 };
  if (scene?.id !== "shantang" || scene.interior || !player)
    return { hall: 0, pa: 0, traffic: 0 };
  // Painting coordinates: station side of the bridge only. The quay, boat,
  // bridge and northern canal promenade are outside this audible region.
  const x = player.x / 1.8,
    y = player.y / 1.8;
  const near = clamp(Math.min(x - 960, 1536 - x) / 100) *
    clamp(Math.min(y - 400, 820 - y) / 40);
  const approach = stationApproach(scene, player);
  return { hall: approach * 0.22, pa: approach * 0.35, traffic: near * approach * 0.45 };
}

export class StationAudio {
  constructor(context, destination) {
    this.context = context;
    this.layers = Object.fromEntries(
      Object.entries(stationRecordings).map(([id, url]) => {
        const gain = context.createGain();
        gain.gain.value = 0;
        gain.connect(destination);
        return [
          id,
          {
            gain,
            track: new MusicTrack(context, url, gain),
            failed: false,
            loading: false,
          },
        ];
      }),
    );
  }

  update(scene, player, audible) {
    const levels = audible ? stationSoundscape(scene, player) : {};
    for (const [id, layer] of Object.entries(this.layers)) {
      const level = levels[id] || 0;
      const param = layer.gain.gain;
      param.cancelScheduledValues(this.context.currentTime);
      if (!level) {
        // Stop immediately at the boundary, including pending decodes; a long
        // fade would let exterior horns leak into the waiting hall.
        param.value = 0;
        layer.track.pause();
        continue;
      }
      param.setTargetAtTime(level, this.context.currentTime, 0.3);
      if (!layer.failed && !layer.loading && layer.track.paused) {
        layer.loading = true;
        layer.track
          .play()
          .catch(() => {
            layer.failed = true;
          })
          .finally(() => {
            layer.loading = false;
          });
      }
    }
  }

  dispose() {
    for (const layer of Object.values(this.layers)) {
      layer.track.dispose();
      layer.gain.disconnect();
    }
  }
}
