import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the schema
const schemaPath = join(__dirname, 'schema', 'blueprint.v1.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Create and configure AJV instance
const ajv = new Ajv({ allErrors: true, verbose: true });
const validateFn = ajv.compile(schema);

/**
 * Validates a blueprint manifest against the v1 schema.
 * @param {object} manifest - The blueprint manifest object to validate
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validate(manifest) {
  const valid = validateFn(manifest);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validateFn.errors || []).map((err) => ({
    path: err.instancePath || '/',
    message: err.message || 'Unknown validation error',
    keyword: err.keyword,
    params: err.params,
  }));

  return { valid: false, errors };
}

/**
 * Validates a blueprint and throws an error if invalid.
 * @param {object} manifest - The blueprint manifest object to validate
 * @throws {Error} If the blueprint is invalid
 */
export function validateOrThrow(manifest) {
  const result = validate(manifest);

  if (!result.valid) {
    const errorMessages = result.errors
      .map((e) => `  - ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Blueprint validation failed:\n${errorMessages}`);
  }

  return result;
}

/**
 * Loads and validates a blueprint from a JSON file path.
 * @param {string} filePath - Path to the blueprint JSON file
 * @returns {{ valid: boolean, errors: Array, manifest: object|null }}
 */
export function validateFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(content);
    const result = validate(manifest);
    return { ...result, manifest };
  } catch (error) {
    return {
      valid: false,
      errors: [
        { path: '/', message: `Failed to load/parse file: ${error.message}` },
      ],
      manifest: null,
    };
  }
}

export { schema };
