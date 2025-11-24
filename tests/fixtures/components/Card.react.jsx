import { createElement } from 'react';

export default function Card({ title, children }) {
  return createElement('div', { 
    className: 'card',
    style: {
      border: '2px solid #4a90e2',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }
  }, [
    title && createElement('h3', { 
      key: 'title',
      style: { 
        margin: '0 0 15px 0',
        color: '#4a90e2',
        fontSize: '1.5rem'
      }
    }, title),
    createElement('div', { 
      key: 'content',
      className: 'card-content'
    }, children)
  ]);
}
