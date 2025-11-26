import React from 'react';

interface HeroProps {
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
  variant?: 'default' | 'compact';
}

export function Hero({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  variant = 'default',
}: HeroProps) {
  return (
    <section
      className={`hero ${variant}`}
      style={{
        padding: variant === 'compact' ? '3rem 2rem' : '6rem 2rem',
        textAlign: 'center',
        backgroundColor: '#1a365d',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: variant === 'compact' ? '2rem' : '3rem',
            marginBottom: '1rem',
          }}
        >
          {headline}
        </h1>
        {subheadline && (
          <p
            style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}
          >
            {subheadline}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {ctaText && ctaLink && (
            <a
              href={ctaLink}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#48bb78',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
              }}
            >
              {ctaText}
            </a>
          )}
          {secondaryCtaText && secondaryCtaLink && (
            <a
              href={secondaryCtaLink}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                border: '2px solid white',
              }}
            >
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
