/**
 * Chart Component - Simple bar/line chart visualization
 * @component
 */
import { h } from 'preact';

/**
 * Chart component for data visualization
 * @param {Object} props - Component props
 * @param {number[]} [props.data=[]] - Array of numeric data points
 * @param {string} [props.type='bar'] - Chart type: 'bar' or 'line'
 * @returns {import('preact').VNode}
 */
export default function Chart({ data = [], type = 'bar' }) {
  // Parse data if it's a string (from JSON serialization)
  const dataArray = typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
  
  // Safety check
  if (!dataArray.length) {
    return h('div', { 
      className: 'chart-widget',
      style: { 
        padding: '20px', 
        textAlign: 'center',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        color: '#999'
      } 
    }, 'No data to display');
  }

  const maxValue = Math.max(...dataArray, 1);
  const chartType = type || 'bar';

  // Generate bars or line points
  const renderVisualization = () => {
    if (chartType === 'line') {
      // Line chart using SVG
      const width = 400;
      const height = 200;
      const padding = 20;
      const stepX = (width - 2 * padding) / (dataArray.length - 1 || 1);
      
      const points = dataArray.map((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - ((value / maxValue) * (height - 2 * padding));
        return `${x},${y}`;
      }).join(' ');

      return h('svg', {
        width: width,
        height: height,
        style: { display: 'block', margin: '0 auto' }
      }, [
        // Grid lines
        ...dataArray.map((_, index) => {
          const x = padding + index * stepX;
          return h('line', {
            key: `grid-${index}`,
            x1: x,
            y1: padding,
            x2: x,
            y2: height - padding,
            stroke: '#e0e0e0',
            strokeWidth: 1
          });
        }),
        // Data line
        h('polyline', {
          points: points,
          fill: 'none',
          stroke: '#4A90E2',
          strokeWidth: 3,
          strokeLinejoin: 'round'
        }),
        // Data points
        ...dataArray.map((value, index) => {
          const x = padding + index * stepX;
          const y = height - padding - ((value / maxValue) * (height - 2 * padding));
          return h('circle', {
            key: `point-${index}`,
            cx: x,
            cy: y,
            r: 5,
            fill: '#4A90E2'
          });
        })
      ]);
    } else {
      // Bar chart
      return h('div', {
        className: 'chart-bars',
        style: {
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: '200px',
          padding: '10px',
          gap: '10px'
        }
      }, dataArray.map((value, index) => {
        const percentage = (value / maxValue) * 100;
        return h('div', {
          key: `bar-${index}`,
          className: 'chart-bar',
          style: {
            flex: 1,
            height: `${percentage}%`,
            backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`,
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            minHeight: '30px'
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }, [
          h('span', {
            style: {
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }
          }, value),
          h('span', {
            style: {
              color: 'white',
              fontSize: '10px'
            }
          }, `#${index + 1}`)
        ]);
      }));
    }
  };

  return h('div', {
    className: 'chart-widget',
    style: {
      padding: '20px',
      border: '2px solid #9B59B6',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      maxWidth: '500px',
      margin: '20px auto'
    }
  }, [
    h('h3', { 
      style: { 
        margin: '0 0 15px 0', 
        color: '#333',
        textAlign: 'center'
      } 
    }, `${chartType === 'line' ? 'Line' : 'Bar'} Chart`),
    renderVisualization(),
    h('div', {
      className: 'chart-legend',
      style: {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#ecf0f1',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#7F8C8D',
        textAlign: 'center'
      }
    }, [
      h('strong', null, 'Data: '),
      dataArray.join(', '),
      h('span', { style: { marginLeft: '10px' } }, `| Max: ${maxValue}`)
    ])
  ]);
}
