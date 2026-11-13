(() => {
  const h1 = document.querySelector('h1');
  const planet = document.querySelector('img[alt*="Mars"]');
  const cs = planet ? getComputedStyle(planet.parentElement) : null;
  return {
    h1Opacity: getComputedStyle(h1).opacity,
    h1Text: h1.textContent,
    planetTransform: cs?.transform,
    heroSection: document.querySelector('#home')?.getBoundingClientRect().height,
  };
})()
