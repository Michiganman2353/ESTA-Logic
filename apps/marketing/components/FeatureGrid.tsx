import React from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureGridProps {
  headline?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

const iconMap: Record<string, string> = {
  calculator: '🧮',
  shield: '🛡️',
  document: '📄',
  users: '👥',
  clock: '⏰',
  refresh: '🔄',
  chart: '📊',
  bell: '🔔',
  lock: '🔒',
  dashboard: '📈',
  settings: '⚙️',
  mobile: '📱',
  history: '📜',
  download: '⬇️',
  support: '💬',
  check: '✅',
};

export function FeatureGrid({
  headline,
  features,
  columns = 3,
}: FeatureGridProps) {
  return (
    <section
      className="feature-grid"
      style={{ padding: '4rem 2rem', backgroundColor: '#f7fafc' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {headline && (
          <h2
            style={{
              textAlign: 'center',
              fontSize: '2rem',
              marginBottom: '3rem',
              color: '#2d3748',
            }}
          >
            {headline}
          </h2>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '2rem',
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-item"
              style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                {iconMap[feature.icon] || '📌'}
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  marginBottom: '0.5rem',
                  color: '#2d3748',
                }}
              >
                {feature.title}
              </h3>
              <p style={{ color: '#718096', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
