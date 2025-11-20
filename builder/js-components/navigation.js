/**
 * Navigation Component - Active navigation state
 * Detects: .nav-item, section[id]
 * 
 * Note: Smooth scroll is now a separate component (smooth-scroll.js)
 * 
 * @component navigation
 */

// Active navigation state - highlights current section in navigation
const updateActiveNavigation = () => {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-item[href^="#"]');
    
  let currentSection = '';
    
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const headerHeight = document.querySelector('.header').offsetHeight;
        
    if (rect.top <= headerHeight + CONFIG.UI.HEADER_SCROLL_OFFSET && rect.bottom > headerHeight + CONFIG.UI.HEADER_SCROLL_OFFSET) {
      currentSection = section.id;
    }
  });

  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === `#${currentSection}`) {
      item.classList.add('active');
    }
  });
};

updateActiveNavigation();
window.addEventListener('scroll', debounce(updateActiveNavigation, 100), { passive: true });
