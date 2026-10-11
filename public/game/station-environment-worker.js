import { paintStationBackdrop } from "./station-environment.js";

const canvas = new OffscreenCanvas(1536, 1024);
const ctx = canvas.getContext("2d");
let image;
self.onmessage = ({ data }) => {
  try {
    image ||= data.image;
    paintStationBackdrop(ctx, image, data.time);
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ bitmap }, [bitmap]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
