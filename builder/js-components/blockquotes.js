/**
 * Blockquotes Component - Auto-detect type from first bold word
 * Detects: .content blockquote
 * 
 * @component blockquotes
 */

(() => {
  const blockquotes = document.querySelectorAll('.content blockquote');
  if (blockquotes.length === 0) {return;}
    
  blockquotes.forEach(blockquote => {
    const firstP = blockquote.querySelector('p:first-child');
    if (!firstP) {return;}
        
    const firstStrong = firstP.querySelector('strong:first-child');
    if (!firstStrong) {return;}
        
    const keyword = firstStrong.textContent.trim().toLowerCase().replace(':', '');
        
    const typeMap = {
      'note': 'note',
      'info': 'info',
      'warning': 'warning',
      'caution': 'warning',
      'success': 'success',
      'tip': 'tip',
      'error': 'error',
      'danger': 'danger',
      'important': 'important'
    };
        
    if (typeMap[keyword]) {
      blockquote.classList.add(typeMap[keyword]);
    }
  });
})();
