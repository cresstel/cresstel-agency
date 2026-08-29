// Redesigned shared JS: robust mobile menu + reveal + tilt
document.addEventListener('DOMContentLoaded', () => {
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
    menuToggle.classList.add('open');
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
    menuToggle.classList.remove('open');
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
    isActive ? closeMenu() : openMenu();
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
      document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

      // Tilt for bento-card
      document.querySelectorAll('.bento-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const dx = x - xc;
          const dy = y - yc;
          card.style.transform = `rotateY(${dx / 20}deg) rotateX(${-dy / 20}deg) scale3d(1.02, 1.02, 1.02)`;
          card.style.setProperty('--x', `${x}px`);
          card.style.setProperty('--y', `${y}px`);
        });
        card.addEventListener('mouseleave', () => card.style.transform = `rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`);
      });

      // Tilt for project-card
      document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const dx = x - xc;
          const dy = y - yc;
          card.style.transform = `rotateY(${dx / 25}deg) rotateX(${-dy / 25}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`);
      });
    } catch (err) {
      // fail gracefully
      console.warn('reveal/tilt init failed', err);
    }
  }

});