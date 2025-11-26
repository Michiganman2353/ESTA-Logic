# Marketing Blueprints Guide

This guide covers how to create and manage marketing page blueprints for the public site.

## Overview

Marketing blueprints are declarative JSON files that define page content and structure. The blueprint system provides:

- **Declarative Content**: Define pages as data, not code
- **Schema Validation**: Catch errors before deployment
- **Component Mapping**: Map block types to React components
- **SEO Support**: Built-in meta tag configuration

## Quick Start

### Creating a New Page

1. Create a new JSON file in `/content/marketing/blueprints/`:

```bash
touch content/marketing/blueprints/my-page.json
```

2. Add the blueprint structure:

```json
{
  "schemaVersion": "1.0.0",
  "slug": "my-page",
  "title": "My Page - ESTA Tracker",
  "meta": {
    "description": "Description for SEO",
    "ogImage": "/images/og-my-page.png"
  },
  "blocks": [
    {
      "type": "Hero",
      "props": {
        "headline": "Welcome to My Page",
        "subheadline": "This is a subheadline",
        "ctaText": "Get Started",
        "ctaLink": "/signup"
      }
    }
  ]
}
```

3. Validate the blueprint:

```bash
node libs/blueprints/validateAll.js
```

4. Preview locally:

```bash
cd apps/marketing
npm run dev
# Open http://localhost:3001/my-page
```

## Schema Reference

### Root Properties

| Property        | Type   | Required | Description                                |
| --------------- | ------ | -------- | ------------------------------------------ |
| `schemaVersion` | string | ✓        | Schema version (e.g., "1.0.0")             |
| `slug`          | string | ✓        | URL path segment (lowercase, hyphens only) |
| `title`         | string | ✓        | Page title for browser tab and SEO         |
| `meta`          | object |          | SEO metadata                               |
| `blocks`        | array  | ✓        | Content blocks to render                   |

### Meta Object

| Property      | Type   | Description              |
| ------------- | ------ | ------------------------ |
| `description` | string | Meta description for SEO |
| `ogImage`     | string | Open Graph image URL     |

### Block Object

| Property | Type   | Required | Description                  |
| -------- | ------ | -------- | ---------------------------- |
| `type`   | string | ✓        | Component type from registry |
| `props`  | object | ✓        | Props to pass to component   |

## Available Block Types

### Hero

Page header section with headline, subheadline, and call-to-action buttons.

```json
{
  "type": "Hero",
  "props": {
    "headline": "Main Headline",
    "subheadline": "Supporting text",
    "ctaText": "Primary Button",
    "ctaLink": "/action",
    "secondaryCtaText": "Secondary Button",
    "secondaryCtaLink": "/learn-more",
    "variant": "default"
  }
}
```

**Props:**

- `headline` (required): Main heading text
- `subheadline`: Supporting description
- `ctaText` / `ctaLink`: Primary CTA button
- `secondaryCtaText` / `secondaryCtaLink`: Secondary CTA button
- `variant`: "default" | "compact"

### FeatureGrid

Grid of feature cards with icons.

```json
{
  "type": "FeatureGrid",
  "props": {
    "headline": "Section Title",
    "columns": 3,
    "features": [
      {
        "icon": "calculator",
        "title": "Feature Name",
        "description": "Feature description text"
      }
    ]
  }
}
```

**Props:**

- `headline`: Section heading
- `columns`: 2 | 3 | 4
- `features`: Array of feature objects

**Available Icons:**
`calculator`, `shield`, `document`, `users`, `clock`, `refresh`, `chart`, `bell`, `lock`, `dashboard`, `settings`, `mobile`, `history`, `download`, `support`, `check`

### PricingTable

Pricing plan comparison table.

```json
{
  "type": "PricingTable",
  "props": {
    "headline": "Choose Your Plan",
    "plans": [
      {
        "name": "Plan Name",
        "price": 9.99,
        "period": "month",
        "description": "Plan description",
        "features": ["Feature 1", "Feature 2"],
        "ctaText": "Get Started",
        "ctaLink": "/signup",
        "highlighted": false
      }
    ]
  }
}
```

**Props:**

- `headline`: Section heading
- `plans`: Array of plan objects
  - `price`: Number or null for custom pricing
  - `period`: Billing period text
  - `highlighted`: Boolean to emphasize a plan

### CTA

Call-to-action section.

```json
{
  "type": "CTA",
  "props": {
    "headline": "Ready to get started?",
    "subheadline": "Join us today",
    "ctaText": "Sign Up Now",
    "ctaLink": "/signup",
    "variant": "primary"
  }
}
```

**Props:**

- `headline` (required): CTA heading
- `subheadline`: Supporting text
- `ctaText` / `ctaLink` (required): Button text and link
- `variant`: "primary" | "secondary" | "tertiary"

## Adding a New Block Type

1. Create the component in `/apps/marketing/components/`:

```tsx
// components/MyBlock.tsx
import React from 'react';

interface MyBlockProps {
  title: string;
  content: string;
}

export function MyBlock({ title, content }: MyBlockProps) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{content}</p>
    </section>
  );
}
```

2. Export from the components index:

```ts
// components/index.ts
export { MyBlock } from './MyBlock';
```

3. Add to the component registry in `pages/[slug].tsx`:

```ts
const componentRegistry = {
  // ...existing components
  MyBlock,
};
```

4. Use in your blueprint:

```json
{
  "type": "MyBlock",
  "props": {
    "title": "My Title",
    "content": "My content"
  }
}
```

## Validation

### Local Validation

Run the validator before committing:

```bash
node libs/blueprints/validateAll.js
```

### Unit Tests

Run the blueprint test suite:

```bash
cd libs/blueprints
npm test
```

### CI Validation

The CI pipeline automatically validates all blueprints on PR. Invalid blueprints will block the merge.

## Schema Versioning

The `schemaVersion` field enables forward compatibility:

- Current version: `1.0.0`
- Version changes require an RFC in `/docs/blueprints/rfcs/`
- Breaking changes require a migration script

## Troubleshooting

### "Unknown block type" Error

The block type in your blueprint doesn't match any component in the registry. Check:

- Spelling and capitalization (e.g., "Hero" not "hero")
- Component is exported from `/apps/marketing/components/index.ts`
- Component is added to `componentRegistry` in `[slug].tsx`

### Validation Errors

Run the validator for detailed error messages:

```bash
node libs/blueprints/validateAll.js
```

Common issues:

- Missing required fields (`schemaVersion`, `slug`, `title`, `blocks`)
- Invalid slug format (must be lowercase with hyphens)
- Missing `type` or `props` in block objects

### Build Failures

If the build fails with blueprint errors:

1. Check the error message for the specific blueprint
2. Validate locally: `node libs/blueprints/validateAll.js`
3. Verify the blueprint file is valid JSON

## Related Documentation

- [Marketing App README](/apps/marketing/README.md)
- [Monorepo Guide](/docs/MONOREPO_GUIDE.md)
- [Blueprint Schema](/libs/blueprints/schema/blueprint.v1.json)
