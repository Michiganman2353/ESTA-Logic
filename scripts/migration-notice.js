// scripts/migration-notice.js
const fs = require('fs');
const path = require('path');

const DEPRECATED_IMPORTS = [
  {
    pattern: "from '@esta/esta-firebase'",
    message: 'consider updating to adapter interface or @esta/firebase',
  },
  {
    pattern: "from '@esta-firebase'",
    message: 'consider updating to @esta/firebase',
  },
  {
    pattern: 'legacyGetDoc',
    message: 'legacyGetDoc is deprecated; use new adapter interface',
  },
];

function scan(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      // Skip node_modules and dist directories
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') {
        continue;
      }
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        scan(p);
      } else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) {
        const contents = fs.readFileSync(p, 'utf8');
        for (const dep of DEPRECATED_IMPORTS) {
          if (contents.includes(dep.pattern)) {
            console.warn(
              `[migration-notice] Found deprecated pattern in ${p} — ${dep.message}`
            );
          }
        }
      }
    }
  } catch (err) {
    // Log permission errors or unexpected failures
    if (err && err.code !== 'ENOENT') {
      console.warn(
        `[migration-notice] Error scanning ${dir}: ${err.message || err}`
      );
    }
  }
}

// Start from current working directory
scan(process.cwd());
console.log('[migration-notice] Scan complete.');
