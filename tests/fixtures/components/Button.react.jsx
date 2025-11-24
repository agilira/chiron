import { createElement, useState } from 'react';

export default function Button({ label = 'Click me', variant = 'primary' }) {
  const [clicks, setClicks] = useState(0);
  
  const colors = {
    primary: '#4a90e2',
    success: '#27ae60',
    danger: '#e74c3c'
  };
  
  return createElement('div', {
    style: { margin: '10px 0' }
  }, [
    createElement('button', {
      key: 'btn',
      onClick: () => setClicks(clicks + 1),
      style: {
        backgroundColor: colors[variant] || colors.primary,
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        transition: 'all 0.2s'
      },
      onMouseEnter: (e) => e.target.style.opacity = '0.8',
      onMouseLeave: (e) => e.target.style.opacity = '1'
    }, `${label} (${clicks})`),
    clicks > 0 && createElement('span', {
      key: 'info',
      style: { 
        marginLeft: '10px',
        color: '#666',
        fontSize: '0.9rem'
      }
    }, `Clicked ${clicks} times!`)
  ]);
}
