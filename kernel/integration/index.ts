/**
 * ESTA-Logic OS Integration Module
 *
 * This module provides the bridge between:
 * - Existing accrual-engine (libs/accrual-engine)
 * - New OS architecture (kernel/core)
 *
 * Use these functions to get OS features (proof objects, time capsules, drift detection)
 * while maintaining compatibility with existing calculation logic.
 *
 * @module kernel/integration
 */

export * from './os-bridge';
