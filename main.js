/* ============================================================
   PRESSURE LINE — main.js
   All interaction logic. No external dependencies except GSAP.
   ============================================================ */

'use strict';

/* ── 1. CUSTOM CURSOR ───────────────────────────────────────── */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = 0, my = 0;   // target position
  let cx = 0, cy = 0;   // current (lerped) position

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function loop() {
    cx += (mx - cx) * 0.12;   // lerp factor = ~8ms lag
    cy += (my - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  // Hover states
  document.querySelectorAll('a, button, .flip-card, .athlete-header, .rule-header, .gb-nav-item, .img-cell, .footer-top').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
})();

/* ── 2. SCROLL PROGRESS BAR ─────────────────────────────────── */
(function initScrollBar() {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    bar.style.height = Math.min(pct, 100) + '%';
  }, { passive: true });
})();

/* ── 3. NAV SCROLL STATE ─────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
})();

/* ── 4. HERO — WATER RIPPLE CANVAS OVERLAY ────────────────── */
/*
 * The photo is the hero background.
 * Canvas draws only animated water ripples + shimmer on top.
 * Background is fully transparent — no fill, no mermaids.
 */
(function initHeroCanvas() {
  const canvas = document.getElementById('mermaidCanvas');
  const waterCanvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (waterCanvas) waterCanvas.style.display = 'none';

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---- Ripple wave: sine wave painted as a thin strip ---- */
  function drawWaveStrip(t, yFrac, opts) {
    const cy = H * yFrac;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let x = 0; x <= W; x += 4) {
      const y = cy
        + Math.sin((x / W) * Math.PI * opts.freq + t * opts.spd)      * opts.amp
        + Math.sin((x / W) * Math.PI * opts.freq2 + t * opts.spd2 + opts.ph) * opts.amp2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, cy - opts.amp * 2);
    ctx.lineTo(0, cy - opts.amp * 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy - opts.amp, 0, cy + opts.amp * 1.5);
    g.addColorStop(0,   `rgba(180, 220, 255, ${opts.op * 0.6})`);
    g.addColorStop(0.4, `rgba(130, 180, 240, ${opts.op})`);
    g.addColorStop(1,   'rgba(80, 130, 200, 0)');
    ctx.fillStyle = g;
    ctx.fill();
  }

  /* ---- Caustic light patch: animated shimmer blobs ---- */
  function drawCaustics(t) {
    // ~12 floating oval light patches that drift and pulse
    const seeds = [
      [0.12, 0.35, 0.08, 0.9],
      [0.28, 0.52, 0.06, 1.3],
      [0.45, 0.28, 0.10, 0.7],
      [0.60, 0.44, 0.07, 1.6],
      [0.75, 0.62, 0.09, 1.1],
      [0.88, 0.38, 0.06, 2.0],
      [0.20, 0.70, 0.07, 0.5],
      [0.52, 0.75, 0.08, 1.8],
      [0.35, 0.18, 0.05, 1.4],
      [0.68, 0.22, 0.06, 0.8],
      [0.82, 0.80, 0.07, 1.2],
      [0.10, 0.88, 0.05, 2.2],
    ];
    seeds.forEach(([xf, yf, rf, ph]) => {
      const cx = W * xf + Math.sin(t * 0.18 + ph) * W * 0.04;
      const cy = H * yf + Math.cos(t * 0.14 + ph) * H * 0.03;
      const r  = Math.min(W, H) * rf * (0.85 + Math.sin(t * 0.35 + ph) * 0.15);
      const op = 0.06 + Math.sin(t * 0.5 + ph) * 0.03;
      const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   `rgba(200, 235, 255, ${op})`);
      g.addColorStop(0.5, `rgba(150, 200, 240, ${op * 0.5})`);
      g.addColorStop(1,   'rgba(80, 140, 200, 0)');
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.6, r, Math.sin(t * 0.1 + ph) * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
  }

  /* ---- Dark vignette to keep text legible ---- */
  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.9);
    g.addColorStop(0,   'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(1,   'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Bottom dark band so text is readable
    const bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
    bot.addColorStop(0,   'rgba(0,0,0,0)');
    bot.addColorStop(1,   'rgba(0,0,0,0.60)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  /* ---- Mouse ripples ---- */
  const mouseRipples = [];

  function spawnRipple(x, y) {
    mouseRipples.push({ x, y, r: 0, maxR: 80 + Math.random() * 60, op: 0.55, born: 0 });
    // extra small inner ring
    mouseRipples.push({ x, y, r: 0, maxR: 35 + Math.random() * 25, op: 0.70, born: 0 });
  }

  // Listen on the whole hero section so text overlay doesn't block events
  const heroSection = canvas.parentElement;
  const evTarget = heroSection || canvas;

  evTarget.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const last = mouseRipples[mouseRipples.length - 1];
    if (!last || Math.hypot(mx - last.x, my - last.y) > 38) {
      spawnRipple(mx, my);
    }
  });

  evTarget.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
    spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
  });

  function drawMouseRipples() {
    for (let i = mouseRipples.length - 1; i >= 0; i--) {
      const rp = mouseRipples[i];
      rp.r  += (rp.maxR - rp.r) * 0.045;
      rp.op *= 0.962;
      rp.born++;

      if (rp.op < 0.01) { mouseRipples.splice(i, 1); continue; }

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 225, 255, ${rp.op})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Second fainter outer ring slightly larger
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r * 1.28, rp.r * 0.28 * 1.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(160, 210, 255, ${rp.op * 0.4})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }
  }

  const pressureLine = document.getElementById('pressureLine');
  let time = 0;

  function animate() {
    time += 0.012;
    ctx.clearRect(0, 0, W, H);

    drawVignette();
    drawCaustics(time);

    drawWaveStrip(time, 0.22, { freq:3.2, spd:0.55, amp:6,  freq2:5.1, spd2:0.82, ph:0.8,  amp2:3,  op:0.10 });
    drawWaveStrip(time, 0.38, { freq:2.8, spd:0.40, amp:9,  freq2:4.4, spd2:0.65, ph:1.5,  amp2:5,  op:0.08 });
    drawWaveStrip(time, 0.53, { freq:3.6, spd:0.68, amp:7,  freq2:5.8, spd2:0.95, ph:0.3,  amp2:3,  op:0.06 });
    drawWaveStrip(time, 0.66, { freq:2.4, spd:0.30, amp:11, freq2:3.9, spd2:0.50, ph:2.1,  amp2:6,  op:0.05 });
    drawWaveStrip(time, 0.79, { freq:4.0, spd:0.75, amp:6,  freq2:6.2, spd2:1.10, ph:1.0,  amp2:3,  op:0.04 });

    drawMouseRipples();

    if (pressureLine) {
      const fade = 1 - Math.min(window.scrollY / (window.innerHeight * 0.5), 1);
      pressureLine.style.opacity = fade;
    }

    requestAnimationFrame(animate);
  }
  animate();
})();

