/**
 * Info Boxes Component - Dismissible alerts with localStorage
 * Detects: .info-box[data-dismissible]
 * 
 * @component info-boxes
 */

(() => {
  const infoBoxes = document.querySelectorAll('.info-box');
  if (infoBoxes.length === 0) {return;}
    
  infoBoxes.forEach(box => {
    const dismissibleId = box.getAttribute('data-dismissible');
    if (dismissibleId === null) {return;}
        
    const boxId = dismissibleId || `info-box-${hashCode(box.textContent)}`;
        
    if (localStorage.getItem(`dismissed-${boxId}`) === 'true') {
      box.style.display = 'none';
      return;
    }
        
    const closeBtn = document.createElement('button');
    closeBtn.className = 'info-box-close';
    closeBtn.setAttribute('aria-label', t('aria_infobox_close', 'Close'));
    closeBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
    closeBtn.addEventListener('click', () => {
      box.classList.add('dismissing');
      localStorage.setItem(`dismissed-${boxId}`, 'true');
      setTimeout(() => box.remove(), 300);
    });
        
    box.appendChild(closeBtn);
  });
})();
