(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const region = document.querySelector('[aria-roledescription="carousel"]');
  region.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const idx = () => [...document.querySelectorAll('[aria-roledescription="carousel"] li')].findIndex((li) => li.getAttribute('aria-hidden') !== 'true');
  const next = region.querySelector('[aria-label="Next terrain image"]');
  const labels = [];
  const broken = [];
  for (let i = 0; i < 7; i++) {
    const items = [...document.querySelectorAll('[aria-roledescription="carousel"] li')];
    labels.push(items[idx()].getAttribute('aria-label'));
    const img = items[idx()].querySelector('img');
    if (img && (!img.complete || img.naturalWidth === 0)) broken.push(img.getAttribute('src'));
    next.click();
    await sleep(900);
  }
  return { total: document.querySelectorAll('[aria-roledescription="carousel"] li').length, labels, broken, dots: document.querySelectorAll('[aria-roledescription="carousel"] ~ div button').length };
})()
