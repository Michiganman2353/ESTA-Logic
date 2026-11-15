import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import EmployerDashboard from '../EmployerDashboard';
import type { User } from '@/types';

const user: User = {
  id: 'manager-1',
  name: 'Example Manager',
  email: 'manager@example.invalid',
  role: 'employer',
  employerSize: 'large',
  status: 'approved',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function view() {
  return render(<MemoryRouter><EmployerDashboard user={user} /></MemoryRouter>);
}

describe('Employer operations dashboard', () => {
  it('does not interpret missing data as a zero balance or a verified compliance status', () => {
    view();
    expect(screen.getByRole('heading', { name: 'Employer workspace' })).toBeInTheDocument();
    expect(screen.getByText(/Counts and balances are shown as unavailable—not zero/i)).toBeInTheDocument();
    expect(screen.getByText('Verified team members')).toBeInTheDocument();
    expect(screen.queryByText(/98%/)).not.toBeInTheDocument();
    expect(screen.queryByText('Sample Employee A')).not.toBeInTheDocument();
  });

  it('switches to team, reviews and intelligence sections without synthetic transactions', () => {
    view();
    fireEvent.click(screen.getByRole('tab', { name: 'Team' }));
    expect(screen.getByText('Roster connection required')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Leave requests' }));
    expect(screen.getByText(/No leave decisions are made on this page today/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve|Deny/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Decision intelligence' }));
    expect(screen.getByText(/Waiting for authorized ledger history/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review audit status' })).toHaveAttribute('href', '/audit');
  });

  it('offers a working link to the public calculation engine without saving records', () => {
    view();
    expect(screen.getByRole('link', { name: /Open Calculation Lab/i })).toHaveAttribute('href', '/guided-flow');
  });
});
