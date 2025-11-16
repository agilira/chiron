/**
 * Core Component - Base initialization and utilities
 * Required for all pages
 * 
 * @component core
 * @required
 */

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
// eslint-disable-next-line no-redeclare, no-unused-vars
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
// eslint-disable-next-line no-redeclare, no-unused-vars
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};
