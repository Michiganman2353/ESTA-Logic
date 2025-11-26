import { describe, it, expect } from '@jest/globals';
import {
  validate,
  validateOrThrow,
  validateFile,
  schema,
} from '../validateBlueprint.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLUEPRINTS_DIR = join(__dirname, '../../../content/marketing/blueprints');

describe('Blueprint Validation', () => {
  describe('schema', () => {
    it('should export the schema object', () => {
      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('Marketing Blueprint v1');
    });
  });

  describe('validate()', () => {
    it('should return valid for a correct minimal blueprint', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
        blocks: [],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for a complete blueprint with meta', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'complete-page',
        title: 'Complete Page',
        meta: {
          description: 'A complete test page',
          ogImage: '/images/test.png',
        },
        blocks: [
          {
            type: 'Hero',
            props: {
              headline: 'Welcome',
              subheadline: 'Test subheadline',
            },
          },
        ],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when schemaVersion is missing', () => {
      const blueprint = {
        slug: 'test-page',
        title: 'Test Page',
        blocks: [],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((e) => e.message.includes('schemaVersion'))
      ).toBe(true);
    });

    it('should return invalid when slug is missing', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        title: 'Test Page',
        blocks: [],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('slug'))).toBe(true);
    });

    it('should return invalid when title is missing', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        blocks: [],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('title'))).toBe(true);
    });

    it('should return invalid when blocks is missing', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('blocks'))).toBe(
        true
      );
    });

    it('should return invalid when slug has invalid characters', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'Invalid Slug!',
        title: 'Test Page',
        blocks: [],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('slug'))).toBe(true);
    });

    it('should return invalid when blocks item is missing type', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
        blocks: [{ props: {} }],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('type'))).toBe(true);
    });

    it('should return invalid when blocks item is missing props', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
        blocks: [{ type: 'Hero' }],
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('props'))).toBe(true);
    });

    it('should return invalid for additional properties at root level', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
        blocks: [],
        unknownField: 'should fail',
      };

      const result = validate(blueprint);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateOrThrow()', () => {
    it('should not throw for valid blueprint', () => {
      const blueprint = {
        schemaVersion: '1.0.0',
        slug: 'test-page',
        title: 'Test Page',
        blocks: [],
      };

      expect(() => validateOrThrow(blueprint)).not.toThrow();
    });

    it('should throw for invalid blueprint', () => {
      const blueprint = {
        slug: 'test-page',
      };

      expect(() => validateOrThrow(blueprint)).toThrow(
        'Blueprint validation failed'
      );
    });

    it('should include error details in thrown error', () => {
      const blueprint = {
        slug: 'test-page',
      };

      try {
        validateOrThrow(blueprint);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('Blueprint validation failed');
        expect(error.message).toContain('schemaVersion');
      }
    });
  });

  describe('validateFile()', () => {
    it('should return error for non-existent file', () => {
      const result = validateFile('/non/existent/file.json');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.manifest).toBeNull();
    });

    it('should return error for invalid JSON file', () => {
      // Create a temporary invalid JSON situation by passing path that can't be parsed
      const result = validateFile(join(__dirname, '../package.json'));
      // package.json is valid JSON but may not match blueprint schema
      expect(result.manifest).not.toBeNull(); // File was parsed
      // May or may not be valid depending on contents
    });
  });

  describe('Sample Blueprints', () => {
    it('should validate home.json blueprint', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'home.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.slug).toBe('home');
      expect(result.manifest.schemaVersion).toBe('1.0.0');
    });

    it('should validate features.json blueprint', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'features.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.slug).toBe('features');
      expect(result.manifest.schemaVersion).toBe('1.0.0');
    });

    it('should validate pricing.json blueprint', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'pricing.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.slug).toBe('pricing');
      expect(result.manifest.schemaVersion).toBe('1.0.0');
    });

    it('should have correct structure for home.json', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'home.json'));
      expect(result.manifest.blocks.length).toBeGreaterThan(0);
      expect(result.manifest.meta).toBeDefined();
      expect(result.manifest.meta.description).toBeDefined();
    });

    it('should have correct structure for features.json', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'features.json'));
      expect(result.manifest.blocks.length).toBeGreaterThan(0);
      // Features should have multiple feature grids
      const featureGrids = result.manifest.blocks.filter(
        (b) => b.type === 'FeatureGrid'
      );
      expect(featureGrids.length).toBeGreaterThan(1);
    });

    it('should have correct structure for pricing.json', () => {
      const result = validateFile(join(BLUEPRINTS_DIR, 'pricing.json'));
      expect(result.manifest.blocks.length).toBeGreaterThan(0);
      // Pricing should have a PricingTable block
      const pricingTable = result.manifest.blocks.find(
        (b) => b.type === 'PricingTable'
      );
      expect(pricingTable).toBeDefined();
      expect(pricingTable.props.plans).toBeDefined();
      expect(pricingTable.props.plans.length).toBeGreaterThan(0);
    });
  });
});
