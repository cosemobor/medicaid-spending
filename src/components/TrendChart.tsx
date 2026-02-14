'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface ChartLine {
  dataKey: string;
  color: string;
  label: string;
}

interface TrendChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  lines: ChartLine[];
  xKey?: string;
  title: string;
  subtitle?: string;
  yFormatter?: (value: number) => string;
  height?: number;
}

export default function TrendChart({
  data,
  lines,
  xKey = 'month',
  title,
  subtitle,
  yFormatter = (v) => v.toLocaleString(),
  height = 320,
}: TrendChartProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      )}
      <div className="mt-3" style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(v: string) => {
                if (v && v.includes('-')) {
                  const [y, m] = v.split('-');
                  return `${m}/${y.slice(2)}`;
                }
                return v;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormatter}
              width={60}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value?: number, name?: string) => {
                const line = lines.find((l) => l.dataKey === name);
                return [yFormatter(value ?? 0), line?.label ?? name ?? ''];
              }}
              labelFormatter={(label) => `${label}`}
            />
            {lines.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => {
                  const line = lines.find((l) => l.dataKey === value);
                  return line?.label ?? value;
                }}
              />
            )}
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                connectNulls
                name={line.dataKey}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
