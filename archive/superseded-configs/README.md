# Superseded Configurations Archive

**Archived:** 2025-12-15  
**Reason:** Replaced by newer standards or consolidated approaches

## ESLint Legacy Configurations

### .eslintrc.json (root)

**Original Location:** `.eslintrc.json`  
**Reason for Archival:** Migrated to ESLint v9+ flat config standard  
**Replaced By:** `eslint.config.js`

**What it contained:**

- Nx module boundary enforcement rules
- Workspace-wide linting configuration
- Legacy ESLint format (pre-v9)

**Migration Notes:**

- All rules migrated to `eslint.config.js` (flat config format)
- Flat config is the future standard for ESLint v9+
- More composable and easier to maintain

### apps/backend/.eslintrc.cjs

**Original Location:** `apps/backend/.eslintrc.cjs`  
**Replaced By:** `apps/backend/eslint.config.js`  
**Reason:** Same as above - flat config migration

### apps/frontend/.eslintrc.cjs

**Original Location:** `apps/frontend/.eslintrc.cjs`  
**Replaced By:** `apps/frontend/eslint.config.js`  
**Reason:** Same as above - flat config migration

## Formatter Configurations

### biome.json

**Original Location:** `biome.json` (root)  
**Reason for Archival:** Standardized on Prettier for consistency  
**Replaced By:** `.prettierrc` (already in use)

**What it contained:**

```json
{
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "linter": { "enabled": true },
  "javascript": { "formatter": { "quoteStyle": "single" } }
}
```

**Why Prettier Won:**

1. Already configured and actively used in package.json scripts
2. Has `prettier-plugin-tailwindcss` integration
3. CI pipeline already runs Prettier
4. Team familiarity
5. Ecosystem support (IDE plugins, git hooks, etc.)

**Biome Advantages (Not Adopted):**

- Faster than Prettier
- Combined linter + formatter
- Written in Rust

**Decision:** Consistency and existing integration outweighed performance gains

## Restoration

### To Restore Legacy ESLint Config:

1. Copy `.eslintrc.json` back to root
2. Rename/remove `eslint.config.js`
3. Update apps to use `.eslintrc.cjs` format
4. **Note:** This is NOT recommended - flat config is the future

### To Restore Biome:

1. Copy `biome.json` back to root
2. Run `npm install -D @biomejs/biome`
3. Update package.json scripts to use `biome format` and `biome lint`
4. Update CI workflows
5. **Note:** Would require team discussion and migration effort

## Migration Notes

### ESLint Flat Config Migration

The migration from `.eslintrc.*` to `eslint.config.js` involved:

1. **Root Config Changes:**
   - Moved from object-based config to array of config objects
   - Updated plugin imports to ES modules
   - Converted `extends` to explicit plugin configurations

2. **Per-App Configs:**
   - Each app has its own `eslint.config.js` for app-specific rules
   - Root config provides workspace-wide rules via Nx plugin

3. **Benefits:**
   - More explicit and composable
   - Better TypeScript support
   - Easier to understand what rules apply where

### Prettier Standardization

Kept `.prettierrc` with:

- Single quotes for JS/TS
- Trailing commas ES5 style
- Tailwindcss plugin for class sorting
- Consistent with existing codebase style

---

**Recommendation:** Do not restore these configs. The new standards are better maintained and aligned with ecosystem direction.
