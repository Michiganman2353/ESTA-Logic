// src/components/landing/index.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import * as ROUTES from '../../constants/routes';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const { deferredPrompt, installPWA, isInstalled } = usePWAInstall();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-cyan-600 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 lg:py-40 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Track Your ESTA Status
              <span className="block text-cyan-200">In Real Time</span>
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-100 mb-10 max-w-3xl mx-auto">
              Never miss an update. Secure, private, and instant notifications for your U.S. visa waiver.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.SIGN_UP}
                className="px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform"
              >
                Get Started Free
              </Link>
              <Link
                to={ROUTES.SIGN_IN}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-indigo-600 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Why ESTA Tracker?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              description="End-to-end encryption. Your data never leaves your device."
            />
            <FeatureCard
              icon="⚡"
              title="Real-Time Updates"
              description="Instant notifications when your ESTA status changes."
            />
            <FeatureCard
              icon="📱"
              title="PWA Installable"
              description="Add to home screen. Works offline. Feels like a native app."
            />
          </div>
        </div>
      </section>

      {/* PWA Install */}
      {!isInstalled && deferredPrompt && (
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h3 className="text-3xl font-bold text-white mb-4">
              Install ESTA Tracker
            </h3>
            <p className="text-white mb-6">
              Get instant access from your home screen
            </p>
            <button
              onClick={installPWA}
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition transform"
            >
              Install Now
            </button>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Track Your ESTA?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of travelers who never miss an update.
          </p>
          <Link
            to={ROUTES.SIGN_UP}
            className="inline-block px-10 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform"
          >
            Start Free Today
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl hover:scale-105 transition transform">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      {description}
    </p>
  </div>
);

export default LandingPage;