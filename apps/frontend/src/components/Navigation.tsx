/**
 * Navigation Component
 *
 * Enterprise-grade navigation bar with ESTA Tracker branding.
 * Features responsive design with mobile drawer menu.
 *
 * Features:
 * - Branded logo integration
 * - Responsive mobile/desktop layouts
 * - User info display
 * - Gradient background with glass effect
 * - Smooth animations
 * - Accessibility compliant
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';

interface NavigationProps {
  user?: {
    name: string;
    email: string;
    role: string;
    status?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export function Navigation({ user, onLogout, className }: NavigationProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

  return (
    <nav
      id="main-navigation"
      className={clsx(
        'glass-card animate-fade-in-down shadow-lg backdrop-blur-md',
        'border-royal-500/20 border-b',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="group flex items-center space-x-3">
            <img
              src="/logo-icon.svg"
              alt="ESTA Tracker"
              className="h-10 w-10 transition-transform group-hover:scale-110"
            />
            <div className="hidden sm:block">
              <span className="gradient-header text-xl font-bold">
                ESTA Tracker
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Michigan Compliance
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user ? (
            <div className="hidden items-center space-x-6 md:flex">
              <Link
                to="/settings"
                className="hover:text-royal-600 dark:hover:text-royal-400 text-sm text-gray-700 transition-colors dark:text-gray-300"
              >
                Settings
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary px-4 py-2 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden items-center space-x-4 md:flex">
              <button
                onClick={() => navigate('/login')}
                className="hover:text-royal-600 dark:hover:text-royal-400 text-sm text-gray-700 transition-colors dark:text-gray-300"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary text-sm"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-lg p-2 text-gray-700 transition-colors dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="animate-slide-in-right border-t border-gray-200 md:hidden dark:border-gray-700">
          <div className="space-y-4 bg-white/90 px-4 py-4 backdrop-blur-md dark:bg-gray-800/90">
            {user ? (
              <>
                <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <p className="text-royal-600 dark:text-royal-400 mt-1 text-xs">
                    {user.role}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="hover:text-royal-600 dark:hover:text-royal-400 block text-sm text-gray-700 transition-colors dark:text-gray-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary w-full text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="hover:text-royal-600 dark:hover:text-royal-400 block w-full text-left text-sm text-gray-700 transition-colors dark:text-gray-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary w-full text-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
