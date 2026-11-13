(async () => {
  const li = [...document.querySelectorAll('[aria-roledescription="carousel"] li')][1];
  const img = li.querySelector('img');
  await img.decode();
  const c = document.createElement('canvas');
  c.width = 48; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 48, 64);
  const data = ctx.getImageData(0, 0, 48, 64).data;
  const lum = [];
  for (let i = 0; i < data.length; i += 4) lum.push(Math.round((data[i] + data[i+1] + data[i+2]) / 3));
  return { src: img.currentSrc, complete: img.complete, natural: [img.naturalWidth, img.naturalHeight], mean: lum.reduce((a, b) => a + b, 0) / lum.length, lum };
})()
