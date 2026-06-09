import Jimp from 'jimp';

async function crop() {
  const image = await Jimp.read('F:/My Codespace/Railway Recommendation System/public/logo.png');
  // Autocrop removes any transparent padding around the logo
  image.autocrop();
  await image.writeAsync('F:/My Codespace/Railway Recommendation System/public/logo.png');
  console.log('Successfully cropped logo padding');
}

crop().catch(console.error);
