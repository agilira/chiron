/**
 * Dropdowns Component - Header dropdown menus
 * Detects: .header-dropdown, .dropdown-menu, .dropdown-toggle
 * 
 * @component dropdowns
 */

(function setupHeaderDropdowns() {
  const headerNav = document.querySelector('.header-nav');
  const dropdownItems = document.querySelectorAll('.header-nav-item');
  
  if (!dropdownItems.length) {return;}

  // Get dropdown trigger mode from config (default: 'hover')
  // Options: 'hover' | 'click'
  const triggerMode = headerNav?.getAttribute('data-dropdown-trigger') || 'hover';

  dropdownItems.forEach(item => {
    const button = item.querySelector('.header-nav-link');
    const dropdown = item.querySelector('.header-dropdown');
    
    if (!button || !dropdown) {return;}

    let closeTimeout = null;

    const openDropdown = () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = (immediate = false) => {
      if (immediate) {
        item.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      } else {
        // Delay closing to allow moving mouse to dropdown
        closeTimeout = setTimeout(() => {
          item.classList.remove('open');
          button.setAttribute('aria-expanded', 'false');
        }, 200);
      }
    };

    // Click handler - always enabled for accessibility
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (item.classList.contains('open')) {
        closeDropdown(true);
      } else {
        // Close other dropdowns
        dropdownItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('open')) {
            otherItem.classList.remove('open');
            const otherButton = otherItem.querySelector('.header-nav-link');
            if (otherButton) {otherButton.setAttribute('aria-expanded', 'false');}
          }
        });
        openDropdown();
      }
    });

    // Hover handlers - only if trigger mode is 'hover'
    if (triggerMode === 'hover') {
      item.addEventListener('mouseenter', () => {
        openDropdown();
      });

      item.addEventListener('mouseleave', () => {
        closeDropdown();
      });

      // Keep open when hovering dropdown content
      dropdown.addEventListener('mouseenter', () => {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }
      });

      dropdown.addEventListener('mouseleave', () => {
        closeDropdown();
      });
    }

    // Close on Escape key
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && item.classList.contains('open')) {
        closeDropdown(true);
        button.focus();
      }
    });

    // Close dropdown when clicking a link inside
    dropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeDropdown(true);
      });
    });
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const clickedOutside = !e.target.closest('.header-nav-item');
    if (clickedOutside) {
      dropdownItems.forEach(item => {
        if (item.classList.contains('open')) {
          item.classList.remove('open');
          const button = item.querySelector('.header-nav-link');
          if (button) {button.setAttribute('aria-expanded', 'false');}
        }
      });
    }
  });
})();
