/**
 * Table of Contents Component - Auto-generate TOC and highlight active section
 * Detects: .table-of-contents, .toc-list, .toc-sidebar
 * 
 * @component toc
 */

(() => {
  const toc = document.querySelector('.table-of-contents, .toc-sidebar');
  if (!toc) {return;}

  // Check if we should include H3 (default: only H2)
  // Can be controlled via data-toc-depth="3" attribute
  const depth = parseInt(toc.getAttribute('data-toc-depth')) || 2;
  // Exclude headings with data-toc-ignore attribute or .toc-ignore class
  const headingSelector = depth >= 3 
    ? 'h2[id]:not([data-toc-ignore]):not(.toc-ignore), h3[id]:not([data-toc-ignore]):not(.toc-ignore)' 
    : 'h2[id]:not([data-toc-ignore]):not(.toc-ignore)';

  // Auto-generate TOC - only from main content, not modals/header/footer
  const mainContent = document.querySelector('main, .main-content, article');
  const headings = mainContent ? mainContent.querySelectorAll(headingSelector) : [];
  if (headings.length === 0) {return;}
    
  let tocList = toc.querySelector('.toc-list');
    
  // If no toc-list exists (like in .toc-sidebar), create the structure
  if (!tocList) {
    const nav = document.createElement('nav');
    nav.className = 'toc-nav';
    nav.setAttribute('aria-label', t('toc_aria', 'Table of contents'));
        
    const title = document.createElement('h2');
    title.className = 'toc-title';
    title.textContent = t('toc_title', 'On This Page');
        
    tocList = document.createElement('ul');
    tocList.className = 'toc-list';
        
    nav.appendChild(title);
    nav.appendChild(tocList);
    toc.appendChild(nav);
  }
    
  // Only generate if list is empty
  if (tocList.children.length > 0) {return;}
    
  const fragment = document.createDocumentFragment();

  headings.forEach(heading => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.className = 'toc-link';
        
    // Determine level from tag name
    const level = heading.tagName.toLowerCase() === 'h2' ? 2 : 3;
    const li = document.createElement('li');
    li.className = `toc-item toc-level-${level}`;
    li.appendChild(link);
    fragment.appendChild(li);
  });
    
  tocList.appendChild(fragment);

  // Highlight current section
  const updateTOCHighlight = () => {
    const tocLinks = document.querySelectorAll('.toc-list a');
    const mainContent = document.querySelector('main, .main-content, article');
    const sections = mainContent ? mainContent.querySelectorAll(headingSelector) : [];
        
    let currentSection = '';
        
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const header = document.querySelector('.header');
      const headerHeight = header ? header.offsetHeight : 0;
            
      if (rect.top <= headerHeight + (typeof CONFIG !== 'undefined' && CONFIG.UI ? CONFIG.UI.TOC_SCROLL_OFFSET : 100)) {
        currentSection = section.id;
      }
    });

    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', debounce(updateTOCHighlight, 100), { passive: true });
})();
