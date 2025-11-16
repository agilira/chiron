/**
 * Accessibility Component - Skip link, ARIA labels, focus management
 * Detects: #main-content, #sidebarToggle, #searchInput
 * 
 * @component accessibility
 */

// Skip link for screen readers
(() => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = t('skip_to_content', 'Skip to main content');
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
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.setAttribute('aria-label', t('sidebar_toggle_aria', 'Toggle sidebar navigation'));
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
