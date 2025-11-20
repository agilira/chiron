/**
 * Code Blocks Component - Copy button only
 * Detects: pre code, .code-copy
 * 
 * @component code-blocks
 */

// Copy button functionality
document.addEventListener('click', async (e) => {
  const button = e.target.closest('.code-copy');
  if (!button) {return;}

  const codeBlock = button.closest('.code-block');
  if (!codeBlock) {return;}

  const code = codeBlock.querySelector('code');
  if (!code) {return;}

  const text = code.textContent;
  const originalHTML = button.innerHTML;
  const originalLabel = button.getAttribute('aria-label');

  try {
    await navigator.clipboard.writeText(text);
    
    // Success state - checkmark icon
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    button.classList.add('copied');
    button.setAttribute('aria-label', t('code_copied', 'Code copied'));
        
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
      button.setAttribute('aria-label', originalLabel || t('code_copy', 'Copy code'));
    }, 2000);
  } catch (_err) {
    console.error('Failed to copy code to clipboard');
    
    // Error state: X icon in lighter red with clear visual feedback
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>';
    button.classList.add('copy-error');
    button.setAttribute('aria-label', t('code_copy_failed', 'Copy failed'));
    
    // Reset after 3 seconds (longer for error visibility)
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copy-error');
      button.setAttribute('aria-label', originalLabel || t('code_copy', 'Copy code'));
    }, 3000);
  }
});
