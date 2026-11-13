(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const region = document.querySelector('[aria-roledescription="carousel"]');
  region.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const next = region.querySelector('[aria-label="Next terrain image"]');
  for (let i = 0; i < 3; i++) { next.click(); await sleep(500); }
  await sleep(1200);
  window.scrollTo(0, 0);
  return [...document.querySelectorAll('[aria-roledescription="carousel"] li')].map((li) => li.getAttribute('aria-hidden'));
})()
