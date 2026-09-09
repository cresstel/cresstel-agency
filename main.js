// Shared interactions: mobile menu, reveal effects, card tilt, and scroll progress.
function init() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  initScrollIndicator();
  initFooterLogoTransition();

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

function initRevealAndTilt() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

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
