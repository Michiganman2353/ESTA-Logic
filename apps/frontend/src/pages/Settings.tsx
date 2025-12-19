/**
 * Settings Page
 *
 * Main settings page for ESTA Tracker that allows users to configure
 * their account, view security information, and manage preferences.
 *
 * Features:
 * - Account information display and editing
 * - Security and privacy information
 * - Notification preferences
 * - Integration settings
 * - Compliance certificate download
 * - Trust badges display
 * - Responsive tabs navigation
 * - Dark mode support
 *
 * Uses:
 * - SecuritySection component for security information
 * - TrustBadgeGroup for trust indicators
 * - Design system components (Button, Card)
 * - User context for current user data
 *
 * Navigation:
 * - Protected route (requires authentication)
 * - Accessible from main dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { SecuritySection, TrustBadgeGroup } from '@/components/Settings';
import { Button } from '@/components/DesignSystem/Button';
import { Card } from '@/components/DesignSystem/Card';

interface SettingsProps {
  user: User;
}

type SettingsTab = 'account' | 'security' | 'notifications' | 'integrations';

export default function Settings({ user }: SettingsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleDownloadCertificate = () => {
    // Generate compliance certificate
    const certificateData = {
      companyName: 'Sample Company',
      certificationDate: new Date().toISOString(),
      features: [
        'Michigan ESTA Compliance',
        'Bank-Level Encryption (AES-256-GCM)',
        'Google Cloud KMS Key Management',
        'Comprehensive Audit Logging',
        '3-Year Record Retention',
      ],
    };

    const blob = new Blob([JSON.stringify(certificateData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esta-tracker-compliance-certificate.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'account' as SettingsTab, label: 'Account', icon: '👤' },
    { id: 'security' as SettingsTab, label: 'Security & Privacy', icon: '🔒' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: '🔔' },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: '🔗' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="hover:text-primary-600 dark:hover:text-primary-400 text-lg font-bold text-gray-900 sm:text-xl dark:text-white"
              >
                ← ESTA Tracker
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="max-w-[150px] truncate text-xs text-gray-700 sm:max-w-none sm:text-sm dark:text-gray-300">
                {user.name} ({user.role})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.href = '/login';
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings, security preferences, and integrations
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mb-6">
          <TrustBadgeGroup
            badges={['security', 'compliance', 'verified']}
            size="md"
            showCertificate={true}
            onDownloadCertificate={handleDownloadCertificate}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav
            className="flex space-x-8 overflow-x-auto"
            aria-label="Settings tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                } `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'account' && (
            <Card>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="input w-full"
                    disabled
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="input w-full"
                    disabled
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <input
                    type="text"
                    defaultValue={user.role}
                    className="input w-full"
                    disabled
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employer Size
                  </label>
                  <input
                    type="text"
                    defaultValue={
                      user.employerSize === 'large'
                        ? 'Large (≥10 employees)'
                        : 'Small (<10 employees)'
                    }
                    className="input w-full"
                    disabled
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && <SecuritySection />}

          {activeTab === 'notifications' && (
            <Card>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive email updates for PTO requests and approvals
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Balance Alerts
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when sick time balance is low
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Compliance Updates
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stay informed about Michigan ESTA law changes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} isLoading={isSaving}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Payroll Integrations
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          QuickBooks
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically sync hours worked from QuickBooks
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <span className="text-2xl">💼</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ADP
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically sync hours worked from ADP
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-2xl">💵</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Paychex
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically sync hours worked from Paychex
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
