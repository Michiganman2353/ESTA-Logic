import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RegisterManager from '../RegisterManager';

describe('Manager enrollment safety gate', () => {
  it('does not collect credentials or pretend registration succeeded', () => {
    render(
      <MemoryRouter>
        <RegisterManager />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /secure start/i })).toBeInTheDocument();
    expect(screen.getByText(/Live manager registration is paused/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot confirm that an account was created/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Complete Registration/i })).not.toBeInTheDocument();
  });

  it('offers public demo and home links without performing API writes', () => {
    render(
      <MemoryRouter>
        <RegisterManager />
      </MemoryRouter>
    );

    expect(screen.getByTestId('manager-demo-link')).toHaveAttribute('href', '/workspace-demo');
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByText(/fictional employee records/i)).toBeInTheDocument();
  });
});
