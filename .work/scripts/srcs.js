(() => [...document.querySelectorAll('[aria-roledescription="carousel"] li')].map((li) => {
  const img = li.querySelector('img');
  return { label: li.getAttribute('aria-label'), src: img?.getAttribute('src'), w: img?.naturalWidth, h: img?.naturalHeight };
}))()
