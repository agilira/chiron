/**
 * TDD Tests: JIT Composition (Just-In-Time Composition)
 * 
 * RED phase: Tests that define nested component behavior
 * Goal: Enable true component composition - <Card><Button /></Card>
 * 
 * Strategy: Treat JSX trees (not individual nodes) as single islands
 */

const path = require('path');
const fs = require('fs');

describe('MDX JIT Composition', () => {
  let plugin;
  let mockContext;

  beforeEach(() => {
    plugin = require('../../plugins/mdx-framework');
    
    mockContext = {
      rootDir: path.join(__dirname, '..', '..'),
      outputDir: path.join(__dirname, '..', '..', 'dist'),
      config: {
        project: { name: 'Test' }
      },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };
  });

  describe('JSX Tree Detection', () => {
    test('should detect nested JSX as a single tree, not separate islands', async () => {
      const mdxContent = `
---
title: Nested Components
---

import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'

<Card title="Hello">
  <Button>Click me</Button>
</Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Should detect ONE component (the tree), not two separate islands
      expect(result.components.length).toBe(1);
      
      // The component should be a wrapper that includes both Card and Button
      const comp = result.components[0];
      expect(comp.isComposition).toBe(true); // Flag for composite components
      expect(comp.includes).toContain('Card'); // Includes Card
      expect(comp.includes).toContain('Button'); // Includes Button
    });

    test('should detect multiple separate trees as separate islands', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'

<Card title="First" />

Some text between components.

<Button>Separate button</Button>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Two separate top-level JSX elements = 2 islands
      expect(result.components.length).toBe(2);
      
      // Neither should be marked as composition
      expect(result.components[0].isComposition).toBeFalsy();
      expect(result.components[1].isComposition).toBeFalsy();
    });

    test('should handle deeply nested structures', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'
import Avatar from '../components/Avatar.react.jsx'

<Card>
  <Avatar src="user.jpg" />
  <div>
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </div>
</Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Single tree
      expect(result.components.length).toBe(1);
      expect(result.components[0].isComposition).toBe(true);
      expect(result.components[0].includes).toContain('Card');
      expect(result.components[0].includes).toContain('Button');
      expect(result.components[0].includes).toContain('Avatar');
    });
  });

  describe('Wrapper Generation', () => {
    test('should generate ephemeral wrapper component for composition', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'

<Card><Button /></Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      const comp = result.components[0];
      
      // Should have wrapper code generated
      expect(comp.wrapperCode).toBeDefined();
      
      // Wrapper should import both components
      expect(comp.wrapperCode).toContain('import Card from');
      expect(comp.wrapperCode).toContain('import Button from');
      
      // Wrapper should export default function
      expect(comp.wrapperCode).toMatch(/export default function/);
      
      // Wrapper should include the JSX tree
      expect(comp.wrapperCode).toContain('<Card>');
      expect(comp.wrapperCode).toContain('<Button');
    });

    test('should generate unique wrapper names for each composition', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'

<Card title="First" />
<Card title="Second" />
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Two separate instances
      expect(result.components.length).toBe(2);
      
      // Different wrapper names
      const name1 = result.components[0].name;
      const name2 = result.components[1].name;
      expect(name1).not.toBe(name2);
    });

    test('should pass props to root component in wrapper', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'

<Card title="My Card" theme="dark">
  <Button>Click</Button>
</Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      const comp = result.components[0];
      
      // Wrapper should include props
      expect(comp.wrapperCode).toContain('title="My Card"');
      expect(comp.wrapperCode).toContain('theme="dark"');
    });
  });

  describe('Bundle Integration', () => {
    test('should create wrapper file on disk for composition', async () => {
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import Button from '../components/Button.react.jsx'

<Card><Button /></Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      const comp = result.components[0];
      
      // Should have wrapper path
      expect(comp.wrapperPath).toBeDefined();
      
      // Wrapper file should exist
      if (comp.wrapperPath) {
        expect(fs.existsSync(comp.wrapperPath)).toBe(true);
        
        // Should contain the wrapper code
        const fileContent = fs.readFileSync(comp.wrapperPath, 'utf8');
        expect(fileContent).toContain('import Card');
        expect(fileContent).toContain('import Button');
        
        // Cleanup
        fs.unlinkSync(comp.wrapperPath);
      }
    });

    test('should bundle wrapper as single component', async () => {
      const mockWrapperPath = path.join(mockContext.outputDir, 'temp', 'Wrapper-123.jsx');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      // Create mock component files
      const componentsDir = path.join(mockContext.outputDir, 'components');
      fs.mkdirSync(componentsDir, { recursive: true });
      
      const cardPath = path.join(componentsDir, 'Card.react.jsx');
      const buttonPath = path.join(componentsDir, 'Button.react.jsx');
      
      fs.writeFileSync(cardPath, `
import { createElement } from 'react';
export default function Card({ children }) {
  return createElement('div', { className: 'card' }, children);
}
`, 'utf8');
      
      fs.writeFileSync(buttonPath, `
import { createElement } from 'react';
export default function Button({ children }) {
  return createElement('button', null, children);
}
`, 'utf8');
      
      // Create temporary wrapper file
      const wrapperCode = `
import Card from '../components/Card.react.jsx';
import Button from '../components/Button.react.jsx';

export default function Wrapper() {
  return (
    <Card>
      <Button>Click</Button>
    </Card>
  );
}
`;
      
      fs.mkdirSync(path.dirname(mockWrapperPath), { recursive: true });
      fs.writeFileSync(mockWrapperPath, wrapperCode, 'utf8');
      
      // Bundle the wrapper
      const outputPath = await plugin.bundleComponent(
        mockWrapperPath,
        'react',
        outputDir,
        mockContext
      );
      
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const bundle = fs.readFileSync(outputPath, 'utf8');
      
      // Should contain both Card and Button code (deduplicated)
      expect(bundle).toContain('Card'); // Component name should appear
      expect(bundle).toContain('Button');
      
      // Cleanup
      fs.unlinkSync(mockWrapperPath);
      fs.unlinkSync(cardPath);
      fs.unlinkSync(buttonPath);
    });

    test('should deduplicate React in composed bundle', async () => {
      // When bundling <Card><Button /></Card>, React should be included once
      // not twice (once for Card, once for Button)
      
      const mockWrapperPath = path.join(mockContext.outputDir, 'temp', 'Wrapper-dedup.jsx');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      // Create mock component files
      const componentsDir = path.join(mockContext.outputDir, 'components');
      fs.mkdirSync(componentsDir, { recursive: true });
      
      const cardPath = path.join(componentsDir, 'Card.react.jsx');
      const buttonPath = path.join(componentsDir, 'Button.react.jsx');
      
      fs.writeFileSync(cardPath, `
import { createElement } from 'react';
export default function Card({ children }) {
  return createElement('div', { className: 'card' }, children);
}
`, 'utf8');
      
      fs.writeFileSync(buttonPath, `
import { createElement } from 'react';
export default function Button({ children }) {
  return createElement('button', null, children);
}
`, 'utf8');
      
      const wrapperCode = `
import Card from '../components/Card.react.jsx';
import Button from '../components/Button.react.jsx';

export default function Wrapper() {
  return <Card><Button>Test</Button></Card>;
}
`;
      
      fs.mkdirSync(path.dirname(mockWrapperPath), { recursive: true });
      fs.writeFileSync(mockWrapperPath, wrapperCode, 'utf8');
      
      const outputPath = await plugin.bundleComponent(
        mockWrapperPath,
        'react',
        outputDir,
        mockContext
      );
      
      const bundle = fs.readFileSync(outputPath, 'utf8');
      
      // Count occurrences of React's createElement signature
      // Should appear once (dedup working), not multiple times
      const createElementMatches = bundle.match(/createElement/g);
      expect(createElementMatches).toBeDefined();
      
      // Bundle size should be reasonable (not 2x React)
      const sizeKB = fs.statSync(outputPath).size / 1024;
      expect(sizeKB).toBeLessThan(50); // Composed component + React runtime
      
      fs.unlinkSync(mockWrapperPath);
      fs.unlinkSync(cardPath);
      fs.unlinkSync(buttonPath);
    });
  });

  describe('Vue SFC Composition', () => {
    test('should handle Vue composition with slots', async () => {
      const mdxContent = `
import Card from '../components/Card.vue'
import VueButton from '../components/VueButton.vue'

<Card>
  <VueButton>Click me</VueButton>
</Card>
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      expect(result.components.length).toBe(1);
      expect(result.components[0].isComposition).toBe(true);
      expect(result.components[0].framework).toBe('vue');
    });
  });

  describe('Mixed Framework Composition', () => {
    test('should NOT allow mixing frameworks in single tree', async () => {
      // This should either error or create separate islands
      const mdxContent = `
import Card from '../components/Card.react.jsx'
import VueButton from '../components/VueButton.vue'

<Card>
  <VueButton>This should not work</VueButton>
</Card>
`;
      
      // Should either throw error or create 2 separate islands
      try {
        const result = await plugin.compileMDX(mdxContent, mockContext);
        
        // If it doesn't error, should create separate islands
        expect(result.components.length).toBeGreaterThan(1);
      } catch (error) {
        // Or should error with helpful message
        expect(error.message).toContain('Cannot mix frameworks');
      }
    });
  });
});