/* ── 5. MANIFESTO — GSAP SCROLL ANIMATIONS ─────────────────── */
(function initManifestoAnimations() {
  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Slide-up for type lines
  gsap.utils.toArray('.type-line').forEach((line, i) => {
    gsap.from(line, {
      scrollTrigger: { trigger: line, start: 'top 88%' },
      y: 40,
      opacity: 0,
      duration: 0.7,
      delay: i * 0.06,
      ease: 'power3.out'
    });
  });

  // Stat counters
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const start  = performance.now();
        const dur    = 1200;
        function step(now) {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
          el.textContent = Math.round(ease * target);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      }
    });
  });

  // Stats row slide-up
  gsap.utils.toArray('.stat-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 88%' },
      y: 24, opacity: 0, duration: 0.6,
      delay: i * 0.08,
      ease: 'power3.out'
    });
  });
})();

/* ── 6. EVIDENCE — STRIKETHROUGH & IMAGE GRID ───────────────── */
(function initEvidence() {
  // Strikethrough on scroll
  const strike = document.getElementById('evStrike');
  if (strike) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { strike.classList.add('active'); observer.disconnect(); }
      });
    }, { threshold: 0.5 });
    observer.observe(strike.closest('.ev-current') || strike);
  }

  // Image grid: scroll-in stagger (GSAP)
  if (typeof gsap !== 'undefined') {
    gsap.utils.toArray('.img-cell').forEach((cell, i) => {
      gsap.from(cell, {
        scrollTrigger: { trigger: cell, start: 'top 90%' },
        y: 30, opacity: 0, duration: 0.55,
        delay: (i % 4) * 0.05,
        ease: 'power2.out'
      });
    });
  }

  // Show placeholder label when evidence image fails to load
  document.querySelectorAll('.img-cell img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
  });
})();

