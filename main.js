// Shared interactions: mobile menu, reveal effects, card tilt, and scroll progress.

/**
 * Returns the normalized scroll position used by the indicator and Footer logo.
 * Keeping this calculation in one place prevents visual state drift at the end
 * of the custom scroller, where fractional pixels and scroll-snap can differ.
 */
function getScrollMetrics(scrollContainer) {
  const isWindowScroller = scrollContainer === window;
  const scrollHeight = isWindowScroller
    ? document.documentElement.scrollHeight
    : scrollContainer.scrollHeight;
  const viewportHeight = isWindowScroller
    ? window.innerHeight
    : scrollContainer.clientHeight;
  const scrollTop = isWindowScroller ? window.scrollY : scrollContainer.scrollTop;
  const maxScroll = Math.max(1, scrollHeight - viewportHeight);
  const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
  return {
    maxScroll,
    percentage: Math.round(ratio * 100),
    ratio
  };
}

/**
 * Initializes navigation, page-level interactions, and the shared scroll systems.
 */
function init() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  initScrollIndicator();
  initFooterLogoTransition();
  initIntroBackground();
  initCtaAnimation();
  initFooterBackgroundAnimation();
  // The Labs trigger uses the custom scroller proxy configured above.
  initLabsTimeline();

  let previouslyFocused = null;
  let trapKeydown = null;

  if (!menuToggle || !mobileMenu) {
    initRevealAndTilt();
    return;
  }

  menuToggle.setAttribute('aria-controls', 'mobile-menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  // Opens the accessible mobile dialog and traps keyboard focus inside it.
  function openMenu() {
    previouslyFocused = document.activeElement;
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    document.querySelector('.scroll-container')?.classList.add('menu-scroll-locked');
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('role', 'dialog');
    mobileMenu.setAttribute('aria-modal', 'true');

    const closeButton = document.getElementById('mobile-close');
    const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(mobileMenu.querySelectorAll(focusableSelector))
      .filter((element) => element.offsetParent !== null);

    if (closeButton) {
      closeButton.focus();
    } else if (focusableElements.length) {
      focusableElements[0].focus();
    }

    trapKeydown = (event) => {
      if (event.key !== 'Tab') return;

      const currentFocusable = Array.from(mobileMenu.querySelectorAll(focusableSelector))
        .filter((element) => element.offsetParent !== null);
      if (!currentFocusable.length) {
        event.preventDefault();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === mobileMenu)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    mobileMenu.addEventListener('keydown', trapKeydown);
  }

  // Closes the mobile dialog, removes the focus trap, and restores focus.
  function closeMenu() {
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    document.querySelector('.scroll-container')?.classList.remove('menu-scroll-locked');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.removeAttribute('role');
    mobileMenu.removeAttribute('aria-modal');

    if (trapKeydown) {
      mobileMenu.removeEventListener('keydown', trapKeydown);
      trapKeydown = null;
    }

    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    } else {
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener('click', (event) => {
    event.preventDefault();
    if (!mobileMenu.classList.contains('active')) {
      openMenu();
    } else {
      document.getElementById('mobile-close')?.focus();
    }
  });

  mobileClose?.addEventListener('click', (event) => {
    event.preventDefault();
    closeMenu();
  });

  mobileMenu.addEventListener('click', (event) => {
    if (event.target === mobileMenu) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.classList.contains('active')) closeMenu();
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      closeMenu();
    });
  });

  const previewImage = mobileMenu.querySelector('.preview-img');
  const previewIndex = mobileMenu.querySelector('.preview-index');
  const previewLinks = mobileMenu.querySelectorAll('.menu-navigation-grid nav:first-of-type .menu-link[data-preview]');
  previewLinks.forEach((link) => {
    const updatePreview = () => {
      if (!previewImage) return;
      const source = link.getAttribute('data-preview');
      if (!source || previewImage.getAttribute('src') === source) return;
      previewImage.style.opacity = '0';
      previewImage.style.transform = 'scale(1.06)';
      window.setTimeout(() => {
        previewImage.setAttribute('src', source);
        previewImage.style.opacity = '1';
        previewImage.style.transform = 'scale(1.02)';
      }, 180);
      if (previewIndex) {
        const number = link.querySelector('.menu-link-number')?.textContent?.replace(/\D/g, '') || '01';
        previewIndex.textContent = `${number.padStart(2, '0')} / 04`;
      }
    };
    link.addEventListener('mouseenter', updatePreview);
    link.addEventListener('focus', updatePreview);
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const mainLinks = mobileMenu.querySelectorAll('.menu-navigation-grid nav:first-of-type .menu-link');
  mainLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const isCurrentPage = href === currentPage || (href === 'index.html' && currentPage === '');
    link.classList.toggle('active-link', isCurrentPage);
    if (isCurrentPage) {
      link.dataset.currentHref = href;
      link.removeAttribute('href');
      link.setAttribute('aria-current', 'page');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
    } else {
      const originalHref = link.dataset.currentHref;
      if (originalHref) {
        link.setAttribute('href', originalHref);
        delete link.dataset.currentHref;
      }
      link.removeAttribute('aria-current');
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
    }
  });

  initRevealAndTilt();
}

