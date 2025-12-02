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

let warningCount = 0;

function scan(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      // Skip node_modules, dist, and hidden directories
      if (
        e.name === 'node_modules' ||
        e.name === 'dist' ||
        e.name === '.git' ||
        e.name.startsWith('.')
      ) {
        continue;
      }
      const p = path.join(dir, e.name);
      try {
        if (e.isDirectory()) {
          scan(p);
        } else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) {
          const contents = fs.readFileSync(p, 'utf8');
          for (const dep of DEPRECATED_IMPORTS) {
            if (contents.includes(dep.pattern)) {
              console.warn(
                `[migration-notice] Found deprecated pattern in ${p} — ${dep.message}`
              );
              warningCount++;
            }
          }
        }
      } catch (fileErr) {
        // Log file-level errors but continue scanning
        if (fileErr && fileErr.code !== 'ENOENT') {
          console.warn(
            `[migration-notice] Error processing ${p}: ${fileErr.message || fileErr}`
          );
        }
      }
    }
  } catch (err) {
    // Log permission errors or unexpected failures at directory level
    if (err && err.code !== 'ENOENT') {
      console.warn(
        `[migration-notice] Error scanning ${dir}: ${err.message || err}`
      );
    }
  }
}

// Start from current working directory
try {
  scan(process.cwd());
  if (warningCount > 0) {
    console.log(
      `[migration-notice] Scan complete. Found ${warningCount} deprecated pattern(s).`
    );
  } else {
    console.log(
      '[migration-notice] Scan complete. No deprecated patterns found.'
    );
  }
} catch (err) {
  console.error(
    `[migration-notice] Fatal error during scan: ${err.message || err}`
  );
  process.exit(1);
}
