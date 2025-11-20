/**
 * Search-Local Plugin - Client-Side Search
 * Enhanced version of builder/js-components/search.js with multilingual filtering
 * 
 * @component search
 * @version 2.0.0
 */

// Search system with multilingual support
(() => {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
    
  if (!searchInput || !searchResults) {return;}
    
  let searchData = null;
  let searchIndex = null; // Full index with metadata
  let searchDataPromise = null;
  let currentFocus = -1;
  let currentLanguage = null;
  let searchTimeout = null;
  let isDestroyed = false;
  let abortController = null;
  let lastSearchTime = 0;
  
  // Configuration - use defaults if CONFIG not available
  const RATE_LIMIT_MS = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH) ? CONFIG.SEARCH.RATE_LIMIT_MS : 100;
  const MIN_QUERY_LENGTH = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH) ? CONFIG.SEARCH.MIN_QUERY_LENGTH : 2;
  const DEBOUNCE_DELAY = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH) ? CONFIG.SEARCH.DEBOUNCE_DELAY : 300;
  const FETCH_TIMEOUT = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH) ? CONFIG.SEARCH.FETCH_TIMEOUT : 5000;
  const MAX_RESULTS = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH) ? CONFIG.SEARCH.MAX_RESULTS : 10;
  
  // Detect current language
  const detectLanguage = () => {
    // Try URL path first (/en/docs/api.html -> 'en')
    const pathMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Try HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.length >= 2) {
      return htmlLang.substring(0, 2);
    }

    return null; // Will use default from index
  };

  currentLanguage = detectLanguage();
    
  const cleanup = () => {
    isDestroyed = true;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    searchData = null;
    searchIndex = null;
    searchDataPromise = null;
  };
    
  // Use pagehide instead of beforeunload (deprecated API)
  window.addEventListener('pagehide', cleanup);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cleanup();}
  });
    
  const domObserver = new MutationObserver(() => {
    if (!document.body.contains(searchInput) || !document.body.contains(searchResults)) {
      cleanup();
      domObserver.disconnect();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });
    
  const loadSearchIndex = async () => {
    if (isDestroyed) {throw new Error('Search has been destroyed');}
    if (searchData) {return searchData;}
    if (searchDataPromise) {return searchDataPromise;}
        
    searchDataPromise = (async () => {
      try {
        abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT);
                
        // Use absolute path from site root to handle multilingual subdirectories
        const response = await fetch('/search-index.json', {
          signal: abortController.signal
        });
                
        clearTimeout(timeoutId);
                
        if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
        const data = await response.json();
        if (isDestroyed) {throw new Error('Search was destroyed during loading');}
        
        // Store full index for metadata
        searchIndex = data;
        
        // Set default language if not detected
        if (!currentLanguage && data.config && data.config.defaultLanguage) {
          currentLanguage = data.config.defaultLanguage;
        }
        
        // Filter pages by language if multilingual aware
        if (data.config && data.config.multilingualAware && currentLanguage) {
          searchData = data.pages.filter(page => page.language === currentLanguage);
        } else {
          searchData = data.pages;
        }
        
        abortController = null;
        return searchData;
      } catch (_error) {
        if (_error.name !== 'AbortError') {
          console.error('Failed to load search index:', _error);
        }
        searchDataPromise = null;
        abortController = null;
                
        if (!isDestroyed && searchResults && _error.name !== 'AbortError') {
          const errorMessage = _error.name === 'AbortError' 
            ? t('search_timeout', 'Search request timeout')
            : t('search_error', 'Search unavailable');
          searchResults.innerHTML = `<div class="search-no-results">${errorMessage}</div>`;
          searchResults.hidden = false;
        }
        throw _error;
      }
    })();
        
    return searchDataPromise;
  };
    
  const simpleSearch = (query, pages) => {
    const now = Date.now();
    if (now - lastSearchTime < RATE_LIMIT_MS) {return [];}
    lastSearchTime = now;
        
    const lowerQuery = query.toLowerCase();
    const queryTerms = lowerQuery.split(/\s+/);
    const results = [];
        
    for (const page of pages) {
      let score = 0;
      
      const title = (page.title || '').toLowerCase();
      const description = (page.description || '').toLowerCase();
      const content = (page.content || '').toLowerCase();
      const headings = (page.headings || []).map(h => h.toLowerCase());
      const keywords = (page.keywords || []).map(k => k.toLowerCase());
      
      // Exact keyword match (bonus)
      if (keywords.some(keyword => keyword === lowerQuery)) {
        score += 15;
      }
      
      // Title matches
      if (title === lowerQuery) {
        score += 20; // Exact match
      } else if (title.includes(lowerQuery)) {
        score += 10; // Partial match
      } else {
        queryTerms.forEach(term => {
          if (title.includes(term)) {score += 5;}
        });
      }
      
      // Description matches
      if (description.includes(lowerQuery)) {
        score += 5;
      } else {
        queryTerms.forEach(term => {
          if (description.includes(term)) {score += 2;}
        });
      }
      
      // Heading matches
      headings.forEach(heading => {
        if (heading.includes(lowerQuery)) {
          score += 3;
        } else {
          queryTerms.forEach(term => {
            if (heading.includes(term)) {score += 1;}
          });
        }
      });
      
      // Keyword matches (partial)
      keywords.forEach(keyword => {
        if (keyword.includes(lowerQuery)) {
          score += 8;
        } else {
          queryTerms.forEach(term => {
            if (keyword.includes(term)) {score += 4;}
          });
        }
      });
      
      // Content matches (lowest priority)
      if (content.includes(lowerQuery)) {score += 1;}
            
      if (score > 0) {results.push({ ...page, score });}
    }
        
    return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
  };
    
  const highlightMatches = (text, query) => {
    if (!query || !text) {return text;}
        
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escapedQuery.length > 200) {
      console.warn('Query too long for highlighting');
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
        
    try {
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
            
      return escapedText.replace(regex, '<span class="search-result-match">$1</span>');
    } catch (_error) {
      console.error('Error creating regex:', _error);
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };
    
  const performSearch = async (query) => {
    if (isDestroyed) {return;}
        
    if (!query || query.length < MIN_QUERY_LENGTH) {
      searchResults.hidden = true;
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      searchInput.setAttribute('aria-expanded', 'false');
      return;
    }
        
    if (!searchData) {
      searchResults.innerHTML = `<div class="search-loading">${t('search_loading', 'Loading...')}</div>`;
      searchResults.hidden = false;
      searchInput.setAttribute('aria-expanded', 'true');
            
      try {
        await loadSearchIndex();
      } catch {
        return;
      }
            
      if (isDestroyed || searchInput.value.trim() !== query) {return;}
    }
        
    const results = simpleSearch(query, searchData);
        
    if (isDestroyed || searchInput.value.trim() !== query) {return;}
        
    if (results.length === 0) {
      searchResults.innerHTML = `<div class="search-no-results">${t('search_no_results', 'No results found')}</div>`;
      searchResults.hidden = false;
      searchResults.style.display = 'block';
      return;
    }
        
    const html = results.map((page, index) => {
      const title = highlightMatches(page.title, query);
      const description = highlightMatches(
        page.description || `${page.content.substring(0, 150)  }...`,
        query
      );
            
      return `
                <a href="${page.url}" class="search-result-item" data-index="${index}">
                    <div class="search-result-title">${title}</div>
                    <div class="search-result-description">${description}</div>
                </a>
            `;
    }).join('');
        
    searchResults.innerHTML = html;
    searchResults.hidden = false;
    searchResults.style.display = 'block';
    searchInput.setAttribute('aria-expanded', 'true');
    currentFocus = -1;
  };
    
  let currentSearchId = 0;
    
  searchInput.addEventListener('input', (e) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
        
    const query = e.target.value.trim();
        
    if (query.length < MIN_QUERY_LENGTH) {
      currentSearchId++;
      performSearch(query);
      return;
    }
        
    const searchId = ++currentSearchId;
        
    searchTimeout = setTimeout(() => {
      searchTimeout = null;
      if (searchId === currentSearchId) {
        performSearch(query);
      }
    }, DEBOUNCE_DELAY);
  });
    
  searchInput.addEventListener('focus', () => {
    if (!isDestroyed) {loadSearchIndex();}
  });
    
  searchInput.addEventListener('blur', () => {
    const blurDelay = (typeof CONFIG !== 'undefined' && CONFIG.UI) ? CONFIG.UI.BLUR_DELAY : 200;
    setTimeout(() => {
      searchResults.hidden = true;
      searchResults.style.display = 'none';
    }, blurDelay);
  });
    
  searchInput.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-result-item');
        
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentFocus++;
      if (currentFocus >= items.length) {currentFocus = 0;}
      setActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentFocus--;
      if (currentFocus < 0) {currentFocus = items.length - 1;}
      setActive(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    } else if (e.key === 'Escape') {
      searchResults.hidden = true;
      searchResults.style.display = 'none';
      searchInput.blur();
    }
  });
    
  const setActive = (items) => {
    items.forEach((item, index) => {
      const isActive = index === currentFocus;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });
    if (items[currentFocus]) {
      items[currentFocus].scrollIntoView({ block: 'nearest' });
    }
  };
    
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.hidden = true;
      searchResults.style.display = 'none';
    }
  });
})();

// Search Modal
(() => {
  const searchToggle = document.getElementById('searchToggle');
  const searchModal = document.getElementById('searchModal');
  const searchModalClose = document.getElementById('searchModalClose');
  const searchModalOverlay = document.getElementById('searchModalOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
    
  if (!searchToggle || !searchModal) {return;}
    
  const openModal = () => {
    searchModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (searchInput) {searchInput.focus();}
    }, 100);
  };
    
  const closeModal = () => {
    searchModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  };
    
  if (searchInput && searchClearBtn) {
    searchInput.addEventListener('input', () => {
      if (searchInput.value.length > 0) {
        searchClearBtn.removeAttribute('hidden');
      } else {
        searchClearBtn.setAttribute('hidden', '');
      }
    });
        
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  }
    
  searchToggle.addEventListener('click', openModal);
  if (searchModalClose) {searchModalClose.addEventListener('click', closeModal);}
  if (searchModalOverlay) {searchModalOverlay.addEventListener('click', closeModal);}
    
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
    
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openModal();
    }
  });
})();
