#!/usr/bin/env node
/**
 * Em / En Dash Guardrail
 *
 * Scans src/app, src/components, src/lib for literal em dashes (U+2014),
 * en dashes (U+2013), and their HTML entity equivalents. Exits non-zero
 * if any are found in non-comment, non-exempt lines.
 *
 * SKIP RULES:
 *   - Lines inside // single-line comments are skipped
 *   - Lines inside block comments are skipped (simple state machine)
 *   - Lines containing the literal string "\u2014" or "\u2013" (the
 *     escape sequence AS SOURCE TEXT) are skipped — these are intentional
 *     encodings in prompt templates for anti-slop instructions
 *   - Box-drawing character U+2500 is NOT matched (different char)
 *   - Paths listed in SKIP_PATHS are entirely skipped
 *
 * HTML entities checked: &mdash; &ndash; &#8211; &#8212; &#x2013; &#x2014;
 *
 * Usage:
 *   node scripts/check-em-dashes.mjs
 *   npm run check:dashes
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/app', 'src/components', 'src/lib'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

// Paths to skip entirely (Tastemaker WIP + do-not-touch list)
const SKIP_PATHS = [
  'src/app/api/ai/tastemaker',
  'src/app/api/tastemaker',
  'src/app/api/tracker',
  'src/components/app/Tastemaker.tsx',
  'src/components/app/PerformanceTracker.tsx',
  'src/components/app/tastemaker',
  'src/lib/tastemaker-state.ts',
  'src/lib/docx-parser.ts',
  'src/lib/youtube-url.ts',
];

// Patterns to detect
const LITERAL_DASH = /[\u2014\u2013]/;
const HTML_ENTITIES = /&mdash;|&ndash;|&#8211;|&#8212;|&#x2013;|&#x2014;/i;
// Lines containing the escape sequence AS SOURCE — intentional, skip
const INTENTIONAL_ESCAPE = /\\u2014|\\u2013/;

function shouldSkipPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return SKIP_PATHS.some(skip => normalized === skip || normalized.startsWith(skip + '/'));
}

function walkDir(dir) {
  const files = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return files; }
  for (const entry of entries) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (shouldSkipPath(rel)) continue;
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      files.push(...walkDir(full));
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')))) {
      files.push(full);
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Block comment state tracking (simple — not a full parser)
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith('/*') || trimmed.startsWith('{/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue; // skip the opening line of a block/JSX comment either way
    }

    // Single-line comments
    if (trimmed.startsWith('//')) continue;

    // Skip intentional escape sequences
    if (INTENTIONAL_ESCAPE.test(line)) continue;

    // Check for violations
    if (LITERAL_DASH.test(line) || HTML_ENTITIES.test(line)) {
      violations.push({ line: i + 1, text: line.trimEnd() });
    }
  }

  return violations;
}

// Main
let totalFiles = 0;
let totalViolations = 0;
const report = [];

for (const dir of SCAN_DIRS) {
  const files = walkDir(join(ROOT, dir));
  for (const file of files) {
    totalFiles++;
    const violations = scanFile(file);
    if (violations.length > 0) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      totalViolations += violations.length;
      report.push({ file: rel, violations });
    }
  }
}

if (totalViolations > 0) {
  console.error(`\u274C Em/en dashes found (${totalViolations} violations in ${report.length} files):\n`);
  for (const { file, violations } of report) {
    for (const v of violations) {
      console.error(`  ${file}:${v.line}  ${v.text}`);
    }
  }
  console.error('');
  process.exit(1);
} else {
  console.log(`\u2713 No em/en dashes found in ${totalFiles} files scanned.`);
  process.exit(0);
}
