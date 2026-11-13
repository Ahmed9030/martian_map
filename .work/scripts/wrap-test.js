(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const idx = () => [...document.querySelectorAll('[aria-roledescription="carousel"] li')].findIndex((li) => li.getAttribute('aria-hidden') !== 'true');
  const region = document.querySelector('[aria-roledescription="carousel"]');
  region.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const prev = region.querySelector('[aria-label="Previous terrain image"]');
  const next = region.querySelector('[aria-label="Next terrain image"]');
  const start = idx();
  prev.click(); await sleep(300); const back = idx();
  next.click(); next.click(); await sleep(300); const fwd = idx();
  return { start, back, fwd };
})()
