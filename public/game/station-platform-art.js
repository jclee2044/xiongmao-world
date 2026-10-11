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

// Architectural overlays share the plate's coordinates and warm metal palette.
export function paintMaintenanceDoor(ctx, x, y, w, h, scale, coverControls = false) {
  ctx.save(); ctx.scale(scale, scale);
  if (coverControls) {
    const wall=ctx.createLinearGradient(x,y-13,x+w+23,y+h);
    wall.addColorStop(0,"#c4b79d");wall.addColorStop(1,"#9b9385");
    ctx.fillStyle=wall;ctx.fillRect(x-5,y-13,w+29,h+18);
  }
  ctx.fillStyle = "#675e50"; ctx.fillRect(x-4,y-4,w+8,h+8);
  const metal = ctx.createLinearGradient(x,y,x+w,y+h);
  metal.addColorStop(0,"#b5ad94"); metal.addColorStop(.5,"#898c80"); metal.addColorStop(1,"#626e68");
  ctx.fillStyle=metal; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="#d2c5a3";ctx.lineWidth=1;ctx.strokeRect(x+3,y+3,w-6,h-6);
  ctx.fillStyle="#344c48";ctx.fillRect(x+w*.12,y+9,w*.76,17);
  ctx.fillStyle="#f4e4b8";ctx.font=`${Math.min(11,w/5)}px sans-serif`;ctx.textAlign="center";ctx.fillText("维修门",x+w/2,y+21);
  ctx.fillStyle="#3f4c46";
  for(let i=0;i<4;i++)ctx.fillRect(x+w*.2,y+h*.7+i*4,w*.6,2);
  ctx.fillStyle="#e3c58a";ctx.fillRect(x+w-12,y+h*.45,3,14);
  ctx.restore();
}
