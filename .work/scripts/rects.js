(async () => {
  await new Promise((r) => setTimeout(r, 600));
  return [...document.querySelectorAll('[aria-roledescription="carousel"] li')].map((li) => {
    const b = li.getBoundingClientRect();
    const img = li.querySelector('img');
    return { label: li.getAttribute('aria-label'), x: Math.round(b.left), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height), op: getComputedStyle(li).opacity, src: img?.currentSrc?.split('url=')[1]?.split('&')[0] };
  });
})()
