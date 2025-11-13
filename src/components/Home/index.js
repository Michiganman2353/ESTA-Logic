// src/components/home/index.js
import React, { useContext, useState, useEffect } from 'react';
import { AuthUserContext } from '../Session';
import Messages from '../Messages';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const HomePage = () => {
  const authUser = useContext(AuthUserContext);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { deferredPrompt, installPWA, isInstalled } = usePWAInstall();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Welcome */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 mb-4">
            Welcome back, {authUser.displayName || authUser.email.split('@')[0]}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Your ESTA status is being monitored in real-time.
          </p>
          <div className="text-3xl font-mono text-gray-800 dark:text-gray-200">
            {time}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="ESTA Status" value="Active" color="green" />
          <StatCard title="Last Checked" value={new Date().toLocaleDateString()} color="blue" />
          <StatCard title="Days Remaining" value="87" color="purple" />
        </div>

        {/* PWA Install */}
        {!isInstalled && deferredPrompt && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-8 text-center">
            <h3 className="text-xl font-bold mb-2">Install ESTA Tracker</h3>
            <p className="mb-4">Add to home screen for quick access</p>
            <button
              onClick={installPWA}
              className="px-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition transform"
            >
              Install App
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Updates
          </h2>
          <Messages />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {title}
    </h3>
    <p className={`text-3xl font-bold mt-2 text-${color}-600 dark:text-${color}-400`}>
      {value}
    </p>
  </div>
);

const condition = (authUser) => !!authUser;

export default HomePage;