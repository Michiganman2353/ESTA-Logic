import { createHash } from 'crypto';

export interface PayrollRow {
  name: string;
  email: string;
  payrollId: string;
}
export interface PayrollRecord extends PayrollRow {
  employeeId: string | null;
  version: number;
}
export function payrollRows(input: unknown): PayrollRow[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100)
    throw new Error('Import between 1 and 100 employees at a time.');
  const emails = new Set<string>();
  const ids = new Set<string>();
  return input.map((value, index) => {
    const row = value as Record<string, unknown> | null;
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    const email =
      typeof row?.email === 'string' ? row.email.trim().toLowerCase() : '';
    const payrollId =
      typeof row?.payrollId === 'string' ? row.payrollId.trim() : '';
    if (
      !name ||
      name.length > 160 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      payrollId.length > 100
    )
      throw new Error(
        `Row ${index + 1}: provide a name, valid email and optional payroll ID (100 characters maximum).`
      );
    if (emails.has(email) || (payrollId && ids.has(payrollId)))
      throw new Error(
        `Row ${index + 1}: duplicate email or payroll ID. Resolve duplicates before reviewing.`
      );
    emails.add(email);
    if (payrollId) ids.add(payrollId);
    return { name, email, payrollId };
  });
}
export function importDigest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
