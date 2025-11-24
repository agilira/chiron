/**
 * React Counter Component
 * Filename pattern: *.react.jsx to distinguish from Preact
 */
import React, { useState } from 'react';

export default function ReactCounter({ initialCount = 0, step = 1 }) {
  const [count, setCount] = useState(parseInt(initialCount) || 0);
  const stepValue = parseInt(step) || 1;

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #61DAFB',
      borderRadius: '8px',
      textAlign: 'center',
      maxWidth: '300px',
      margin: '20px auto',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>React Counter</h3>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#61DAFB',
        margin: '20px 0'
      }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setCount(count - stepValue)}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            backgroundColor: '#E74C3C',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          −{stepValue}
        </button>
        <button
          onClick={() => setCount(parseInt(initialCount) || 0)}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            backgroundColor: '#95A5A6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + stepValue)}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            backgroundColor: '#2ECC71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          +{stepValue}
        </button>
      </div>
      <p style={{ marginTop: '15px', fontSize: '12px', color: '#7F8C8D' }}>
        Step: {stepValue} | Initial: {initialCount}
      </p>
    </div>
  );
}
