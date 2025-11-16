/**
 * Code Blocks Component - Syntax highlighting and copy button
 * Detects: pre code, .code-copy
 * 
 * @component code-blocks
 */

// Initialize highlight.js
(() => {
  if (typeof hljs === 'undefined') {return;}
    
  hljs.configure({
    ignoreUnescapedHTML: true,
    languages: ['javascript', 'python', 'java', 'html', 'css', 'bash', 'sh', 'shell', 'json', 'yaml', 'yml', 'xml', 'sql', 'typescript', 'ts', 'php', 'ruby', 'go', 'rust', 'c', 'cpp', 'csharp', 'cs', 'plaintext', 'text']
  });
    
  hljs.registerAliases('sh', {languageName: 'bash'});
  hljs.registerAliases('shell', {languageName: 'bash'});
  hljs.registerAliases('yml', {languageName: 'yaml'});
  hljs.registerAliases('ts', {languageName: 'typescript'});
  hljs.registerAliases('cs', {languageName: 'csharp'});
  hljs.registerAliases(['markdown', 'md'], {languageName: 'html'});
    
  const excludedLanguages = ['text', 'plaintext', 'txt'];
    
  document.querySelectorAll('pre code').forEach((block) => {
    const classList = block.className.split(' ');
    const langClass = classList.find(cls => cls.startsWith('language-'));
        
    if (langClass) {
      const lang = langClass.replace('language-', '');
      const normalizedLang = lang.toLowerCase();
      if (excludedLanguages.includes(normalizedLang)) {
        block.className = `language-${lang} nohighlight`;
        return;
      }
      const mappedLang = hljs.getLanguage(lang) ? lang : hljs.getLanguage(normalizedLang) ? normalizedLang : (normalizedLang === 'markdown' || normalizedLang === 'md') ? 'html' : lang;
      block.className = `language-${mappedLang}`;
      if (mappedLang !== lang) {
        block.classList.add(`language-${lang}`);
      }
    }
        
    hljs.highlightElement(block);
  });
})();

// Copy button functionality
document.addEventListener('click', async (e) => {
  const button = e.target.closest('.code-copy');
  if (!button) {return;}

  const codeBlock = button.closest('.code-block');
  if (!codeBlock) {return;}

  const code = codeBlock.querySelector('code');
  if (!code) {return;}

  const text = code.textContent;

  try {
    await navigator.clipboard.writeText(text);
    showToast(t('code_copy_success', 'Code copied to clipboard!'), 'success');
        
    const originalHTML = button.innerHTML;
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    button.classList.add('copied');
        
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
    showToast(t('code_copy_failed', 'Failed to copy code'), 'error');
  }
});
