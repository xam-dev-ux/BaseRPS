#!/usr/bin/env node
/**
 * Generate placeholder screenshots (1080x1920)
 * Run: node scripts/generate-screenshots.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, '..', 'public', 'screenshots');

// Ensure screenshots directory exists
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

const createScreenshotSvg = (title, subtitle, content) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <!-- Status bar mock -->
  <rect width="1080" height="80" fill="rgba(0,0,0,0.3)"/>
  <text x="540" y="52" text-anchor="middle" font-family="Arial" font-size="28" fill="white">BaseRPS</text>

  <!-- Title -->
  <text x="540" y="200" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="48" fill="white">${title}</text>
  <text x="540" y="260" text-anchor="middle" font-family="Arial" font-size="28" fill="#93c5fd">${subtitle}</text>

  <!-- Content area -->
  ${content}

  <!-- Bottom nav mock -->
  <rect y="1800" width="1080" height="120" fill="rgba(0,0,0,0.3)"/>
  <text x="180" y="1870" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Play</text>
  <text x="540" y="1870" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Battles</text>
  <text x="900" y="1870" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Stats</text>
</svg>`;

const screenshots = [
  {
    name: 'screenshot-1.png',
    title: 'Battle Arena',
    subtitle: 'Choose your weapon',
    content: `
      <!-- Rock Paper Scissors buttons -->
      <circle cx="270" cy="800" r="100" fill="#fbbf24" opacity="0.9"/>
      <text x="270" y="820" text-anchor="middle" font-size="80">✊</text>
      <text x="270" y="940" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Rock</text>

      <circle cx="540" cy="800" r="100" fill="#f0f9ff" opacity="0.9"/>
      <text x="540" y="820" text-anchor="middle" font-size="80">✋</text>
      <text x="540" y="940" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Paper</text>

      <circle cx="810" cy="800" r="100" fill="#ef4444" opacity="0.9"/>
      <text x="810" y="820" text-anchor="middle" font-size="80">✌️</text>
      <text x="810" y="940" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Scissors</text>

      <!-- Timer -->
      <text x="540" y="1100" text-anchor="middle" font-family="Arial" font-size="64" fill="white">⏱ 45s</text>

      <!-- Match info -->
      <rect x="140" y="1200" width="800" height="200" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="540" y="1280" text-anchor="middle" font-family="Arial" font-size="28" fill="white">Round 1 of 3</text>
      <text x="540" y="1340" text-anchor="middle" font-family="Arial" font-size="36" fill="#fbbf24">0.05 ETH pot</text>
    `
  },
  {
    name: 'screenshot-2.png',
    title: 'Active Matches',
    subtitle: 'Join or create a battle',
    content: `
      <!-- Match cards -->
      <rect x="80" y="400" width="920" height="180" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="160" y="480" font-family="Arial" font-size="28" fill="white">0x1234...5678</text>
      <text x="160" y="530" font-family="Arial" font-size="22" fill="#93c5fd">BO3 • 0.01 ETH</text>
      <rect x="720" y="450" width="200" height="60" rx="8" fill="#3b82f6"/>
      <text x="820" y="490" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Join</text>

      <rect x="80" y="620" width="920" height="180" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="160" y="700" font-family="Arial" font-size="28" fill="white">0xabcd...ef01</text>
      <text x="160" y="750" font-family="Arial" font-size="22" fill="#93c5fd">BO5 • 0.1 ETH</text>
      <rect x="720" y="670" width="200" height="60" rx="8" fill="#3b82f6"/>
      <text x="820" y="710" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Join</text>

      <rect x="80" y="840" width="920" height="180" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="160" y="920" font-family="Arial" font-size="28" fill="white">0x9876...4321</text>
      <text x="160" y="970" font-family="Arial" font-size="22" fill="#93c5fd">BO1 • 0.005 ETH</text>
      <rect x="720" y="890" width="200" height="60" rx="8" fill="#3b82f6"/>
      <text x="820" y="930" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Join</text>

      <!-- Create match button -->
      <rect x="80" y="1100" width="920" height="100" rx="16" fill="#10b981"/>
      <text x="540" y="1165" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="32" fill="white">+ Create New Match</text>
    `
  },
  {
    name: 'screenshot-3.png',
    title: 'Your Stats',
    subtitle: 'Track your performance',
    content: `
      <!-- Stats grid -->
      <rect x="80" y="400" width="440" height="200" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="300" y="480" text-anchor="middle" font-family="Arial" font-size="64" fill="#10b981">24</text>
      <text x="300" y="540" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Wins</text>

      <rect x="560" y="400" width="440" height="200" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="780" y="480" text-anchor="middle" font-family="Arial" font-size="64" fill="#ef4444">12</text>
      <text x="780" y="540" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Losses</text>

      <rect x="80" y="640" width="440" height="200" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="300" y="720" text-anchor="middle" font-family="Arial" font-size="64" fill="#fbbf24">67%</text>
      <text x="300" y="780" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Win Rate</text>

      <rect x="560" y="640" width="440" height="200" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="780" y="720" text-anchor="middle" font-family="Arial" font-size="64" fill="#3b82f6">8</text>
      <text x="780" y="780" text-anchor="middle" font-family="Arial" font-size="24" fill="#93c5fd">Current Streak</text>

      <!-- Move distribution -->
      <rect x="80" y="900" width="920" height="300" rx="16" fill="rgba(255,255,255,0.1)"/>
      <text x="540" y="970" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="28" fill="white">Move Distribution</text>

      <!-- Rock bar -->
      <rect x="160" y="1020" width="300" height="40" rx="8" fill="#fbbf24"/>
      <text x="480" y="1050" font-family="Arial" font-size="24" fill="white">Rock 42%</text>

      <!-- Paper bar -->
      <rect x="160" y="1080" width="250" height="40" rx="8" fill="#f0f9ff"/>
      <text x="430" y="1110" font-family="Arial" font-size="24" fill="white">Paper 35%</text>

      <!-- Scissors bar -->
      <rect x="160" y="1140" width="170" height="40" rx="8" fill="#ef4444"/>
      <text x="350" y="1170" font-family="Arial" font-size="24" fill="white">Scissors 23%</text>
    `
  }
];

async function generateScreenshots() {
  console.log('Generating placeholder screenshots...\n');

  for (const { name, title, subtitle, content } of screenshots) {
    const svg = Buffer.from(createScreenshotSvg(title, subtitle, content));
    await sharp(svg)
      .png()
      .toFile(join(screenshotsDir, name));
    console.log(`✓ ${name} (1080x1920)`);
  }

  console.log('\n✅ Screenshots generated!');
  console.log('\nNote: These are placeholder screenshots. Replace with actual');
  console.log('app screenshots for better app store presence.');
}

generateScreenshots().catch(console.error);