function initCtaAnimation() {
  const cta = document.querySelector('.cta-section');
  const building = cta?.querySelector('.cta-building-img');
  const scrollContainer = document.querySelector('.scroll-container');

  if (!cta || !building || !scrollContainer || !window.gsap || !window.ScrollTrigger) return;

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.set(building, { yPercent: 100 });

  const timeline = window.gsap.timeline({
    scrollTrigger: {
      trigger: cta,
      scroller: scrollContainer,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  timeline
    .to(building, { yPercent: 0, ease: 'none', duration: 1 }, 0);
}

/**
 * Fades the Footer image into view as the Footer approaches the viewport.
 */
function initFooterBackgroundAnimation() {
  const footer = document.querySelector('footer');
  const background = footer?.querySelector('.footer-bg-image');
  const scrollContainer = document.querySelector('.scroll-container');

  if (!footer || !background || !scrollContainer || !window.gsap || !window.ScrollTrigger) return;

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.set(background, { opacity: 0.18 });

  window.gsap.to(background, {
    opacity: 1,
    ease: 'power1.out',
    scrollTrigger: {
      trigger: footer,
      scroller: scrollContainer,
      start: 'top 85%',
      end: 'top 35%',
      scrub: 0.8,
      invalidateOnRefresh: true
    }
  });
}

/**
 * Expands the Labs card while the sticky Labs track is scrubbed by scrolling.
 */
function initLabsTimeline() {
  const labs = document.getElementById('labs');
  const track = labs?.querySelector('.labs-scroll-track');
  const card = labs?.querySelector('.labs-card');
  const content = labs?.querySelector('.labs-content');
  const scrollContainer = document.querySelector('.scroll-container');

  if (!labs || !track || !card || !content || !scrollContainer || !window.gsap || !window.ScrollTrigger) return;

  window.gsap.registerPlugin(window.ScrollTrigger);
  const timeline = window.gsap.timeline({
    scrollTrigger: {
      trigger: track,
      scroller: scrollContainer,
      start: 'top top',
      end: () => `+=${Math.round(scrollContainer.clientHeight * 2)}`,
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  timeline
    .to(card, {
      width: () => `${scrollContainer.clientWidth}px`,
      height: () => `${scrollContainer.clientHeight}px`,
      borderWidth: 0,
      duration: 1,
      ease: 'none'
    }, 0)
    .to({}, { duration: 1, ease: 'none' }, 1);

  window.ScrollTrigger.refresh();
  const refreshLabs = () => window.ScrollTrigger.refresh();
  window.addEventListener('resize', refreshLabs, { passive: true });
  labs._labsTimelineCleanup = () => {
    window.removeEventListener('resize', refreshLabs);
    timeline.kill();
  };
}

/**
 * Builds the starfield, configures the custom scroller proxy, and binds the
 * scrubbed background transitions for Hero, Intro, and Services.
 */
function initIntroBackground() {
  const background = document.getElementById('intro-background');
  const starCanvas = document.getElementById('starfield');
  const scrollContainer = document.querySelector('.scroll-container');
  const hero = document.querySelector('#hero');
  const manifesto = document.querySelector('#manifesto');
  const introFull2 = document.querySelector('#intro-full-2');
  const introFull3 = document.querySelector('#intro-full-3');
  const nextSection = document.querySelector('#solutions');
  const servicesCurtain = document.querySelector('.services-curtain');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!background || !starCanvas || !scrollContainer || !hero || !manifesto || !introFull2 || !introFull3 || !nextSection || !servicesCurtain || !window.gsap || !window.ScrollTrigger) return;

  // The canvas is decorative only; reduced-motion users keep a static starfield.
  const context = starCanvas.getContext('2d');
  const stars = [];
  // Resizes the canvas for the current viewport and regenerates its stars.
  const resizeStars = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    starCanvas.width = Math.floor(width * ratio);
    starCanvas.height = Math.floor(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    stars.length = 0;
    const count = Math.max(70, Math.min(150, Math.floor((width * height) / 14000)));
    for (let index = 0; index < count; index += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.35 + 0.35,
        alpha: Math.random() * 0.45 + 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0008 + 0.0002
      });
    }
  };

  // Draws the stars and applies a subtle twinkle when motion is allowed.
  const drawStars = (time = 0) => {
    if (!context) return;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach((star) => {
      const twinkle = 0.72 + Math.sin(time * star.speed + star.phase) * 0.28;
      context.beginPath();
      context.shadowBlur = star.radius > 1 ? 4 : 2;
      context.shadowColor = 'rgba(255, 255, 255, 0.8)';
      context.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.shadowBlur = 0;
    if (!prefersReducedMotion) window.requestAnimationFrame(drawStars);
  };

  resizeStars();
  drawStars();
  window.addEventListener('resize', resizeStars, { passive: true });
  window.gsap.registerPlugin(window.ScrollTrigger);
  // Tell ScrollTrigger that scrolling happens inside .scroll-container, not window.
  window.ScrollTrigger.scrollerProxy(scrollContainer, {
    scrollTop(value) {
      if (arguments.length) scrollContainer.scrollTop = value;
      return scrollContainer.scrollTop;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    }
  });
  scrollContainer.addEventListener('scroll', () => window.ScrollTrigger.update(), { passive: true });

  const heroLayer = background.querySelector('.intro-bg-hero');
  const manifestoLayer = background.querySelector('.intro-bg-manifesto');
  const introFull2Layer = background.querySelector('.intro-bg-full-2');
  const introFull3Layer = background.querySelector('.intro-bg-full-3');
  if (!heroLayer || !manifestoLayer || !introFull2Layer || !introFull3Layer) return;

  background.classList.add('is-active');
  window.gsap.set([heroLayer, manifestoLayer, introFull2Layer, introFull3Layer], { opacity: 0, scale: 1 });
  window.gsap.set(heroLayer, { opacity: 1 });

  // Hero -> Manifesto: zoom backg1, then crossfade into backg2.
  const transition = window.gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      scroller: scrollContainer,
      start: 'top top',
      end: () => `+=${hero.offsetHeight}`,
      scrub: 1,
      invalidateOnRefresh: true,
      onEnterBack: () => background.classList.add('is-active')
    }
  });

  transition.to(heroLayer, { scale: 1.25, duration: 1, ease: 'none' }, 0);
  transition.to(heroLayer, { opacity: 0, duration: 0.4, ease: 'none' }, 0.6);
  transition.to(manifestoLayer, { opacity: 1, duration: 0.4, ease: 'none' }, 0.6);
  transition.to(manifestoLayer, { scale: 1.25, duration: 0.4, ease: 'none' }, 0.6);

  // Manifesto -> Intro 2: crossfade backg2 into backg3 and continue the zoom.
  const manifestoTransition = window.gsap.timeline({
    scrollTrigger: {
      trigger: manifesto,
      scroller: scrollContainer,
      start: 'top top',
      end: () => `+=${manifesto.offsetHeight}`,
      scrub: 1,
      invalidateOnRefresh: true
    }
  });

  manifestoTransition.to(manifestoLayer, { opacity: 0, duration: 0.4, ease: 'none' }, 0.6);
  manifestoTransition.to(introFull2Layer, { opacity: 1, duration: 0.4, ease: 'none' }, 0.6);
  manifestoTransition.to(introFull2Layer, { scale: 1.25, duration: 0.4, ease: 'none' }, 0.6);

  // Intro 2 -> Intro 3: crossfade backg3 into backg4 and continue the zoom.
  const introFull2Transition = window.gsap.timeline({
    scrollTrigger: {
      trigger: introFull2,
      scroller: scrollContainer,
      start: 'top top',
      end: () => `+=${introFull2.offsetHeight}`,
      scrub: 1,
      invalidateOnRefresh: true
    }
  });

  introFull2Transition.to(introFull2Layer, { opacity: 0, duration: 0.4, ease: 'none' }, 0.6);
  introFull2Transition.to(introFull3Layer, { opacity: 1, duration: 0.4, ease: 'none' }, 0.6);
  introFull2Transition.to(introFull3Layer, { scale: 1.25, duration: 0.4, ease: 'none' }, 0.6);

  // The curved curtain rises during the approach to Services and masks the previous scene.
  window.gsap.set(servicesCurtain, { yPercent: 100, scaleY: 1.08 });
  window.gsap.timeline({
    scrollTrigger: {
      trigger: nextSection,
      scroller: scrollContainer,
      start: 'top bottom',
      end: 'top top',
      scrub: 1,
      invalidateOnRefresh: true
    }
  }).to(servicesCurtain, { yPercent: 0, scaleY: 1, ease: 'none' });

  window.ScrollTrigger.create({
    trigger: nextSection,
    scroller: scrollContainer,
    start: 'top top',
    onEnter: () => background.classList.remove('is-active'),
    onLeaveBack: () => background.classList.add('is-active')
  });

  window.ScrollTrigger.refresh();
}

/**
 * Reveals content, fits oversized typography, activates Services items, and
 * applies the shared pointer tilt/reflection interaction to cards.
 */
function initRevealAndTilt() {
  // Adds the active class once content enters the viewport.
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  const serviceItems = document.querySelectorAll('.service-item');
  // Fits each Hero line to its available width without changing its font size.
  const fitHeroTitle = () => {
    const hero = document.querySelector('.hero-title');
    if (!hero) return;

    const parent = hero.parentElement;
    if (!parent) return;

    hero.querySelectorAll('span').forEach((line) => {
      line.style.setProperty('--hero-line-scale-x', '1');
      line.style.width = 'max-content';
      const availableWidth = parent.clientWidth;
      // scrollWidth measures the untransformed line, even while the previous
      // scaleX transition is still settling after a language change.
      const requiredWidth = line.scrollWidth;
      const scale = requiredWidth ? Math.min(1, availableWidth / requiredWidth) : 1;
      line.style.setProperty('--hero-line-scale-x', scale.toFixed(4));
    });
  };

  let heroFitFrame = 0;
  const scheduleHeroLayoutRefresh = () => {
    window.cancelAnimationFrame(heroFitFrame);
    heroFitFrame = window.requestAnimationFrame(fitHeroTitle);
  };

  scheduleHeroLayoutRefresh();
  window.addEventListener('resize', scheduleHeroLayoutRefresh, { passive: true });
  window.addEventListener('load', scheduleHeroLayoutRefresh, { once: true });
  window.addEventListener('language:changed', scheduleHeroLayoutRefresh);
  document.fonts?.ready.then(scheduleHeroLayoutRefresh);

  // Fits Services headings to their row while preserving the oversized display style.
  const fitServiceTitles = () => {
    document.querySelectorAll('.service-title').forEach((title) => {
      const parent = title.parentElement;
      if (!parent) return;

      title.style.width = 'max-content';
      title.style.setProperty('--title-scale-x', '1');
      const leftInset = parseFloat(window.getComputedStyle(parent).paddingLeft) || 0;
      const availableWidth = Math.max(0, parent.clientWidth - leftInset - 30);
      // scrollWidth is the untransformed layout width, so CSS transitions cannot
      // feed a stale scaled value back into the next measurement.
      const requiredWidth = title.scrollWidth;
      const scale = requiredWidth ? Math.min(1, availableWidth / requiredWidth) : 1;
      title.style.setProperty('--title-scale-x', scale.toFixed(4));
    });
  };

  let serviceFitFrame = 0;
  const scheduleServiceLayoutRefresh = () => {
    window.cancelAnimationFrame(serviceFitFrame);
    serviceFitFrame = window.requestAnimationFrame(() => {
      fitServiceTitles();
      window.ScrollTrigger?.refresh();
    });
  };

  scheduleServiceLayoutRefresh();
  window.addEventListener('resize', scheduleServiceLayoutRefresh, { passive: true });
  window.addEventListener('load', scheduleServiceLayoutRefresh, { once: true });
  window.addEventListener('services:refit', scheduleServiceLayoutRefresh);
  document.fonts?.ready.then(scheduleServiceLayoutRefresh);

  // Refit when a late-loading font or translated label changes the measured width.
  const servicesContainer = document.querySelector('.services-container');
  if (servicesContainer && 'ResizeObserver' in window) {
    const servicesResizeObserver = new ResizeObserver(scheduleServiceLayoutRefresh);
    servicesResizeObserver.observe(servicesContainer);
    document.querySelectorAll('.service-title').forEach((title) => servicesResizeObserver.observe(title));
  }

  serviceItems.forEach((item) => {
    // Makes the hovered or focused service the active item for visual emphasis.
    const activate = () => {
      serviceItems.forEach((service) => {
        const active = service === item;
        service.classList.toggle('is-active', active);
        service.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };
    item.addEventListener('mouseenter', activate);
    item.addEventListener('focus', activate);
    item.addEventListener('click', activate);
  });

  document.querySelectorAll('.bento-card, .project-card, .intro-gradient-panel, .contact-scheduler').forEach((card) => {
    // Updates the shared CSS variables that drive pointer tilt and reflection.
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const intensity = card.classList.contains('intro-gradient-panel') ? 12 : 20;

      card.style.setProperty('--rotY', `${(x - rect.width / 2) / intensity}deg`);
      card.style.setProperty('--rotX', `${-(y - rect.height / 2) / intensity}deg`);
      card.style.setProperty('--scale', '1.02');
      card.style.setProperty('--lift', '-4px');
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
      card.style.setProperty('--refl', card.classList.contains('intro-gradient-panel') ? '0.5' : '0.9');
    });

    // Restores the card to its neutral state when the pointer leaves.
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rotY', '0deg');
      card.style.setProperty('--rotX', '0deg');
      card.style.setProperty('--scale', '1');
      card.style.setProperty('--lift', '0px');
      card.style.setProperty('--refl', '0.12');
    });
  });
}

