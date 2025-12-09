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
        'glass-card shadow-lg backdrop-blur-md animate-fade-in-down',
        'border-b border-royal-500/20',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/logo-icon.svg"
              alt="ESTA Tracker"
              className="h-10 w-10 transition-transform group-hover:scale-110"
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold gradient-header">
                ESTA Tracker
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Michigan Compliance
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user ? (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/settings"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-royal-600 dark:hover:text-royal-400 transition-colors"
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
                  className="btn btn-secondary text-sm px-4 py-2"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-royal-600 dark:hover:text-royal-400 transition-colors"
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
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors"
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
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 animate-slide-in-right">
          <div className="px-4 py-4 space-y-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
            {user ? (
              <>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <p className="text-xs text-royal-600 dark:text-royal-400 mt-1">
                    {user.role}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="block text-sm text-gray-700 dark:text-gray-300 hover:text-royal-600 dark:hover:text-royal-400 transition-colors"
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
                  className="block w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:text-royal-600 dark:hover:text-royal-400 transition-colors"
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
