// Redesigned shared JS: robust mobile menu + reveal + tilt
function init() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  // Focus trap helpers
  let previouslyFocused = null;
  let trapKeydown = null;

  if (!menuToggle || !mobileMenu) {
    // still initialize shared observers/tilt below even if menu pieces are missing
    initRevealAndTilt();
    return;
  }

  // Accessibility
  menuToggle.setAttribute('aria-controls', 'mobile-menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  function openMenu() {
    // save previous focus to restore later
    previouslyFocused = document.activeElement;

    mobileMenu.classList.add('active');
    // Do not morph the hamburger into an X to avoid duplicate close icons — keep visual state on the explicit close button
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');

    // mark as dialog for assistive tech
    mobileMenu.setAttribute('role', 'dialog');
    mobileMenu.setAttribute('aria-modal', 'true');

    // focus the close button if present, otherwise first focusable element
    const closeBtn = document.getElementById('mobile-close');
    const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(mobileMenu.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (closeBtn) {
      closeBtn.focus();
    } else if (focusables.length) {
      focusables[0].focus();
    }

    // install focus trap on the mobileMenu
    trapKeydown = function(e) {
      if (e.key !== 'Tab') return;
      const current = Array.from(mobileMenu.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (current.length === 0) {
        e.preventDefault();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (e.shiftKey) {
        // shift+tab
        if (document.activeElement === first || document.activeElement === mobileMenu) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    mobileMenu.addEventListener('keydown', trapKeydown);
  }

  function closeMenu() {
    mobileMenu.classList.remove('active');
    // Do not morph the hamburger into an X; visual close is the #mobile-close inside the menu
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');

    // remove dialog attributes
    mobileMenu.removeAttribute('role');
    mobileMenu.removeAttribute('aria-modal');

    // remove focus trap
    if (trapKeydown) {
      mobileMenu.removeEventListener('keydown', trapKeydown);
      trapKeydown = null;
    }

    // restore focus to where it was
    try {
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      else menuToggle.focus();
    } catch (err) {
      menuToggle.focus();
    }
  }

  // Toggle
  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isActive = mobileMenu.classList.contains('active');
    if (!isActive) {
      openMenu();
    } else {
      // Menu is already open — do not close via the hamburger toggle.
      // Move keyboard focus to the in-menu close button for accessibility.
      const closeBtn = document.getElementById('mobile-close');
      if (closeBtn) closeBtn.focus();
      // Also avoid toggling the menu by accident; no further action.
    }
  });

  // Close button inside menu (explicit X)
  if (mobileClose) {
    mobileClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  // Close by clicking on the overlay background (but not on inner content)
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMenu();
  });

  // Close when any menu link is activated
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));

  // Initialize reveal and tilt behaviors
  initRevealAndTilt();

  // Helper: shared reveal + tilt initialization
  function initRevealAndTilt() {
    try {
      // Reveal
      const observerOptions = { threshold: 0.1 };
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('active');
        });
      }, observerOptions);
      const revealEls = document.querySelectorAll('.reveal');
      revealEls.forEach(el => revealObserver.observe(el));

      // Tilt for bento-card
      const bentoCards = document.querySelectorAll('.bento-card');
      let bentoAttached = 0;
      bentoCards.forEach(card => {
        if (!card) return;
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const dx = x - xc;
          const dy = y - yc;
          // debug
          // set CSS variables instead of writing transform directly so other transforms (reveal) are preserved
          card.style.setProperty('--rotY', `${dx / 20}deg`);
          card.style.setProperty('--rotX', `${-dy / 20}deg`);
          card.style.setProperty('--scale', '1.02');
          card.style.setProperty('--x', `${x}px`);
          card.style.setProperty('--y', `${y}px`);
          card.style.setProperty('--refl', '0.9');
        });
        card.addEventListener('mouseleave', () => {
          card.style.setProperty('--rotY', '0deg');
          card.style.setProperty('--rotX', '0deg');
          card.style.setProperty('--scale', '1');
          card.style.setProperty('--refl', '0.12');
        });
        bentoAttached++;
      });

      // Tilt for project-card
      const projectCards = document.querySelectorAll('.project-card');
      let projectAttached = 0;
      projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const dx = x - xc;
          const dy = y - yc;
          card.style.setProperty('--rotY', `${dx / 25}deg`);
          card.style.setProperty('--rotX', `${-dy / 25}deg`);
          card.style.setProperty('--scale', '1.02');
        });
        card.addEventListener('mouseleave', () => {
          card.style.setProperty('--rotY', '0deg');
          card.style.setProperty('--rotX', '0deg');
          card.style.setProperty('--scale', '1');
        });
        projectAttached++;
      });
    } catch (err) {
      // fail gracefully
      console.warn('reveal/tilt init failed', err);
    }
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}