import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Medicaid Provider Spending Explorer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '60px 80px',
            width: '100%',
            height: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              M
            </div>
            <span
              style={{
                fontSize: '20px',
                color: '#64748b',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              CMS T-MSIS Data Explorer
            </span>
          </div>

          <h1
            style={{
              fontSize: '52px',
              fontWeight: 800,
              color: '#0f172a',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 0 20px 0',
            }}
          >
            Medicaid Provider Spending Explorer
          </h1>

          <p
            style={{
              fontSize: '22px',
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 1.5,
              margin: '0 0 36px 0',
              maxWidth: '800px',
            }}
          >
            Explore provider-level fee-for-service spending trends, patterns,
            and statistical anomalies across procedures, states, and providers.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {[
              ['$1.09T', 'Total Spending'],
              ['10K+', 'Providers'],
              ['11K+', 'Procedures'],
              ['57', 'States'],
            ].map(([value, label]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#2563eb',
                  }}
                >
                  {value}
                </span>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '36px',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#2563eb',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                padding: '10px 24px',
                borderRadius: '8px',
              }}
            >
              Explore the Data
            </span>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              Jan 2018 – Dec 2024
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