/**
 * Updates the fixed scroll control and returns the user to the top at the end.
 */
function initScrollIndicator() {
  const scrollContainer = document.querySelector('.scroll-container');
  const indicator = document.getElementById('scroll-indicator');
  const actionLabel = document.getElementById('scroll-action-label');
  const actionIcon = document.getElementById('scroll-action-icon');
  const progress = document.getElementById('scroll-progress');
  if (!scrollContainer || !indicator || !actionLabel || !actionIcon || !progress) return;

  const updateIndicator = () => {
    const { percentage } = getScrollMetrics(scrollContainer);
    const atEnd = percentage >= 100;
    progress.textContent = `${percentage}%`;
    actionLabel.textContent = atEnd ? 'To top' : 'Scroll';
    indicator.setAttribute('aria-label', atEnd ? 'Return to top' : 'Scroll down');
    actionIcon.classList.toggle('animate-bounce', !atEnd);
    actionIcon.classList.toggle('rotate-180', atEnd);
  };

  scrollContainer.addEventListener('scroll', updateIndicator, { passive: true });
  indicator.addEventListener('click', () => {
    if (scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight - 1) return;
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  });
  updateIndicator();
}

/**
 * Crossfades the fixed navigation logo with the logo rendered inside the Footer.
 */
function initFooterLogoTransition() {
  const siteBrand = document.getElementById('site-brand');
  const footerLogoTarget = document.getElementById('footer-logo-target');
  const scrollContainer = document.querySelector('.scroll-container') || window;
  if (!siteBrand || !footerLogoTarget) return;

  const footerLogoLink = footerLogoTarget.querySelector('a');
  footerLogoLink?.addEventListener('click', (event) => {
    event.preventDefault();
    if (scrollContainer === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const updateLogoVisibility = () => {
    const { maxScroll, ratio } = getScrollMetrics(scrollContainer);
    const scrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
    const isFooterVisible =
      scrollTop >= maxScroll - 4 || ratio >= 0.995;

    if (!isFooterVisible) {
      siteBrand.classList.remove('footer-logo-fade-out');
      footerLogoTarget.classList.remove('footer-logo-fade-in');
      return;
    }

    siteBrand.classList.add('footer-logo-fade-out');
    footerLogoTarget.classList.add('footer-logo-fade-in');
  };

  scrollContainer.addEventListener('scroll', updateLogoVisibility, { passive: true });
  window.addEventListener('resize', updateLogoVisibility);
  if (scrollContainer !== window) {
    const resizeObserver = new ResizeObserver(updateLogoVisibility);
    resizeObserver.observe(scrollContainer);
    resizeObserver.observe(document.body);
  }
  updateLogoVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
