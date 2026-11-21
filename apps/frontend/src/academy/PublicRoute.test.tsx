import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useAuth } from '@/contexts/useAuth';
import App from '@/App';

vi.mock('@/contexts/useAuth', () => ({
  useAuth: vi.fn(() => {
    throw new Error('Workspace authentication is unavailable');
  }),
}));
vi.mock('@/lib/analytics', () => ({
  trackAcademyEvent: vi.fn(),
  trackAccountEvent: vi.fn(),
}));

it('loads the public academy without invoking workspace authentication guards', async () => {
  window.history.replaceState({}, '', '/interactive-world');
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'Explore ESTA Academy' })
  ).toBeInTheDocument();
  expect(useAuth).not.toHaveBeenCalled();
  window.history.replaceState({}, '', '/');
});
