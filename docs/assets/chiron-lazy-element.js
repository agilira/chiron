/**
 * Chiron Lazy Custom Element
 * Simplified syntax for lazy loading with Web Components
 * 
 * Usage:
 * <chiron-lazy strategy="visible" scripts="app.js" skeleton="card">
 *   <div id="app"></div>
 * </chiron-lazy>
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

(function() {
  'use strict';

  // Skeleton templates
  const SKELETON_TEMPLATES = {
    card: `
      <div class="chiron-skeleton-heading"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-button"></div>
    `,
    
    dashboard: `
      <div class="chiron-skeleton-card"></div>
      <div class="chiron-skeleton-card"></div>
      <div class="chiron-skeleton-card"></div>
      <div class="chiron-skeleton-card"></div>
    `,
    
    list: `
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
    `,
    
    profile: `
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
        <div class="chiron-skeleton-avatar"></div>
        <div style="flex: 1;">
          <div class="chiron-skeleton-heading" style="width: 200px;"></div>
          <div class="chiron-skeleton-text" style="width: 150px;"></div>
        </div>
      </div>
      <div class="chiron-skeleton-text"></div>
      <div class="chiron-skeleton-text"></div>
    `,
    
    form: `
      <div class="chiron-skeleton-heading" style="width: 150px; margin-bottom: 1.5rem;"></div>
      <div class="chiron-skeleton-text" style="height: 2.5rem; margin-bottom: 1rem;"></div>
      <div class="chiron-skeleton-text" style="height: 2.5rem; margin-bottom: 1rem;"></div>
      <div class="chiron-skeleton-text" style="height: 2.5rem; margin-bottom: 1rem;"></div>
      <div class="chiron-skeleton-button"></div>
    `,
    
    chart: `
      <div class="chiron-skeleton-heading" style="width: 200px; margin-bottom: 1rem;"></div>
      <div class="chiron-skeleton-box" style="height: 300px;"></div>
    `,
    
    none: ''
  };

  /**
   * ChironLazy Custom Element
   */
  class ChironLazyElement extends HTMLElement {
    constructor() {
      super();
      this.isInitialized = false;
    }

    connectedCallback() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Get attributes
      const strategy = this.getAttribute('strategy') || 'visible';
      const scripts = this.getAttribute('scripts') || '';
      const styles = this.getAttribute('styles') || '';
      const skeleton = this.getAttribute('skeleton') || 'card';
      const minHeight = this.getAttribute('min-height') || '200px';

      // Store original content
      const originalContent = this.innerHTML;

      // Build wrapper structure
      this.innerHTML = this.buildStructure(skeleton, originalContent);

      // Set minimum height
      this.style.minHeight = minHeight;
      this.style.position = 'relative';
      this.style.display = 'block';

      // Set data attributes for lazy loader
      this.setAttribute('data-chiron-lazy', strategy);
      if (scripts) this.setAttribute('data-chiron-scripts', scripts);
      if (styles) this.setAttribute('data-chiron-styles', styles);

      // Trigger lazy loader initialization if available
      if (window.ChironLazyLoader) {
        const scriptsArray = scripts ? scripts.split(',').map(s => s.trim()) : [];
        const stylesArray = styles ? styles.split(',').map(s => s.trim()) : [];
        window.ChironLazyLoader.setupLazyLoad(this, strategy, scriptsArray, stylesArray);
      }
    }

    buildStructure(skeletonType, content) {
      const skeletonHTML = SKELETON_TEMPLATES[skeletonType] || SKELETON_TEMPLATES.card;
      
      return `
        <div class="chiron-skeleton">
          ${skeletonHTML}
        </div>
        <div class="chiron-lazy-content">
          ${content}
        </div>
      `;
    }
  }

  // Register custom element
  if ('customElements' in window) {
    customElements.define('chiron-lazy', ChironLazyElement);
  } else {
    console.warn('[Chiron] Custom Elements not supported in this browser');
  }

  // Framework shortcuts
  class ChironLazyReact extends ChironLazyElement {
    connectedCallback() {
      // Auto-add React scripts
      const appScript = this.getAttribute('app') || '';
      const reactVersion = this.getAttribute('react-version') || '18';
      
      const scripts = [
        `https://unpkg.com/react@${reactVersion}/umd/react.production.min.js`,
        `https://unpkg.com/react-dom@${reactVersion}/umd/react-dom.production.min.js`,
        appScript ? `assets/${appScript}` : ''
      ].filter(Boolean).join(',');
      
      this.setAttribute('scripts', scripts);
      
      super.connectedCallback();
    }
  }

  class ChironLazyVue extends ChironLazyElement {
    connectedCallback() {
      const appScript = this.getAttribute('app') || '';
      const vueVersion = this.getAttribute('vue-version') || '3';
      
      const scripts = [
        `https://unpkg.com/vue@${vueVersion}/dist/vue.global.prod.js`,
        appScript ? `assets/${appScript}` : ''
      ].filter(Boolean).join(',');
      
      this.setAttribute('scripts', scripts);
      
      super.connectedCallback();
    }
  }

  class ChironLazyAlpine extends ChironLazyElement {
    connectedCallback() {
      const alpineVersion = this.getAttribute('alpine-version') || '3';
      
      this.setAttribute('scripts', `https://unpkg.com/alpinejs@${alpineVersion}/dist/cdn.min.js`);
      this.setAttribute('skeleton', this.getAttribute('skeleton') || 'none');
      
      super.connectedCallback();
    }
  }

  // Register framework shortcuts
  if ('customElements' in window) {
    customElements.define('chiron-lazy-react', ChironLazyReact);
    customElements.define('chiron-lazy-vue', ChironLazyVue);
    customElements.define('chiron-lazy-alpine', ChironLazyAlpine);
  }

})();
