(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const items = [...document.querySelectorAll('[aria-roledescription="carousel"] li')];
  items[4].scrollIntoView({ block: 'center' });
  await sleep(800);
  const img = items[4].querySelector('img');
  const r = items[4].getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left, w: r.width, h: r.height, currentSrc: img.currentSrc, natural: [img.naturalWidth, img.naturalHeight], complete: img.complete };
})()