/* ── 7. GUIDEBOOK COVER ANIMATION ───────────────────────────── */
(function initGuidebookCover() {
  const cover = document.querySelector('.gb-cover');
  if (!cover) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        // Small delay for theatrical effect
        setTimeout(() => cover.classList.add('visible'), 200);
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(cover);
})();

/* ── 8. GUIDEBOOK NAV — ACTIVE STATE ON SCROLL ──────────────── */
(function initGuidebookNav() {
  const navItems = document.querySelectorAll('.gb-nav-item');
  const sections = document.querySelectorAll('.gb-section');
  if (!navItems.length || !sections.length) return;

  const gbContent = document.getElementById('gbContent');
  if (!gbContent) return;

  // Click to scroll
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = document.getElementById(item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Scroll to update active
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(item => {
          item.classList.toggle('active', item.dataset.target === id);
        });
      }
    });
  }, {
    rootMargin: '-10% 0px -60% 0px',
    threshold: 0
  });
  sections.forEach(s => io.observe(s));
})();

/* ── 9. COMPARE SLIDER (DRAG) ───────────────────────────────── */
(function initCompareSlider() {
  const slider = document.getElementById('compareSlider');
  const left   = document.getElementById('compareLeft');
  const right  = document.getElementById('compareRight');
  const handle = document.getElementById('compareHandle');
  const hint   = document.getElementById('compareHint');
  if (!slider || !left || !right || !handle) return;

  let dragging  = false;
  let hintGone  = false;

  function setPosition(pct) {
    pct = Math.max(20, Math.min(80, pct));
    left.style.width   = pct + '%';
    right.style.width  = (100 - pct) + '%';
    handle.style.left  = pct + '%';
  }

  function getPercent(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  handle.addEventListener('mousedown',  e => { dragging = true; e.preventDefault(); });
  handle.addEventListener('touchstart', () => { dragging = true; }, { passive: true });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    if (!hintGone && hint) { hint.style.opacity = '0'; hintGone = true; }
    setPosition(getPercent(e.clientX));
  });
  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    if (!hintGone && hint) { hint.style.opacity = '0'; hintGone = true; }
    setPosition(getPercent(e.touches[0].clientX));
  }, { passive: true });

  window.addEventListener('mouseup',  () => { dragging = false; });
  window.addEventListener('touchend', () => { dragging = false; });
})();

/* ── 10. ATHLETE ACCORDION ──────────────────────────────────── */
(function initAthleteCards() {
  const cards = document.querySelectorAll('.athlete-card');
  cards.forEach(card => {
    card.querySelector('.athlete-header').addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      // Close all
      cards.forEach(c => c.classList.remove('open'));
      // Open clicked if it was closed
      if (!isOpen) card.classList.add('open');
    });
  });
})();

