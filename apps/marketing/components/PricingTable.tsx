import React from 'react';

interface Plan {
  name: string;
  price: number | null;
  period: string | null;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
}

interface PricingTableProps {
  headline?: string;
  plans: Plan[];
}

export function PricingTable({ headline, plans }: PricingTableProps) {
  return (
    <section
      className="pricing-table"
      style={{ padding: '4rem 2rem', backgroundColor: 'white' }}
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
            gridTemplateColumns: `repeat(${plans.length}, 1fr)`,
            gap: '2rem',
            alignItems: 'stretch',
          }}
        >
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-plan ${plan.highlighted ? 'highlighted' : ''}`}
              style={{
                padding: '2rem',
                backgroundColor: plan.highlighted ? '#1a365d' : '#f7fafc',
                color: plan.highlighted ? 'white' : '#2d3748',
                borderRadius: '0.5rem',
                boxShadow: plan.highlighted
                  ? '0 4px 6px rgba(0,0,0,0.2)'
                  : '0 1px 3px rgba(0,0,0,0.1)',
                transform: plan.highlighted ? 'scale(1.05)' : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>
              <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
                {plan.description}
              </p>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                }}
              >
                {plan.price === null ? (
                  'Custom'
                ) : plan.price === 0 ? (
                  'Free'
                ) : (
                  <>
                    ${plan.price}
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 'normal',
                        opacity: 0.8,
                      }}
                    >
                      /{plan.period}
                    </span>
                  </>
                )}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '2rem',
                  flexGrow: 1,
                }}
              >
                {plan.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: plan.highlighted
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid #e2e8f0',
                    }}
                  >
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaLink}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '1rem',
                  backgroundColor: plan.highlighted ? '#48bb78' : '#1a365d',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                {plan.ctaText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
