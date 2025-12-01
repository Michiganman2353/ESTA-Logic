/**
 * ESTA Tracker Accrual Engine
 *
 * Core business logic for Michigan ESTA sick time accrual calculations
 * This package will be replaced/enhanced with WebAssembly (Rust) in Phase Two
 *
 * Helix Integration: For immutable FP calculations, use:
 *   import { calculate } from '@esta-logic/helix';
 * The Helix package provides pure functional calculations compiled to WASM.
 *
 * Compliance Engine v2: For deterministic, ruleset-driven calculations:
 *   import { calculateAccrualV2, validateCarryoverV2 } from '@esta-tracker/accrual-engine';
 * The v2 engine uses a JSON ruleset for statutory compliance verification.
 */

export * from './calculator.js';
export * from './rules.js';
export * from './carryover.js';
export * from './validator.js';
export * from './compliance-engine.js';
