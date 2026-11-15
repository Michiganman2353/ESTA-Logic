import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Navigation } from '@/components/Navigation';
import Dashboard from '../Dashboard';
import Settings from '../Settings';
import type { User } from '@/types';

const base: User = {
  id: 'test-actor',
  name: 'Account Test',
  email: 'test@example.invalid',
  role: 'employer',
  status: 'pending',
  employerSize: 'large',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function view(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('authenticated workspace shell', () => {
  it('restricts navigation choices to the signed-in role', () => {
    view(<Navigation user={{ ...base, role: 'employee' }} />);
    expect(screen.getByRole('link', { name: 'My time' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Company' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activity' })).toBeInTheDocument();
  });

  it('uses the supplied sign-out handler rather than clearing an auth token', async () => {
    const onLogout = vi.fn(async () => undefined);
    view(<Navigation user={base} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }));
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
  });

  it('renders live account overview without invented employee balances', () => {
    view(<Dashboard user={base} />);
    expect(screen.getByRole('heading', { name: /Welcome back, Account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Company workspace/i })).toHaveAttribute('href', '/employer');
    expect(screen.queryByRole('link', { name: /My sick time/i })).not.toBeInTheDocument();
    expect(screen.getByText(/will not substitute fictional balances/i)).toBeInTheDocument();
  });

  it('does not offer fake save operations in account settings', () => {
    view(<Settings user={base} />);
    expect(screen.getByText(/more than 10 employees/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save changes|Save preferences/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    expect(screen.getByText(/Notification delivery isn't connected/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save preferences/i })).not.toBeInTheDocument();
  });
});
