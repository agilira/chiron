/**
 * File Utils - createSlug() Tests
 * Tests for URL-friendly slug generation
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const { createSlug } = require('../builder/utils/file-utils');

describe('createSlug()', () => {
  describe('basic functionality', () => {
    it('should convert simple text to lowercase slug', () => {
      expect(createSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(createSlug('Multiple Word Slug')).toBe('multiple-word-slug');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(createSlug('Too   Many    Spaces')).toBe('too-many-spaces');
    });

    it('should remove special characters', () => {
      expect(createSlug('Hello! World?')).toBe('hello-world');
      expect(createSlug('Test@Email.com')).toBe('testemailcom');
      expect(createSlug('Price: $99.99')).toBe('price-9999');
    });

    it('should preserve hyphens in text', () => {
      expect(createSlug('Pre-existing-hyphens')).toBe('pre-existing-hyphens');
    });

    it('should handle mixed case properly', () => {
      expect(createSlug('CamelCaseText')).toBe('camelcasetext');
      expect(createSlug('UPPERCASE TEXT')).toBe('uppercase-text');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(createSlug('')).toBe('');
    });

    it('should handle whitespace only', () => {
      expect(createSlug('   ')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(createSlug(null)).toBe('');
      expect(createSlug(undefined)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(createSlug(123)).toBe('');
      expect(createSlug({})).toBe('');
      expect(createSlug([])).toBe('');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(createSlug('-leading-hyphen')).toBe('leading-hyphen');
      expect(createSlug('trailing-hyphen-')).toBe('trailing-hyphen');
      expect(createSlug('-both-sides-')).toBe('both-sides');
    });

    it('should collapse multiple hyphens', () => {
      expect(createSlug('multiple---hyphens')).toBe('multiple-hyphens');
      expect(createSlug('too----many-----hyphens')).toBe('too-many-hyphens');
    });
  });

  describe('real-world examples (blog use cases)', () => {
    it('should handle author names', () => {
      expect(createSlug('John Doe')).toBe('john-doe');
      expect(createSlug('Mary Jane Smith')).toBe('mary-jane-smith');
      expect(createSlug("O'Brien")).toBe('obrien');
    });

    it('should handle category names', () => {
      expect(createSlug('JavaScript')).toBe('javascript');
      expect(createSlug('Web Development')).toBe('web-development');
      expect(createSlug('Node.js & Express')).toBe('nodejs-express');
    });

    it('should handle tag names', () => {
      expect(createSlug('TypeScript')).toBe('typescript');
      expect(createSlug('API Design')).toBe('api-design');
      expect(createSlug('How-To Guide')).toBe('how-to-guide');
    });

    it('should handle titles with punctuation', () => {
      expect(createSlug('Getting Started: A Guide')).toBe('getting-started-a-guide');
      expect(createSlug('What is React?')).toBe('what-is-react');
      expect(createSlug('Tips & Tricks')).toBe('tips-tricks');
    });

    it('should handle non-English characters', () => {
      expect(createSlug('Café Résumé')).toBe('caf-rsum');
      expect(createSlug('Übersetzung')).toBe('bersetzung');
    });

    it('should handle numbers', () => {
      expect(createSlug('ES6 Features')).toBe('es6-features');
      expect(createSlug('Top 10 Tips')).toBe('top-10-tips');
      expect(createSlug('2024 Roadmap')).toBe('2024-roadmap');
    });
  });

  describe('consistency with existing blog slugs', () => {
    // These tests ensure new implementation matches existing behavior
    it('should match author slug format', () => {
      // Existing: authorText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      expect(createSlug('Marco Rossi')).toBe('marco-rossi');
      expect(createSlug('Sofia Bianchi')).toBe('sofia-bianchi');
    });

    it('should match tag slug format', () => {
      // Existing: tag.toLowerCase().replace(/\s+/g, '-');
      const tags = ['JavaScript', 'Web Development', 'Node.js'];
      expect(tags.map(createSlug)).toEqual(['javascript', 'web-development', 'nodejs']);
    });

    it('should match archive URL slug format', () => {
      // Existing: item.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      expect(createSlug('Tutorials')).toBe('tutorials');
      expect(createSlug('Getting Started')).toBe('getting-started');
    });
  });
});
