(() => {
  const region = document.querySelector('[aria-roledescription="carousel"]');
  const ul = region.querySelector('ul');
  const li = ul.querySelector('li');
  const fig = li.querySelector('figure');
  const cap = fig.querySelector('figcaption');
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), height: Math.round(b.height), width: Math.round(b.width), left: Math.round(b.left) }; };
  const cs = getComputedStyle(ul);
  return { region: r(region), ul: r(ul), li: r(li), fig: r(fig), cap: r(cap), ulH: cs.height, liStyle: li.getAttribute('style') };
})()
