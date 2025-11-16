/**
 * Tests for Image Optimizer Utility
 * TDD approach with mocked sharp
 */

const { optimizeImage } = require('../../../builder/utils/image-optimizer');

// Mock sharp
jest.mock('sharp');
const sharp = require('sharp');

describe('Image Optimizer', () => {
  let mockSharp;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup sharp mock chain
    mockSharp = {
      webp: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue({ size: 1000 })
    };
    
    sharp.mockReturnValue(mockSharp);
  });

  describe('WebP Generation', () => {
    test('should generate webp version of jpg', async () => {
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      const result = await optimizeImage(input, output);
      
      expect(sharp).toHaveBeenCalledWith(input);
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharp.toFile).toHaveBeenCalledWith('/path/to/output/image.webp');
      expect(result).toContain('/path/to/output/image.webp');
    });

    test('should generate webp version of png', async () => {
      const input = '/path/to/icon.png';
      const output = '/path/to/output/icon.png';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharp.toFile).toHaveBeenCalledWith('/path/to/output/icon.webp');
    });

    test('should use correct quality setting', async () => {
      const input = '/path/to/photo.jpg';
      const output = '/path/to/output/photo.jpg';
      
      await optimizeImage(input, output, { quality: 75 });
      
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 75 });
    });
  });

  describe('Original Format Optimization', () => {
    test('should compress jpg with quality setting', async () => {
      const input = '/path/to/photo.jpg';
      const output = '/path/to/output/photo.jpg';
      
      await optimizeImage(input, output);
      
      expect(sharp).toHaveBeenCalledTimes(2); // Once for webp, once for original
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85 });
      expect(mockSharp.toFile).toHaveBeenCalledWith(output);
    });

    test('should compress jpeg with quality setting', async () => {
      const input = '/path/to/photo.jpeg';
      const output = '/path/to/output/photo.jpeg';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85 });
    });

    test('should compress png with quality setting', async () => {
      const input = '/path/to/icon.png';
      const output = '/path/to/output/icon.png';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 85 });
    });
  });

  describe('Return Value', () => {
    test('should return array of generated files', async () => {
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      const result = await optimizeImage(input, output);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result).toContain('/path/to/output/image.jpg');
      expect(result).toContain('/path/to/output/image.webp');
    });

    test('should return both webp and original paths', async () => {
      const input = '/path/to/photo.png';
      const output = '/path/to/output/photo.png';
      
      const result = await optimizeImage(input, output);
      
      expect(result[0]).toBe('/path/to/output/photo.png');
      expect(result[1]).toBe('/path/to/output/photo.webp');
    });
  });

  describe('Error Handling', () => {
    test('should throw error if sharp fails', async () => {
      mockSharp.toFile.mockRejectedValue(new Error('Sharp error'));
      
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      await expect(optimizeImage(input, output)).rejects.toThrow('Sharp error');
    });

    test('should handle missing input file', async () => {
      sharp.mockImplementation(() => {
        throw new Error('Input file is missing');
      });
      
      const input = '/nonexistent/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      await expect(optimizeImage(input, output)).rejects.toThrow();
    });

    test('should validate input parameters', async () => {
      await expect(optimizeImage(null, '/output')).rejects.toThrow();
      await expect(optimizeImage('/input', null)).rejects.toThrow();
    });
  });

  describe('File Extension Handling', () => {
    test('should handle uppercase extensions', async () => {
      const input = '/path/to/IMAGE.JPG';
      const output = '/path/to/output/IMAGE.JPG';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.jpeg).toHaveBeenCalled();
    });

    test('should handle .jpeg extension', async () => {
      const input = '/path/to/photo.jpeg';
      const output = '/path/to/output/photo.jpeg';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.jpeg).toHaveBeenCalled();
    });

    test('should handle .PNG extension', async () => {
      const input = '/path/to/icon.PNG';
      const output = '/path/to/output/icon.PNG';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.png).toHaveBeenCalled();
    });

    test('should generate correct webp path regardless of case', async () => {
      const input = '/path/to/IMAGE.JPG';
      const output = '/path/to/output/IMAGE.JPG';
      
      const result = await optimizeImage(input, output);
      
      expect(result[1]).toBe('/path/to/output/IMAGE.webp');
    });
  });

  describe('Quality Options', () => {
    test('should use default quality 80 for webp', async () => {
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
    });

    test('should use default quality 85 for original', async () => {
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      
      await optimizeImage(input, output);
      
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85 });
    });

    test('should accept custom quality options', async () => {
      const input = '/path/to/image.jpg';
      const output = '/path/to/output/image.jpg';
      const options = { quality: 70, originalQuality: 90 };
      
      await optimizeImage(input, output, options);
      
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 70 });
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 90 });
    });
  });

  describe('Integration Points', () => {
    test('should be callable from builder', async () => {
      const input = '/content/images/hero.jpg';
      const output = '/docs/images/hero.jpg';
      
      const result = await optimizeImage(input, output);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should work with relative paths', async () => {
      const input = 'images/photo.png';
      const output = 'docs/images/photo.png';
      
      await optimizeImage(input, output);
      
      expect(sharp).toHaveBeenCalledWith(input);
      expect(mockSharp.toFile).toHaveBeenCalledWith('docs/images/photo.webp');
    });
  });
});
