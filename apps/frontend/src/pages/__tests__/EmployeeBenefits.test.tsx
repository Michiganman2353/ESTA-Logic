import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import EmployeeDashboard from '../EmployeeDashboard';
import type { User } from '@/types';

const employee: User = {
  id: 'employee-1',
  name: 'Example Employee',
  email: 'employee@example.invalid',
  role: 'employee',
  employerSize: 'large',
  status: 'approved',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const view = () => render(<MemoryRouter><EmployeeDashboard user={employee} /></MemoryRouter>);

describe('Employee benefits dashboard', () => {
  it('shows unavailable, not invented or zero, balance information', () => {
    view();
    expect(screen.getByRole('heading', { name: 'My earned sick time' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current available hours not yet available')).toHaveTextContent('—');
    expect(screen.getByText(/figures below are unavailable—not zero/i)).toBeInTheDocument();
    expect(screen.queryByText('Sample Employee A')).not.toBeInTheDocument();
  });

  it('has functional requests and history tabs but never submits mock leave', () => {
    view();
    fireEvent.click(screen.getByRole('tab', { name: 'My requests' }));
    expect(screen.getByText(/Request submission isn't connected/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit request|Approve in demo/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByText(/Explainable receipts are awaiting integration/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View recordkeeping status' })).toHaveAttribute('href', '/audit');
  });

  it('links to the public Calculation Lab without modifying employee records', () => {
    view();
    expect(screen.getByRole('link', { name: /Explore the Calculation Lab/i })).toHaveAttribute('href', '/guided-flow');
  });
});
