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
  let stageTop = 0;
  let stageTotal = 0;
  let animOverride = null; // null = use scroll; 0–1 = drive animation programmatically

  function measureStage() {
    if (!stage) return;
    stageTop = stage.offsetTop;
    stageTotal = stage.offsetHeight - window.innerHeight;
  }

  function update() {
    ticking = false;
    if (!stage || stageTotal <= 0) return;
    const p = animOverride !== null ? animOverride : clamp((window.scrollY - stageTop) / stageTotal, 0, 1);

    const flap   = ease(span(p, 0.02, 0.34));
    const lift   = ease(span(p, 0.30, 0.82));
    const reveal = ease(span(p, 0.60, 0.98));

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
  window.addEventListener('resize', () => { measureStage(); update(); });
  measureStage();
  update();

  /* ---------------- open invitation button ---------------- */
  const openBtn = document.getElementById('openInviteBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openBtn.disabled = true;
      const duration = 1800;
      const startTime = performance.now();

      function animFrame(now) {
        const t = Math.min((now - startTime) / duration, 1);
        animOverride = ease(t);
        update();
        if (t < 1) {
          requestAnimationFrame(animFrame);
        } else {
          animOverride = null;
          window.scrollTo({ top: stageTop + stageTotal, behavior: 'instant' });
          openBtn.disabled = false;
        }
      }
      requestAnimationFrame(animFrame);
    });
  }

  /* ---------------- hero snap: desktop wheel only (mobile scrolls freely) --- */
  const isMobile = () => window.matchMedia('(hover:none)').matches;

  let heroAnimating = false;
  function animateToY(targetY) {
    if (heroAnimating) return;
    heroAnimating = true;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    setTimeout(() => { heroAnimating = false; }, 1200);
  }

  function stageEnd() { return stageTop + stageTotal; }

  function onIntent(deltaY) {
    if (heroAnimating || isMobile()) return;
    const atTop      = window.scrollY < 20;
    const atStageEnd = Math.abs(window.scrollY - stageEnd()) < 40;
    if (deltaY > 0 && atTop)      animateToY(stageEnd());
    if (deltaY < 0 && atStageEnd) animateToY(0);
  }

  window.addEventListener('wheel', (e) => onIntent(e.deltaY), { passive: true });

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


  /* ---------------- gallery carousel (3-up, infinite) ---------------- */
  const gallery = document.getElementById('gallerySlideshow');
  if (gallery) {
    const photos = [
      'img/image0.jpeg','img/image1.jpeg','img/image2.jpeg','img/image3.jpeg',
      'img/image4.jpeg','img/image5.jpeg','img/image6.jpeg','img/image7.jpeg',
      'img/image8.jpeg'
    ];
    const N = photos.length; // 9
    const VIS = 3;
    const track   = gallery.querySelector('.slide-track');
    const dotsEl  = gallery.querySelector('.slide-dots');

    // Build track: [last VIS clones] + [all N photos] + [first VIS clones]
    [...photos.slice(-VIS), ...photos, ...photos.slice(0, VIS)].forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Nikhita and Deep';
      if (i >= VIS) img.loading = 'lazy';
      slide.appendChild(img);
      track.appendChild(slide);
    });

    // Build dots
    for (let i = 0; i < N; i++) {
      const dot = document.createElement('button');
      dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Photo ${i + 1}`);
      dotsEl.appendChild(dot);
    }
    const dots = dotsEl.querySelectorAll('.slide-dot');

    let pos  = VIS; // index in padded sequence; VIS = first real slide
    let busy = false;
    let timer;
    const pct = 100 / VIS; // percent per slide

    function applyPos(animate) {
      track.style.transition = animate ? 'transform .55s ease' : 'none';
      if (!animate) void track.offsetWidth; // force reflow so snap is instant
      track.style.transform = `translateX(${-pos * pct}%)`;
    }

    function updateDots() {
      const ri = ((pos - VIS) % N + N) % N;
      dots.forEach((d, i) => d.classList.toggle('active', i === ri));
    }

    function go(delta) {
      if (busy) return;
      busy = true;
      pos += delta;
      applyPos(true);
      updateDots();
    }

    track.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'transform') return;
      if (pos >= VIS + N) { pos -= N; applyPos(false); }
      else if (pos < VIS) { pos += N; applyPos(false); }
      busy = false;
    });

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => go(1), 3000);
    }

    gallery.querySelector('.slide-prev').addEventListener('click', () => { go(-1); startTimer(); });
    gallery.querySelector('.slide-next').addEventListener('click', () => { go(1);  startTimer(); });

    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      pos = VIS + i;
      applyPos(true);
      updateDots();
      startTimer();
    }));

    gallery.addEventListener('mouseenter', () => clearInterval(timer));
    gallery.addEventListener('mouseleave', startTimer);

    applyPos(false);
    updateDots();
    startTimer();
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
