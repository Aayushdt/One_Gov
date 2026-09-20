#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.resolve(__dirname, '../src/i18n/en.json');
const hiPath = path.resolve(__dirname, '../src/i18n/hi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

function getLeaves(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, getLeaves(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

const enLeaves = getLeaves(en);
const hiLeaves = getLeaves(hi);

const enKeys = Object.keys(enLeaves);
const hiKeys = Object.keys(hiLeaves);

const missingInHi = enKeys.filter((k) => !(k in hiLeaves));
const missingInEn = hiKeys.filter((k) => !(k in enLeaves));
const emptyInHi = hiKeys.filter((k) => typeof hiLeaves[k] === 'string' && hiLeaves[k].trim() === '');

let hasError = false;

if (missingInHi.length > 0) {
  console.error('❌ Keys present in en.json but missing in hi.json:', missingInHi);
  hasError = true;
}

if (missingInEn.length > 0) {
  console.error('❌ Keys present in hi.json but missing in en.json:', missingInEn);
  hasError = true;
}

if (emptyInHi.length > 0) {
  console.error('❌ Empty translation values found in hi.json:', emptyInHi);
  hasError = true;
}

if (hasError) {
  console.error('\nParity check FAILED.');
  process.exit(1);
} else {
  console.log(`✔ i18n parity check passed: 100% match across all ${enKeys.length} keys with no empty values.`);
  process.exit(0);
}
