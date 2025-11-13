// src/components/navigation/index.js
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthUserContext } from '../Session';
import SignOutButton from '../SignOut';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

const Navigation = () => {
  const authUser = useContext(AuthUserContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={ROUTES.LANDING}
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400"
            >
              ESTA Tracker
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {authUser ? <AuthMenu authUser={authUser} /> : <NonAuthMenu />}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-2 space-y-1">
              {authUser ? <AuthMenu authUser={authUser} mobile /> : <NonAuthMenu mobile />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const AuthMenu = ({ authUser, mobile = false }) => {
  const menuItemClass = mobile
    ? 'block w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition'
    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition';

  return (
    <>
      <Link to={ROUTES.HOME} className={menuItemClass}>
        Home
      </Link>
      <Link to={ROUTES.ACCOUNT} className={menuItemClass}>
        Account
      </Link>
      {authUser.roles?.[ROLES.ADMIN] && (
        <Link to={ROUTES.ADMIN} className={menuItemClass}>
          Admin
        </Link>
      )}
      <div className={mobile ? 'block' : 'inline-block'}>
        <SignOutButton />
      </div>
    </>
  );
};

const NonAuthMenu = ({ mobile = false }) => {
  const menuItemClass = mobile
    ? 'block w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition'
    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition';

  return (
    <>
      <Link to={ROUTES.LANDING} className={menuItemClass}>
        Landing
      </Link>
      <Link to={ROUTES.SIGN_IN} className={menuItemClass}>
        Sign In
      </Link>
    </>
  );
};

export default Navigation;