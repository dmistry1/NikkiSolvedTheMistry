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

  /* ---------------- scroll reveals ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------------- slideshow ---------------- */
  const ssEl = document.getElementById('photoSlideshow');
  const dotsEl = document.querySelector('.slideshow-dots');
  if (ssEl && dotsEl) {
    const track = ssEl.querySelector('.slide-track');
    const slides = Array.from(track.querySelectorAll('.slide'));
    const wrap = ssEl.closest('.slideshow-wrap');
    let idx = 0, timer;

    function perView() {
      return window.innerWidth >= 900 ? 3 : window.innerWidth >= 540 ? 2 : 1;
    }

    function setup() {
      const pv = perView();
      const w = ssEl.offsetWidth / pv;
      slides.forEach(s => { s.style.width = w + 'px'; });
      // rebuild dots for the number of "pages"
      dotsEl.innerHTML = '';
      const pages = slides.length - pv + 1;
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 's-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Photo ' + (i + 1));
        d.addEventListener('click', () => { goTo(i); reset(); });
        dotsEl.appendChild(d);
      }
      idx = 0;
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
    }

    function goTo(n) {
      const pv = perView();
      const max = slides.length - pv;
      idx = Math.max(0, Math.min(n, max));
      // loop: if past end go to 0
      if (n > max) idx = 0;
      if (n < 0)   idx = max;
      track.style.transition = '';
      track.style.transform = `translateX(-${idx * slides[0].offsetWidth}px)`;
      Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    function reset() { clearInterval(timer); timer = setInterval(() => goTo(idx + 1), 3500); }

    wrap.querySelector('.slide-prev').addEventListener('click', () => { goTo(idx - 1); reset(); });
    wrap.querySelector('.slide-next').addEventListener('click', () => { goTo(idx + 1); reset(); });

    let tx = 0;
    ssEl.addEventListener('touchstart', e => { tx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
    ssEl.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? idx + 1 : idx - 1);
      reset();
    }, { passive: true });

    window.addEventListener('resize', () => { setup(); reset(); });
    setup();
    reset();
  }

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
