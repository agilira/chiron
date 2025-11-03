/**
 * Chiron SSG JavaScript App
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

// i18n Helper - Get translated string with fallback
const i18n = window.CHIRON_I18N || {};
const t = (key, fallback = '') => i18n[key] || fallback;

// Configuration Constants
// Features: mobile sidebar, search, navigation, accessibility, code blocks, table of contents, keyboard navigation, theme toggle, cookie consent, sitemap generation, robots generation, developer tools, scroll to top
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

class DocumentationApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        this.searchInput = document.getElementById('searchInput');
        this.editPageBtn = document.getElementById('editPageBtn');
        
        this.init();
    }

    init() {
        this.setupMobileSidebar();
        this.setupCollapsibleSections();
        this.setupSearch();
        this.setupNavigation();
        this.setupAccessibility();
        this.setupCodeBlocks();
        this.setupTableOfContents();
        this.setupKeyboardNavigation();
        this.setupThemeToggle();
        this.setupCookieConsent();
        this.setupSitemapGeneration();
        this.setupRobotsGeneration();
        this.setupDeveloperTools();
        this.setupScrollToTop();
        this.setupTabs();
    }

    // Sidebar mobile
    setupMobileSidebar() {
        if (!this.sidebarToggle || !this.mobileOverlay) return;

        // Focus management helpers
        let lastFocusedElement = null;

        const getFocusableElements = (container) => {
            return container.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        };

        const openSidebar = () => {
            lastFocusedElement = document.activeElement;
            this.sidebar.classList.add('open');
            this.mobileOverlay.classList.add('open');

            // ARIA
            this.sidebar.setAttribute('aria-hidden', 'false');
            this.sidebarToggle.setAttribute('aria-expanded', 'true');

            // Block body scroll when sidebar is open
            document.body.style.overflow = 'hidden';

            // Focus first focusable element inside sidebar
            const focusables = getFocusableElements(this.sidebar);
            if (focusables.length) focusables[0].focus();
        };

        const closeSidebar = () => {
            this.sidebar.classList.remove('open');
            this.mobileOverlay.classList.remove('open');

            // ARIA
            this.sidebar.setAttribute('aria-hidden', 'true');
            this.sidebarToggle.setAttribute('aria-expanded', 'false');

            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus
            if (lastFocusedElement) lastFocusedElement.focus();
        };

        const toggleSidebar = () => {
            if (this.sidebar.classList.contains('open')) closeSidebar();
            else openSidebar();
        };

        this.sidebarToggle.addEventListener('click', toggleSidebar);
        this.mobileOverlay.addEventListener('click', closeSidebar);

        // Basic focus trap
        document.addEventListener('keydown', (e) => {
            if (!this.sidebar.classList.contains('open')) return;
            if (e.key === 'Escape') {
                closeSidebar();
                return;
            }

            if (e.key === 'Tab') {
                const focusables = Array.from(getFocusableElements(this.sidebar));
                if (!focusables.length) return;
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

        // Auto-close on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.sidebar.classList.remove('open');
                this.mobileOverlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }

    // Collapsible sidebar sections
    setupCollapsibleSections() {
        const collapsibleButtons = document.querySelectorAll('.nav-section-title.collapsible');
        
        if (!collapsibleButtons.length) return;

        collapsibleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const section = button.closest('.nav-section');
                if (!section) return;

                // Toggle expanded state
                const isExpanded = section.classList.contains('expanded');
                section.classList.toggle('expanded');

                // Update ARIA
                button.setAttribute('aria-expanded', !isExpanded);

                // Save state to localStorage (optional)
                const sectionTitle = button.textContent.trim();
                try {
                    const stateKey = `sidebar-section-${sectionTitle}`;
                    localStorage.setItem(stateKey, !isExpanded ? 'open' : 'closed');
                } catch (e) {
                    // Ignore localStorage errors (private browsing, etc.)
                }
            });
        });

        // Restore state from localStorage on page load
        this.restoreCollapsibleSectionsState();
    }

    // Restore collapsible sections state from localStorage
    restoreCollapsibleSectionsState() {
        const collapsibleButtons = document.querySelectorAll('.nav-section-title.collapsible');
        
        collapsibleButtons.forEach(button => {
            const sectionTitle = button.textContent.trim();
            const stateKey = `sidebar-section-${sectionTitle}`;
            
            try {
                const savedState = localStorage.getItem(stateKey);
                
                if (savedState) {
                    const section = button.closest('.nav-section');
                    const shouldBeOpen = savedState === 'open';
                    const isCurrentlyOpen = section.classList.contains('expanded');

                    // Only update if state differs
                    if (shouldBeOpen !== isCurrentlyOpen) {
                        section.classList.toggle('expanded', shouldBeOpen);
                        button.setAttribute('aria-expanded', shouldBeOpen);
                    }
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        });
    }

    // Search system - Simple and fast
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) {
            return;
        }
        
        let searchData = null;
        let searchDataPromise = null; // Cache the promise to prevent race conditions
        let currentFocus = -1;
        let searchTimeout = null; // Store timeout reference for cleanup
        let isDestroyed = false; // Flag to prevent operations after cleanup
        let abortController = null; // For canceling fetch requests
        let lastSearchTime = 0; // For rate limiting
        const RATE_LIMIT_MS = CONFIG.SEARCH.RATE_LIMIT_MS;
        const MIN_QUERY_LENGTH = CONFIG.SEARCH.MIN_QUERY_LENGTH;
        const DEBOUNCE_DELAY = CONFIG.SEARCH.DEBOUNCE_DELAY;
        const FETCH_TIMEOUT = CONFIG.SEARCH.FETCH_TIMEOUT;
        const MAX_RESULTS = CONFIG.SEARCH.MAX_RESULTS;
        
        // Cleanup function to prevent memory leaks
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
            // Clear search data to free memory
            searchData = null;
            searchDataPromise = null;
        };
        
        // Register cleanup on page unload and navigation
        window.addEventListener('beforeunload', cleanup);
        
        // Also cleanup on page visibility change (better for SPA scenarios)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cleanup();
        });
        
        // Watch for search input removal from DOM to cleanup (prevent memory leaks)
        const domObserver = new MutationObserver(() => {
            if (!document.body.contains(searchInput) || !document.body.contains(searchResults)) {
                cleanup();
                domObserver.disconnect();
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
        
        // Lazy load search index
        const loadSearchIndex = async () => {
            // Check if destroyed
            if (isDestroyed) {
                throw new Error('Search has been destroyed');
            }
            
            // Return cached data if available
            if (searchData) return searchData;
            
            // Return pending promise if already loading (prevent race condition)
            if (searchDataPromise) {
                // Wait for the pending promise instead of creating a new one
                return searchDataPromise;
            }
            
            // Start loading and cache the promise
            searchDataPromise = (async () => {
                try {
                    // Create new AbortController for this request with timeout
                    abortController = new AbortController();
                    
                    // Set timeout for fetch request
                    const timeoutId = setTimeout(() => {
                        abortController.abort();
                    }, FETCH_TIMEOUT);
                    
                    const response = await fetch('search-index.json', {
                        signal: abortController.signal
                    });
                    
                    // Clear timeout on successful fetch
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Check again if destroyed during async operation
                    if (isDestroyed) {
                        throw new Error('Search was destroyed during loading');
                    }
                    
                    searchData = data.pages;
                    abortController = null; // Clear after success
                    return searchData;
                } catch (error) {
                    // Don't log if request was aborted intentionally
                    if (error.name !== 'AbortError') {
                        console.error('Failed to load search index:', error);
                    }
                    
                    searchDataPromise = null; // Reset on error to allow retry
                    abortController = null;
                    
                    if (!isDestroyed && searchResults && error.name !== 'AbortError') {
                        const errorMessage = error.name === 'AbortError' 
                            ? t('search_timeout', 'Search request timeout')
                            : t('search_error', 'Search unavailable');
                        searchResults.innerHTML = `<div class="search-no-results">${errorMessage}</div>`;
                        searchResults.hidden = false;
                    }
                    throw error;
                }
            })();
            
            return searchDataPromise;
        };
        
        // Simple search function with rate limiting
        const simpleSearch = (query, pages) => {
            // Rate limiting check
            const now = Date.now();
            if (now - lastSearchTime < RATE_LIMIT_MS) {
                // Too fast, use cached results or wait
                return [];
            }
            lastSearchTime = now;
            
            const lowerQuery = query.toLowerCase();
            const results = [];
            
            for (const page of pages) {
                let score = 0;
                
                // Search in title (highest priority)
                if (page.title.toLowerCase().includes(lowerQuery)) {
                    score += 10;
                }
                
                // Search in description
                if (page.description && page.description.toLowerCase().includes(lowerQuery)) {
                    score += 5;
                }
                
                // Search in content
                if (page.content.toLowerCase().includes(lowerQuery)) {
                    score += 1;
                }
                
                // Search in headings
                if (page.headings && page.headings.some(h => h.toLowerCase().includes(lowerQuery))) {
                    score += 3;
                }
                
                if (score > 0) {
                    results.push({ ...page, score });
                }
            }
            
            // Sort by score
            return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
        };
        
        // Highlight matches - SECURITY: Prevent XSS and regex injection
        const highlightMatches = (text, query) => {
            if (!query || !text) return text;
            
            // Escape special regex characters in query to prevent regex injection
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Validate the escaped query length to prevent ReDoS attacks
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
                
                // Escape HTML first to prevent XSS
                const escapedText = text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
                
                // Then highlight matches - the span is safe since escapedText is already escaped
                return escapedText.replace(regex, '<span class="search-result-match">$1</span>');
            } catch (error) {
                console.error('Error creating regex:', error);
                // Return escaped text without highlighting if regex fails
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }
        };
        
        // Perform search with race condition protection
        const performSearch = async (query) => {
            // Check if destroyed
            if (isDestroyed) return;
            
            if (!query || query.length < MIN_QUERY_LENGTH) {
                searchResults.hidden = true;
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
                searchInput.setAttribute('aria-expanded', 'false');
                return;
            }
            
            // Store query timestamp to detect race conditions
            const queryTimestamp = Date.now();
            
            // Load data if not available
            if (!searchData) {
                searchResults.innerHTML = `<div class="search-loading">${t('search_loading', 'Loading...')}</div>`;
                searchResults.hidden = false;
                searchInput.setAttribute('aria-expanded', 'true');
                
                try {
                    await loadSearchIndex();
                } catch (error) {
                    // Error already handled in loadSearchIndex
                    return;
                }
                
                // RACE CONDITION CHECK: After async operation, verify query hasn't changed
                if (isDestroyed) return;
                if (searchInput.value.trim() !== query) {
                    // User typed something else, abort this search
                    return;
                }
            }
            
            const results = simpleSearch(query, searchData);
            
            // RACE CONDITION CHECK: Verify query is still current before rendering
            if (isDestroyed) return;
            const currentQuery = searchInput.value.trim();
            if (currentQuery !== query) {
                // Query changed during search, don't show stale results
                return;
            }
            
            if (results.length === 0) {
                searchResults.innerHTML = `<div class="search-no-results">${t('search_no_results', 'No results found')}</div>`;
                searchResults.hidden = false;
                searchResults.style.display = 'block';
                return;
            }
            
            // Render results
            const html = results.map((page, index) => {
                const title = highlightMatches(page.title, query);
                const description = highlightMatches(
                    page.description || page.content.substring(0, 150) + '...',
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
        
        // Debounce search with proper cleanup and race condition protection
        let currentSearchId = 0; // Track search operations
        
        searchInput.addEventListener('input', (e) => {
            // Clear any pending search
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                searchTimeout = null;
            }
            
            const query = e.target.value.trim();
            
            // If query is empty or too short, clear immediately
            if (query.length < MIN_QUERY_LENGTH) {
                currentSearchId++; // Invalidate any pending searches
                performSearch(query); // Will clear the results
                return;
            }
            
            // Increment search ID to invalidate previous searches
            const searchId = ++currentSearchId;
            
            // Debounce actual search
            searchTimeout = setTimeout(() => {
                searchTimeout = null;
                // Only perform search if this is still the current search
                if (searchId === currentSearchId) {
                    performSearch(query);
                }
            }, DEBOUNCE_DELAY);
        });
        
        // Load index on first focus
        searchInput.addEventListener('focus', () => {
            if (!isDestroyed) {
                loadSearchIndex();
            }
        });
        
        // Close on blur (with delay to allow clicks on results)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                searchResults.hidden = true;
                searchResults.style.display = 'none';
            }, CONFIG.UI.BLUR_DELAY);
        });
        
        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const items = searchResults.querySelectorAll('.search-result-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                setActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
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
                // Set ARIA attributes for screen readers
                item.setAttribute('aria-selected', isActive);
            });
            if (items[currentFocus]) {
                items[currentFocus].scrollIntoView({ block: 'nearest' });
            }
        };
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.hidden = true;
                searchResults.style.display = 'none';
            }
        });
    }

    // Navigation
    setupNavigation() {
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
                    
                    // Update URL without reloading the page
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });

        // Handle active state for navigation
        this.updateActiveNavigation();
        window.addEventListener('scroll', this.debounce(() => {
            this.updateActiveNavigation();
        }, 100));
    }

    updateActiveNavigation() {
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
    }

    // Accessibility
    setupAccessibility() {
        // Skip link for screen readers
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

        // ARIA labels
        if (this.sidebarToggle) {
            this.sidebarToggle.setAttribute('aria-label', 'Toggle sidebar navigation');
            this.sidebarToggle.setAttribute('aria-expanded', 'false');
        }

        if (this.searchInput) {
            this.searchInput.setAttribute('aria-label', t('aria_search', 'Search documentation'));
        }

        // Focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    closeModals() {
        // Close sidebar if open
        if (this.sidebar && this.sidebar.classList.contains('open')) {
            this.sidebar.classList.remove('open');
            this.mobileOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
        
        // Hide search results
        this.hideSearchResults();
        if (this.searchInput) {
            this.searchInput.blur();
        }
    }

    // Code blocks - Use event delegation for better performance
    setupCodeBlocks() {
        // Initialize highlight.js for syntax highlighting
        if (typeof hljs !== 'undefined') {
            // Configure highlight.js
            hljs.configure({
                ignoreUnescapedHTML: true,
                languages: ['javascript', 'python', 'java', 'html', 'css', 'bash', 'sh', 'shell', 'json', 'yaml', 'yml', 'xml', 'sql', 'typescript', 'ts', 'php', 'ruby', 'go', 'rust', 'c', 'cpp', 'csharp', 'cs', 'plaintext', 'text']
            });
            
            // Register language aliases
            hljs.registerAliases('sh', {languageName: 'bash'});
            hljs.registerAliases('shell', {languageName: 'bash'});
            hljs.registerAliases('yml', {languageName: 'yaml'});
            hljs.registerAliases('ts', {languageName: 'typescript'});
            hljs.registerAliases('cs', {languageName: 'csharp'});
            
            // Languages to exclude from highlighting (keep plain)
            const excludedLanguages = ['markdown', 'md', 'text', 'plaintext', 'txt'];
            
            // Highlight all code blocks
            document.querySelectorAll('pre code').forEach((block) => {
                // Get language from class
                const classList = block.className.split(' ');
                const langClass = classList.find(cls => cls.startsWith('language-'));
                
                if (langClass) {
                    const lang = langClass.replace('language-', '');
                    
                    // Skip highlighting for excluded languages
                    if (excludedLanguages.includes(lang.toLowerCase())) {
                        block.className = `language-${lang} nohighlight`;
                        return;
                    }
                    
                    // Ensure the language is set correctly
                    block.className = `language-${lang}`;
                }
                
                hljs.highlightElement(block);
            });
        }

        // Single event listener using event delegation
        document.addEventListener('click', async (e) => {
            const button = e.target.closest('.code-copy');
            if (!button) return;

            const codeBlock = button.closest('.code-block');
            if (!codeBlock) return;

            const code = codeBlock.querySelector('code');
            if (!code) return;

            const text = code.textContent;

            try {
                await navigator.clipboard.writeText(text);
                this.showToast('Code copied to clipboard!', 'success');
                
                // Visual feedback
                const originalHTML = button.innerHTML;
                button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
                this.showToast('Failed to copy code', 'error');
            }
        });
    }

    // Table of contents
    setupTableOfContents() {
        const toc = document.querySelector('.table-of-contents');
        if (!toc) return;

        // Genera automaticamente il TOC se non esiste
        const headings = document.querySelectorAll('h2, h3');
        if (headings.length > 0 && !toc.querySelector('.toc-list').children.length) {
            const tocList = toc.querySelector('.toc-list');
            
            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();

            headings.forEach(heading => {
                if (!heading.id) {
                    heading.id = heading.textContent.toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .replace(/\s+/g, '-');
                }

                const level = heading.tagName === 'H2' ? '' : '  ';
                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.textContent = level + heading.textContent;
                
                const li = document.createElement('li');
                li.appendChild(link);
                fragment.appendChild(li);
            });
            
            // Single DOM update instead of multiple appendChild calls
            tocList.appendChild(fragment);
        }

        // Highlight current section in TOC
        window.addEventListener('scroll', this.debounce(() => {
            this.updateTOCHighlight();
        }, 100));
    }

    updateTOCHighlight() {
        const tocLinks = document.querySelectorAll('.toc-list a');
        const sections = document.querySelectorAll('h2[id], h3[id]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const headerHeight = document.querySelector('.header').offsetHeight;
            
            if (rect.top <= headerHeight + CONFIG.UI.TOC_SCROLL_OFFSET) {
                currentSection = section.id;
            }
        });

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                if (this.sidebarToggle) {
                    this.sidebarToggle.click();
                }
            }
        });
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showToast(message, type = 'info') {
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

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, CONFIG.UI.TOAST_ANIMATION_DELAY);

        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, CONFIG.UI.TOAST_FADE_OUT_DELAY);
        }, CONFIG.UI.TOAST_DURATION);
    }

    // Theme toggle functionality
    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (!themeToggle) return;

        // Safe localStorage access with fallback
        const getStoredTheme = () => {
            try {
                return localStorage.getItem('theme');
            } catch (e) {
                console.warn('localStorage not available:', e);
                return null;
            }
        };
        
        const setStoredTheme = (theme) => {
            try {
                localStorage.setItem('theme', theme);
            } catch (e) {
                console.warn('Cannot save theme preference:', e);
            }
        };

        // Initialize theme from localStorage or system preference
        const savedTheme = getStoredTheme();
        
        // Check if matchMedia is supported (for older browsers)
        let systemTheme = 'light';
        if (window.matchMedia) {
            systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        const currentTheme = savedTheme || systemTheme;
        
        this.setTheme(currentTheme);

        // Toggle theme on button click
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            setStoredTheme(newTheme);
            
            // Show feedback
            this.showToast(`Switched to ${newTheme} mode`, 'success');
        });

        // Listen for system theme changes (if supported)
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!getStoredTheme()) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Set theme helper function
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.setAttribute('data-theme', theme);
            themeToggle.setAttribute('aria-label', 
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
        
        // Update logos based on theme
        this.updateLogosForTheme(theme);
        
        // Update highlight.js theme
        this.updateHighlightTheme(theme);
    }

    // Update highlight.js theme dynamically
    updateHighlightTheme(theme) {
        // Remove existing highlight.js theme links
        const existingLinks = document.querySelectorAll('link[href*="highlight.js"]');
        existingLinks.forEach(link => {
            if (link.media && link.media !== 'all') {
                link.remove();
            }
        });

        // Add the correct theme
        const themeUrl = theme === 'dark' 
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = themeUrl;
        document.head.appendChild(link);
        
        // Re-highlight all code blocks with new theme
        if (typeof hljs !== 'undefined') {
            const excludedLanguages = ['markdown', 'md', 'text', 'plaintext', 'txt'];
            
            document.querySelectorAll('pre code').forEach((block) => {
                // Get original language class
                const classList = block.className.split(' ');
                const langClass = classList.find(cls => cls.startsWith('language-'));
                
                if (langClass) {
                    const lang = langClass.replace('language-', '');
                    
                    // Skip re-highlighting for excluded languages
                    if (excludedLanguages.includes(lang.toLowerCase())) {
                        block.className = `language-${lang} nohighlight`;
                        return;
                    }
                    
                    block.className = langClass;
                } else {
                    block.className = '';
                }
                
                // Re-highlight
                hljs.highlightElement(block);
            });
        }
    }

    // Update logos based on current theme
    updateLogosForTheme(theme) {
        const logos = document.querySelectorAll('.logo-img, .footer-logo');
        
        logos.forEach(logo => {
            const lightSrc = logo.getAttribute('data-logo-light');
            const darkSrc = logo.getAttribute('data-logo-dark');
            
            if (theme === 'dark' && darkSrc) {
                logo.src = darkSrc;
            } else if (lightSrc) {
                logo.src = lightSrc;
            }
        });
    }

    // Cookie consent
    setupCookieConsent() {
        const cookieBanner = document.getElementById('cookieBanner');
        const cookieAcceptBtn = document.getElementById('cookieAcceptBtn');
        const cookieDeclineBtn = document.getElementById('cookieDeclineBtn');
        const cookieConsentBtn = document.getElementById('cookieConsentBtn');

        if (!cookieBanner) return;

        // Safe localStorage helpers
        const getCookieConsent = () => {
            try {
                return localStorage.getItem('cookieConsent');
            } catch (e) {
                console.warn('localStorage not available:', e);
                return null;
            }
        };
        
        const setCookieConsent = (value) => {
            try {
                localStorage.setItem('cookieConsent', value);
                return true;
            } catch (e) {
                console.warn('Cannot save cookie consent:', e);
                return false;
            }
        };

        // Check if user has already given consent
        const hasConsented = getCookieConsent();
        
        if (!hasConsented) {
            // Show banner after a brief delay
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, CONFIG.UI.COOKIE_BANNER_DELAY);
        }

        // Handle acceptance
        if (cookieAcceptBtn) {
            cookieAcceptBtn.addEventListener('click', () => {
                if (setCookieConsent('accepted')) {
                    cookieBanner.classList.remove('show');
                    this.showToast('Cookie preferences saved', 'success');
                } else {
                    this.showToast('Could not save preferences', 'error');
                }
            });
        }

        // Handle decline
        if (cookieDeclineBtn) {
            cookieDeclineBtn.addEventListener('click', () => {
                if (setCookieConsent('declined')) {
                    cookieBanner.classList.remove('show');
                    this.showToast('Non-essential cookies disabled', 'success');
                } else {
                    cookieBanner.classList.remove('show');
                    this.showToast('Preferences not saved (storage disabled)', 'error');
                }
            });
        }

        // Handle manage cookies button
        if (cookieConsentBtn) {
            cookieConsentBtn.addEventListener('click', () => {
                // Show banner again to allow changing preferences
                cookieBanner.classList.add('show');
            });
        }
    }

    // Sitemap generation
    setupSitemapGeneration() {
        const sitemapBtn = document.getElementById('sitemapGenerateBtn');
        if (!sitemapBtn) return;

        sitemapBtn.addEventListener('click', () => {
            if (window.chironConfig && window.chironConfig.generateSitemap) {
                window.chironConfig.generateSitemap();
            } else {
                console.warn('ChironConfig not available for sitemap generation');
            }
        });
    }

    // Robots.txt generation
    setupRobotsGeneration() {
        const robotsBtn = document.getElementById('robotsGenerateBtn');
        if (!robotsBtn) return;

        robotsBtn.addEventListener('click', () => {
            if (window.chironConfig && window.chironConfig.generateRobotsTxt) {
                window.chironConfig.generateRobotsTxt();
            } else {
                console.warn('ChironConfig not available for robots.txt generation');
            }
        });
    }

    // Developer tools
    setupDeveloperTools() {
        const developerTools = document.getElementById('developerTools');
        if (!developerTools) return;

        // Show/hide developer tools with Ctrl+Shift+D
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

        // Add dark mode styles for developer tools
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
    }

    // Scroll to Top Button - WCAG 2.2 AA Compliant
    setupScrollToTop() {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (!scrollToTopBtn) return;

        // Show/hide button based on scroll position
        const toggleScrollButton = () => {
            if (window.pageYOffset > CONFIG.UI.SCROLL_TO_TOP_THRESHOLD) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        };

        // Smooth scroll to top
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };

        // Event listeners
        window.addEventListener('scroll', toggleScrollButton, { passive: true });
        scrollToTopBtn.addEventListener('click', scrollToTop);

        // Keyboard accessibility
        scrollToTopBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToTop();
            }
        });

        // Initial state
        toggleScrollButton();
    }

    // Tabs Component - Accessible tab interface
    setupTabs() {
        const tabContainers = document.querySelectorAll('.tabs-container');
        if (tabContainers.length === 0) return;

        tabContainers.forEach(container => {
            const tabButtons = container.querySelectorAll('.tab-button');
            const tabPanels = container.querySelectorAll('.tab-panel');

            if (tabButtons.length === 0 || tabPanels.length === 0) return;

            // Switch to a specific tab
            const switchTab = (index) => {
                // Deactivate all tabs
                tabButtons.forEach((btn, i) => {
                    const isActive = i === index;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-selected', isActive.toString());
                    btn.setAttribute('tabindex', isActive ? '0' : '-1');
                });

                // Show only the active panel
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

            // Click handler
            tabButtons.forEach((button, index) => {
                button.addEventListener('click', () => {
                    switchTab(index);
                });

                // Keyboard navigation (Arrow keys)
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

            // Initialize first tab as active
            if (tabButtons.length > 0) {
                switchTab(0);
            }
        });
    }

}

// DocumentationApp class ends here
// Note: DocumentationApp is now initialized after configuration is loaded

// Service Worker removed - PWA features not needed for now
