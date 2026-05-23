// ══════════════════════════════════════════════════════════════
// CodeFleet Redesign — Bold scroll-driven animations
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── MARQUEE — clone tracks for seamless CSS loop ──────────
  document.querySelectorAll('.marquee-track').forEach(track => {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.parentElement.appendChild(clone);
  });

  // ── HERO SCROLL EFFECTS ───────────────────────────────────
  // Pink circle grows from BL blob center; about-rise panel comes up on scroll
  const pinkCircle   = document.getElementById('heroPinkCircle');
  const heroSection  = document.getElementById('home');
  const heroSticky   = document.getElementById('heroSticky');
  const techBL       = document.getElementById('techBL');
  const aboutRise    = document.getElementById('heroAboutRise');

  // Cache DOM refs and section offset once — avoids getBoundingClientRect on every scroll
  const aboutContent = document.querySelector('.about-content');
  const parallaxBtn  = document.querySelector('.parallax-btn');
  const aboutSection = document.getElementById('about');

  let aboutSectionTop = 0;
  function cacheAboutOffset() {
    if (aboutSection) aboutSectionTop = aboutSection.offsetTop;
  }
  cacheAboutOffset();
  window.addEventListener('resize', cacheAboutOffset, { passive: true });

  let heroTicking = false;
  function updateHeroScroll() {
    if (!heroTicking) {
      requestAnimationFrame(() => {
        heroTicking = false;
        if (!heroSection) return;
        const scrollY = window.scrollY;

        // Animation starts sooner and completes faster on mobile
        const isMobileCircle = window.innerWidth <= 768;
        const animStart    = isMobileCircle ? 150 : 300;
        const animDistance = isMobileCircle ? 400 : 800;
        const progress = Math.min(Math.max((scrollY - animStart) / animDistance, 0), 1);

        // Pink circle — transform-only animation for GPU compositing on Safari iOS.
        // No left/top/width/height changes; only transform is updated each frame.
        if (pinkCircle) {
          const BASE = 100; // matches CSS width/height in px
          const maxSize = Math.max(window.innerWidth, window.innerHeight) * 2.8;
          const scale = progress * maxSize / BASE;
          let tx = -BASE / 2; // default: hidden off-screen center
          let ty = -BASE / 2;
          if (techBL) {
            const br = techBL.getBoundingClientRect();
            tx = br.left + br.width / 2 - BASE / 2;
            ty = br.top  + br.height / 2 - BASE / 2;
          }
          const t = `translate(${tx}px,${ty}px) scale(${scale})`;
          pinkCircle.style.transform = t;
          pinkCircle.style.webkitTransform = t;
        }

        // Parallax for about-content
        if (aboutContent) {
          aboutContent.style.transform = `translateY(-${scrollY * 0.25}px)`;
        }

        // Smooth button parallax — no getBoundingClientRect, pure arithmetic
        if (parallaxBtn) {
          // How far past the about section's top the user has scrolled
          const relScroll = scrollY - (aboutSectionTop - window.innerHeight);
          // On mobile the button drifts downward faster; on desktop it goes upward
          const isMobile = window.innerWidth <= 768;
          const btnParallax = Math.max(0, relScroll * (isMobile ? 0.35 : 0.12));
          parallaxBtn.style.transform = isMobile
            ? `translateY(${btnParallax}px)`
            : `translateY(-${btnParallax}px)`;
        }
      });
      heroTicking = true;
    }
  }

  window.addEventListener('scroll', updateHeroScroll, { passive: true });
  updateHeroScroll();

  // ── NAV LINK SCRAMBLE ──────────────────────────────────
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&';

  function scramble(el) {
    const original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    let frame = 0;
    clearInterval(el._scramble);
    el._scramble = setInterval(() => {
      el.textContent = original.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < frame / 2) return original[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      if (frame / 2 >= original.length) {
        clearInterval(el._scramble);
        el.textContent = original;
      }
      frame++;
    }, 28);
  }

  // ── LINK ARROW — rolling character ticker ─────────────
  document.querySelectorAll('.link-arrow').forEach(link => {
    const textEl = link.querySelector('.link-text');
    if (!textEl) return;
    const text = textEl.textContent;
    let charIndex = 0;
    textEl.innerHTML = text.split('').map(ch => {
      if (ch === ' ') return '<span class="roll-space"> </span>';
      const i = charIndex++;
      return `<span class="roll-char" style="--i:${i}"><span class="roll-top">${ch}</span><span class="roll-bot">${ch}</span></span>`;
    }).join('');
  });

  // ── NAV LINK — 3D flip-in per letter ──────────────────
  document.querySelectorAll('.nav-link').forEach(link => {
    const text = link.textContent.trim();
    link.innerHTML = text.split('').map(ch =>
      `<span class="nav-letter">${ch}</span>`
    ).join('');

    link._flipTimers = [];

    const flipLetter = (span, toColor, delay) => {
      const t = setTimeout(() => {
        span.style.transition = 'none';
        span.style.transform = 'rotateX(-90deg)';
        void span.offsetHeight; // commit snap before animating back
        if (toColor) {
          span.style.color = toColor;
        } else {
          span.style.removeProperty('color');
        }
        span.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        span.style.transform = 'rotateX(0deg)';
      }, delay);
      link._flipTimers.push(t);
    };

    link.addEventListener('mouseenter', () => {
      link._flipTimers.forEach(clearTimeout);
      link._flipTimers = [];
      link.querySelectorAll('.nav-letter').forEach((span, i) => {
        flipLetter(span, '#ff007f', i * 40);
      });
    });

    link.addEventListener('mouseleave', () => {
      link._flipTimers.forEach(clearTimeout);
      link._flipTimers = [];
      link.querySelectorAll('.nav-letter').forEach((span, i) => {
        flipLetter(span, null, i * 25);
      });
    });
  });

  // ── MENU TOGGLE ────────────────────────────────────────
  const menuToggle = document.getElementById('menuToggle');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuLinks = document.querySelectorAll('.menu-link');
  const menuDot = menuToggle.querySelector('.menu-dot');
  const menuLabelEl = menuToggle.querySelector('.menu-label');

  // Build animated two-text label structure
  const labelPrimary = document.createElement('span');
  labelPrimary.className = 'menu-label-text';
  labelPrimary.textContent = 'MENÜ';
  const labelAlt = document.createElement('span');
  labelAlt.className = 'menu-label-alt';
  labelAlt.textContent = 'BEZÁR';
  menuLabelEl.innerHTML = '';
  menuLabelEl.appendChild(labelPrimary);
  menuLabelEl.appendChild(labelAlt);

  let menuOpen = false;

  const openMenu = () => {
    menuOpen = true;
    menuOverlay.classList.add('active');
    // Dot: pop burst + morph to ring
    menuDot.classList.remove('pop');
    void menuDot.offsetHeight;
    menuDot.classList.add('pop', 'is-open');
    // Both spans slide up together — BEZÁR (2nd) enters view
    labelPrimary.style.transform = 'translateY(-100%)';
    labelAlt.style.transform = 'translateY(-100%)';
  };

  const closeMenu = () => {
    menuOpen = false;
    menuOverlay.classList.remove('active');
    // Dot: pop burst + back to solid
    menuDot.classList.remove('pop');
    void menuDot.offsetHeight;
    menuDot.classList.add('pop');
    menuDot.classList.remove('is-open');
    // Both spans slide back down — MENÜ (1st) returns to view
    labelPrimary.style.transform = '';
    labelAlt.style.transform = '';
  };

  menuToggle.addEventListener('click', () => {
    menuOpen ? closeMenu() : openMenu();
  });

  // ── MENU LINK — click to close ────────────────────────
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')));
      setTimeout(() => window.dispatchEvent(new Event('scroll')), 400);
    });
  });

  // ── SCROLL REVEAL ──────────────────────────────────────
  const reveals = document.querySelectorAll(
    '.reveal-up, .reveal-left, .reveal-right, .reveal-scale'
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, parseInt(delay));
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  reveals.forEach((el) => revealObserver.observe(el));

  // ── TRUST COUNTER ANIMATION ────────────────────────────
  const trustNumbers = document.querySelectorAll('.trust-number[data-target]');

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          animateCounter(el, 0, target, 1500);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  trustNumbers.forEach((el) => counterObserver.observe(el));

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }


  // ── VISION HEADING — letter-by-letter scroll reveal ─────
  const visionLines = document.querySelectorAll('.vision-line');
  const allLetterSpans = []; // flat array in DOM order across all lines

  visionLines.forEach(line => {
    const rawText = line.textContent.trim();
    line.innerHTML = '';

    for (const char of rawText) {
      const span = document.createElement('span');
      if (char === ' ') {
        span.className = 'letter-space';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'letter';
        span.textContent = char;
        allLetterSpans.push({ span, line });
      }
      line.appendChild(span);
    }
  });

  // On scroll, light up letters progressively across all lines
  const visionHeadingEl = document.getElementById('visionHeading');
  if (visionHeadingEl && allLetterSpans.length) {
    window.addEventListener('scroll', () => {
      const rect = visionHeadingEl.getBoundingClientRect();
      const windowH = window.innerHeight;
      const progress = Math.min(Math.max((windowH - rect.top) / (windowH * 1.1), 0), 1);
      const litCount = Math.floor(progress * allLetterSpans.length);
      allLetterSpans.forEach(({ span }, i) => {
        span.classList.toggle('lit', i < litCount);
      });
    }, { passive: true });
  }

  // ── SERVICES STICKY SCROLL ────────────────────────────────
  const servicesScrollArea = document.getElementById('servicesScrollArea');
  const servicesTrack      = document.getElementById('servicesTrack');
  const servicesNumInner   = document.getElementById('servicesNumInner');
  const servicesNumOuter   = document.getElementById('servicesNumOuter');
  const servicePanels      = document.querySelectorAll('.service-panel');

  if (servicesScrollArea && servicePanels.length) {
    const numServices = servicePanels.length;

    // Cache viewport height so mobile URL-bar resize doesn't shift the scroll math
    let cachedVH = window.innerHeight;

    // Set the scroll area tall enough for all panels (px, not vh, for stability)
    servicesScrollArea.style.height = `${numServices * cachedVH}px`;

    // Sync every panel + sticky wrapper to cachedVH so CSS 100vh (which iOS
    // measures WITHOUT the URL bar) can't cause a mismatch that skips panel #1
    function syncPanelHeights() {
      servicePanels.forEach(p => { p.style.height = cachedVH + 'px'; });
      const stickyPanel = document.querySelector('.services-sticky-panel');
      if (stickyPanel) stickyPanel.style.height = cachedVH + 'px';
    }
    syncPanelHeights();

    // Size the outer slot window to exactly one slot height
    let slotHeight = 0;
    function initSlotHeight() {
      const firstSlot = document.querySelector('.services-num-slot');
      if (firstSlot && servicesNumOuter) {
        slotHeight = firstSlot.offsetHeight;
        servicesNumOuter.style.height = slotHeight + 'px';
      }
    }

    // Header elements for scrub animation
    const servicesMegaTitle  = document.getElementById('servicesMegaTitle');
    const titleRevealBlock   = document.getElementById('titleRevealBlock');
    const servicesEyebrow    = document.querySelector('.services-eyebrow');
    const servicesHeader     = document.querySelector('.services-header');

    function updateServices() {
      // 1. HEADER SCRUB ANIMATION — purple block wipe reveal
      if (servicesHeader && servicesMegaTitle && titleRevealBlock) {
        const headerRect  = servicesHeader.getBoundingClientRect();
        const windowH     = window.innerHeight;
        const scrubProgress = Math.min(Math.max((windowH - headerRect.top) / (windowH * 0.75), 0), 1);

        if (scrubProgress < 0.5) {
          // Phase 1 (0→0.5): block sweeps LEFT → RIGHT over the title
          const p1 = scrubProgress / 0.5;
          titleRevealBlock.style.transformOrigin = 'left';
          titleRevealBlock.style.transform = `scaleX(${p1})`;
          servicesMegaTitle.style.opacity = '0';
        } else {
          // Phase 2 (0.5→1): block shrinks LEFT → RIGHT, revealing title underneath
          const p2 = (scrubProgress - 0.5) / 0.5;
          titleRevealBlock.style.transformOrigin = 'right';
          titleRevealBlock.style.transform = `scaleX(${1 - p2})`;
          servicesMegaTitle.style.opacity = '1';
        }

        if (servicesEyebrow) {
          const eyebrowP = Math.min(Math.max((scrubProgress - 0.4) / 0.6, 0), 1);
          servicesEyebrow.style.opacity = eyebrowP;
          servicesEyebrow.style.transform = `translateY(${10 - (eyebrowP * 10)}px)`;
        }
      }

      // 2. STICKY CONTENT TRACK
      const rect = servicesScrollArea.getBoundingClientRect();
      const scrollInArea = -rect.top;

      if (scrollInArea < 0) {
        // Explicitly reset to service #1 so no stale state bleeds in
        if (servicesTrack) servicesTrack.style.transform = 'translateY(0)';
        if (servicesNumInner) servicesNumInner.style.transform = 'translateY(0)';
        return;
      }

      const maxOffset = (numServices - 1) * cachedVH;
      const trackOffset = Math.min(scrollInArea, maxOffset);

      if (servicesTrack) {
        servicesTrack.style.transform = `translateY(-${trackOffset}px)`;
      }

      // Drive slot number continuously with scroll (like a reel)
      if (servicesNumInner && slotHeight > 0) {
        const slotOffset = Math.min(
          (scrollInArea / cachedVH) * slotHeight,
          (numServices - 1) * slotHeight
        );
        servicesNumInner.style.transform = `translateY(-${slotOffset}px)`;
      }
    }

    window.addEventListener('scroll', updateServices, { passive: true });
    window.addEventListener('resize', () => {
      cachedVH = window.innerHeight;
      servicesScrollArea.style.height = `${numServices * cachedVH}px`;
      syncPanelHeights();
      initSlotHeight();
      updateServices();
    });

    setTimeout(() => { initSlotHeight(); updateServices(); }, 120);
  }

  // ── CASES PARALLAX + CIRCLE + PROCESS ANIMATION ───────
  const casesScrollContainer = document.getElementById('casesScrollContainer');
  const casesEyebrow         = document.getElementById('casesEyebrow');
  const caseFloats           = document.querySelectorAll('.case-float');
  const fixedCircle          = document.getElementById('fixedCircle');
  const processSection       = document.getElementById('processSection');
  const dorkoText            = document.getElementById('dorkoText');
  const padelText            = document.getElementById('padelText');
  const portaText            = document.getElementById('portaText');
  const patriaText           = document.getElementById('patriaText');
  const procBg1              = document.getElementById('procBg1');
  const procBg2              = document.getElementById('procBg2');

  const PURPLE = '#8B5CF6';
  const PINK   = '#EC4899';
  const CIRCLE_FINAL = 150;

  // Ease-in-out helper
  function eio(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }
  // Ease-out cubic
  function eoc(t) { return 1 - Math.pow(1-t, 3); }
  // Clamp 0-1
  function sub(progress, from, to) {
    return Math.min(Math.max((progress - from) / (to - from), 0), 1);
  }

  function setCircle(top, size, color, spin, opacity) {
    if (!fixedCircle) return;
    // Transform-only animation — no left/top/width/height changes.
    // Translate moves the 100px element so its center sits at (cx, top),
    // then scale grows it to the target size. GPU-composited on Safari iOS.
    const BASE = 100; // matches CSS width/height in px
    const cx   = window.innerWidth / 2;
    const tx   = cx - BASE / 2;
    const ty   = top - BASE / 2;
    const sc   = size / BASE;
    const t    = `translate(${tx}px,${ty}px) scale(${sc}) rotate(${spin}deg)`;
    fixedCircle.style.opacity    = String(opacity);
    fixedCircle.style.background = color;
    fixedCircle.style.transform  = t;
    fixedCircle.style.webkitTransform = t;
  }

  const isMobileProc  = window.innerWidth <= 768;
  const circleFinal   = isMobileProc ? 130 : CIRCLE_FINAL;

  // ── updateCircle: handles cases-end peek + process entry shrink ─
  function updateCircle() {
    if (!fixedCircle || !processSection || !casesScrollContainer) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const startSize = vw * 1.15;
    const pRect = processSection.getBoundingClientRect();
    const cRect = casesScrollContainer.getBoundingClientRect();
    const maxCasesScroll = cRect.height - vh;
    const casesScrolled = -cRect.top;

    // Let updateProcessSection own everything once inside the section
    if (pRect.top <= 0) return;

    // Above the cases section entirely — ensure circle is hidden
    if (casesScrolled < 0) {
      fixedCircle.style.opacity = '0';
      return;
    }

    // Phase 1: End of cases — circle peeks from bottom
    if (casesScrolled >= 0 && casesScrolled <= maxCasesScroll) {
      const cp = casesScrolled / maxCasesScroll;
      if (cp >= 0.7) {
        const pp = (cp - 0.7) / 0.3;
        const top = vh + (startSize * 0.5) * (1 - pp);
        setCircle(top, startSize, PURPLE, 0, pp);
        // keep slide-in text offscreen
        if (dorkoText) { dorkoText.style.opacity = '0'; }
        if (padelText) { padelText.style.opacity = '0'; }
      } else {
        if (fixedCircle) fixedCircle.style.opacity = '0';
      }
      return;
    }

    // Phase 2: Process section entering screen — circle shrinks, DRK+PADEL slide in
    if (pRect.top > 0 && pRect.top <= vh) {
      const pp = 1 - (pRect.top / vh); // 0→1
      const e = eio(pp);
      const size = startSize - (startSize - circleFinal) * e;
      const top  = vh - (vh * 0.5 * e);
      setCircle(top, size, PURPLE, 0, 1);

      // Text slides in from outside, fades in
      const tOffset = (1 - e) * (isMobileProc ? 15 : 40); // vw — less travel on mobile
      if (dorkoText) {
        dorkoText.style.opacity   = String(e);
        dorkoText.style.transform = `translateX(${tOffset}vw) translateY(-50%)`;
      }
      if (padelText) {
        padelText.style.opacity   = String(e);
        padelText.style.transform = `translateX(-${tOffset}vw) translateY(-50%)`;
      }
      // Hide slide 2 text
      if (portaText) portaText.style.opacity = '0';
      if (patriaText) patriaText.style.opacity = '0';
    }
  }

  // ── updateProcessSection: 4-phase internal scroll ─────────────
  function updateProcessSection() {
    if (!processSection) return;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const pRect = processSection.getBoundingClientRect();

    if (pRect.top > 0) return; // not yet

    const scrolled = -pRect.top;
    const max = processSection.offsetHeight - vh;
    
    // Check if we've scrolled completely past the section
    const isPast = scrolled > max;
    const prog = Math.min(Math.max(scrolled / max, 0), 1);

    const circleCenter = vh * 0.5;
    const infoCard1 = document.getElementById('infoCard1');
    const infoCard2 = document.getElementById('infoCard2');

    // ── Phase A (0 → 0.25): DRK/PADEL converge into circle, Card 1 slides up ─
    if (prog <= 0.25) {
      const p = eoc(sub(prog, 0, 0.25));
      const offset = isMobileProc
        ? (1 - p) * 110 + 80 * p  // mobile: 110px → 80px
        : (1 - p) * 125 + 75 * p; // desktop: 125px → 75px
      const tOpacity = 1 - p;
      if (dorkoText) {
        dorkoText.style.opacity   = String(tOpacity);
        dorkoText.style.transform = `translateY(-50%)`;
        dorkoText.style.right     = `calc(50% + ${offset}px)`;
      }
      if (padelText) {
        padelText.style.opacity   = String(tOpacity);
        padelText.style.transform = `translateY(-50%)`;
        padelText.style.left      = `calc(50% + ${offset}px)`;
      }
      if (portaText) portaText.style.opacity = '0';
      if (patriaText) patriaText.style.opacity = '0';
      if (procBg1) procBg1.style.opacity = '1';
      if (procBg2) procBg2.style.opacity = '0';
      
      if (infoCard1) {
        infoCard1.style.opacity = String(p);
        infoCard1.style.transform = `translateX(-50%) translateY(${(1 - p) * 50}px)`;
      }
      if (infoCard2) infoCard2.style.opacity = '0';

      setCircle(circleCenter, circleFinal, PURPLE, 0, 1);
    }
    // ── Phase B (0.25 → 0.50): Circle spins + exits downward, bg crossfades, Card 1 exits ─
    else if (prog <= 0.5) {
      const p = eio(sub(prog, 0.25, 0.50));
      const spin = p * 360;
      const exitY = p * vh;
      setCircle(circleCenter + exitY, circleFinal, PURPLE, spin, 1 - p * 0.3);
      if (dorkoText) dorkoText.style.opacity = '0';
      if (padelText) padelText.style.opacity = '0';
      if (portaText) portaText.style.opacity = '0';
      if (patriaText) patriaText.style.opacity = '0';
      if (procBg1) procBg1.style.opacity = String(1 - p);
      if (procBg2) procBg2.style.opacity = String(p);
      
      if (infoCard1) {
        infoCard1.style.opacity = String(1 - p);
        infoCard1.style.transform = `translateX(-50%) translateY(${p * 50}px)`;
      }
      if (infoCard2) infoCard2.style.opacity = '0';
    }
    // ── Phase C (0.50 → 0.70): Pink circle enters from top, spinning ─
    else if (prog <= 0.7) {
      const p = eio(sub(prog, 0.5, 0.70));
      const spin = (1 - p) * -360;
      const entryY = (1 - p) * -vh;
      setCircle(circleCenter + entryY, circleFinal, PINK, spin, 1);
      if (dorkoText) dorkoText.style.opacity = '0';
      if (padelText) padelText.style.opacity = '0';
      if (portaText) portaText.style.opacity = '0';
      if (patriaText) patriaText.style.opacity = '0';
      if (procBg1) procBg1.style.opacity = '0';
      if (procBg2) procBg2.style.opacity = '1';
      
      if (infoCard1) infoCard1.style.opacity = '0';
      if (infoCard2) infoCard2.style.opacity = '0';
    }
    // ── Phase D (0.70 → 1.0): PORTA + PATRIA slide out from circle, Card 2 slides up ─
    else {
      const p = eoc(sub(prog, 0.70, 1.0));
      const offset = isMobileProc
        ? p * 25 + 80   // mobile: 80px → 105px
        : p * 125 + 75; // desktop: 75px → 200px
      
      let finalTop = circleCenter;
      if (isPast) {
        // Scroll the pink circle up with the rest of the page
        finalTop -= (scrolled - max);
      }
      
      setCircle(finalTop, circleFinal, PINK, 0, 1);
      
      if (dorkoText) dorkoText.style.opacity = '0';
      if (padelText) padelText.style.opacity = '0';
      if (portaText) {
        portaText.style.opacity   = String(p);
        portaText.style.right     = `calc(50% + ${offset}px)`;
        portaText.style.transform = `translateY(-50%)`;
      }
      if (patriaText) {
        patriaText.style.opacity  = String(p);
        patriaText.style.left     = `calc(50% + ${offset}px)`;
        patriaText.style.transform = `translateY(-50%)`;
      }
      if (procBg1) procBg1.style.opacity = '0';
      if (procBg2) procBg2.style.opacity = '1';

      if (infoCard1) infoCard1.style.opacity = '0';
      if (infoCard2) {
        infoCard2.style.opacity = String(p);
        infoCard2.style.transform = `translateX(-50%) translateY(${(1 - p) * 50}px)`;
      }
    }
  }

  if (casesScrollContainer) {
    function updateCasesParallax() {
      const rect = casesScrollContainer.getBoundingClientRect();
      const maxScroll = rect.height - window.innerHeight;
      const scrollInArea = -rect.top;

      if (scrollInArea < -window.innerHeight || scrollInArea > maxScroll + window.innerHeight) {
        return;
      }

      const progress = Math.min(Math.max(scrollInArea / maxScroll, 0), 1);

      if (casesEyebrow) {
        casesEyebrow.style.transform = `translateY(${-(progress * 250)}px)`;
        casesEyebrow.style.opacity   = Math.max(1 - (progress * 3), 0);
      }

      const cardConfigs = [
        [0.00, 0.20, 100],
        [0.05, 0.25, 80],
        [0.10, 0.30, 160],
        [0.15, 0.35, 140],
        [0.20, 0.40, 150],
        [0.25, 0.45, 220],
      ];

      caseFloats.forEach((floatEl, i) => {
        const [eStart, eEnd, pSpeed] = cardConfigs[i] || [0, 0.3, 120];
        const entryProg  = Math.min(Math.max((progress - eStart) / (eEnd - eStart), 0), 1);
        const easedEntry = 1 - Math.pow(1 - entryProg, 3);
        const entryY     = (1 - easedEntry) * 120;
        const parallaxY  = Math.max(0, progress - eStart) * pSpeed;
        floatEl.style.opacity   = easedEntry;
        floatEl.style.transform = `translateY(${entryY - parallaxY}px)`;
      });
    }

    function onScroll() {
      updateCasesParallax();
      updateCircle();
      updateProcessSection();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    function onScroll2() { updateCircle(); updateProcessSection(); }
    window.addEventListener('scroll', onScroll2, { passive: true });
    onScroll2();
  }

});
