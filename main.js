// Shared interactions: mobile menu, reveal effects, card tilt, and scroll progress.
function init() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  initScrollIndicator();
  initFooterLogoTransition();
  initIntroBackground();

  let previouslyFocused = null;
  let trapKeydown = null;

  if (!menuToggle || !mobileMenu) {
    initRevealAndTilt();
    return;
  }

  menuToggle.setAttribute('aria-controls', 'mobile-menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  function openMenu() {
    previouslyFocused = document.activeElement;
    mobileMenu.classList.add('active');
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

  function closeMenu() {
    mobileMenu.classList.remove('active');
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
    link.addEventListener('click', closeMenu);
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  mobileMenu.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('active-link', href === currentPage || (href === 'index.html' && currentPage === ''));
  });

  initRevealAndTilt();
}

// Builds the starfield and binds one scrubbed GSAP timeline to each Hero/Intro transition.
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

function initRevealAndTilt() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  const serviceItems = document.querySelectorAll('.service-item');
  const fitHeroTitle = () => {
    const hero = document.querySelector('.hero-title');
    if (!hero) return;

    const parent = hero.parentElement;
    if (!parent) return;

    hero.querySelectorAll('span').forEach((line) => {
      line.style.setProperty('--hero-line-scale-x', '1');
      line.style.width = 'max-content';
      const availableWidth = parent.clientWidth;
      const requiredWidth = line.getBoundingClientRect().width;
      const scale = requiredWidth ? Math.min(1, availableWidth / requiredWidth) : 1;
      line.style.setProperty('--hero-line-scale-x', scale.toFixed(4));
    });
  };

  fitHeroTitle();
  window.addEventListener('resize', fitHeroTitle, { passive: true });
  document.fonts?.ready.then(fitHeroTitle);

  const fitServiceTitles = () => {
    document.querySelectorAll('.service-title').forEach((title) => {
      const parent = title.parentElement;
      if (!parent) return;

      title.style.width = 'max-content';
      title.style.setProperty('--title-scale-x', '1');
      const leftInset = parseFloat(window.getComputedStyle(parent).paddingLeft) || 0;
      const availableWidth = Math.max(0, parent.clientWidth - leftInset - 30);
      const requiredWidth = title.getBoundingClientRect().width;
      const scale = requiredWidth ? Math.min(1, availableWidth / requiredWidth) : 1;
      title.style.setProperty('--title-scale-x', scale.toFixed(4));
    });
  };

  fitServiceTitles();
  window.addEventListener('resize', fitServiceTitles, { passive: true });
  document.fonts?.ready.then(fitServiceTitles);

  serviceItems.forEach((item) => {
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

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rotY', '0deg');
      card.style.setProperty('--rotX', '0deg');
      card.style.setProperty('--scale', '1');
      card.style.setProperty('--lift', '0px');
      card.style.setProperty('--refl', '0.12');
    });
  });
}

function initScrollIndicator() {
  const scrollContainer = document.querySelector('.scroll-container');
  const indicator = document.getElementById('scroll-indicator');
  const actionLabel = document.getElementById('scroll-action-label');
  const actionIcon = document.getElementById('scroll-action-icon');
  const progress = document.getElementById('scroll-progress');
  if (!scrollContainer || !indicator || !actionLabel || !actionIcon || !progress) return;

  const updateIndicator = () => {
    const maxScroll = Math.max(1, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const percentage = Math.min(100, Math.max(0, Math.round((scrollContainer.scrollTop / maxScroll) * 100)));
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

function initFooterLogoTransition() {
  const siteBrand = document.getElementById('site-brand');
  const footerLogoTarget = document.getElementById('footer-logo-target');
  const scrollContainer = document.querySelector('.scroll-container');
  if (!siteBrand || !footerLogoTarget || !scrollContainer) return;

  const footerLogoLink = footerLogoTarget.querySelector('a');
  footerLogoLink?.addEventListener('click', (event) => {
    event.preventDefault();
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const updateLogoVisibility = () => {
    const maxScroll = Math.max(1, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const isFooterVisible = scrollContainer.scrollTop >= maxScroll - 1;

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
  updateLogoVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
