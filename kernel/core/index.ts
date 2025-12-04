/**
 * ESTA-Logic Microkernel Core
 *
 * Central orchestration module for the WASM-native microkernel.
 * The kernel is the conductor - all modules are instruments that play under its direction.
 *
 * @module kernel/core
 */

export * from './scheduler';
export * from './ipc-router';
export * from './capability-engine';
