/**
 * Tabs Component - Accessible tab interface
 * Detects: .tabs-container, .tab-button, .tab-panel
 * 
 * @component tabs
 */

(() => {
  const tabContainers = document.querySelectorAll('.tabs-container');
  if (tabContainers.length === 0) {return;}

  tabContainers.forEach(container => {
    const tabButtons = container.querySelectorAll('.tab-button');
    const tabPanels = container.querySelectorAll('.tab-panel');

    if (tabButtons.length === 0 || tabPanels.length === 0) {return;}

    const switchTab = (index) => {
      tabButtons.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive.toString());
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      tabPanels.forEach((panel, i) => {
        if (i === index) {
          panel.classList.add('active');
          panel.removeAttribute('hidden');
        } else {
          panel.classList.remove('active');
          panel.setAttribute('hidden', '');
        }
      });
    };

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(index);
      });

      button.addEventListener('keydown', (e) => {
        let newIndex = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = (index + 1) % tabButtons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIndex = tabButtons.length - 1;
        }

        if (newIndex !== -1) {
          switchTab(newIndex);
          tabButtons[newIndex].focus();
        }
      });
    });

    if (tabButtons.length > 0) {
      switchTab(0);
    }
  });
})();
