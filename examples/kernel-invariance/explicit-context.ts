/**
 * Explicit Context Pattern Example
 * 
 * Demonstrates how all environmental concerns are passed as explicit parameters,
 * eliminating implicit dependencies that would break deployment invariance.
 */

// ❌ ANTI-PATTERN: Implicit Dependencies

interface ImplicitCalculation {
  hoursWorked: number;
  accrualRate: number;
}

function calculateAccrualImplicit(input: ImplicitCalculation): number {
  // PROBLEM 1: Implicit time dependency
  const now = new Date(); // System clock varies across environments
  console.log(`Calculated at: ${now.toISOString()}`);
  
  // PROBLEM 2: Environment variable dependency
  const debugMode = process?.env?.DEBUG === 'true'; // Varies by deployment
  if (debugMode) {
    console.log('Debug info...');
  }
  
  // PROBLEM 3: Locale dependency
  const formatted = (input.hoursWorked * input.accrualRate).toLocaleString();
  // Output varies by system locale
  
  // PROBLEM 4: Random behavior
  if (Math.random() > 0.5) { // Nondeterministic
    console.log('Random branch taken');
  }
  
  return input.hoursWorked * input.accrualRate;
}

// ✅ CORRECT PATTERN: Explicit Context

interface ExecutionContext {
  timestamp: string;        // Explicit time
  lawVersion: string;       // Explicit law version
  jurisdiction: string;     // Explicit jurisdiction
  traceEnabled: boolean;    // Explicit debug flag
  randomSeed?: number;      // Explicit seed (if randomness needed)
}

interface ExplicitCalculation {
  hoursWorked: number;
  accrualRate: number;
}

interface CalculationResult {
  accrual: number;
  trace?: string[];
}

function calculateAccrualExplicit(
  input: ExplicitCalculation,
  context: ExecutionContext
): CalculationResult {
  const trace: string[] = [];
  
  // Explicit time (passed as parameter)
  if (context.traceEnabled) {
    trace.push(`Calculated at: ${context.timestamp}`);
  }
  
  // Explicit configuration (no environment variables)
  if (context.traceEnabled) {
    trace.push(`Debug enabled by explicit context`);
    trace.push(`Law Version: ${context.lawVersion}`);
    trace.push(`Jurisdiction: ${context.jurisdiction}`);
  }
  
  // Deterministic formatting (no locale)
  const accrual = input.hoursWorked * input.accrualRate;
  const formattedAccrual = accrual.toFixed(2); // Explicit precision
  
  if (context.traceEnabled) {
    trace.push(`Accrual: ${formattedAccrual} hours`);
  }
  
  // Explicit randomness (with seed)
  if (context.randomSeed !== undefined) {
    // Use seeded PRNG instead of Math.random()
    const deterministicRandom = seededRandom(context.randomSeed);
    if (deterministicRandom > 0.5) {
      trace.push('Deterministic branch taken (seed-based)');
    }
  }
  
  return {
    accrual,
    trace: context.traceEnabled ? trace : undefined,
  };
}

// Seeded pseudo-random number generator (deterministic)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function demonstrateExplicitContext() {
  console.log('='.repeat(80));
  console.log('EXPLICIT CONTEXT PATTERN DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  const input: ExplicitCalculation = {
    hoursWorked: 150,
    accrualRate: 1 / 30,
  };

  // Context 1: Production environment
  const productionContext: ExecutionContext = {
    timestamp: '2025-06-15T14:30:00.000Z',
    lawVersion: '1.0.0',
    jurisdiction: 'US-MI',
    traceEnabled: false,
  };

  // Context 2: Debug environment (same timestamp for reproducibility)
  const debugContext: ExecutionContext = {
    timestamp: '2025-06-15T14:30:00.000Z', // Explicit, not system time
    lawVersion: '1.0.0',
    jurisdiction: 'US-MI',
    traceEnabled: true,
    randomSeed: 42, // Explicit seed for reproducible randomness
  };

  console.log('Input:');
  console.log(JSON.stringify(input, null, 2));
  console.log();
  console.log('-'.repeat(80));
  console.log();

  console.log('EXECUTION 1: Production Context (trace disabled)');
  console.log('Context:');
  console.log(JSON.stringify(productionContext, null, 2));
  console.log();
  const result1 = calculateAccrualExplicit(input, productionContext);
  console.log('Result:');
  console.log(JSON.stringify(result1, null, 2));
  console.log();

  console.log('EXECUTION 2: Debug Context (trace enabled)');
  console.log('Context:');
  console.log(JSON.stringify(debugContext, null, 2));
  console.log();
  const result2 = calculateAccrualExplicit(input, debugContext);
  console.log('Result:');
  console.log(JSON.stringify(result2, null, 2));
  console.log();

  console.log('-'.repeat(80));
  console.log();

  // Both should produce the same accrual value
  if (result1.accrual === result2.accrual) {
    console.log('✅ SUCCESS: Identical accrual despite different contexts');
    console.log(`   Accrual: ${result1.accrual} hours`);
    console.log();
    console.log('   Production context: No trace (efficient)');
    console.log(`   Debug context: ${result2.trace?.length} trace entries (informative)`);
  } else {
    console.log('❌ FAILURE: Accrual values differ');
  }

  console.log();
  console.log('='.repeat(80));
  console.log('KEY PRINCIPLES DEMONSTRATED:');
  console.log('='.repeat(80));
  console.log();
  console.log('1. EXPLICIT TIME');
  console.log('   ❌ Date.now() - varies by system clock');
  console.log('   ✅ context.timestamp - explicit parameter');
  console.log();
  console.log('2. EXPLICIT CONFIGURATION');
  console.log('   ❌ process.env.DEBUG - varies by environment');
  console.log('   ✅ context.traceEnabled - explicit parameter');
  console.log();
  console.log('3. EXPLICIT FORMATTING');
  console.log('   ❌ toLocaleString() - varies by system locale');
  console.log('   ✅ toFixed(2) - explicit precision');
  console.log();
  console.log('4. EXPLICIT RANDOMNESS');
  console.log('   ❌ Math.random() - nondeterministic');
  console.log('   ✅ seededRandom(seed) - deterministic with explicit seed');
  console.log();
  console.log('='.repeat(80));
  console.log();
  console.log('DEPLOYMENT INVARIANCE ACHIEVED BY:');
  console.log('='.repeat(80));
  console.log();
  console.log('• All variability sources are EXPLICIT parameters');
  console.log('• No hidden dependencies on environment');
  console.log('• Same context → Same result (always)');
  console.log('• Different contexts can produce different traces...');
  console.log('  ...but IDENTICAL computational results');
  console.log();
  console.log('This pattern enables:');
  console.log('  - Cross-environment determinism');
  console.log('  - Historical reproducibility');
  console.log('  - Audit trail completeness');
  console.log('  - Zero configuration drift');
  console.log();
  console.log('='.repeat(80));
}

// Run demonstration
demonstrateExplicitContext();
