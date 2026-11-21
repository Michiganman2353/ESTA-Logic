import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InteractiveWorld from '@/pages/InteractiveWorld';
import { trackAcademyEvent } from '@/lib/analytics';
vi.mock('@/lib/analytics', () => ({ trackAcademyEvent: vi.fn() }));
const show = () =>
  render(
    <MemoryRouter>
      <InteractiveWorld />
    </MemoryRouter>
  );
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));
beforeEach(() => vi.mocked(trackAcademyEvent).mockClear());

describe('public educational academy', () => {
  it('offers six accessible locations, keyboard movement and touch buttons without authentication', () => {
    show();
    expect(
      screen.getByRole('heading', { name: 'Explore ESTA Academy' })
    ).toBeInTheDocument();
    const directory = screen.getByText(
      'Location list · accessible alternative to walking'
    ).parentElement!;
    expect(within(directory).getAllByRole('button')).toHaveLength(6);
    const map = screen.getByRole('region', { name: 'Academy exploration map' });
    map.focus();
    fireEvent.keyDown(map, { key: 'ArrowRight' });
    expect(
      document.querySelector('.academy-player')?.getAttribute('transform')
    ).toBe('translate(338 530)');
    click('Move west');
    expect(
      document.querySelector('.academy-player')?.getAttribute('transform')
    ).toBe('translate(320 530)');
    expect(
      screen.getByRole('link', { name: 'Sign in to workspace' })
    ).toHaveAttribute('href', '/login');
  });
  it('supports retries, focuses conversations, completes a quest and restores focus on close', () => {
    show();
    const entry = screen.getByRole('button', { name: /01 Employer Office/ });
    entry.focus();
    fireEvent.click(entry);
    expect(screen.getByRole('region', { name: /Morgan/ })).toHaveFocus();
    click('Accrual or frontloading?');
    click('Try the accrual example');
    click('No time is earned');
    expect(screen.getByText('Take another look.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continue lesson' })
    ).not.toBeInTheDocument();
    click('2 hours, calculated for this period');
    click('Continue lesson');
    click('Complete the setup lesson');
    expect(screen.getByRole('progressbar')).toHaveValue(1);
    click('Close conversation');
    expect(entry).toHaveFocus();
    click('Restart this visit');
    expect(screen.getByRole('progressbar')).toHaveValue(0);
  });
  it('completes four data-driven lessons and unlocks conditional dialogue without writing records', () => {
    show();
    const steps = [
      [
        /01 Employer Office/,
        'Accrual or frontloading?',
        'Try the accrual example',
        '2 hours, calculated for this period',
        'Complete the setup lesson',
      ],
      [
        /02 Payroll Desk/,
        'Practice reviewing a duplicate',
        null,
        'Resolve the duplicate email and payroll ID, then review again',
        'Complete the payroll lesson',
      ],
      [
        /03 Employee Center/,
        'Follow a practice request',
        null,
        'It is saved as a request and awaits an employer decision',
        'Complete the employee lesson',
      ],
      [
        /04 Compliance Inspector/,
        'Inspect a practice adjustment',
        null,
        'The source or reason supporting the adjustment',
        'Complete the records lesson',
      ],
    ] as const;
    for (const [location, first, second, answer, complete] of steps) {
      click(location);
      click(first);
      if (second) click(second);
      click(answer);
      click('Continue lesson');
      click(complete);
    }
    expect(screen.getByRole('progressbar')).toHaveValue(4);
    expect(screen.getByText('You’ve connected the steps.')).toBeInTheDocument();
    click('Return to the inspector');
    click('Connect all four lessons');
    expect(
      screen.getByText('From practice to a real process')
    ).toBeInTheDocument();
    expect(
      vi
        .mocked(trackAcademyEvent)
        .mock.calls.filter(([event]) => event === 'academy_tour_completed')
    ).toHaveLength(1);
    expect(
      vi.mocked(trackAcademyEvent).mock.calls.every((args) => args.length === 1)
    ).toBe(true);
  });
});
