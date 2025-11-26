import React from 'react';

interface CTAProps {
  headline: string;
  subheadline?: string;
  ctaText: string;
  ctaLink: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export function CTA({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  variant = 'primary',
}: CTAProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#48bb78',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#4299e1',
      color: 'white',
    },
    tertiary: {
      backgroundColor: '#f7fafc',
      color: '#2d3748',
    },
  };

  const sectionStyle = styles[variant] || styles.primary;

  return (
    <section
      className={`cta cta-${variant}`}
      style={{
        ...sectionStyle,
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{headline}</h2>
        {subheadline && (
          <p
            style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9 }}
          >
            {subheadline}
          </p>
        )}
        <a
          href={ctaLink}
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: variant === 'tertiary' ? '#1a365d' : 'white',
            color: variant === 'tertiary' ? 'white' : '#1a365d',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
          }}
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
