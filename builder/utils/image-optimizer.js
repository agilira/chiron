/**
 * Image Optimizer Utility
 * Generates WebP versions and compresses original images using sharp
 * 
 * @module builder/utils/image-optimizer
 */

const sharp = require('sharp');
const path = require('path');

/**
 * Optimize image and generate WebP version
 * 
 * @param {string} inputPath - Path to source image
 * @param {string} outputPath - Path for optimized image
 * @param {Object} options - Optimization options
 * @param {number} options.quality - WebP quality (default: 80)
 * @param {number} options.originalQuality - Original format quality (default: 85)
 * @returns {Promise<string[]>} Array of generated file paths [original, webp]
 * @throws {Error} If input/output paths are invalid or sharp fails
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
  // Validate inputs
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Invalid input path');
  }
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Invalid output path');
  }

  const quality = options.quality || 80;
  const originalQuality = options.originalQuality || 85;
  const ext = path.extname(inputPath).toLowerCase();
  const results = [];

  try {
    // Generate AVIF version (best compression)
    const avifPath = outputPath.replace(/\.(jpg|jpeg|png|gif)$/i, '.avif');
    await sharp(inputPath)
      .avif({ quality: Math.max(quality - 15, 30) }) // AVIF needs lower quality number for same visual results
      .toFile(avifPath);

    // Generate WebP version (broad modern support)
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    await sharp(inputPath)
      .webp({ quality })
      .toFile(webpPath);
    
    // Optimize and save original format (fallback)
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(inputPath)
        .jpeg({ quality: originalQuality, mozjpeg: true })
        .toFile(outputPath);
    } else if (ext === '.png') {
      await sharp(inputPath)
        .png({ quality: originalQuality, palette: true })
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .toFile(outputPath);
    }
    
    results.push(outputPath, webpPath, avifPath);
    
    return results;
  } catch (error) {
    throw new Error(`Image optimization failed for ${inputPath}: ${error.message}`);
  }
}

module.exports = { optimizeImage };
