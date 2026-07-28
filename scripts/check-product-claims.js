#!/usr/bin/env node

/**
 * Fails when active product or marketing code contains categorical claims that
 * require independent legal, audit, certification, or infrastructure evidence.
 *
 * This intentionally scans active customer-facing source only. Historical
 * documents and internal design notes may discuss these phrases as examples.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const TARGETS = [
  'apps/frontend/index.html',
  'apps/frontend/src/pages',
  'apps/frontend/src/components',
  'apps/marketing/src',
  'content/marketing',
];

const EXTENSIONS = new Set(['.html', '.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

const PROHIBITED = [
  { label: 'absolute legal compliance', pattern: /100%\s+(?:ESTA\s+)?compliant/gi },
  { label: 'categorical compliance metadata', pattern: /(?:compliant\s+sick\s+time\s+management|michigan\s+sick\s+time\s+compliance)/gi },
  { label: 'guaranteed compliance', pattern: /guaranteed\s+compliance/gi },
  { label: 'state approval or certification', pattern: /(?:state|government)\s+(?:approved|certified)/gi },
  { label: 'audit-proof guarantee', pattern: /audit[- ]proof/gi },
  { label: 'absolute risk guarantee', pattern: /zero\s+risk/gi },
  { label: 'absolute tenant guarantee', pattern: /zero\s+cross[- ]tenant\s+data\s+access/gi },
  { label: 'bank-grade claim', pattern: /bank[- ](?:grade|level)\s+encryption/gi },
  { label: 'military-grade claim', pattern: /military[- ]grade\s+encryption/gi },
  { label: 'SOC 2 compliance claim', pattern: /SOC\s*2\s+compliant/gi },
  { label: 'GDPR compliance claim', pattern: /GDPR\s+compliant/gi },
  { label: 'CCPA compliance claim', pattern: /CCPA\s+compliant/gi },
  { label: 'cryptographic immutability claim', pattern: /cryptographically\s+(?:signed\s+and\s+)?immutable/gi },
  { label: 'HSM deployment claim', pattern: /hardware\s+security\s+modules?\s*\(HSM\)/gi },
];

function collectFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return EXTENSIONS.has(path.extname(target)) ? [target] : [];

  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    return entry.isDirectory() ? collectFiles(fullPath) : EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

const findings = [];

for (const target of TARGETS) {
  for (const filename of collectFiles(path.join(ROOT, target))) {
    const text = fs.readFileSync(filename, 'utf8');
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const claim of PROHIBITED) {
        claim.pattern.lastIndex = 0;
        if (claim.pattern.test(line)) {
          findings.push({
            file: path.relative(ROOT, filename),
            line: index + 1,
            label: claim.label,
            excerpt: line.trim(),
          });
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error('Unsupported categorical product claims found:\n');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.label}]`);
    console.error(`  ${finding.excerpt}\n`);
  }
  console.error(
    'Describe the implemented control or tested behavior instead of making an absolute legal, certification, or security claim.'
  );
  process.exit(1);
}

console.log('Product claims check passed.');
