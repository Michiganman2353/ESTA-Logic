#!/usr/bin/env node
/**
 * Validates all marketing blueprints in the content/marketing/blueprints directory.
 * Used by CI to ensure all blueprints are valid before merge.
 */

import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateFile } from './validateBlueprint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLUEPRINTS_DIR = join(__dirname, '../../content/marketing/blueprints');

function main() {
  console.log('🔍 Validating marketing blueprints...\n');

  let files;
  try {
    files = readdirSync(BLUEPRINTS_DIR).filter((f) => f.endsWith('.json'));
  } catch (error) {
    console.error(`❌ Failed to read blueprints directory: ${BLUEPRINTS_DIR}`);
    console.error(error.message);
    process.exit(1);
  }

  if (files.length === 0) {
    console.warn('⚠️  No blueprint files found in', BLUEPRINTS_DIR);
    process.exit(0);
  }

  let hasErrors = false;

  for (const file of files) {
    const filePath = join(BLUEPRINTS_DIR, file);
    const result = validateFile(filePath);

    if (result.valid) {
      console.log(`✅ ${file} - Valid`);
    } else {
      hasErrors = true;
      console.log(`❌ ${file} - Invalid`);
      for (const error of result.errors) {
        console.log(`   ${error.path}: ${error.message}`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error(
      '❌ Some blueprints failed validation. Please fix the errors above.'
    );
    process.exit(1);
  }

  console.log(`✅ All ${files.length} blueprints are valid!`);
  process.exit(0);
}

main();
