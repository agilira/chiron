/**
 * Base Component Bundle - Always loaded components
 * Includes: core, accessibility, sidebar, search, theme, navigation, scroll-to-top
 * These components are present on every page so we bundle them together
 * 
 * @component base
 * @required
 */

// ============================================================================
// CORE - Utilities and configuration
// ============================================================================

// i18n Helper - Get translated string with fallback
const i18n = window.CHIRON_I18N || {};
// eslint-disable-next-line no-redeclare
const t = (key, fallback = '') => i18n[key] || fallback;
// Make t() globally accessible for other components
window.t = t;

// Configuration Constants
// eslint-disable-next-line no-redeclare
const CONFIG = {
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 200,
    RATE_LIMIT_MS: 100,
    MAX_RESULTS: 10,
    FETCH_TIMEOUT: 10000,
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
  },
  UI: {
    TOAST_DURATION: 3000,
    TOAST_ANIMATION_DELAY: 100,
    TOAST_FADE_OUT_DELAY: 300,
    BLUR_DELAY: 200,
    COOKIE_BANNER_DELAY: 1000,
    WATCH_DEBOUNCE_DELAY: 300,
    SCROLL_OFFSET: 20,
    HEADER_SCROLL_OFFSET: 50,
    TOC_SCROLL_OFFSET: 100,
    SCROLL_TO_TOP_THRESHOLD: 300
  },
  CACHE: {
    MAX_SIZE: 50
  }
};

// Utility functions
// eslint-disable-next-line no-redeclare
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// eslint-disable-next-line no-redeclare
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-500)' : 'var(--error-500)'};
        color: white;
        padding: 12px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, CONFIG.UI.TOAST_ANIMATION_DELAY);

  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, CONFIG.UI.TOAST_FADE_OUT_DELAY);
  }, CONFIG.UI.TOAST_DURATION);
};
// Make showToast globally accessible for other components
window.showToast = showToast;

// Hash helper for info boxes
// eslint-disable-next-line no-unused-vars, no-redeclare
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// ============================================================================
// ACCESSIBILITY - Skip link, ARIA labels, focus management
// ============================================================================

// Skip link for screen readers
(() => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-600);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  document.body.insertBefore(skipLink, document.body.firstChild);
})();

// ARIA labels
(() => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.setAttribute('aria-label', 'Toggle sidebar navigation');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.setAttribute('aria-label', t('aria_search', 'Search documentation'));
  }
})();

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
        
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (mobileOverlay) {mobileOverlay.classList.remove('open');}
      document.body.style.overflow = '';
    }
        
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.hidden = true;
      searchResults.style.display = 'none';
    }
        
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {searchInput.blur();}
  }
});

// ============================================================================
// SIDEBAR - Mobile sidebar toggle and collapsible sections
// ============================================================================

// Mobile sidebar
(() => {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mobileOverlay = document.getElementById('mobileOverlay');
    
  if (!sidebarToggle || !mobileOverlay) {return;}

  let lastFocusedElement = null;

  const getFocusableElements = (container) => {
    return container.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
  };

  const openSidebar = () => {
    lastFocusedElement = document.activeElement;
    sidebar.classList.add('open');
    mobileOverlay.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebarToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    const focusables = getFocusableElements(sidebar);
    if (focusables.length) {focusables[0].focus();}
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebarToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocusedElement) {lastFocusedElement.focus();}
  };

  const toggleSidebar = () => {
    if (sidebar.classList.contains('open')) {closeSidebar();}
    else {openSidebar();}
  };

  sidebarToggle.addEventListener('click', toggleSidebar);
  mobileOverlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (!sidebar.classList.contains('open')) {return;}
    if (e.key === 'Escape') {
      closeSidebar();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(getFocusableElements(sidebar));
      if (!focusables.length) {return;}
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

// Collapsible sidebar sections
(() => {
  const collapsibleButtons = document.querySelectorAll('.nav-section-title.collapsible');
    
  if (!collapsibleButtons.length) {return;}

  collapsibleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
            
      const section = button.closest('.nav-section');
      if (!section) {return;}

      const isExpanded = section.classList.contains('expanded');
      section.classList.toggle('expanded');
      button.setAttribute('aria-expanded', !isExpanded);

      const sectionTitle = button.textContent.trim();
      try {
        const stateKey = `sidebar-section-${sectionTitle}`;
        localStorage.setItem(stateKey, !isExpanded ? 'open' : 'closed');
      } catch {
        // Ignore localStorage errors (intentionally empty)
      }
    });
  });

  // Restore state from localStorage
  collapsibleButtons.forEach(button => {
    const sectionTitle = button.textContent.trim();
    const stateKey = `sidebar-section-${sectionTitle}`;
        
    try {
      const savedState = localStorage.getItem(stateKey);
            
      if (savedState) {
        const section = button.closest('.nav-section');
        const shouldBeOpen = savedState === 'open';
        const isCurrentlyOpen = section.classList.contains('expanded');

        if (shouldBeOpen !== isCurrentlyOpen) {
          section.classList.toggle('expanded', shouldBeOpen);
          button.setAttribute('aria-expanded', shouldBeOpen);
        }
      }
    } catch {
      // Ignore localStorage errors (intentionally empty)
    }
  });
})();

