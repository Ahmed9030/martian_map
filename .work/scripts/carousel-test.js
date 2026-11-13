(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const activeIndex = () => {
    const items = [...document.querySelectorAll('[aria-roledescription="carousel"] li')];
    const active = items.findIndex((li) => li.getAttribute('aria-hidden') !== 'true');
    return { active, label: items[active]?.getAttribute('aria-label') };
  };
  const region = document.querySelector('[aria-roledescription="carousel"]');
  const before = activeIndex();
  const next = region.querySelector('[aria-label="Next terrain image"]');
  const prev = region.querySelector('[aria-label="Previous terrain image"]');
  next.click();
  await sleep(900);
  const afterNext = activeIndex();
  prev.click();
  await sleep(900);
  const afterPrev = activeIndex();
  prev.click(); // wrap backwards to last slide
  await sleep(900);
  const wrapped = activeIndex();
  await sleep(4600); // autoplay tick (mouse not over region)
  const afterAutoplay = activeIndex();
  return { before, afterNext, afterPrev, wrapped, afterAutoplay, dots: document.querySelectorAll('[aria-roledescription="carousel"] ~ div button').length };
})()
