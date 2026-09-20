#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Files permitted to contain raw hex codes
const ALLOWED_FILES = new Set([
  'styles/global.css',
  'store/themeStore.ts',      // <meta name="theme-color"> tag requires static hex string
  'pages/CertificatePage.tsx', // Canvas QRCode generator requires static hex string
]);

// Old palette hex codes that must NEVER exist anywhere in src (including allowed files except if aliased)
const FORBIDDEN_OLD_COLORS = [
  '#E44931',
  '#F6A724',
  '#2F8968',
  '#3D81F6',
  '#ca8a04',
  '#7a5800',
  '#10b981',
  '#3b82f6',
];

// Regex for hex color codes
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (/\.(tsx?|jsx?|css)$/.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

const allFiles = getFiles(srcDir);
let hasError = false;

console.log('======================================================');
console.log('       RAW COLOR & PALETTE LINT CI CHECK              ');
console.log('======================================================\n');

for (const fullPath of allFiles) {
  const relPath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  // Check 1: Old obsolete palette colors
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const oldColor of FORBIDDEN_OLD_COLORS) {
      if (line.toLowerCase().includes(oldColor.toLowerCase())) {
        console.error(`❌ Obsolete palette color ${oldColor} found in ${relPath}:${i + 1}`);
        console.error(`   ${line.trim()}`);
        hasError = true;
      }
    }
  }

  // Check 2: Raw hex codes outside allowed files
  if (!ALLOWED_FILES.has(relPath)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Ignore placeholder text or non-color hashes (e.g., #2024/991)
      if (line.includes('challan #2024')) continue;

      const matches = line.match(HEX_COLOR_REGEX);
      if (matches) {
        // Exclude possible false positives
        const realColors = matches.filter((m) => {
          // If it's a 3 or 6 char hex
          return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(m);
        });
        if (realColors.length > 0) {
          console.error(`❌ Raw hex color ${realColors.join(', ')} found in ${relPath}:${i + 1}`);
          console.error(`   ${line.trim()}`);
          hasError = true;
        }
      }
    }
  }
}

if (hasError) {
  console.error('\n❌ Raw color lint check FAILED.');
  process.exit(1);
} else {
  console.log(`✔ Raw color lint check passed: scanned ${allFiles.length} source files with 0 violations.`);
  process.exit(0);
}
