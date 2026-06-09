/* Deep & Shree — invite controller (scroll card, countdown, reveals) */
(function () {
  'use strict';

  // start at the top so the card always opens fresh
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('load', () => window.scrollTo(0, 0));

  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const envelope = document.getElementById('envelope');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // map x in [a,b] -> [0,1]
  const span = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  // smoothstep for buttery motion
  const ease = (t) => t * t * (3 - 2 * t);

  let ticking = false;

  function update() {
    ticking = false;
    if (!stage) return;
    const vh = window.innerHeight;
    const total = stage.offsetHeight - vh;          // scrollable distance while pinned
    const p = clamp(-stage.getBoundingClientRect().top / total, 0, 1);

    // phases
    const flap   = ease(span(p, 0.02, 0.34));       // flap opens
    const lift   = ease(span(p, 0.30, 0.82));       // letter rises + grows
    const reveal = ease(span(p, 0.60, 0.98));       // names fade in

    root.style.setProperty('--p', p.toFixed(4));
    root.style.setProperty('--flap', flap.toFixed(4));
    root.style.setProperty('--lift', lift.toFixed(4));
    root.style.setProperty('--reveal', reveal.toFixed(4));

    if (envelope) envelope.dataset.open = flap > 0.5 ? '1' : '0';
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ---------------- countdown ---------------- */
  const TARGET = new Date('2026-09-06T18:00:00').getTime();
  const cd = document.getElementById('countdown');
  if (cd) {
    const elD = cd.querySelector('[data-d]');
    const elH = cd.querySelector('[data-h]');
    const elM = cd.querySelector('[data-m]');
    const elS = cd.querySelector('[data-s]');
    const pad = (n) => String(n).padStart(2, '0');

    function tick() {
      let diff = Math.max(0, TARGET - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      elD.textContent = pad(d);
      elH.textContent = pad(h);
      elM.textContent = pad(m);
      elS.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- scroll reveals ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
