'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
} from 'recharts';

interface SparklineChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatter?: (value: number) => string;
}

export default function SparklineChart({
  data,
  dataKey,
  xKey = 'month',
  color = '#2563eb',
  height = 80,
  formatter = (v) => v.toLocaleString(),
}: SparklineChartProps) {
  if (data.length === 0) return null;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`sparkFill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey={xKey} hide />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              padding: '4px 8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
            formatter={(value?: number) => [formatter(value ?? 0), '']}
            labelFormatter={(label) => {
              if (typeof label === 'string' && label.includes('-')) {
                const [y, m] = label.split('-');
                return `${m}/${y}`;
              }
              return String(label);
            }}
            separator=""
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sparkFill-${dataKey})`}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
