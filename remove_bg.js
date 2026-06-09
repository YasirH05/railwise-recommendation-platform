import Jimp from 'jimp';

async function removeBg() {
  const image = await Jimp.read('c:/Users/YasirPC/Downloads/ChatGPT Image Jun 10, 2026, 03_19_31 AM.png');
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const visited = new Uint8Array(w * h);
  const queue = [[0, 0], [w-1, 0], [0, h-1], [w-1, h-1]]; // start from 4 corners
  
  const isWhite = (x, y) => {
    const idx = (w * y + x) << 2;
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    return r > 230 && g > 230 && b > 230; // Threshold for white-ish
  };

  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    
    const idx = w * y + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    if (isWhite(x, y)) {
      const dataIdx = idx << 2;
      
      // Calculate alpha based on how dark the pixel is (anti-aliasing)
      const r = image.bitmap.data[dataIdx + 0];
      const g = image.bitmap.data[dataIdx + 1];
      const b = image.bitmap.data[dataIdx + 2];
      const avg = (r + g + b) / 3;
      
      if (avg > 250) {
        image.bitmap.data[dataIdx + 3] = 0; // Pure transparent
      } else {
        // Soften the edges
        const alpha = Math.floor((255 - avg) * 10);
        image.bitmap.data[dataIdx + 3] = Math.min(255, Math.max(0, alpha));
      }
      
      queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
    }
  }
  
  await image.writeAsync('F:/My Codespace/Railway Recommendation System/public/logo.png');
  console.log('Successfully created transparent logo.png');
}

removeBg().catch(console.error);
