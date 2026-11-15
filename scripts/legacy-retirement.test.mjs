import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('retired Rust/WASM research artifacts are not active build inputs', () => {
  for (const path of [
    'engine/esta-kernel/Cargo.toml',
    'libs/accrual-engine-wasm/Cargo.toml',
    'scripts/build-wasm.sh',
    '.github/workflows/wasm-build.yml',
  ]) {
    assert.equal(existsSync(new URL('../' + path, import.meta.url)), false,
      path + ' must not reappear as an active runtime dependency');
  }
});

test('Nx and root package expose no retired WASM commands', () => {
  const root = JSON.parse(read('package.json'));
  const accrual = JSON.parse(read('libs/accrual-engine/project.json'));
  assert.equal(root.scripts['wasm:build'], undefined);
  assert.equal(root.scripts['wasm:test'], undefined);
  assert.equal(accrual.targets['wasm-build'], undefined);
  assert.equal(accrual.targets['wasm-test'], undefined);
});

test('current production mapping remains the React frontend', () => {
  const vercel = JSON.parse(read('vercel.json'));
  assert.equal(vercel.outputDirectory, 'apps/frontend/dist');
  assert.match(vercel.buildCommand, /build:frontend/);
});

test('canonical architecture document does not claim microkernel deployment', () => {
  const doc = read('ARCHITECTURE.md');
  assert.match(doc, /React \+ TypeScript/);
  assert.match(doc, /Vercel/);
  assert.match(doc, /not production-ready/);
  assert.doesNotMatch(doc, /frozen, deterministic kernel where/);
});
