/**
 * Language Switcher Component - Dropdown for language selection
 * Detects: .language-switcher
 * 
 * @component language-switcher
 */

(function setupLanguageSwitcher() {
  const switcher = document.querySelector('.language-switcher');
  
  if (!switcher) {return;} // No language switcher present
  
  const button = switcher.querySelector('.dropdown-toggle');
  const menu = switcher.querySelector('.dropdown-menu');
  
  if (!button || !menu) {return;}
  
  // Toggle dropdown on click
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
      // Close
      button.setAttribute('aria-expanded', 'false');
      menu.setAttribute('hidden', '');
    } else {
      // Open
      button.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('hidden');
      
      // Focus first item
      const firstItem = menu.querySelector('.dropdown-item');
      if (firstItem) {
        setTimeout(() => firstItem.focus(), 100);
      }
    }
  });
  
  // Close on escape
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      button.setAttribute('aria-expanded', 'false');
      menu.setAttribute('hidden', '');
      button.focus();
    }
  });
  
  // Keyboard navigation
  menu.addEventListener('keydown', (e) => {
    const items = Array.from(menu.querySelectorAll('.dropdown-item'));
    const currentIndex = items.indexOf(document.activeElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      button.setAttribute('aria-expanded', 'false');
      menu.setAttribute('hidden', '');
    }
  });
  
  // Store language preference when switching
  menu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (_e) => {
      const locale = item.getAttribute('lang');
      if (locale) {
        try {
          localStorage.setItem('chiron_locale', locale);
        } catch (_err) {
          // Ignore localStorage errors
        }
      }
    });
  });
})();
