import { PLATFORM_SCALE, PLATFORM_ART_WIDTH, PLATFORM_ART_HEIGHT, platformTrainArt } from "../data/station-platform.js";

export function paintPlatformTrain(ctx, img, pose) {
  if (!pose?.visible || !img?.complete || !img.naturalWidth) return;
  const {crop,x,width,noseY,trackX} = platformTrainArt;
  const height = width * crop.h / crop.w;
  const y = noseY - height + pose.travel * (height + PLATFORM_ART_HEIGHT);
  ctx.save();
  ctx.scale(PLATFORM_SCALE, PLATFORM_SCALE);
  // Clip the moving sprite to the track corridor and the authored scene.
  ctx.beginPath();ctx.rect(trackX,0,PLATFORM_ART_WIDTH-trackX,PLATFORM_ART_HEIGHT);ctx.clip();
  ctx.drawImage(img,crop.x,crop.y,crop.w,crop.h,x,y,width,height);
  ctx.restore();
}
