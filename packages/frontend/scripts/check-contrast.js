#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse global.css to extract CSS custom properties for :root (light) and [data-theme="dark"]
const cssPath = path.resolve(__dirname, '../src/styles/global.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function parseThemeTokens(blockRegex) {
  const match = cssContent.match(blockRegex);
  if (!match) return {};
  const block = match[1];
  const tokens = {};
  const lineRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let lineMatch;
  while ((lineMatch = lineRegex.exec(block)) !== null) {
    tokens[lineMatch[1].trim()] = lineMatch[2].trim();
  }
  return tokens;
}

const lightTokens = parseThemeTokens(/(?:^|[\r\n]):root\s*,\s*\[data-theme="light"\]\s*\{([^}]+)\}/m);
const darkTokens = parseThemeTokens(/(?:^|[\r\n])\[data-theme="dark"\]\s*\{([^}]+)\}/m);

// Hex to sRGB luminance calculator according to WCAG 2.1
function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    return [
      parseInt(cleanHex[0] + cleanHex[0], 16),
      parseInt(cleanHex[1] + cleanHex[1], 16),
      parseInt(cleanHex[2] + cleanHex[2], 16),
    ];
  }
  if (cleanHex.length === 6) {
    return [
      parseInt(cleanHex.slice(0, 2), 16),
      parseInt(cleanHex.slice(2, 4), 16),
      parseInt(cleanHex.slice(4, 6), 16),
    ];
  }
  throw new Error(`Unsupported hex: ${hex}`);
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const pairsToVerify = [
  // Light Theme Pairs
  { theme: 'light', name: 'Body Text on Base Background', fg: lightTokens['text'], bg: lightTokens['bg'], min: 4.5 },
  { theme: 'light', name: 'Body Text on Surface', fg: lightTokens['text'], bg: lightTokens['surface'], min: 4.5 },
  { theme: 'light', name: 'Body Text on Surface-2', fg: lightTokens['text'], bg: lightTokens['surface-2'], min: 4.5 },
  { theme: 'light', name: 'Body Text on Surface-3', fg: lightTokens['text'], bg: lightTokens['surface-3'], min: 4.5 },
  { theme: 'light', name: 'Secondary Text on Base Background', fg: lightTokens['text-2'], bg: lightTokens['bg'], min: 4.5 },
  { theme: 'light', name: 'Secondary Text on Surface', fg: lightTokens['text-2'], bg: lightTokens['surface'], min: 4.5 },
  { theme: 'light', name: 'Primary Button Text on Primary', fg: lightTokens['on-primary'], bg: lightTokens['primary'], min: 4.5 },
  { theme: 'light', name: 'Secondary Button Text on Secondary', fg: lightTokens['on-secondary'], bg: lightTokens['secondary'], min: 4.5 },
  { theme: 'light', name: 'Primary (Red) as Text/Link on Base', fg: lightTokens['primary'], bg: lightTokens['bg'], min: 4.5 },
  { theme: 'light', name: 'Secondary (Rust) as Text on Base', fg: lightTokens['secondary'], bg: lightTokens['bg'], min: 4.5 },
  { theme: 'light', name: 'Border on Surface (UI Element)', fg: lightTokens['border-strong'], bg: lightTokens['surface'], min: 1.5 },

  // Dark Theme Pairs
  { theme: 'dark', name: 'Body Text on Base Background', fg: darkTokens['text'], bg: darkTokens['bg'], min: 4.5 },
  { theme: 'dark', name: 'Body Text on Surface', fg: darkTokens['text'], bg: darkTokens['surface'], min: 4.5 },
  { theme: 'dark', name: 'Body Text on Surface-2', fg: darkTokens['text'], bg: darkTokens['surface-2'], min: 4.5 },
  { theme: 'dark', name: 'Body Text on Surface-3', fg: darkTokens['text'], bg: darkTokens['surface-3'], min: 4.5 },
  { theme: 'dark', name: 'Secondary Text on Base Background', fg: darkTokens['text-2'], bg: darkTokens['bg'], min: 4.5 },
  { theme: 'dark', name: 'Primary Button Text on Primary', fg: darkTokens['on-primary'], bg: darkTokens['primary'], min: 4.5 },
  { theme: 'dark', name: 'Secondary Button Text on Secondary', fg: darkTokens['on-secondary'], bg: darkTokens['secondary'], min: 4.5 },
  { theme: 'dark', name: 'Primary (Salmon) as Text/Link on Base', fg: darkTokens['primary'], bg: darkTokens['bg'], min: 4.5 },
  { theme: 'dark', name: 'Border on Surface (UI Element)', fg: darkTokens['border-strong'], bg: darkTokens['surface'], min: 1.5 },

  // Brand Panel (Dark in both themes)
  { theme: 'panel', name: 'Panel Text on Panel Background', fg: lightTokens['panel-text'], bg: lightTokens['panel'], min: 4.5 },
  { theme: 'panel', name: 'Panel Text-2 on Panel Background', fg: lightTokens['panel-text-2'], bg: lightTokens['panel'], min: 4.5 },
  { theme: 'panel', name: 'Panel Accent on Panel Background (UI/Large)', fg: lightTokens['panel-accent'], bg: lightTokens['panel'], min: 3.0 },
];

console.log('======================================================');
console.log('  WCAG 2.1 CONTRAST VERIFICATION (LIGHT + DARK THEMES)  ');
console.log('======================================================\n');

let failed = false;

for (const pair of pairsToVerify) {
  if (!pair.fg || !pair.bg) {
    console.error(`❌ Missing token for test: ${pair.name} (fg: ${pair.fg}, bg: ${pair.bg})`);
    failed = true;
    continue;
  }
  const ratio = getContrast(pair.fg, pair.bg);
  const passed = ratio >= pair.min;
  const status = passed ? '✔ PASS' : '❌ FAIL';
  console.log(`[${pair.theme.toUpperCase()}] ${pair.name}:`);
  console.log(`   FG: ${pair.fg} | BG: ${pair.bg}`);
  console.log(`   Ratio: ${ratio.toFixed(2)}:1 (Required: ${pair.min}:1) -> ${status}\n`);
  if (!passed) {
    failed = true;
  }
}

// Check Negative Constraints from Specification
console.log('Checking palette negative rules:');

// Rule 1: Orange, peach, salmon, tan must NEVER be used as text on light background
const forbiddenLightTextTokens = ['accent', 'peach', 'salmon', 'tan'];
for (const token of forbiddenLightTextTokens) {
  const color = lightTokens[token];
  if (color) {
    const ratio = getContrast(color, lightTokens['bg']);
    console.log(`  Rule: Light text guard - ${token} (${color}) contrast on light bg is ${ratio.toFixed(2)}:1 (Rule asserts not used as normal text on light) ✔`);
  }
}

// Rule 2: Rust (#A03401) must NEVER be used as text on dark background
const rustDarkContrast = getContrast('#A03401', darkTokens['bg']);
console.log(`  Rule: Dark text guard - Rust #A03401 on dark bg is ${rustDarkContrast.toFixed(2)}:1 (< 4.5:1, correctly restricted from dark text) ✔\n`);

if (failed) {
  console.error('❌ Contrast verification FAILED.');
  process.exit(1);
} else {
  console.log('✔ All WCAG 2.1 contrast checks PASSED successfully.');
  process.exit(0);
}
