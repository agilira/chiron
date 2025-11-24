/**
 * Interactive API Explorer - React Demo
 * Demonstrates React integration in a static Chiron site
 */

const { useState, useCallback, useMemo } = React;

// Mock API endpoints for demonstration
const API_ENDPOINTS = {
  getUser: {
    method: 'GET',
    path: '/api/users/{id}',
    description: 'Retrieve user information by ID',
    params: [{ name: 'id', type: 'number', example: '1' }]
  },
  getConfig: {
    method: 'GET',
    path: '/api/config',
    description: 'Get configuration settings',
    params: []
  },
  searchDocs: {
    method: 'GET',
    path: '/api/search?q={query}',
    description: 'Search documentation',
    params: [{ name: 'query', type: 'string', example: 'react' }]
  }
};

// Mock API responses
const MOCK_RESPONSES = {
  getUser: (id) => ({
    id: parseInt(id) || 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'developer',
    created_at: '2024-01-15T10:30:00Z'
  }),
  getConfig: () => ({
    site_name: 'Chiron Documentation',
    version: '2.0.0',
    features: ['search', 'dark-mode', 'analytics'],
    build_time: new Date().toISOString()
  }),
  searchDocs: (query) => ({
    query: query || 'react',
    results: [
      { title: 'React Integration', url: '/react-demo.html', score: 0.95 },
      { title: 'External Scripts', url: '/external-scripts-demo.html', score: 0.82 }
    ],
    total: 2
  })
};

function APIExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('getUser');
  const [paramValue, setParamValue] = useState('1');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [requestTime, setRequestTime] = useState(null);

  // Memoize current endpoint to avoid recalculation
  const endpoint = useMemo(() => API_ENDPOINTS[selectedEndpoint], [selectedEndpoint]);

  // Memoize handler to avoid recreation on every render
  const handleRequest = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setStatus(null);

    const startTime = performance.now();

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

    const endTime = performance.now();
    const responseData = MOCK_RESPONSES[selectedEndpoint](paramValue);

    setResponse(responseData);
    setStatus(200);
    setRequestTime(Math.round(endTime - startTime));
    setLoading(false);
  }, [selectedEndpoint, paramValue]);

  // Handler for endpoint change
  const handleEndpointChange = useCallback((e) => {
    const newEndpoint = e.target.value;
    setSelectedEndpoint(newEndpoint);
    setParamValue(API_ENDPOINTS[newEndpoint].params[0]?.example || '');
    setResponse(null);
    setStatus(null);
  }, []);

  // Handler for parameter value change
  const handleParamChange = useCallback((e) => {
    setParamValue(e.target.value);
  }, []);

  return React.createElement('div', null,
    React.createElement('h2', null, 'Interactive API Explorer'),
    React.createElement('p', null, 'Try live API requests with this React-powered demo'),

    React.createElement('form', { onSubmit: handleRequest },
      React.createElement('div', { className: 'form__group' },
        React.createElement('label', { htmlFor: 'endpoint-select' }, 'Select Endpoint'),
        React.createElement('select', {
          id: 'endpoint-select',
          value: selectedEndpoint,
          onChange: handleEndpointChange
        },
          Object.entries(API_ENDPOINTS).map(([key, ep]) =>
            React.createElement('option', { key, value: key },
              `${ep.method} ${ep.path}`
            )
          )
        )
      ),

      React.createElement('p', { style: { fontSize: '0.875rem', color: 'var(--color-text-muted)' } },
        endpoint.description
      ),

      endpoint.params.length > 0 && endpoint.params.map(param =>
        React.createElement('div', { key: param.name, className: 'form__group' },
          React.createElement('label', { htmlFor: `param-${param.name}` },
            `${param.name} (${param.type})`
          ),
          React.createElement('input', {
            id: `param-${param.name}`,
            type: param.type === 'number' ? 'number' : 'text',
            value: paramValue,
            onChange: handleParamChange,
            placeholder: `e.g., ${param.example}`,
            required: true
          })
        )
      ),

      React.createElement('button', {
        type: 'submit',
        disabled: loading,
        className: 'ml-auto',
        style: { marginTop: '20px' }
      }, loading ? 'Sending...' : 'Send Request')
    ),

    (response || loading) && React.createElement('div', { style: { marginTop: '2rem' } },
      React.createElement('h3', null, 'Response'),
      status && React.createElement('p', null,
        React.createElement('strong', null, `Status: ${status} OK`),
        requestTime && React.createElement('span', { style: { marginLeft: '1rem', color: 'var(--color-text-muted)' } },
          `${requestTime}ms`
        )
      ),
      React.createElement('pre', null,
        React.createElement('code', null,
          loading ? '// Sending request...' : JSON.stringify(response, null, 2)
        )
      )
    )
  );
}

// Mount the app when lazy-loaded
document.addEventListener('lazy-app-loaded', (e) => {
  // Check if this is our React API explorer
  if (e.detail.appId === 'react-api-root' || e.detail.container.id === 'react-api-root') {
    const container = e.detail.container;
    
    console.log('[ReactApp] Initializing API Explorer...');
    
    // Wait a tick for React to be available
    setTimeout(() => {
      if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.error('[ReactApp] React or ReactDOM not loaded');
        container.innerHTML = '<p style="color: red;">Failed to load React</p>';
        return;
      }
      
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(APIExplorer));
      
      console.log('[ReactApp] API Explorer mounted successfully');
    }, 100);
  }
});

// Also support old immediate mounting (backward compatibility)
// This will run if React is already loaded on page
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-api-root');
  if (container && typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
    // Only mount if not already loaded via lazy-app
    if (!container.dataset.lazyApp) {
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(APIExplorer));
    }
  }
});
