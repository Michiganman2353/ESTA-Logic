/**
 * UI Component Showcase
 *
 * This page demonstrates all UI components, loading states, and responsive utilities
 * in the ESTA Tracker design system. Useful for development, testing, and documentation.
 *
 * Features:
 * - All button variants and states
 * - All loading spinner variants
 * - Responsive layout utilities
 * - Color palette
 * - Typography samples
 * - Grid systems
 */

import { useState } from 'react';
import {
  Button,
  LoadingSpinner,
  PageLoader,
  InlineLoader,
  SkeletonLoader,
  SkeletonCard,
  ResponsiveCard,
  ResponsiveGrid,
  ResponsiveStatCard,
} from '@/components/DesignSystem';
import { LoadingButton } from '@/components/LoadingButton';

export default function UIShowcase() {
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  const simulateLoading = (id: string) => {
    setLoadingButton(id);
    setTimeout(() => setLoadingButton(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="container-responsive py-6">
          <h1 className="text-responsive-2xl font-bold text-gray-900 dark:text-white">
            ESTA Tracker UI Component Showcase
          </h1>
          <p className="text-responsive-base mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive demonstration of all design system components
          </p>
        </div>
      </header>

      <main className="container-responsive space-responsive py-8">
        {/* Buttons Section */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="text-responsive-xl mb-4 font-bold text-gray-900 dark:text-white">
              Buttons
            </h2>

            {/* Button Variants */}
            <div className="space-y-4">
              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  States
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <LoadingButton
                    loading={loadingButton === 'btn1'}
                    onClick={() => simulateLoading('btn1')}
                  >
                    Click to Load
                  </LoadingButton>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  With Icons
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button leftIcon={<span>←</span>}>Back</Button>
                  <Button rightIcon={<span>→</span>}>Next</Button>
                  <Button
                    leftIcon={<span>✓</span>}
                    rightIcon={<span>→</span>}
                    variant="primary"
                  >
                    Complete
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Full Width
                </h3>
                <Button fullWidth variant="primary">
                  Full Width Button
                </Button>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Legacy Button Styles (CSS Classes)
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button className="btn btn-primary">Primary CSS</button>
                  <button className="btn btn-secondary">Secondary CSS</button>
                  <button className="btn btn-danger">Danger CSS</button>
                  <button className="btn btn-success">Success CSS</button>
                  <button className="btn btn-primary" disabled>
                    Disabled CSS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loading Spinners Section */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="text-responsive-xl mb-4 font-bold text-gray-900 dark:text-white">
              Loading Spinners
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Variants
                </h3>
                <div className="grid-4-cols">
                  <div className="card text-center">
                    <LoadingSpinner variant="circular" size="lg" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Circular
                    </p>
                  </div>
                  <div className="card text-center">
                    <LoadingSpinner variant="dots" size="lg" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Dots
                    </p>
                  </div>
                  <div className="card text-center">
                    <LoadingSpinner variant="pulse" size="lg" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Pulse
                    </p>
                  </div>
                  <div className="card text-center">
                    <LoadingSpinner variant="bars" size="lg" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Bars
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-center">
                    <LoadingSpinner size="xs" />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      XS
                    </p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="sm" />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      SM
                    </p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="md" />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      MD
                    </p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      LG
                    </p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="xl" />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      XL
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  With Text
                </h3>
                <LoadingSpinner
                  variant="circular"
                  size="lg"
                  text="Loading data..."
                />
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Inline Loader
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Processing your request <InlineLoader text="Please wait" />
                </p>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Page Loader Demo
                </h3>
                <Button onClick={() => setShowPageLoader(true)}>
                  Show Page Loader
                </Button>
                {showPageLoader && (
                  <div className="relative">
                    <PageLoader
                      message="Loading Dashboard"
                      hint="This may take a few seconds"
                    />
                    <Button
                      onClick={() => setShowPageLoader(false)}
                      className="fixed right-4 top-4 z-[60]"
                      variant="secondary"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Utilities Section */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="text-responsive-xl mb-4 font-bold text-gray-900 dark:text-white">
              Responsive Utilities
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Responsive Grid (2 Columns)
                </h3>
                <div className="grid-2-cols">
                  <div className="card bg-primary-50 dark:bg-primary-900/20">
                    Column 1
                  </div>
                  <div className="card bg-primary-50 dark:bg-primary-900/20">
                    Column 2
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Responsive Grid (3 Columns)
                </h3>
                <div className="grid-3-cols">
                  <div className="card bg-accent-50 dark:bg-accent-900/20">
                    Column 1
                  </div>
                  <div className="card bg-accent-50 dark:bg-accent-900/20">
                    Column 2
                  </div>
                  <div className="card bg-accent-50 dark:bg-accent-900/20">
                    Column 3
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Responsive Stat Cards
                </h3>
                <ResponsiveGrid>
                  <ResponsiveStatCard
                    label="Total Users"
                    value="1,234"
                    change={15}
                    trend="up"
                    icon={<span className="text-2xl">👥</span>}
                  />
                  <ResponsiveStatCard
                    label="Active Sessions"
                    value="892"
                    change={8}
                    trend="up"
                    icon={<span className="text-2xl">📊</span>}
                  />
                  <ResponsiveStatCard
                    label="Completion Rate"
                    value="94%"
                    change={-2}
                    trend="down"
                    icon={<span className="text-2xl">✓</span>}
                  />
                </ResponsiveGrid>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Responsive Cards
                </h3>
                <ResponsiveGrid>
                  <ResponsiveCard
                    title="Standard Card"
                    description="This card adapts to its container size using container queries"
                    variant="default"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resize your browser to see how this card adapts!
                    </p>
                  </ResponsiveCard>
                  <ResponsiveCard
                    title="Compact Card"
                    description="A more compact variant"
                    variant="compact"
                  />
                  <ResponsiveCard
                    title="Detailed Card"
                    description="Shows additional information on larger screens"
                    variant="detailed"
                    onAction={() => alert('Action clicked!')}
                    actionLabel="View More"
                  />
                </ResponsiveGrid>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Loaders Section */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="text-responsive-xl mb-4 font-bold text-gray-900 dark:text-white">
              Skeleton Loaders
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Skeleton Variants
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      Text (default)
                    </p>
                    <SkeletonLoader variant="text" count={3} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      Circle
                    </p>
                    <SkeletonLoader variant="circle" width={64} height={64} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      Rectangular
                    </p>
                    <SkeletonLoader
                      variant="rectangular"
                      width="100%"
                      height={100}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-responsive-base mb-3 font-semibold text-gray-700 dark:text-gray-300">
                  Skeleton Cards
                </h3>
                <div className="grid-3-cols">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="text-responsive-xl mb-4 font-bold text-gray-900 dark:text-white">
              Responsive Typography
            </h2>

            <div className="space-y-4">
              <div className="text-responsive-2xl font-bold text-gray-900 dark:text-white">
                2XL Responsive Heading
              </div>
              <div className="text-responsive-xl font-bold text-gray-900 dark:text-white">
                XL Responsive Heading
              </div>
              <div className="text-responsive-lg font-semibold text-gray-900 dark:text-white">
                LG Responsive Heading
              </div>
              <div className="text-responsive-base text-gray-700 dark:text-gray-300">
                Base responsive body text - resize your browser to see how it
                adapts
              </div>
              <div className="text-responsive-sm text-gray-600 dark:text-gray-400">
                Small responsive text for captions and descriptions
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="container-responsive py-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            ESTA Tracker Design System v2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
