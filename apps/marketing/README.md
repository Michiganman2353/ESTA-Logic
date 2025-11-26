# Marketing App

Declarative marketing site powered by blueprint-driven content.

## Overview

This Next.js application renders marketing pages from JSON blueprint files located in `/content/marketing/blueprints/`. Each blueprint defines the page structure using a component-based block system.

## Quick Start

```bash
# From the repository root
npm install

# Start the development server
cd apps/marketing
npm run dev

# Open http://localhost:3001/home
```

## Available Pages

- `/home` - Main landing page
- `/features` - Feature showcase page
- `/pricing` - Pricing plans page

## Architecture

### Blueprint-Driven Rendering

1. Blueprints are JSON files in `/content/marketing/blueprints/`
2. Each blueprint contains:
   - `schemaVersion`: Schema version for compatibility
   - `slug`: URL path segment
   - `title`: Page title
   - `meta`: SEO metadata (description, ogImage)
   - `blocks`: Array of component blocks to render

3. At build time:
   - `getStaticPaths` discovers all blueprint files
   - `getStaticProps` loads and validates each blueprint
   - Pages are statically generated (SSG)

### Component Registry

The page maps block types to React components:

| Block Type   | Component        | Purpose                            |
| ------------ | ---------------- | ---------------------------------- |
| Hero         | `<Hero>`         | Page header with headline and CTAs |
| FeatureGrid  | `<FeatureGrid>`  | Grid of feature cards              |
| PricingTable | `<PricingTable>` | Pricing plan comparison            |
| CTA          | `<CTA>`          | Call-to-action section             |

### Validation

Blueprints are validated against the schema in `/libs/blueprints/schema/blueprint.v1.json` at build time. Invalid blueprints will fail the build.

## Adding a New Page

1. Create a new blueprint file: `/content/marketing/blueprints/my-page.json`
2. Follow the schema structure (see `/docs/blueprints.md`)
3. Run `npm run dev` to preview at `/my-page`
4. Run the validation: `node libs/blueprints/validateAll.js`

## Adding a New Block Type

1. Create component in `/apps/marketing/components/`
2. Export from `/apps/marketing/components/index.ts`
3. Add to `componentRegistry` in `/apps/marketing/pages/[slug].tsx`
4. Update the schema if needed

## Scripts

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start development server on port 3001 |
| `npm run build`    | Build for production (static export)  |
| `npm run start`    | Serve production build                |
| `npm run lint`     | Run ESLint                            |
| `npm run test:e2e` | Run Playwright E2E tests              |

## Related Documentation

- [Blueprint Schema Guide](/docs/blueprints.md)
- [Monorepo Guide](/docs/MONOREPO_GUIDE.md)
