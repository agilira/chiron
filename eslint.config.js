// eslint.config.js - ESLint 9+ Flat Config
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  // Base configuration for Node.js files
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'indent': ['error', 2],
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['error', 'always'],
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'comma-dangle': ['error', 'never'],
      'arrow-spacing': 'error',
      'keyword-spacing': 'error',
      'space-before-blocks': 'error',
      'space-infix-ops': 'error'
    }
  },
  // Browser environment for js-components
  {
    files: ['builder/js-components/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        history: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        AbortController: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        // External libraries (loaded via CDN)
        hljs: 'readonly',
        CONFIG: 'writable',
        // Utility functions from core.js or base.js
        t: 'writable',
        debounce: 'writable',
        showToast: 'writable',
        hashCode: 'writable'
      }
    }
  },
  {
    ignores: ['node_modules/**', 'docs/**', 'coverage/**', '**/*.min.js', '**/*.ejs']
  }
];
