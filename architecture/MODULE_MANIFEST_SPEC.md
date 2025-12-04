# ESTA Logic Module Manifest Specification

## Overview

Every ESTA Logic module requires a `manifest.json` file that declares its metadata, dependencies, and required capabilities.

## Manifest Schema

```json
{
  "name": "module-name",
  "version": "1.0.0",
  "description": "Module description",
  "entry_point": "module_init.main",
  "runtime": "wasm32",
  "dependencies": ["other-module"],
  "capabilities_required": ["db:read", "messaging:send"],
  "priority": "normal",
  "preload": false
}
```

## Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Unique module identifier |
| version | string | Semantic version (X.Y.Z) |
| entry_point | string | Function to call on module start |
| runtime | string | Runtime type (currently only "wasm32") |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| description | string | "" | Human-readable description |
| dependencies | array | [] | List of required modules |
| capabilities_required | array | [] | Required capabilities |
| priority | string | "normal" | Module priority level |
| preload | boolean | false | Whether to preload module |

## Priority Levels

- `critical`: System-essential modules
- `high`: User-facing modules
- `normal`: Standard modules
- `low`: Background modules
- `lazy`: Load on demand

## Capability Format

Capabilities use the format `resource:action`:
- `db:read` - Read database access
- `db:write` - Write database access
- `messaging:send` - Send messages
- `messaging:receive` - Receive messages
- `file:read` - Read file access
- `file:write` - Write file access

## Validation

The module loader validates manifests against this specification before loading. Invalid manifests will cause module load failure.
