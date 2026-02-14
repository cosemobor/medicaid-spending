'use client';

import { useMemo, useCallback, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';

export interface DotPlotDatum {
  x: number;
  y: number;
  label: string;
  category?: string;
  id: string;
  size?: number;
  [key: string]: unknown;
}

interface DotPlotTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DotPlotDatum }>;
  renderTooltip?: (datum: DotPlotDatum) => React.ReactNode;
}

function DefaultTooltip({ active, payload, renderTooltip }: DotPlotTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  if (renderTooltip) return <>{renderTooltip(d)}</>;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{d.label}</p>
    </div>
  );
}

interface DotPlotProps {
  data: DotPlotDatum[];
  xLabel: string;
  yLabel: string;
  title: string;
  subtitle?: string;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
  categoryColors?: Record<string, string>;
  height?: number;
  selectedId?: string | null;
  onDotClick?: (datum: DotPlotDatum) => void;
  renderTooltip?: (datum: DotPlotDatum) => React.ReactNode;
  highlightIds?: Set<string>;
}

export default function DotPlot({
  data,
  xLabel,
  yLabel,
  title,
  subtitle,
  xFormatter = (v) => v.toLocaleString(),
  yFormatter = (v) => v.toLocaleString(),
  categoryColors = {},
  height = 380,
  selectedId,
  onDotClick,
  renderTooltip,
  highlightIds,
}: DotPlotProps) {
  const dotClickedRef = useRef(false);

  const { groupedData, dimmedData } = useMemo(() => {
    const hasHighlight = highlightIds && highlightIds.size > 0;
    const groups: Record<string, DotPlotDatum[]> = {};
    const dimmed: DotPlotDatum[] = [];

    for (const d of data) {
      if (hasHighlight && !highlightIds!.has(d.id)) {
        dimmed.push(d);
        continue;
      }
      const cat = d.category ?? 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    }

    return { groupedData: groups, dimmedData: dimmed };
  }, [data, highlightIds]);

  const handleDotClick = useCallback((d: DotPlotDatum) => {
    dotClickedRef.current = true;
    onDotClick?.(d);
  }, [onDotClick]);

  const renderDot = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      const { cx, cy, fill, payload } = props as { cx: number; cy: number; fill: string; payload: DotPlotDatum };
      if (cx == null || cy == null) return <circle cx={0} cy={0} r={0} />;
      const isSelected = payload?.id === selectedId;
      if (isSelected) {
        return (
          <g>
            <circle cx={cx} cy={cy} r={14} fill={fill} opacity={0.12} />
            <circle cx={cx} cy={cy} r={7} fill={fill} stroke="#1a1a1a" strokeWidth={2.5} />
          </g>
        );
      }
      return <circle cx={cx} cy={cy} r={5} fill={fill} opacity={0.75} />;
    },
    [selectedId],
  );

  return (
    <div
      className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm sm:p-4"
      style={{ userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
      onClick={(e) => {
        if (dotClickedRef.current) { dotClickedRef.current = false; return; }
        if ((e.target as HTMLElement).closest?.('svg') && onDotClick) {
          onDotClick({ x: 0, y: 0, label: '', id: '' }); // deselect
        }
      }}
    >
      <div className="mb-2 px-2">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            type="number"
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={xFormatter}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#475569' }}
          />
          <YAxis
            dataKey="y"
            type="number"
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={yFormatter}
            width={65}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: '#475569' }}
          />
          <Tooltip content={<DefaultTooltip renderTooltip={renderTooltip} />} cursor={false} />
          {dimmedData.length > 0 && (
            <Scatter
              name="Other"
              data={dimmedData}
              fill="#d1d5db"
              fillOpacity={0.3}
              shape={renderDot}
              onClick={(d: Record<string, unknown>) => handleDotClick(d as unknown as DotPlotDatum)}
              isAnimationActive={false}
            />
          )}
          {Object.entries(groupedData).map(([cat, points]) => (
            <Scatter
              key={cat}
              name={cat}
              data={points}
              fill={categoryColors[cat] ?? '#475569'}
              fillOpacity={0.75}
              shape={renderDot}
              onClick={(d: Record<string, unknown>) => handleDotClick(d as unknown as DotPlotDatum)}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      {Object.keys(categoryColors).length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {Object.entries(categoryColors).map(([cat, color]) => (
            groupedData[cat] && (
              <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {cat}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}
