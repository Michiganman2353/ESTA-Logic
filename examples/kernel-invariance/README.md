# Kernel Deployment Invariance Examples

This directory contains examples demonstrating the kernel's **absolute deployment invariance**—the guarantee that identical inputs produce bit-for-bit identical outputs across all environments.

## Purpose

These examples prove that the ESTA-Kernel:

1. **Executes identically** across all deployment targets
2. **Produces deterministic results** independent of runtime
3. **Maintains historical reproducibility** across time
4. **Operates without environmental dependencies**

## Examples

### 1. Cross-Environment Execution

**File:** `cross-environment-accrual.ts`

Demonstrates identical accrual calculations across:
- Node.js
- Browser (simulated)
- Edge runtime (simulated)
- Serverless function (simulated)

### 2. Time Travel Calculation

**File:** `time-travel-reproduction.ts`

Proves that calculations from the past remain reproducible in the future with guaranteed identical results.

### 3. Explicit Context Pattern

**File:** `explicit-context.ts`

Shows how all environmental concerns are passed as explicit parameters, eliminating implicit dependencies.

### 4. Determinism Verification

**File:** `determinism-test.ts`

Property-based tests verifying deterministic behavior across random inputs.

## Running the Examples

```bash
# Run all examples
npm run demo:invariance

# Run specific example
npx ts-node examples/kernel-invariance/cross-environment-accrual.ts
npx ts-node examples/kernel-invariance/time-travel-reproduction.ts
npx ts-node examples/kernel-invariance/explicit-context.ts
npx ts-node examples/kernel-invariance/determinism-test.ts
```

## Expected Output

All examples should demonstrate:
- ✅ Identical results across all environments
- ✅ No variation based on system time
- ✅ No variation based on locale
- ✅ No variation based on runtime
- ✅ Complete reproducibility

## References

- **Deployment Invariance**: See `/DEPLOYMENT_INVARIANCE.md`
- **Kernel Specification**: See `/KERNEL_SPEC.md`
- **Instruction Set**: See `/INSTRUCTION_SET.md`
