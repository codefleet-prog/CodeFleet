/**
 * CodeFleet — main.js  (full-service v3)
 * Scroll-driven intro animation + full motion design system
 *
 * Motion tokens (mirrors CSS :root):
 *   ease-out-expo:  cubic-bezier(.19, 1, .22, 1)
 *   ease-out-quart: cubic-bezier(.165, .84, .44, 1)
 *   ease-in-out-cubic: cubic-bezier(.645, .045, .355, 1)
 */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================================
     INTRO ELEMENTS
  ========================================================================= */
  const intro       = document.getElementById('intro');
  const introBg     = document.getElementById('intro-bg');
  const introTech   = document.getElementById('intro-tech');
  const introLogo   = document.getElementById('intro-logo');
  const header      = document.getElementById('header');
  const headerLogo  = header.querySelector('.logo');
  const navLinks    = document.querySelector('.nav-links');
  const heroContent = document.getElementById('hero-content');
  const heroVisual  = document.getElementById('hero-visual');
  const typedEl     = document.getElementById('typed-text');

  if (!intro) return;

  const SCROLL_DIST = window.innerHeight;
  const LOGO_WORD   = 'CODEFLEET';

  /* =========================================================================
     1. FLIP position data
  ========================================================================= */
  let techDx = 0, techDy = 0, techScale = 1;
  let logoDx = 0, logoDy = 0;

  function measurePositions() {
    // Source: where introTech actually sits in the intro overlay (measured directly)
    const tRect = introTech.getBoundingClientRect();
    const tCx   = tRect.left + tRect.width  / 2;
    const tCy   = tRect.top  + tRect.height / 2;

    // Target depends on breakpoint:
    // Desktop (>1024px) → fly to hero-visual (right column spacer)
    // Mobile  (≤1024px) → stay roughly centered, just scale down, fade handled in applyTransition
    if (window.innerWidth > 1024) {
      const hvRect = heroVisual.getBoundingClientRect();
      const hvCx   = hvRect.width  > 0 ? hvRect.left + hvRect.width  / 2 : window.innerWidth  * 0.75;
      const hvCy   = hvRect.height > 0 ? hvRect.top  + hvRect.height / 2 : window.innerHeight * 0.5;
      techDx    = hvCx - tCx;
      techDy    = hvCy - tCy;
      techScale = hvRect.width > 0 ? hvRect.width / tRect.width : 1;
    } else {
      // Mobile: blob stays centered (dx=0, dy=0), shrinks to 80% — then fades out in applyTransition
      techDx    = 0;
      techDy    = 0;
      techScale = 0.78;
    }

    // Intro logo is always perfectly flex-centered in its full-screen anchor.
    // Use viewport center directly — avoids any getBoundingClientRect quirks.
    const lCx = window.innerWidth  / 2;
    const lCy = window.innerHeight / 2;

    // Temporarily reveal header at its natural resting position to measure logo.
    // Use transform:'none' (not translateY(0)) so position:fixed computes correctly.
    const savedOpacity    = header.style.opacity;
    const savedTransform  = header.style.transform;
    const savedTransition = header.style.transition;
    const savedVisibility = header.style.visibility;
    header.style.transition = 'none';
    header.style.opacity    = '1';
    header.style.transform  = 'none';
    header.style.visibility = 'visible';
    void header.offsetHeight; // synchronous layout flush

    const hlRect = headerLogo.getBoundingClientRect();
    const hlCx   = hlRect.left + hlRect.width  / 2;
    const hlCy   = hlRect.top  + hlRect.height / 2;

    header.style.transition = savedTransition;
    header.style.opacity    = savedOpacity;
    header.style.transform  = savedTransform;
    header.style.visibility = savedVisibility;

    logoDx = hlCx - lCx;
    logoDy = hlCy - lCy;

    headerLogo.style.opacity = '0';
  }

  // Initial measure: wait for fonts + layout to settle
  setTimeout(measurePositions, 300);

  // Re-measure on first scroll (before animation has progressed) as a safety net
  let firstScrollMeasured = false;
  window.addEventListener('scroll', () => {
    if (!firstScrollMeasured && window.scrollY < SCROLL_DIST * 0.05) {
      firstScrollMeasured = true;
      measurePositions();
    }
  }, { passive: true, once: false });

  window.addEventListener('resize', () => {
    if (window.scrollY < 10) measurePositions();
  });

  /* =========================================================================
     2. LOOPING TYPEWRITER
  ========================================================================= */
  let typeTimer  = null;
  let loopActive = true;
  let charIndex  = 0;
  let erasing    = false;

  function typeTick() {
    if (!loopActive) { typedEl.textContent = LOGO_WORD; return; }
    if (!erasing) {
      if (charIndex < LOGO_WORD.length) {
        typedEl.textContent = LOGO_WORD.slice(0, ++charIndex);
        typeTimer = setTimeout(typeTick, 130);
      } else {
        typeTimer = setTimeout(() => { erasing = true; typeTick(); }, 1600);
      }
    } else {
      if (charIndex > 0) {
        typedEl.textContent = LOGO_WORD.slice(0, --charIndex);
        typeTimer = setTimeout(typeTick, 70);
      } else {
        typeTimer = setTimeout(() => { erasing = false; typeTick(); }, 500);
      }
    }
  }

  function stopLoop() {
    loopActive = false;
    clearTimeout(typeTimer);
    typedEl.textContent = LOGO_WORD;
  }

  typeTimer = setTimeout(typeTick, 500);

  /* =========================================================================
     3. SCROLL ANIMATION ENGINE
  ========================================================================= */
  let targetProgress  = 0;
  let currentProgress = 0;
  let transitionDone  = false;

  function easeOutCubic(t)   { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
  function remap(v, inMin, inMax) {
    return easeOutCubic(Math.max(0, Math.min((v - inMin) / (inMax - inMin), 1)));
  }

  window.addEventListener('scroll', () => {
    targetProgress = Math.min(window.scrollY / SCROLL_DIST, 1);
    if (targetProgress > 0.05 && loopActive) stopLoop();
  }, { passive: true });

  function applyTransition(p) {
    const ep = Math.min(p, 1);

    introBg.style.opacity = 1 - easeInOutCubic(ep);

    const techEp = easeInOutCubic(ep);
    const tx = techDx * techEp;
    const ty = techDy * techEp;
    const ts = 1 + (techScale - 1) * techEp;
    introTech.style.transform = `translate(${tx}px, ${ty}px) scale(${ts})`;

    // On mobile: slowly dissolve the tech blob into the background so hero text stays readable
    if (window.innerWidth <= 1024) {
      const mFade = remap(ep, 0.45, 0.95);
      introTech.style.opacity = String(1 - mFade * 0.90); // 1 → 0.10
    } else {
      introTech.style.opacity = '';
    }

    const logoEp = remap(ep, 0, 0.82);
    introLogo.style.transform = `translate(${logoDx * logoEp}px, ${logoDy * logoEp}px)`;

    const headerLogoReveal = remap(ep, 0.75, 0.95);
    headerLogo.style.opacity = String(headerLogoReveal);

    const hdrEp = remap(ep, 0.08, 0.55);
    header.style.opacity   = String(hdrEp);
    header.style.transform = `translateY(${(1 - hdrEp) * -100}%)`;
    // Sync desktop nav with header slide-in
    if (window.innerWidth > 768 && navLinks) {
      navLinks.style.opacity      = String(hdrEp);
      navLinks.style.transform    = `translateY(${(1 - hdrEp) * -100}%)`;
      navLinks.style.pointerEvents = hdrEp > 0.8 ? 'auto' : 'none';
    }

    const hcEp = remap(ep, 0.35, 1.0);
    heroContent.style.opacity   = String(hcEp);
    heroContent.style.transform = `translateX(${(1 - hcEp) * -70}px)`;

    intro.style.pointerEvents = ep >= 0.98 ? 'none' : 'auto';

    if (ep >= 0.99 && !transitionDone) {
      transitionDone = true;
      introLogo.style.visibility = 'hidden';
      // On mobile: drop intro below hero-container (z-index 5) so faded blob sits behind text
      if (window.innerWidth <= 1024) intro.style.zIndex = '3';
    } else if (ep < 0.99 && transitionDone) {
      transitionDone = false;
      introLogo.style.visibility = '';
      intro.style.zIndex = '';
    }
  }

  function rafLoop() {
    const diff = targetProgress - currentProgress;
    currentProgress += diff * 0.07;
    if (Math.abs(diff) < 0.0003) currentProgress = targetProgress;
    applyTransition(currentProgress);
    requestAnimationFrame(rafLoop);
  }

  applyTransition(0);
  requestAnimationFrame(rafLoop);

  /* =========================================================================
     4. HEADER SCROLL EFFECT
  ========================================================================= */
  window.addEventListener('scroll', () => {
    if (currentProgress < 0.95) return;
    header.classList.toggle('scrolled', window.scrollY > 50);
    highlightNavLink();
  }, { passive: true });

  const pageSections = document.querySelectorAll('section[id]');
  function highlightNavLink() {
    const scrollY = window.pageYOffset;
    pageSections.forEach(sec => {
      const link = document.querySelector(`.nav-links a[href*=${sec.id}]`);
      if (!link) return;
      link.classList.toggle('active',
        scrollY > sec.offsetTop - 100 && scrollY <= sec.offsetTop + sec.offsetHeight - 100
      );
    });
  }

  /* =========================================================================
     5. MOBILE MENU
  ========================================================================= */
  const mobileBtn = document.querySelector('.mobile-menu-btn');

  const navCloseBtn = document.querySelector('.nav-close-btn');

  function closeMenu() {
    navLinks.classList.remove('active');
    mobileBtn.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navCloseBtn) navCloseBtn.addEventListener('click', closeMenu);

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      mobileBtn.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Close on ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) closeMenu();
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
  }

  /* =========================================================================
     6. MOTION SYSTEM — Staggered reveal IntersectionObserver
     Pattern: enter/exit, low-frequency (marketing site)
     Easing:  ease-out-expo (CSS), 600ms illustrative duration
  ========================================================================= */
  // Assign stagger delays to direct .reveal children of [data-stagger] parents
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    const gap = parseInt(parent.dataset.stagger) || 90;
    parent.querySelectorAll(':scope > .reveal').forEach((el, i) => {
      el.style.transitionDelay = `${i * gap}ms`;
    });
  });

  const revealObs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* =========================================================================
     7. COUNTER ANIMATION
     Triggered by IntersectionObserver when [data-count] enters viewport
     Easing: ease-out-cubic over 1800ms (illustrative)
  ========================================================================= */
  const counterObs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el   = entry.target;
      const raw  = el.dataset.count || '';
      const isMinus   = raw.startsWith('-');
      const isPlus    = raw.startsWith('+');
      const isPercent = raw.includes('%');
      const num    = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
      const prefix = isMinus ? '−' : isPlus ? '+' : '';
      const suffix = isPercent ? '%' : '';
      const dur    = 1800;
      const t0     = performance.now();

      function tick(now) {
        const t      = Math.min((now - t0) / dur, 1);
        const eased  = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + Math.round(eased * num) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

  /* =========================================================================
     8. ANIMATED PROGRESS BARS
     Store target widths → start at 0 → animate in on intersection
     CSS transition handles the animation (ease-out-expo, 1200ms)
  ========================================================================= */
  document.querySelectorAll('.bar-fill').forEach(el => {
    el.dataset.barTarget = el.style.width;
    el.style.width = '0%';
  });

  const barObs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      setTimeout(() => {
        entry.target.style.width = entry.target.dataset.barTarget;
      }, 250);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.bar-fill').forEach(el => barObs.observe(el));

  /* =========================================================================
     9. CURSOR GLOW — Soft pink spotlight in the hero
  ========================================================================= */
  const heroSticky = document.querySelector('.hero-sticky');
  if (heroSticky) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    heroSticky.appendChild(glow);

    let glowX   = window.innerWidth  / 2;
    let glowY   = window.innerHeight * 0.4;
    let tGlowX  = glowX;
    let tGlowY  = glowY;
    let glowRun = false;

    // Start centered
    glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%,-50%)`;

    heroSticky.addEventListener('mousemove', e => {
      const rect = heroSticky.getBoundingClientRect();
      tGlowX = e.clientX - rect.left;
      tGlowY = e.clientY - rect.top;
      if (!glowRun) { glowRun = true; animateGlow(); }
    });

    heroSticky.addEventListener('mouseleave', () => {
      tGlowX = window.innerWidth  / 2;
      tGlowY = window.innerHeight * 0.4;
    });

    function animateGlow() {
      glowX += (tGlowX - glowX) * 0.06;
      glowY += (tGlowY - glowY) * 0.06;
      glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%,-50%)`;
      if (Math.abs(tGlowX - glowX) > 0.4 || Math.abs(tGlowY - glowY) > 0.4) {
        requestAnimationFrame(animateGlow);
      } else {
        glowRun = false;
      }
    }
  }

  /* =========================================================================
     10. MAGNETIC BUTTONS — Primary CTAs subtly follow cursor
     Pattern: hover, low-frequency
     Easing: ease-out-quart for return
  ========================================================================= */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const dx   = (e.clientX - (rect.left + rect.width  / 2)) * 0.28;
      const dy   = (e.clientY - (rect.top  + rect.height / 2)) * 0.28;
      btn.style.transition = 'transform 80ms linear';
      btn.style.transform  = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 500ms cubic-bezier(.165,.84,.44,1)';
      btn.style.transform  = '';
    });
  });

  /* =========================================================================
     11. SERVICE CARD 3-D TILT
     Pattern: hover, medium-frequency, on-screen morph
     Easing: ease-in-out for natural feel
  ========================================================================= */
  document.querySelectorAll('.service-cat:not(.featured)').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (window.innerWidth < 768) return;
      const rect = card.getBoundingClientRect();
      const rx   =  ((e.clientY - rect.top  - rect.height / 2) / rect.height) * 7;
      const ry   = -((e.clientX - rect.left - rect.width  / 2) / rect.width)  * 7;
      card.style.transition = 'transform 100ms linear';
      card.style.transform  = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 500ms cubic-bezier(.165,.84,.44,1), box-shadow 300ms ease, border-color 300ms ease';
      card.style.transform  = '';
    });
  });

  /* =========================================================================
     12. MARQUEE — duplicate track content for seamless loop
  ========================================================================= */
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });

}); // DOMContentLoaded

  /* =========================================================================
     AUDIT FORM — formsubmit.co submission with UI feedback
  ========================================================================= */
  const auditForm = document.getElementById('auditForm');
  if (auditForm) {
    auditForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn  = this.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Küldés...';
      btn.disabled  = true;

      fetch(this.action, {
        method:  'POST',
        body:    new FormData(this),
        headers: { Accept: 'application/json' },
      })
      .then(r => {
        if (!r.ok) throw new Error('err');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Kérés elküldve!';
        btn.style.background = '#10b981';
        this.reset();
        setTimeout(() => {
          btn.innerHTML        = orig;
          btn.style.background = '';
          btn.disabled         = false;
        }, 3500);
      })
      .catch(() => {
        btn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Hiba történt, próbáld újra.';
        btn.style.background = '#ef4444';
        setTimeout(() => {
          btn.innerHTML        = orig;
          btn.style.background = '';
          btn.disabled         = false;
        }, 3500);
      });
    });
  }
