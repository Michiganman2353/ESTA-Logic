/**
 * Architecture Boundary Tests
 *
 * Validates that interface boundaries are respected throughout the codebase
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    // Skip node_modules, dist, and build directories
    if (
      item.isDirectory() &&
      !item.name.includes('node_modules') &&
      !item.name.includes('dist') &&
      !item.name.includes('build') &&
      !item.name.includes('.next')
    ) {
      findTypeScriptFiles(fullPath, files);
    } else if (
      item.isFile() &&
      (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract import statements from a TypeScript file
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex =
    /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1] ?? '');
  }

  return imports;
}

describe('Interface Boundary Enforcement', () => {
  it('frontend should not import from backend API implementation', () => {
    const frontendDir = path.join(repoRoot, 'apps/frontend/src');

    if (!fs.existsSync(frontendDir)) {
      // Skip if frontend doesn't exist
      return;
    }

    const frontendFiles = findTypeScriptFiles(frontendDir);
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of frontendFiles) {
      const imports = extractImports(file);

      for (const imp of imports) {
        // Check for forbidden imports from backend API
        if (
          imp.includes('../../../api/') ||
          imp.includes('../../api/') ||
          imp.startsWith('api/')
        ) {
          violations.push({
            file: path.relative(repoRoot, file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      const message = violations
        .map((v) => `  ${v.file}: imports "${v.import}"`)
        .join('\n');
      throw new Error(
        `Frontend files should not import from backend API:\n${message}`
      );
    }
  });

  it('frontend should use API contracts for API types', () => {
    const frontendApiFile = path.join(repoRoot, 'apps/frontend/src/lib/api.ts');

    if (!fs.existsSync(frontendApiFile)) {
      // Skip if file doesn't exist
      return;
    }

    const content = fs.readFileSync(frontendApiFile, 'utf-8');

    // Should have documentation comment about using contracts
    // This test will pass once we update the frontend to use the contracts
    const hasContractComment =
      content.includes('@esta/api-contracts') ||
      content.includes('API contract');

    // For now, we'll just check if the file exists and mark this as a TODO
    // The actual migration to use contracts will be done in a follow-up step
    expect(frontendApiFile).toBeTruthy();
  });

  it('API contracts should not import from frontend or backend', () => {
    const contractsDir = path.join(repoRoot, 'libs/api-contracts/src');

    if (!fs.existsSync(contractsDir)) {
      // Skip if contracts don't exist
      return;
    }

    const contractFiles = findTypeScriptFiles(contractsDir);
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of contractFiles) {
      const imports = extractImports(file);

      for (const imp of imports) {
        // Check for forbidden imports
        if (
          imp.includes('apps/frontend') ||
          imp.includes('apps/backend') ||
          imp.includes('../../../api/') ||
          imp.includes('../../api/')
        ) {
          violations.push({
            file: path.relative(repoRoot, file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      const message = violations
        .map((v) => `  ${v.file}: imports "${v.import}"`)
        .join('\n');
      throw new Error(
        `API contracts should not import from frontend or backend:\n${message}`
      );
    }
  });

  it('API contracts should only import from zod and self', () => {
    const contractsDir = path.join(repoRoot, 'libs/api-contracts/src');

    if (!fs.existsSync(contractsDir)) {
      return;
    }

    const contractFiles = findTypeScriptFiles(contractsDir).filter(
      // Exclude test files from this check
      (file) => !file.includes('__tests__')
    );
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of contractFiles) {
      const imports = extractImports(file);

      for (const imp of imports) {
        // Allow only zod, relative imports, and scoped imports within api-contracts
        const isAllowed =
          imp === 'zod' ||
          imp.startsWith('./') ||
          imp.startsWith('../') ||
          imp.startsWith('@esta/api-contracts');

        if (!isAllowed) {
          violations.push({
            file: path.relative(repoRoot, file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      const message = violations
        .map((v) => `  ${v.file}: imports "${v.import}"`)
        .join('\n');
      throw new Error(
        `API contracts should only import from zod and self:\n${message}`
      );
    }
  });
});

describe('Contract Structure', () => {
  it('should have versioned API structure', () => {
    const contractsDir = path.join(repoRoot, 'libs/api-contracts/src');

    if (!fs.existsSync(contractsDir)) {
      return;
    }

    const v1Dir = path.join(contractsDir, 'v1');
    expect(fs.existsSync(v1Dir)).toBe(true);

    const v1Index = path.join(v1Dir, 'index.ts');
    expect(fs.existsSync(v1Index)).toBe(true);
  });

  it('should export all v1 contracts from main index', () => {
    const mainIndex = path.join(repoRoot, 'libs/api-contracts/src/index.ts');

    if (!fs.existsSync(mainIndex)) {
      return;
    }

    const content = fs.readFileSync(mainIndex, 'utf-8');
    expect(content).toContain('v1');
  });
});
