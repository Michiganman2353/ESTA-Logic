export interface PayrollRow {
  name: string;
  email: string;
  payrollId: string;
}

/** RFC 4180 quoting, CRLF and UTF-8 BOM support. Only roster identity is accepted. */
export function parsePayrollCsv(source: string): PayrollRow[] {
  if (source.length > 200000)
    throw new Error('Choose a CSV smaller than 200 KB.');
  const records: string[][] = [];
  let row: string[] = [],
    value = '',
    quoted = false,
    closed = false;
  const input = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else value += char;
    } else if (char === '"' && !value && !closed) quoted = true;
    else if (char === ',' || char === '\n' || char === '\r') {
      row.push(value);
      value = '';
      closed = false;
      if (char !== ',') {
        if (row.some((cell) => cell.trim())) records.push(row);
        row = [];
        if (char === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      if (closed || char === '"')
        throw new Error('Invalid CSV quoting. Export the file again.');
      value += char;
    }
  }
  if (quoted) throw new Error('A quoted CSV value is incomplete.');
  row.push(value);
  if (row.some((cell) => cell.trim())) records.push(row);
  const header = records.shift()?.map((cell) => cell.trim().toLowerCase());
  if (!header || header.join(',') !== 'name,email,payrollid')
    throw new Error(
      'Use these three column headers: name,email,payrollId. Map payroll exports to these columns before uploading.'
    );
  if (!records.length || records.length > 100)
    throw new Error('Import between 1 and 100 employees at a time.');
  return records.map((cells, index) => {
    if (cells.length !== 3)
      throw new Error(`Row ${index + 2} must contain exactly three columns.`);
    return {
      name: cells[0]!.trim(),
      email: cells[1]!.trim(),
      payrollId: cells[2]!.trim(),
    };
  });
}
