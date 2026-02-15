import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Medicaid Provider Spending Explorer — T-MSIS Data Analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#f9fafb',
          fontFamily: 'system-ui, sans-serif',
          padding: '40px 48px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Medicaid Provider Spending Explorer
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            CMS T-MSIS provider-level fee-for-service spending, Jan 2018 – Dec 2024
          </p>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {['Overview', 'Providers', 'Procedures', 'Anomalies', 'States'].map((tab, i) => (
            <span
              key={tab}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: '6px',
                background: i === 0 ? '#2563eb' : 'transparent',
                color: i === 0 ? 'white' : '#6b7280',
              }}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Spending (2018–2024)', value: '$1093.56B', detail: '$1,093,562,833,512' },
            { label: 'Total Beneficiary-Months', value: '11.3B', detail: 'Sum across all months' },
            { label: 'Avg Cost / Beneficiary-Month', value: '$97', detail: '$58 per claim' },
            { label: 'Providers Tracked', value: '10K', detail: '11K procedures across 57 states' },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid #e5e7eb',
              }}
            >
              <span style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{card.label}</span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                {card.value}
              </span>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{card.detail}</span>
            </div>
          ))}
        </div>

        {/* Explore the Data section */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            Explore the Data
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Provider Map', value: '10K', detail: 'providers mapped with location data', color: '#2563eb' },
              { label: 'Top Procedure', value: 'Personal care ser per 15 min', detail: '$122.74B in total spending', color: '#16a34a' },
              { label: 'Billing Anomalies', value: '2K', detail: 'providers charging above 2x median', color: '#dc2626' },
              { label: 'Top Spending State', value: 'NY', detail: '$144.77B in total spending', color: '#2563eb' },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  background: card.color === '#dc2626' ? '#fef2f2' : card.color === '#16a34a' ? '#f0fdf4' : '#eff6ff',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  borderLeft: `3px solid ${card.color}`,
                }}
              >
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{card.label}</span>
                <span
                  style={{
                    fontSize: card.value.length > 10 ? '15px' : '22px',
                    fontWeight: 700,
                    color: '#111827',
                    marginTop: '2px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.value}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{card.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart preview area */}
        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'white',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e5e7eb',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Monthly Medicaid Spending</span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>Total provider payments per month (nominal $)</span>
            {/* Simplified chart line */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginTop: 'auto', height: '60px' }}>
              {[30, 35, 32, 38, 40, 42, 45, 55, 70, 80, 75, 72, 68, 65, 70, 72, 75, 78, 80, 85, 82, 78, 75, 20].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: '#2563eb',
                      borderRadius: '1px',
                      opacity: 0.7,
                    }}
                  />
                ),
              )}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'white',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e5e7eb',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Cost per Beneficiary</span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>
              Average monthly spending per unique beneficiary (nominal $)
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginTop: 'auto', height: '60px' }}>
              {[40, 42, 45, 48, 50, 52, 55, 70, 85, 60, 58, 56, 55, 55, 56, 57, 58, 57, 56, 58, 59, 60, 61, 62].map(
                (h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: '#16a34a',
                      borderRadius: '1px',
                      opacity: 0.7,
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