// Keyboard shortcut: Ctrl/Cmd + / to toggle sidebar
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {sidebarToggle.click();}
  }
});

// ============================================================================
// THEME - Dark/light mode toggle
// ============================================================================

(() => {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) {return;}

  const getStoredTheme = () => {
    try {
      return localStorage.getItem('theme');
    } catch (_e) {
      console.warn('localStorage not available:', _e);
      return null;
    }
  };
    
  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch (_e) {
      console.warn('Cannot save theme preference:', _e);
    }
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('data-theme', theme);
      themeToggleBtn.setAttribute('aria-label', 
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
        
    updateLogosForTheme(theme);
    updateHighlightTheme(theme);
  };

  const updateHighlightTheme = (_theme) => {
    // Remove external Highlight.js CSS (we use custom styles in styles.css)
    const existingLinks = document.querySelectorAll('link[href*="highlight.js"]');
    existingLinks.forEach(link => link.remove());
        
    if (typeof hljs !== 'undefined') {
      const excludedLanguages = ['text', 'plaintext', 'txt'];
      const languageAliasMap = {
        markdown: 'html',
        md: 'html'
      };
            
      document.querySelectorAll('pre code').forEach((block) => {
        const classList = block.className.split(' ');
        const langClass = classList.find(cls => cls.startsWith('language-'));
                
        if (langClass) {
          const lang = langClass.replace('language-', '');
          const normalizedLang = lang.toLowerCase();
          if (excludedLanguages.includes(normalizedLang)) {
            block.className = `language-${lang} nohighlight`;
            return;
          }
          const mappedLang = languageAliasMap[normalizedLang] || lang;
          block.className = `language-${mappedLang}`;
          if (mappedLang !== lang) {
            block.classList.add(`language-${lang}`);
          }
        } else {
          block.className = '';
        }
                
        hljs.highlightElement(block);
      });
    }
  };

  const updateLogosForTheme = (theme) => {
    const logosWithData = document.querySelectorAll('[data-logo-light], [data-logo-dark]');
    logosWithData.forEach(logo => {
      const lightSrc = logo.getAttribute('data-logo-light');
      const darkSrc = logo.getAttribute('data-logo-dark');
            
      if (theme === 'dark' && darkSrc) {
        logo.src = darkSrc;
      } else if (lightSrc) {
        logo.src = lightSrc;
      }
    });
        
    const headerLightLogos = document.querySelectorAll('.logo-light');
    const headerDarkLogos = document.querySelectorAll('.logo-dark');
    const footerLightLogos = document.querySelectorAll('.footer-logo-light');
    const footerDarkLogos = document.querySelectorAll('.footer-logo-dark');
        
    if (theme === 'dark') {
      headerLightLogos.forEach(logo => logo.style.display = 'block');
      headerDarkLogos.forEach(logo => logo.style.display = 'none');
      footerLightLogos.forEach(logo => logo.style.display = 'none');
      footerDarkLogos.forEach(logo => logo.style.display = 'block');
    } else {
      headerLightLogos.forEach(logo => logo.style.display = 'none');
      headerDarkLogos.forEach(logo => logo.style.display = 'block');
      footerLightLogos.forEach(logo => logo.style.display = 'block');
      footerDarkLogos.forEach(logo => logo.style.display = 'none');
    }
  };

  // Initialize theme
  const savedTheme = getStoredTheme();
  let systemTheme = 'light';
  if (window.matchMedia) {
    systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const currentTheme = savedTheme || systemTheme;
  setTheme(currentTheme);

  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setStoredTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'success');
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();

// ============================================================================
// NAVIGATION - Smooth scroll and active state
// ============================================================================

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

// ============================================================================
// SCROLL TO TOP - Button to scroll back to top
// ============================================================================

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

// ============================================================================
// HEADER DROPDOWNS - Dropdown menus in header navigation
// ============================================================================
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

// LANGUAGE SWITCHER - Dropdown for language selection
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


