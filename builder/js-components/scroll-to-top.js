/**
 * Scroll to Top Component - Button to scroll back to top
 * Detects: #scrollToTop
 * 
 * @component scroll-to-top
 */

(() => {
  const scrollToTopBtn = document.getElementById('scrollToTop');
  if (!scrollToTopBtn) {return;}

  const toggleScrollButton = () => {
    if (window.pageYOffset > CONFIG.UI.SCROLL_TO_TOP_THRESHOLD) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  window.addEventListener('scroll', toggleScrollButton, { passive: true });
  scrollToTopBtn.addEventListener('click', scrollToTop);

  scrollToTopBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });

  toggleScrollButton();
})();
