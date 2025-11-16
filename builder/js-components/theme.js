/**
 * Theme Component - Dark/light mode toggle
 * Detects: .theme-toggle, #themeToggle
 * 
 * @component theme
 */

(() => {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) {return;}

  const getStoredTheme = () => {
    try {
      return localStorage.getItem('theme');
    } catch (_e) {
      console.warn('localStorage not available:', _e); // Intentionally using _e
      return null;
    }
  };
    
  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch (_e) {
      console.warn('Cannot save theme preference:', _e); // Intentionally using _e
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
      const excludedLanguages = ['markdown', 'md', 'text', 'plaintext', 'txt'];
            
      document.querySelectorAll('pre code').forEach((block) => {
        const classList = block.className.split(' ');
        const langClass = classList.find(cls => cls.startsWith('language-'));
                
        if (langClass) {
          const lang = langClass.replace('language-', '');
          if (excludedLanguages.includes(lang.toLowerCase())) {
            block.className = `language-${lang} nohighlight`;
            return;
          }
          block.className = langClass;
        } else {
          block.className = '';
        }
        
        // Remove previous highlighting before re-highlighting
        delete block.dataset.highlighted;
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
    showToast(t('theme_switch_success', 'Switched to {theme} mode').replace('{theme}', newTheme), 'success');
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

