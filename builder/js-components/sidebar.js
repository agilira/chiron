/**
 * Sidebar Component - Mobile sidebar toggle and collapsible sections
 * Detects: #sidebar, #sidebarToggle, #mobileOverlay, .nav-section-title.collapsible
 * 
 * @component sidebar
 */

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

