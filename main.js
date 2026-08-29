// Shared JS: mobile menu toggle and overlay handling
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const bar1 = document.getElementById('bar1');
  const bar2 = document.getElementById('bar2');

  if (!menuToggle || !mobileMenu || !bar1 || !bar2) return;

  // Accessibility attributes
  menuToggle.setAttribute('aria-controls', 'mobile-menu');
  menuToggle.setAttribute('aria-expanded', 'false');

  function openMenu() {
    mobileMenu.classList.add('active');
    menuToggle.classList.add('open');
    bar1.style.transform = 'translateY(7px) rotate(45deg)';
    bar2.style.transform = 'translateY(-7px) rotate(-45deg)';
    document.body.style.overflow = 'hidden';
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('open');
    bar1.style.transform = 'translateY(0) rotate(0)';
    bar2.style.transform = 'translateY(0) rotate(0)';
    document.body.style.overflow = 'auto';
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = mobileMenu.classList.contains('active');
    isActive ? closeMenu() : openMenu();
  });

  // Close when clicking on the overlay (but not on links)
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMenu();
  });

  // Close menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  // Scroll Reveal (shared)
  const observerOptions = { threshold: 0.1 };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, observerOptions);
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // 3D Tilt for .bento-card (shared)
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
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    });
  });

  // 3D Tilt for .project-card (shared)
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
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    });
  });

});