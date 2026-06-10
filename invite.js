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

  /* ---------------- hero snap: one scroll opens, one scroll up closes ---- */
  let heroAnimating = false;

  function animateToY(targetY) {
    if (heroAnimating) return;
    heroAnimating = true;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    setTimeout(() => { heroAnimating = false; }, 1200);
  }

  function stageEnd() { return stage ? stage.offsetHeight - window.innerHeight : 0; }

  function onIntent(deltaY) {
    if (heroAnimating) return;
    const atTop     = window.scrollY < 20;
    const atStageEnd = Math.abs(window.scrollY - stageEnd()) < 40;

    if (deltaY > 0 && atTop)      animateToY(stageEnd()); // open
    if (deltaY < 0 && atStageEnd) animateToY(0);          // close
  }

  // wheel
  window.addEventListener('wheel', (e) => onIntent(e.deltaY), { passive: true });

  // touch
  let _ty0 = 0;
  window.addEventListener('touchstart', (e) => { _ty0 = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend',   (e) => { onIntent(_ty0 - e.changedTouches[0].clientY); }, { passive: true });

  /* ---------------- countdown ---------------- */
  const TARGET = new Date('2026-09-06T18:00:00').getTime();
  const cd = document.getElementById('countdown');
  if (cd) {
    const elD = cd.querySelector('[data-d]');
    const elH = cd.querySelector('[data-h]');
    const elM = cd.querySelector('[data-m]');
    const elS = cd.querySelector('[data-s]');
    const pad = (n) => String(n).padStart(2, '0');

    const pop = (el) => {
      const cell = el.closest('.count-cell');
      cell.classList.remove('pop');
      void cell.offsetWidth;
      cell.classList.add('pop');
    };

    let prev = {};
    function tick() {
      let diff = Math.max(0, TARGET - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      if (d !== prev.d) { elD.textContent = pad(d); pop(elD); }
      if (h !== prev.h) { elH.textContent = pad(h); pop(elH); }
      if (m !== prev.m) { elM.textContent = pad(m); pop(elM); }
      if (s !== prev.s) { elS.textContent = pad(s); pop(elS); }
      prev = { d, h, m, s };
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- fairy lights ---------------- */
  const fairyString = document.querySelector('.fairy-string');
  if (fairyString) {
    const palette = [
      { c: '#ffe066', g: 'rgba(255,224,102,.4)' },
      { c: '#ff6b6b', g: 'rgba(255,107,107,.4)' },
      { c: '#7ee8fa', g: 'rgba(126,232,250,.4)' },
      { c: '#90ee90', g: 'rgba(144,238,144,.4)' },
      { c: '#f4a261', g: 'rgba(244,162,97,.4)'  },
      { c: '#c77dff', g: 'rgba(199,125,255,.4)' },
    ];
    for (let i = 0; i < 26; i++) {
      const { c, g } = palette[i % palette.length];
      const el = document.createElement('span');
      el.className = 'light';
      el.style.setProperty('--lc', c);
      el.style.setProperty('--lg', g);
      el.style.setProperty('--delay', `${(i * 0.13).toFixed(2)}s`);
      el.style.setProperty('--ld',    `${(1.1 + (i * 0.07) % 0.9).toFixed(2)}s`);
      fairyString.appendChild(el);
    }
  }

  /* ---------------- scroll reveals ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------------- gallery fallbacks ---------------- */
  document.querySelectorAll('.gallery-card img').forEach((img) => {
    img.addEventListener('error', () => {
      img.closest('.gallery-card')?.remove();
    }, { once: true });
  });

  /* ---------------- RSVP form ---------------- */
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpStatus = document.getElementById('rsvpStatus');
  if (rsvpForm && rsvpStatus) {
    const scriptUrl = rsvpForm.dataset.scriptUrl;
    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    const phoneInput = rsvpForm.querySelector('input[name="phone"]');

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        const area = digits.slice(0, 3);
        const prefix = digits.slice(3, 6);
        const line = digits.slice(6, 10);

        if (digits.length > 6) {
          phoneInput.value = `(${area}) ${prefix}-${line}`;
        } else if (digits.length > 3) {
          phoneInput.value = `(${area}) ${prefix}`;
        } else if (digits.length > 0) {
          phoneInput.value = `(${area}`;
        } else {
          phoneInput.value = '';
        }
      });
    }

    rsvpForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!scriptUrl || scriptUrl.includes('PASTE_GOOGLE_APPS_SCRIPT')) {
        rsvpStatus.textContent = 'RSVP saving is not connected yet.';
        rsvpStatus.className = 'form-status error';
        return;
      }

      const formData = new FormData(rsvpForm);
      if (formData.get('website')) return;
      formData.append('submittedAt', new Date().toISOString());

      rsvpStatus.textContent = 'Sending your RSVP...';
      rsvpStatus.className = 'form-status';
      if (submitButton) submitButton.disabled = true;

      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: new URLSearchParams(formData)
        });

        rsvpForm.reset();
        rsvpStatus.textContent = 'Thank you. Your RSVP has been received.';
        rsvpStatus.className = 'form-status success';
      } catch (error) {
        rsvpStatus.textContent = 'Something went wrong. Please try again in a moment.';
        rsvpStatus.className = 'form-status error';
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
