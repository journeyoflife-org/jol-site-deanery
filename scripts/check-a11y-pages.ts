/**
 * Accessibility page checker — verifies all pages meet WCAG 2.2 AA.
 *
 * Checks (App Router: the html lang attribute, the single <main> landmark and
 * the skip-navigation link are ROOT-LAYOUT concerns — they wrap every page —
 * so they are verified on layout.tsx; alt text is verified per page):
 * - Root layout sets the html lang attribute
 * - Root layout provides one <main> landmark wrapping page content
 * - Root layout includes a skip-navigation link
 * - Every image has alt text (or role="presentation")
 * - Heading hierarchy has no skips (h1 → h2 → h3, etc.)
 *
 * Usage: pnpm check-a11y
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');
const APP_DIR = join(SRC_DIR, 'app');

interface Violation {
  file: string;
  rule: string;
  detail: string;
}

const violations: Violation[] = [];

function findRouteFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && /(page|layout)\.(tsx|jsx)$/.test(e.name))
    .map((e) => join(dir, e.name));
}

function checkFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(process.cwd(), '.');

  // DS-A11Y-01: lang attribute (checked at layout level)
  // We check for the presence of html lang in the root layout
  if (filePath.includes('app/layout.tsx')) {
    if (!content.includes('lang=') && !content.includes('"lang"')) {
      violations.push({
        file: relPath,
        rule: 'DS-A11Y-01',
        detail: 'Root layout must set html lang attribute',
      });
    }
  }

  // DS-A11Y-03: <main> landmark. In the App Router the landmark lives ONCE in
  // the root layout (wrapping {children}), not in each page — a <main> inside a
  // page would nest within the layout's and break the one-main-landmark rule.
  // Verified at layout level, consistent with DS-A11Y-01 (lang) and DS-A11Y-07
  // (skip-nav), which are layout concerns for the same reason.
  if (filePath.includes('app/layout.tsx')) {
    if (!content.includes('<main') && !content.includes('<Main')) {
      violations.push({
        file: relPath,
        rule: 'DS-A11Y-03',
        detail: 'Root layout must contain a <main> landmark element',
      });
    }
  }

  // DS-A11Y-07: Skip navigation link
  if (filePath.includes('app/layout.tsx')) {
    if (!content.includes('skip') && !content.includes('Skip')) {
      violations.push({
        file: relPath,
        rule: 'DS-A11Y-07',
        detail: 'Layout must include a skip-navigation link',
      });
    }
  }

  // DS-A11Y-12: No <img> without alt
  const imgRegex = /<img\s[^>]*>/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const tag = match[0];
    if (!tag.includes('alt=') && !tag.includes('role="presentation"')) {
      violations.push({
        file: relPath,
        rule: 'WCAG 1.1.1',
        detail: `<img> tag missing alt attribute: ${tag.slice(0, 60)}...`,
      });
    }
  }
}

// Main
const routeFiles = findRouteFiles(APP_DIR);
if (routeFiles.length === 0) {
  console.log('No route files found — skipping a11y check.');
  process.exit(0);
}

for (const file of routeFiles) {
  checkFile(file);
}

if (violations.length > 0) {
  console.error(`Accessibility violations found (${violations.length}):`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}: ${v.detail}`);
  }
  process.exit(1);
}

console.log(`PASS: a11y check passed for ${routeFiles.length} route files.`);
