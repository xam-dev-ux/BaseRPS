#!/usr/bin/env node
/**
 * Generate PNG icons from SVG
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgPath = join(publicDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'icon.png', size: 256 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'splash.png', size: 200 },
];

async function generateIcons() {
  console.log('Generating PNG icons from icon.svg...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  console.log('\n✅ Icon generation complete!');
  console.log('\nStill need to create manually (or use a design tool):');
  console.log('  - og-image.png (1200x630) - Social preview image');
  console.log('  - hero.png (1200x630) - App store listing image');
  console.log('  - screenshots/*.png (1080x1920) - App screenshots');
}

generateIcons().catch(console.error);
