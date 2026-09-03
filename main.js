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

  function updateCurrentMenuState() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    mobileMenu.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const isCurrentPage = href === currentPage || (href === 'index.html' && currentPage === '');
      link.classList.toggle('active-link', isCurrentPage);
    });
  }

  updateCurrentMenuState();

  // Initialize reveal and tilt behaviors
  initRevealAndTilt();
  // Initialize hero headline swap moved from inline index.html script
  // The function initHeroSwap is defined below and will guard its own initialization
  if (typeof initHeroSwap === 'function') initHeroSwap();

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

      // 3D tilt for interactive rectangular cards and panels
      const interactiveCards = document.querySelectorAll('.bento-card, .project-card, .intro-gradient-panel, .contact-scheduler');
      interactiveCards.forEach(card => {
        if (!card) return;
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const dx = x - xc;
          const dy = y - yc;
          const intensity = card.classList.contains('intro-gradient-panel') ? 12 : 20;
          const lift = -4; // subtle rise so cards feel tactile without looking exaggerated

          card.style.setProperty('--rotY', `${dx / intensity}deg`);
          card.style.setProperty('--rotX', `${-dy / intensity}deg`);
          card.style.setProperty('--scale', '1.02');
          card.style.setProperty('--lift', `${lift}px`);
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

/* Hero swap logic moved from index.html: define initHeroSwap() here */
function initHeroSwap(){
  try {
    var container = document.getElementById('hero-swap');
    if(!container) return;

    var state = 'first';
    var savedScrollY = null; // null indicates no active lock saved
    var bodyLocked = false;   // true when the body has been fixed to freeze visual scroll
    var touchStartY = null;
    var gestureAccumulator = 0;
    var WHEEL_TRIGGER = 350; /* total accumulated delta required for wheel */
    var TOUCH_TRIGGER = 220; /* accumulated touch distance */
    var IMMEDIATE_WHEEL = 120; /* single-event strong wheel delta that should trigger immediately */
    var IMMEDIATE_TOUCH = 80; /* single-move touch delta to trigger immediately */

    var wheelBuffer = 0;
    var wheelTimer = null;
    var WHEEL_FLUSH_MS = 80; /* time window to accumulate wheel events */

    // Helper: determine if user is currently within the hero area (first viewport)
    function isWithinHero(){
      try{
        // If body is locked we want handlers to remain active
        if(bodyLocked) return true;
        var docY = window.scrollY || document.documentElement.scrollTop || 0;
        // Use container.offsetHeight as hero height (the hero/fullscreen slides occupy first viewport)
        var heroHeight = container.offsetHeight || window.innerHeight;
        return docY < heroHeight; // still within hero vertical bounds
      }catch(err){
        return false;
      }
    }

    function lockBodyAtCurrentScroll(){
      // capture where the document was scrolled to and freeze visual position
      savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      bodyLocked = true;
      document.body.style.position = 'fixed';
      document.body.style.top = (-savedScrollY) + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    function unlockBodyAndRestore(){
      // only restore if a lock was actually applied; otherwise avoid jumping to 0
      if (!bodyLocked || savedScrollY === null) {
        bodyLocked = false;
        savedScrollY = null;
        // clear any styles just in case
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        return;
      }

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      // restore to the saved scroll position and clear the lock markers
      window.scrollTo({ top: savedScrollY, behavior: 'auto' });
      bodyLocked = false;
      savedScrollY = null;
    }

    function showSecond(){
      if(state !== 'first') return;
      container.classList.add('show-second');
      state = 'locked';
      gestureAccumulator = 0;
      wheelBuffer = 0;
      clearTimeout(wheelTimer);
      lockBodyAtCurrentScroll();
    }

    function continuePageFromSecond(){
      if(state !== 'locked') return;
      state = 'released';
      gestureAccumulator = 0;
      wheelBuffer = 0;
      clearTimeout(wheelTimer);
      // unlock only if locked; unlockBodyAndRestore is now defensive
      unlockBodyAndRestore();
      // advance the page past the hero area to continue normal scrolling
      var advanceBy = Math.max(window.innerHeight * 0.28, 220);
      var target = (savedScrollY !== null ? savedScrollY + advanceBy : window.scrollY + advanceBy);
      window.scrollTo({ top: target, behavior: 'auto' });
    }

    function showFirst(){
      if(state === 'first') return;
      clearTimeout(wheelTimer);
      wheelBuffer = 0;
      // Only attempt to restore body if it was previously locked
      if (bodyLocked) unlockBodyAndRestore();
      container.classList.remove('show-second');
      state = 'first';
      gestureAccumulator = 0;
    }

    function handleWheel(e){
      // Only intercept wheel gestures when inside the hero area or while the body is actively locked.
      if(!isWithinHero()) return; // allow normal page scrolling outside the hero

      var delta = e.deltaY || 0;

      if(state === 'first'){
        if(delta > 0){
          e.preventDefault();
          e.stopImmediatePropagation && e.stopImmediatePropagation();

          wheelBuffer += Math.abs(delta);

          if(delta >= IMMEDIATE_WHEEL || wheelBuffer >= WHEEL_TRIGGER){
            clearTimeout(wheelTimer);
            wheelBuffer = 0;
            showSecond();
          } else {
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(function(){
              wheelBuffer = 0;
            }, WHEEL_FLUSH_MS);
          }
        } else if(delta < 0){
          clearTimeout(wheelTimer);
          wheelBuffer = 0;
        }
        return;
      }

      if(state === 'locked'){
        if(delta > 0){
          e.preventDefault();
          e.stopImmediatePropagation && e.stopImmediatePropagation();
          wheelBuffer += Math.abs(delta);
          if(delta >= IMMEDIATE_WHEEL || wheelBuffer >= WHEEL_TRIGGER){
            clearTimeout(wheelTimer);
            wheelBuffer = 0;
            continuePageFromSecond();
          } else {
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(function(){
              wheelBuffer = 0;
            }, WHEEL_FLUSH_MS);
          }
        } else if(delta < 0){
          if(Math.abs(delta) >= 90){
            e.preventDefault();
            showFirst();
          }
        }
        return;
      }

      if(state === 'released' && delta < 0 && Math.abs(delta) >= 90){
        e.preventDefault();
        showFirst();
      }
    }

    function handleTouchStart(e){
      // Only start tracking touches if we're within the hero area
      if(!isWithinHero()){
        touchStartY = null;
        gestureAccumulator = 0;
        return;
      }
      touchStartY = e.touches[0].clientY;
      gestureAccumulator = 0;
    }

    function handleTouchMove(e){
      if(touchStartY === null) return;
      // Only process touch moves when still within hero or while body is locked
      if(!isWithinHero()) return;

      var dy = touchStartY - e.touches[0].clientY;

      if(state === 'first'){
        if(dy > 0){
          if(dy >= IMMEDIATE_TOUCH){
            e.preventDefault();
            touchStartY = null;
            showSecond();
          } else {
            gestureAccumulator += dy;
            if(gestureAccumulator >= TOUCH_TRIGGER){
              e.preventDefault();
              touchStartY = null;
              showSecond();
            }
          }
        } else {
          gestureAccumulator = 0;
        }
        return;
      }

      if(state === 'locked'){
        if(dy > 0){
          if(dy >= IMMEDIATE_TOUCH){
            e.preventDefault();
            touchStartY = null;
            continuePageFromSecond();
          } else {
            gestureAccumulator += dy;
            if(gestureAccumulator >= TOUCH_TRIGGER){
              e.preventDefault();
              touchStartY = null;
              continuePageFromSecond();
            }
          }
        } else if(dy < 0 && Math.abs(dy) >= 90){
          e.preventDefault();
          touchStartY = null;
          showFirst();
        }
        return;
      }

      if(state === 'released' && dy < 0 && Math.abs(dy) >= 90){
        e.preventDefault();
        touchStartY = null;
        showFirst();
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

  } catch (err) {
    console.warn('initHeroSwap failed', err);
  }

}

