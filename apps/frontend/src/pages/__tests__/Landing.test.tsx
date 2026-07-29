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

  describe('Rendering', () => {
    it('renders the main headline and development status', () => {
      renderLanding();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        /Understand and track Michigan earned sick time/i
      );
      expect(
        screen.getByText(/Michigan ESTA tools under active development/i)
      ).toBeInTheDocument();
    });

    it('renders code-verifiable capability cards', () => {
      renderLanding();

      expect(
        screen.getByText('Transparent ESTA calculations')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Code-enforced access controls')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Deterministic calculation engine')
      ).toBeInTheDocument();
    });

    it('states that the calculation lab does not save personal information', () => {
      renderLanding();

      expect(
        screen.getByText(/does not save personal or employee information/i)
      ).toBeInTheDocument();
    });

    it('describes implemented security without external certifications', () => {
      renderLanding();

      expect(
        screen.getByRole('heading', {
          name: /Security implemented within the application/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Firebase email\/password authentication/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Claims intentionally limited/i)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('opens the public calculation lab from the hero', () => {
      renderLanding();

      fireEvent.click(screen.getByTestId('hero-calculation-lab'));
      expect(mockNavigate).toHaveBeenCalledWith('/guided-flow');
    });

    it('opens account registration from the hero', () => {
      renderLanding();

      fireEvent.click(screen.getByTestId('hero-test-registration'));
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('opens the public calculation lab from the final call to action', () => {
      renderLanding();

      fireEvent.click(screen.getByTestId('cta-calculation-lab'));
      expect(mockNavigate).toHaveBeenCalledWith('/guided-flow');
    });
  });
});
