import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Landing from '../Landing';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLanding = () => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Landing />
    </BrowserRouter>
  );
};

describe('Landing Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows a prominent headline and honest development status', () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Earned sick time/i
    );
    expect(screen.getByText(/Michigan ESTA tools under active development/i)).toBeInTheDocument();
  });

  it('shows verifiable capability cards and transparent security language', () => {
    renderLanding();

    expect(screen.getByText('Transparent ESTA calculations')).toBeInTheDocument();
    expect(screen.getByText('Code-enforced access controls')).toBeInTheDocument();
    expect(screen.getByText('Deterministic calculation engine')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Security implemented within the application/i })).toBeInTheDocument();
    expect(screen.getByText(/Firebase email\/password authentication/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Claims intentionally limited/i })).toBeInTheDocument();
  });

  it('states that the lab does not save personal or employee information', () => {
    renderLanding();
    expect(screen.getByText(/does not save personal or employee information/i)).toBeInTheDocument();
  });

  it('switches the interactive preview between employer and employee', () => {
    renderLanding();
    const employeeButton = screen.getByRole('button', { name: 'Employee view' });
    fireEvent.click(employeeButton);
    expect(employeeButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Employee overview' })).toBeInTheDocument();
    expect(screen.getByText('Your sample earned time')).toBeInTheDocument();
  });

  it('recalculates the illustrative accrued hours when the slider changes', () => {
    renderLanding();
    fireEvent.change(screen.getByLabelText(/Try changing hours worked/i), { target: { value: '210' } });
    expect(screen.getByText('210 hrs')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('switches the workflow detail panel', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /Organize/i }));
    expect(screen.getByRole('heading', { name: /Bring your people and balances into one place/i })).toBeInTheDocument();
    expect(screen.getByText(/Authenticated workflows are being hardened/i)).toBeInTheDocument();
  });

  it('opens public calculation lab from the hero and final call to action', () => {
    renderLanding();
    fireEvent.click(screen.getByTestId('hero-calculation-lab'));
    expect(mockNavigate).toHaveBeenCalledWith('/guided-flow');
    fireEvent.click(screen.getByTestId('cta-calculation-lab'));
    expect(mockNavigate).toHaveBeenCalledWith('/guided-flow');
  });

  it('opens pilot status from the hero', () => {
    renderLanding();
    fireEvent.click(screen.getByTestId('hero-pilot-status'));
    expect(mockNavigate).toHaveBeenCalledWith('/pricing');
  });
});
