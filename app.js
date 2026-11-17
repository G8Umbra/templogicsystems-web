const root = document.documentElement;
root.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-navigation');
if (menuButton && menu) {
  const setMenu = open => {
    menuButton.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menuButton.textContent = open ? menuButton.dataset.close : menuButton.dataset.open;
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false); menuButton.focus();
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));
}
const sections = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  sections.forEach(section => observer.observe(section));
} else sections.forEach(section => section.classList.add('is-visible'));

const motionButton = document.querySelector('.network-control');
if (motionButton) {
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    const paused = motionButton.getAttribute('aria-pressed') !== 'true';
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.closest('.field-hero').classList.toggle('network-paused', paused);
    motionButton.textContent = paused ? motionButton.dataset.play : motionButton.dataset.pause;
  });
}
if (document.querySelector('.network-canvas')) import('./network.js').catch(() => document.documentElement.classList.add('network-static'));
