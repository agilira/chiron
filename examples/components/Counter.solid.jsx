/**
 * Solid Counter Component
 * Filename pattern: *.solid.jsx to distinguish from Preact/React
 */
import { createSignal } from 'solid-js';

export default function SolidCounter(props) {
  const initialValue = parseInt(props.initialCount) || 0;
  const stepValue = parseInt(props.step) || 1;
  
  const [count, setCount] = createSignal(initialValue);

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #2C4F7C',
      'border-radius': '8px',
      'text-align': 'center',
      'max-width': '300px',
      margin: '20px auto',
      'background-color': '#f8f9fa',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Solid Counter</h3>
      <div style={{
        'font-size': '48px',
        'font-weight': 'bold',
        color: '#2C4F7C',
        margin: '20px 0'
      }}>
        {count()}
      </div>
      <div style={{ display: 'flex', gap: '10px', 'justify-content': 'center' }}>
        <button
          onClick={() => setCount(count() - stepValue)}
          style={{
            padding: '10px 20px',
            'font-size': '18px',
            'background-color': '#E74C3C',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          −{stepValue}
        </button>
        <button
          onClick={() => setCount(initialValue)}
          style={{
            padding: '10px 20px',
            'font-size': '18px',
            'background-color': '#95A5A6',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count() + stepValue)}
          style={{
            padding: '10px 20px',
            'font-size': '18px',
            'background-color': '#2ECC71',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          +{stepValue}
        </button>
      </div>
      <p style={{ 'margin-top': '15px', 'font-size': '12px', color: '#7F8C8D' }}>
        Step: {stepValue} | Initial: {props.initialCount}
      </p>
    </div>
  );
}
