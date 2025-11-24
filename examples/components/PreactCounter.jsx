/**
 * Counter Component - Interactive counter with configurable step
 * @component
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';

/**
 * Counter component with increment/decrement functionality
 * @param {Object} props - Component props
 * @param {number} [props.initialCount=0] - Starting count value
 * @param {number} [props.step=1] - Amount to increment/decrement
 * @returns {import('preact').VNode}
 */
export default function Counter({ initialCount = 0, step = 1 }) {
  const [count, setCount] = useState(parseInt(initialCount) || 0);
  const stepValue = parseInt(step) || 1;

  return h('div', { 
    className: 'counter-widget',
    style: {
      padding: '20px',
      border: '2px solid #4A90E2',
      borderRadius: '8px',
      textAlign: 'center',
      maxWidth: '300px',
      margin: '20px auto',
      backgroundColor: '#f8f9fa'
    }
  }, [
    h('h3', { style: { margin: '0 0 15px 0', color: '#333' } }, 'Interactive Counter'),
    h('div', { 
      className: 'counter-display',
      style: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#4A90E2',
        margin: '20px 0'
      }
    }, count),
    h('div', { 
      className: 'counter-controls',
      style: { display: 'flex', gap: '10px', justifyContent: 'center' }
    }, [
      h('button', {
        onClick: () => setCount(count - stepValue),
        style: {
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#E74C3C',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        },
        onMouseEnter: (e) => e.target.style.backgroundColor = '#C0392B',
        onMouseLeave: (e) => e.target.style.backgroundColor = '#E74C3C'
      }, `−${stepValue}`),
      h('button', {
        onClick: () => setCount(parseInt(initialCount) || 0),
        style: {
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#95A5A6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        },
        onMouseEnter: (e) => e.target.style.backgroundColor = '#7F8C8D',
        onMouseLeave: (e) => e.target.style.backgroundColor = '#95A5A6'
      }, 'Reset'),
      h('button', {
        onClick: () => setCount(count + stepValue),
        style: {
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#2ECC71',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        },
        onMouseEnter: (e) => e.target.style.backgroundColor = '#27AE60',
        onMouseLeave: (e) => e.target.style.backgroundColor = '#2ECC71'
      }, `+${stepValue}`)
    ]),
    h('p', { 
      style: { 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#7F8C8D' 
      } 
    }, `Step: ${stepValue} | Initial: ${initialCount}`)
  ]);
}
