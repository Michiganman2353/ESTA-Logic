/**
 * Tests for LoadingSpinner Components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, PageLoader, InlineLoader } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with circular variant', () => {
    render(<LoadingSpinner variant="circular" ariaLabel="Loading data" />);
    expect(screen.getByLabelText('Loading data')).toBeInTheDocument();
  });

  it('should render with dots variant', () => {
    render(<LoadingSpinner variant="dots" ariaLabel="Loading content" />);
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('should render with pulse variant', () => {
    render(<LoadingSpinner variant="pulse" ariaLabel="Processing" />);
    expect(screen.getByLabelText('Processing')).toBeInTheDocument();
  });

  it('should render with bars variant', () => {
    render(<LoadingSpinner variant="bars" ariaLabel="Loading bars" />);
    expect(screen.getByLabelText('Loading bars')).toBeInTheDocument();
  });

  it('should render with text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-spinner" />);
    expect(container.firstChild).toHaveClass('custom-spinner');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="xs" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should apply centered layout', () => {
    const { container } = render(<LoadingSpinner centered />);
    expect(container.firstChild).toHaveClass('justify-center');
  });

  it('should use default aria-label when not provided', () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('should render with custom color', () => {
    const { container } = render(<LoadingSpinner color="text-red-500" />);
    const spinner = container.querySelector('.text-red-500');
    expect(spinner).toBeInTheDocument();
  });
});

describe('PageLoader', () => {
  it('should render with default props', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<PageLoader message="Loading Dashboard" />);
    expect(screen.getByText('Loading Dashboard')).toBeInTheDocument();
  });

  it('should render with hint text', () => {
    render(
      <PageLoader message="Please wait" hint="This may take a few seconds" />
    );
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(screen.getByText('This may take a few seconds')).toBeInTheDocument();
  });

  it('should render without overlay', () => {
    const { container } = render(<PageLoader overlay={false} />);
    const loader = container.firstChild;
    expect(loader).not.toHaveClass('fixed');
    expect(loader).not.toHaveClass('backdrop-blur-sm');
  });

  it('should render with overlay by default', () => {
    const { container } = render(<PageLoader />);
    const loader = container.firstChild;
    expect(loader).toHaveClass('fixed');
    expect(loader).toHaveClass('backdrop-blur-sm');
  });

  it('should have proper ARIA attributes', () => {
    render(<PageLoader message="Loading data" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-live', 'polite');
    expect(loader).toHaveAttribute('aria-label', 'Loading data');
  });
});

describe('InlineLoader', () => {
  it('should render with default props', () => {
    render(<InlineLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with text', () => {
    render(<InlineLoader text="Saving..." />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<InlineLoader size="xs" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<InlineLoader size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<InlineLoader size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with circular variant', () => {
    render(<InlineLoader variant="circular" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with dots variant', () => {
    render(<InlineLoader variant="dots" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render as inline element', () => {
    const { container } = render(<InlineLoader text="Loading" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('inline-flex');
  });
});
