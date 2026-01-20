#!/usr/bin/env node
/**
 * Generate social/hero images
 * Run: node scripts/generate-social-images.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Create SVG template for social images (1200x630)
const createSocialSvg = (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Rock -->
  <circle cx="${width * 0.2}" cy="${height * 0.45}" r="80" fill="#fbbf24" opacity="0.9"/>
  <text x="${width * 0.2}" y="${height * 0.46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#1e3a8a">✊</text>

  <!-- Paper -->
  <rect x="${width * 0.5 - 60}" y="${height * 0.45 - 70}" width="120" height="140" rx="8" fill="#f0f9ff" opacity="0.9"/>
  <text x="${width * 0.5}" y="${height * 0.46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#1e3a8a">✋</text>

  <!-- Scissors -->
  <circle cx="${width * 0.8}" cy="${height * 0.45}" r="80" fill="#ef4444" opacity="0.9"/>
  <text x="${width * 0.8}" y="${height * 0.46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="white">✌️</text>

  <!-- Title -->
  <text x="${width * 0.5}" y="${height * 0.15}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="72" fill="white">BaseRPS</text>
  <text x="${width * 0.5}" y="${height * 0.22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#93c5fd">Battle for ETH</text>

  <!-- Subtitle -->
  <text x="${width * 0.5}" y="${height * 0.85}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#93c5fd">PvP Rock Paper Scissors on Base</text>
  <text x="${width * 0.5}" y="${height * 0.92}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#6b7280">Commit-reveal mechanics • Overtime system • Instant payouts</text>
</svg>`;

async function generateSocialImages() {
  console.log('Generating social/hero images...\n');

  // og-image.png (1200x630)
  const ogSvg = Buffer.from(createSocialSvg(1200, 630));
  await sharp(ogSvg)
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x630)');

  // hero.png (same dimensions)
  await sharp(ogSvg)
    .png()
    .toFile(join(publicDir, 'hero.png'));
  console.log('✓ hero.png (1200x630)');

  console.log('\n✅ Social images generated!');
  console.log('\nNote: These are placeholder images. Consider creating custom');
  console.log('designs for better app store presence.');
}

generateSocialImages().catch(console.error);
