/**
 * Pixel-perfect comparison script for Figma implementations
 * 
 * Usage: node compare.js <original.png> <screenshot.png> [output-dir]
 * 
 * Requires: npm install pixelmatch pngjs
 */

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  threshold: 0.1, // 0 = exact match, 1 = any difference allowed
};

function loadPNG(filepath) {
  const buffer = fs.readFileSync(filepath);
  return PNG.sync.read(buffer);
}

function savePNG(png, filepath) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filepath, buffer);
}

function cropToSize(png, targetWidth, targetHeight) {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png.data;
  }
  
  const result = Buffer.alloc(targetWidth * targetHeight * 4);
  
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcIdx = (y * png.width + x) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      
      result[dstIdx] = png.data[srcIdx];
      result[dstIdx + 1] = png.data[srcIdx + 1];
      result[dstIdx + 2] = png.data[srcIdx + 2];
      result[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  
  return result;
}

function compare(originalPath, screenshotPath, outputDir = './output') {
  console.log('🎨 Figma Implementation Pixel Comparison\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Load images
  console.log('📂 Loading images...');
  const original = loadPNG(originalPath);
  const screenshot = loadPNG(screenshotPath);
  
  console.log(`   Original:   ${original.width}x${original.height}`);
  console.log(`   Screenshot: ${screenshot.width}x${screenshot.height}`);
  
  // Use smaller dimensions for comparison
  const width = Math.min(original.width, screenshot.width);
  const height = Math.min(original.height, screenshot.height);
  
  if (original.width !== screenshot.width || original.height !== screenshot.height) {
    console.log(`\n⚠️  Size mismatch! Using overlap area: ${width}x${height}`);
    console.log('   Tip: Set deviceScaleFactor: 2 in screenshot for @2x Figma exports');
  }
  
  // Crop images to same size
  const img1Data = cropToSize(original, width, height);
  const img2Data = cropToSize(screenshot, width, height);
  
  // Create diff image
  const diff = new PNG({ width, height });
  
  console.log('\n🔍 Comparing pixels...');
  const numDiffPixels = pixelmatch(
    img1Data,
    img2Data,
    diff.data,
    width,
    height,
    { threshold: CONFIG.threshold }
  );
  
  // Calculate statistics
  const totalPixels = width * height;
  const matchedPixels = totalPixels - numDiffPixels;
  const matchPercentage = ((matchedPixels / totalPixels) * 100).toFixed(2);
  const diffPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);
  
  // Save diff image
  const diffPath = path.join(outputDir, 'diff.png');
  savePNG(diff, diffPath);
  
  // Print report
  console.log('\n' + '═'.repeat(50));
  console.log('📊 PIXEL COMPARISON REPORT');
  console.log('═'.repeat(50));
  console.log(`   Comparison area:  ${width}x${height} pixels`);
  console.log(`   Total pixels:     ${totalPixels.toLocaleString()}`);
  console.log(`   Matching pixels:  ${matchedPixels.toLocaleString()}`);
  console.log(`   Different pixels: ${numDiffPixels.toLocaleString()}`);
  console.log('─'.repeat(50));
  console.log(`   Match rate:       ${matchPercentage}%`);
  console.log(`   Diff rate:        ${diffPercentage}%`);
  console.log('═'.repeat(50));
  
  // Status message
  const matchPct = parseFloat(matchPercentage);
  if (matchPct >= 99) {
    console.log('\n✅ Excellent! Pixel-perfect implementation (>99% match)');
  } else if (matchPct >= 97) {
    console.log('\n🟢 Great match (>97%), only minor anti-aliasing differences');
  } else if (matchPct >= 95) {
    console.log('\n🟡 Good match (>95%), minor adjustments needed');
  } else if (matchPct >= 90) {
    console.log('\n🟠 Acceptable match (>90%), some adjustments needed');
  } else {
    console.log('\n🔴 Significant differences detected');
  }
  
  console.log(`\n📁 Diff saved to: ${diffPath}`);
  
  // Suggestions
  if (numDiffPixels > 0) {
    console.log('\n💡 Common fixes:');
    console.log('   - Adjust top/left by 1-2px');
    console.log('   - Use line-height: 1 for text');
    console.log('   - Add margin-bottom for baseline alignment');
    console.log('   - Check font-family is loaded');
  }
  
  return {
    matchPercentage: matchPct,
    diffPixels: numDiffPixels,
    totalPixels,
    diffPath,
  };
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node compare.js <original.png> <screenshot.png> [output-dir]');
  console.log('\nExample:');
  console.log('  node compare.js figma-export.png implementation.png ./output');
  process.exit(1);
}

const [originalPath, screenshotPath, outputDir] = args;
const result = compare(originalPath, screenshotPath, outputDir);
process.exit(result.matchPercentage >= 95 ? 0 : 1);
