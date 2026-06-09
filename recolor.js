import Jimp from 'jimp';

async function recolorBg() {
  const image = await Jimp.read('F:/My Codespace/Railway Recommendation System/public/logo.png');
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (w * y + x) << 2;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];
      
      if (a > 0) {
        // Keep pure whites white
        if (r > 230 && g > 230 && b > 230) continue;
        
        // Detect Gold (Red and Green are much higher than Blue)
        const isGold = (r > b + 20 && g > b + 20);
        
        if (isGold) {
           // Map gold to Purple (#c084fc -> 192, 132, 252)
           const brightness = (r + g + b) / 3;
           const factor = brightness / 255;
           image.bitmap.data[idx + 0] = Math.min(255, Math.floor(192 * factor * 1.5));
           image.bitmap.data[idx + 1] = Math.min(255, Math.floor(132 * factor * 1.5));
           image.bitmap.data[idx + 2] = Math.min(255, Math.floor(252 * factor * 1.5));
        } else {
          // Map everything else (Dark Blues) to Light Blue (#60a5fa -> 96, 165, 250)
          // To keep anti-aliasing against white, we blend based on brightness.
          const brightness = (r + g + b) / 3;
          if (brightness < 230) {
             const factor = brightness / 230; // 0 to 1
             image.bitmap.data[idx + 0] = Math.floor(96 + (255 - 96) * factor);
             image.bitmap.data[idx + 1] = Math.floor(165 + (255 - 165) * factor);
             image.bitmap.data[idx + 2] = Math.floor(250 + (255 - 250) * factor);
          }
        }
      }
    }
  }
  
  await image.writeAsync('F:/My Codespace/Railway Recommendation System/public/logo.png');
  console.log('Successfully recolored logo.png');
}

recolorBg().catch(console.error);
