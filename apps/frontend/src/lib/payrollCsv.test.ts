import { describe, expect, it } from 'vitest';
import { parsePayrollCsv } from './payrollCsv';

describe('payroll CSV input', () => {
  it('handles payroll exports with BOM, CRLF and quoted commas or escaped quotes', () => {
    expect(
      parsePayrollCsv(
        '\uFEFFname,email,payrollId\r\n"Doe, Jane",jane@example.test,QB-1\r\n"Pat ""PJ"" Smith",pat@example.test,\r\n'
      )
    ).toEqual([
      { name: 'Doe, Jane', email: 'jane@example.test', payrollId: 'QB-1' },
      { name: 'Pat "PJ" Smith', email: 'pat@example.test', payrollId: '' },
    ]);
  });
  it.each([
    'name,email,salary\nJane,jane@example.test,10',
    'name,email,payrollId\nJane,jane@example.test,1,EXTRA',
    'name,email,payrollId\n"Unclosed,jane@example.test,1',
    'name,email,payrollId\n"Closed"suffix,jane@example.test,1',
    'name,email,payrollId\n',
  ])('rejects malformed or unreviewable input', (source) => {
    expect(() => parsePayrollCsv(source)).toThrow();
  });
});
