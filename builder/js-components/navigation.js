/**
 * Navigation Component - Smooth scroll and active state
 * Detects: a[href^="#"], .nav-item
 * 
 * @component navigation
 */

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
        
    if (targetElement) {
      const headerHeight = document.querySelector('.header').offsetHeight;
      const targetPosition = targetElement.offsetTop - headerHeight - CONFIG.UI.SCROLL_OFFSET;
            
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
            
      history.pushState(null, null, `#${targetId}`);
    }
  });
});

// Active navigation state
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
