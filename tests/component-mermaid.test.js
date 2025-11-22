/**
 * Tests for Mermaid Component
 * 
 * Build-time rendering of Mermaid diagrams to static SVG using mermaid.ink API
 * Zero client-side JavaScript, better performance, SEO-friendly
 */

const { JSDOM } = require('jsdom');
const https = require('https');

// Mock https module
jest.mock('https');

describe('Mermaid Component', () => {
  let processMermaid;
  
  // Mock https.get to simulate API responses
  const mockHttpsGet = (responseData, statusCode = 200) => {
    https.get.mockImplementation((url, callback) => {
      const mockResponse = {
        statusCode,
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(responseData);
          } else if (event === 'end') {
            handler();
          }
          return mockResponse;
        })
      };
      
      callback(mockResponse);
      
      return {
        on: jest.fn()
      };
    });
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful SVG response by default
    mockHttpsGet('<svg>test diagram</svg>');
  });

  describe('Component Registration', () => {
    test('should export component with correct structure', () => {
      const component = require('../plugins/components/mermaid');
      
      expect(component).toBeDefined();
      expect(component.name).toBe('mermaid');
      expect(component.type).toBe('component');
      expect(typeof component.process).toBe('function');
    });
  });

  describe('Mermaid Tag Processing', () => {
    beforeEach(() => {
      const component = require('../plugins/components/mermaid');
      processMermaid = component.process;
    });

    test('should process simple flowchart', async () => {
      const input = `<Mermaid>
graph TD
  A[Start] --> B[Process]
  B --> C[End]
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('<svg');
      expect(result).toContain('test diagram');
      expect(https.get).toHaveBeenCalled();
    });

    test('should process with custom id attribute', async () => {
      const input = `<Mermaid id="my-diagram">
graph LR
  A --> B
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('my-diagram');
      expect(https.get).toHaveBeenCalled();
    });

    test('should auto-generate id if not provided', async () => {
      const input = `<Mermaid>
graph TD
  A --> B
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(https.get).toHaveBeenCalled();
      // Should have an auto-generated ID in the container
      expect(result).toMatch(/id="mermaid-\d+-[a-z0-9]+"/);
    });

    test('should handle sequence diagrams', async () => {
      const input = `<Mermaid>
sequenceDiagram
  Alice->>John: Hello
  John-->>Alice: Hi
</Mermaid>`;

      await processMermaid(input);
      
      expect(https.get).toHaveBeenCalled();
      // Verify API was called with base64-encoded diagram
      const callUrl = https.get.mock.calls[0][0];
      expect(callUrl).toContain('mermaid.ink/svg/');
    });

    test('should handle class diagrams', async () => {
      const input = `<Mermaid>
classDiagram
  Animal <|-- Dog
  Animal : +string name
</Mermaid>`;

      await processMermaid(input);
      
      expect(https.get).toHaveBeenCalled();
    });

    test('should process multiple diagrams', async () => {
      const input = `
<Mermaid id="diagram1">
graph TD
  A --> B
</Mermaid>

Some text

<Mermaid id="diagram2">
graph LR
  X --> Y
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(https.get).toHaveBeenCalledTimes(2);
      expect(result).toContain('diagram1');
      expect(result).toContain('diagram2');
    });

    test('should preserve content between diagrams', async () => {
      const input = `
<p>Before diagram</p>

<Mermaid>
graph TD
  A --> B
</Mermaid>

<p>After diagram</p>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('Before diagram');
      expect(result).toContain('After diagram');
    });
  });

  describe('Self-closing Tag Support', () => {
    beforeEach(() => {
      const component = require('../plugins/components/mermaid');
      processMermaid = component.process;
      
      mockHttpsGet('<svg>diagram</svg>');
    });

    test('should handle self-closing tag with diagram attribute', async () => {
      const input = `<Mermaid diagram="graph TD; A-->B" />`;

      await processMermaid(input);
      
      expect(https.get).toHaveBeenCalled();
      const callUrl = https.get.mock.calls[0][0];
      expect(callUrl).toContain('mermaid.ink/svg/');
    });

    test('should handle self-closing tag with id', async () => {
      const input = `<Mermaid id="test-1" diagram="graph LR; X-->Y" />`;

      const result = await processMermaid(input);
      
      expect(https.get).toHaveBeenCalled();
      expect(result).toContain('id="test-1"');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const component = require('../plugins/components/mermaid');
      processMermaid = component.process;
    });

    test('should throw error and fail build after retries', async () => {
      // Mock error response for all attempts
      https.get.mockImplementation((_url, _callback) => {
        return {
          on: jest.fn((event, handler) => {
            if (event === 'error') {
              handler(new Error('Network error'));
            }
          })
        };
      });
      
      const input = `<Mermaid>
graph TD
  A --> B
</Mermaid>`;

      // Should throw after 3 retries (no retry delay in tests)
      await expect(processMermaid(input)).rejects.toThrow('Mermaid diagram rendering failed');
    });

    test('should throw error on persistent HTTP errors', async () => {
      // Mock 503 response for all attempts
      https.get.mockImplementation((url, callback) => {
        const mockResponse = {
          statusCode: 503,
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              handler('Service Unavailable');
            } else if (event === 'end') {
              handler();
            }
            return mockResponse;
          })
        };
        
        callback(mockResponse);
        
        return {
          on: jest.fn()
        };
      });
      
      const input = `<Mermaid id="test">graph TD; A-->B</Mermaid>`;

      await expect(processMermaid(input)).rejects.toThrow('Mermaid diagram rendering failed');
    });

    test('should handle empty content', async () => {
      const input = `<Mermaid></Mermaid>`;

      const result = await processMermaid(input);
      
      // Should not call API with empty content
      expect(https.get).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    test('should handle whitespace-only content', async () => {
      const input = `<Mermaid>
        
      </Mermaid>`;

      const result = await processMermaid(input);
      
      expect(https.get).not.toHaveBeenCalled();
      expect(result).toBe('');
    });
  });

  describe('CSS Class Support', () => {
    beforeEach(() => {
      const component = require('../plugins/components/mermaid');
      processMermaid = component.process;
      
      mockHttpsGet('<svg>diagram</svg>');
    });

    test('should add custom class from attribute', async () => {
      const input = `<Mermaid class="my-custom-class">
graph TD
  A --> B
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('my-custom-class');
    });

    test('should always include mermaid-diagram base class', async () => {
      const input = `<Mermaid>
graph TD
  A --> B
</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('mermaid-diagram');
    });
  });

  describe('SVG Output Validation', () => {
    beforeEach(() => {
      const component = require('../plugins/components/mermaid');
      processMermaid = component.process;
    });

    test('should wrap SVG in container div', async () => {
      mockHttpsGet('<svg><g></g></svg>');
      
      const input = `<Mermaid>graph TD; A-->B</Mermaid>`;

      const result = await processMermaid(input);
      
      const dom = new JSDOM(result);
      const container = dom.window.document.querySelector('.mermaid-diagram');
      
      expect(container).toBeTruthy();
      expect(container.querySelector('svg')).toBeTruthy();
    });

    test('should preserve SVG attributes', async () => {
      mockHttpsGet('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g></g></svg>');
      
      const input = `<Mermaid>graph TD; A-->B</Mermaid>`;

      const result = await processMermaid(input);
      
      expect(result).toContain('viewBox="0 0 100 100"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });

  describe('API Integration', () => {
    test('should call mermaid.ink API with base64-encoded diagram', async () => {
      const component = require('../plugins/components/mermaid');
      
      const diagramCode = 'graph TD; A-->B';
      const input = `<Mermaid>${diagramCode}</Mermaid>`;
      
      await component.process(input);
      
      expect(https.get).toHaveBeenCalled();
      const callUrl = https.get.mock.calls[0][0];
      
      // Verify URL format
      expect(callUrl).toContain('https://mermaid.ink/svg/');
      
      // Verify diagram was base64 encoded
      const base64Part = callUrl.split('/svg/')[1];
      expect(base64Part).toBeDefined();
      
      // Decode and verify
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      expect(decoded).toBe(diagramCode);
    });
  });
});
