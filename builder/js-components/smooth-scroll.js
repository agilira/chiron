/**
 * Smooth Scroll Component - Smooth scrolling for anchor links
 * Detects: a[href^="#"] (anchor links)
 * 
 * Required by: scroll-to-top (uses smooth behavior)
 * 
 * @component smooth-scroll
 */

// Smooth scroll for internal anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
        
    if (targetElement) {
      const header = document.querySelector('.header');
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = targetElement.offsetTop - headerHeight - (CONFIG?.UI?.SCROLL_OFFSET || 20);
            
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
            
      // Update URL hash
      history.pushState(null, null, `#${targetId}`);
    }
  });
});
