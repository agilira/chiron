/**
 * Developer Tools Component - Debug panel (Ctrl+Shift+D)
 * Detects: #developerTools
 * 
 * @component developer-tools
 */

(() => {
  const developerTools = document.getElementById('developerTools');
  if (!developerTools) {return;}

  // Toggle with Ctrl+Shift+D
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      const isVisible = developerTools.style.display !== 'none';
      developerTools.style.display = isVisible ? 'none' : 'block';
            
      if (!isVisible) {
        console.log('🛠️ Developer tools activated! Press Ctrl+Shift+D to hide.');
      }
    }
  });

  // Dark mode styles
  const observer = new MutationObserver(() => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      developerTools.style.background = 'var(--bg-secondary)';
      developerTools.style.borderColor = 'var(--border-primary)';
      developerTools.style.color = 'var(--text-primary)';
    } else {
      developerTools.style.background = 'var(--gray-100)';
      developerTools.style.borderColor = 'var(--gray-300)';
      developerTools.style.color = 'var(--gray-700)';
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
