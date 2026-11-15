import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AuditLog from '../AuditLog';
import type { User } from '@/types';

const user: User = {
  id: 'employee-1', name: 'Example Employee', email: 'employee@example.invalid',
  role: 'employee', employerSize: 'large',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('audit records workspace', () => {
  it('displays accurate disconnected state and switches between evidence and exports', () => {
    render(<MemoryRouter><AuditLog user={user} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Activity and audit history' })).toBeInTheDocument();
    expect(screen.getByText(/does not mean that no historical activity exists/i)).toBeInTheDocument();
    expect(screen.queryByText(/certified|100% secure/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Balance evidence' }));
    expect(screen.getByText('Awaiting signed-in ledger history')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Exports' }));
    expect(screen.getByText(/Audit export isn't available/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export|Download/i })).not.toBeInTheDocument();
  });
});
