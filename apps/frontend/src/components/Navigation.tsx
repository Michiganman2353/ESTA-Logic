import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { AuthContext } from '@/contexts/AuthContext';

type WorkspaceRole = 'employee' | 'employer' | 'admin';

interface NavigationProps {
  user?: {
    name: string;
    email: string;
    role: string;
    status?: string;
  };
  onLogout?: () => void | Promise<void>;
  className?: string;
}

const menu: ReadonlyArray<{ to: string; label: string; roles: WorkspaceRole[] }> = [
  { to: '/dashboard', label: 'Overview', roles: ['employee', 'employer', 'admin'] },
  { to: '/employer', label: 'Company', roles: ['employer', 'admin'] },
  { to: '/companies', label: 'Companies', roles: ['employer'] },
  { to: '/learn', label: 'Learn ESTA', roles: ['employee', 'employer', 'admin'] },
  { to: '/employee', label: 'My time', roles: ['employee', 'admin'] },
  { to: '/audit', label: 'Activity', roles: ['employee', 'employer', 'admin'] },
  { to: '/settings', label: 'Settings', roles: ['employee', 'employer', 'admin'] },
];

function Icon({ name }: { name: 'menu' | 'close' | 'logout' }) {
  const paths = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M5 5l14 14M19 5L5 19" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {paths[name]}
    </svg>
  );
}

export function Navigation({ user, onLogout, className }: NavigationProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Allows isolated public component tests to render without Firebase.
  // An actual authenticated sign-out must use the central AuthProvider.
  const authContext = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const role: WorkspaceRole | null = user?.role === 'employee' || user?.role === 'employer' || user?.role === 'admin' ? user.role : null;
  const selectedCompany = role === 'employer' ? searchParams.get('company') : null;
  const links = role ? menu.filter((item) => item.roles.includes(role)).map((item) => ({ ...item, to: selectedCompany && ['/employer', '/audit'].includes(item.to) ? `${item.to}?company=${encodeURIComponent(selectedCompany)}` : item.to })) : [];

  async function handleLogout() {
    setSignOutError('');
    setSigningOut(true);
    try {
      if (onLogout) {
        await onLogout();
      } else if (authContext) {
        await authContext.signOut();
      } else {
        throw new Error('Sign-out service is unavailable.');
      }
      setMobileOpen(false);
      navigate('/login', { replace: true });
    } catch {
      setSignOutError('We could not sign you out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => clsx(
    'rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
  );

  return (
    <nav id="main-navigation" aria-label={user ? 'Workspace navigation' : 'Site navigation'} className={clsx('relative z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <img src="/logo-icon.svg" alt="" aria-hidden="true" className="h-9 w-9" />
            <span className="flex flex-col">
              <span className="text-base font-extrabold leading-tight tracking-tight text-[#0d2856]">ESTA Tracker</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600">{user ? 'Workspace' : 'Michigan earned sick time'}</span>
            </span>
          </Link>

          {user ? (
            <>
              <div className="hidden items-center gap-1 md:flex" aria-label="Workspace sections">
                {links.map((link) => <NavLink end key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <div className="max-w-40 text-right">
                  <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs capitalize text-slate-500">{user.role}</p>
                </div>
                <button type="button" disabled={signingOut} onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50">
                  <Icon name="logout" /> {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Log in</Link>
              <Link to="/pricing" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Pilot status</Link>
            </div>
          )}

          <button type="button" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-workspace-navigation" onClick={() => setMobileOpen((open) => !open)} className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 md:hidden">
            <Icon name={mobileOpen ? 'close' : 'menu'} />
          </button>
        </div>
        {signOutError && <p role="alert" className="pb-3 text-sm font-medium text-rose-700">{signOutError}</p>}
      </div>

      {mobileOpen && (
        <div id="mobile-workspace-navigation" className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
          {user ? (
            <>
              <p className="mb-3 text-sm font-bold text-slate-800">{user.name} <span className="font-normal capitalize text-slate-500">· {user.role}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {links.map((link) => (
                  <NavLink key={link.to} end to={link.to} className={linkClass} onClick={() => setMobileOpen(false)}>{link.label}</NavLink>
                ))}
              </div>
              <button type="button" disabled={signingOut} onClick={() => void handleLogout()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:opacity-50"><Icon name="logout" /> Sign out</button>
            </>
          ) : (
            <div className="grid gap-2">
              <Link onClick={() => setMobileOpen(false)} to="/login" className="rounded-xl bg-blue-600 p-3 text-center font-bold text-white">Log in</Link>
              <Link onClick={() => setMobileOpen(false)} to="/pricing" className="rounded-xl border border-blue-200 p-3 text-center font-semibold text-blue-800">Pilot status</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
