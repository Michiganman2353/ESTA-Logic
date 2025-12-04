// tauri-shell/src/tauri_entry.ts
//
// Tauri Entry Point for ESTA Logic
//
// Version: 1.0.0

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

/**
 * Initialize the ESTA Logic application
 */
export async function initializeApp(): Promise<void> {
  console.log('Initializing ESTA Logic...');

  // Initialize kernel bridge
  await invoke('initialize_kernel');

  // Set up event listeners
  await setupEventListeners();
}

/**
 * Set up Tauri event listeners
 */
async function setupEventListeners(): Promise<void> {
  // Listen for kernel events
  await listen('kernel-event', (event) => {
    console.log('Kernel event:', event.payload);
  });

  // Listen for state updates
  await listen('state-update', (event) => {
    console.log('State update:', event.payload);
  });
}

/**
 * Send a command to the kernel
 */
export async function sendKernelCommand(
  command: string,
  payload: unknown
): Promise<unknown> {
  return invoke('kernel_command', { command, payload });
}

/**
 * Get current kernel state
 */
export async function getKernelState(): Promise<unknown> {
  return invoke('get_kernel_state');
}

/**
 * Shutdown the application
 */
export async function shutdown(): Promise<void> {
  await invoke('shutdown_kernel');
}
