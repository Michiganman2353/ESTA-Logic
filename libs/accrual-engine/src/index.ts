/**
 * ESTA-Logic Compliance Engine
 *
 * This package is the authoritative home for Michigan ESTA calculations.
 * It is intentionally implemented as a small, deterministic TypeScript
 * library with no UI, Firebase, network, kernel, plugin, agent, or runtime
 * dependencies.
 *
 * Production callers should import compliance behavior directly from this
 * package or through a thin application-service facade. Alternative WASM,
 * microkernel, Helix, and agent implementations are experimental and must not
 * become required production execution paths.
 *
 * Architecture: docs/architecture/RELIABLE_ENGINE_ARCHITECTURE.md
 */

export * from './calculator.js';
export * from './rules.js';
export * from './carryover.js';
export * from './validator.js';
export * from './compliance-engine.js';
