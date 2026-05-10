/* My Blog — main.js */

/* ── Sticky header shadow on scroll ───────────────────────── */
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 10) {
      header.style.borderBottomColor = 'rgba(45,186,126,0.15)';
      header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
    } else {
      header.style.borderBottomColor = '';
      header.style.boxShadow = '';
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ── Intersection Observer for staggered fade-up ──────────── */
(function () {
  const els = document.querySelectorAll('.post-card');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = (i * 0.06) + 's';
        entry.target.classList.add('fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
})();
