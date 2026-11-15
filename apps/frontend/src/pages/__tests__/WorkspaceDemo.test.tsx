import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import WorkspaceDemo from '../WorkspaceDemo';

function renderDemo() {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WorkspaceDemo />
    </BrowserRouter>
  );
}

describe('Interactive Workspace Demo', () => {
  it('identifies every sample as non-persistent and avoids invented compliance scores', () => {
    renderDemo();
    expect(screen.getByRole('heading', { name: 'Employer workspace' })).toBeInTheDocument();
    expect(screen.getByText(/Sample data — not your account/i)).toBeInTheDocument();
    expect(screen.getByText(/No Firebase records are loaded, changed, or saved/i)).toBeInTheDocument();
    expect(screen.queryByText(/98%/)).not.toBeInTheDocument();
  });

  it('filters the synthetic employee list', () => {
    renderDemo();
    fireEvent.change(screen.getByLabelText('Search sample employees'), { target: { value: 'Facilities' } });
    expect(screen.getByRole('button', { name: /Sample Employee C/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sample Employee B/i })).not.toBeInTheDocument();
  });

  it('requires an explicit manager note before a demo decision', () => {
    renderDemo();
    fireEvent.click(screen.getAllByRole('button', { name: /Review example request/i })[0]);
    const approve = screen.getByRole('button', { name: 'Approve in demo' });
    const deny = screen.getByRole('button', { name: 'Deny in demo' });
    expect(approve).toBeDisabled();
    expect(deny).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Manager decision note (required)'), { target: { value: 'Sample manager reviewed request' } });
    expect(approve).toBeEnabled();
    fireEvent.click(approve);
    expect(screen.getByRole('status')).toHaveTextContent(/marked approved/i);
    expect(screen.getByText(/Demo manager note: Sample manager reviewed request/i)).toBeInTheDocument();
  });

  it('lets a sample employee submit a request without a persistence operation', () => {
    renderDemo();
    fireEvent.click(screen.getByRole('button', { name: 'Employee', exact: true }));
    expect(screen.getByRole('heading', { name: 'Employee workspace' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Example requested date'), { target: { value: '2027-01-12' } });
    fireEvent.change(screen.getByLabelText('Example hours'), { target: { value: '3.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add request to demo queue' }));
    expect(screen.getByRole('status')).toHaveTextContent(/not submitted to an employer/i);
    expect(screen.getByText(/Jan 12, 2027 · 3.5 hours/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Employer', exact: true }));
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
  });
});