/* ── 11. EVIDENCE CARDS TOGGLE (old .ev-card) ───────────────── */
(function initEvidenceCards() {
  document.querySelectorAll('.ev-card').forEach(card => {
    const btn = card.querySelector('.ev-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      card.classList.toggle('open');
      btn.textContent = isOpen ? 'Expand ↓' : 'Collapse ↑';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* ── 11b. SECTION I EVIDENCE BLOCKS TOGGLE ──────────────────── */
/* Handled by inline script in index.html immediately after the blocks. */

/* ── 12. DIRECTIVE CONSOLE RULES ────────────────────────────── */
(function initDirectiveConsole() {
  document.querySelectorAll('.console-rule').forEach(rule => {
    rule.querySelector('.rule-header').addEventListener('click', () => {
      rule.classList.toggle('open');
    });
  });
})();

/* ── 12. GUIDEBOOK CONCLUSION ────────────────────────────────── */
(function initConclusion() {

  // Athlete strip — staggered scroll-in
  document.querySelectorAll('.gc-athlete-row').forEach((row, i) => {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => row.classList.add('visible'), i * 100);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(row);
  });

  // Pull quote — line wipe reveal
  const pqLines = document.querySelectorAll('.gc-pq-line');
  const underline = document.getElementById('gcPqUnderline');
  if (pqLines.length) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        pqLines.forEach((line, i) => {
          setTimeout(() => line.classList.add('visible'), i * 200);
        });
        if (underline) {
          setTimeout(() => underline.classList.add('visible'), pqLines.length * 200 + 100);
        }
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(pqLines[0].closest('.gc-pullquote'));
  }

  // Spacer brand fade-in
  const brand = document.getElementById('gcSpacerBrand');
  if (brand) {
    const mo = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        brand.classList.add('visible');
        mo.disconnect();
      }
    }, { threshold: 0.4 });
    mo.observe(brand);
  }

  // Ripple canvas in spacer
  const canvas = document.getElementById('gcRippleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Mouse interaction
  let mx = W / 2, my = H / 2;
  canvas.parentElement.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });

  function drawWave(t, yFrac, opts) {
    const cy = H * yFrac;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let x = 0; x <= W; x += 3) {
      const y = cy
        + Math.sin((x / W) * Math.PI * opts.freq + t * opts.spd) * opts.amp
        + Math.sin((x / W) * Math.PI * opts.freq2 + t * opts.spd2 + opts.ph) * opts.amp2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, cy - opts.amp, 0, cy + opts.amp * 2);
    g.addColorStop(0, `rgba(42,91,168,${opts.op * 0.6})`);
    g.addColorStop(0.5, `rgba(20,50,120,${opts.op})`);
    g.addColorStop(1, 'rgba(10,20,60,0)');
    ctx.fillStyle = g;
    ctx.fill();
  }

  function drawMouseGlow() {
    const r = Math.min(W, H) * 0.35;
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, r);
    g.addColorStop(0, 'rgba(42,91,168,0.12)');
    g.addColorStop(1, 'rgba(42,91,168,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    t += 0.008;
    ctx.clearRect(0, 0, W, H);
    drawMouseGlow();
    drawWave(t, 0.3, { freq:2.5, spd:0.4, amp:12, freq2:4.2, spd2:0.6, ph:1.0, amp2:6, op:0.18 });
    drawWave(t, 0.5, { freq:3.1, spd:0.55, amp:9, freq2:5.0, spd2:0.8, ph:0.5, amp2:4, op:0.14 });
    drawWave(t, 0.7, { freq:2.0, spd:0.3, amp:14, freq2:3.5, spd2:0.5, ph:2.0, amp2:7, op:0.10 });
    requestAnimationFrame(loop);
  }
  loop();

})();

/* ── 13. DIRECTIVES — SCROLL-IN TYPEWRITER ──────────────────── */
(function initDirectivesSection() {
  const cols  = document.querySelectorAll('.dir-col');
  const delays = [0, 200, 400];

  cols.forEach((col, ci) => {
    const rules = col.querySelectorAll('.dir-rule-item');
    rules.forEach((rule, ri) => {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setTimeout(() => rule.classList.add('visible'), delays[ci] + ri * 150);
          observer.disconnect();
        }
      }, { threshold: 0.2 });
      observer.observe(rule);
    });
  });

  // Closing statement lines
  const closingLines = document.querySelectorAll('.closing-line');
  const redline = document.getElementById('closingRedline');

  closingLines.forEach(line => {
    const delay = parseInt(line.dataset.delay || '0', 10);
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => {
          line.classList.add('visible');
          // After last line, trigger red line
          if (line.classList.contains('closing-red') && redline) {
            setTimeout(() => redline.classList.add('active'), 500);
          }
        }, delay);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(line);
  });
})();
