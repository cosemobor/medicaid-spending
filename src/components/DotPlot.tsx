'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceArea,
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
  defaultLog?: boolean;
  xTicks?: number[];
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
  defaultLog = true,
  xTicks,
}: DotPlotProps) {
  const dotClickedRef = useRef(false);
  const dragStartPx = useRef<{ x: number; y: number } | null>(null);

  // Zoom state
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [yDomain, setYDomain] = useState<[number, number] | null>(null);
  const [refArea, setRefArea] = useState<{
    x1: number; y1: number; x2: number; y2: number;
  } | null>(null);
  const isDragging = useRef(false);

  // Log scale state
  const [useLog, setUseLog] = useState(defaultLog);

  const isZoomed = xDomain !== null || yDomain !== null;

  const { groupedData, dimmedData } = useMemo(() => {
    const hasHighlight = highlightIds && highlightIds.size > 0;
    const groups: Record<string, DotPlotDatum[]> = {};
    const dimmed: DotPlotDatum[] = [];

    for (const d of data) {
      // Filter out non-positive values when log scale is active
      if (useLog && (d.x <= 0 || d.y <= 0)) continue;
      if (hasHighlight && !highlightIds!.has(d.id)) {
        dimmed.push(d);
        continue;
      }
      const cat = d.category ?? 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    }

    return { groupedData: groups, dimmedData: dimmed };
  }, [data, highlightIds, useLog]);

  const handleDotClick = useCallback((d: DotPlotDatum) => {
    dotClickedRef.current = true;
    onDotClick?.(d);
  }, [onDotClick]);

  // Zoom handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = useCallback((e: any) => {
    if (!e?.activePayload?.[0]) {
      // Clicked on chart background — capture approximate coordinate from recharts event
      if (e?.xValue != null && e?.yValue != null) {
        setRefArea({ x1: e.xValue, y1: e.yValue, x2: e.xValue, y2: e.yValue });
        isDragging.current = true;
        dragStartPx.current = e?.chartX != null ? { x: e.chartX, y: e.chartY } : null;
      }
      return;
    }
    const p = e.activePayload[0].payload as DotPlotDatum;
    setRefArea({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    isDragging.current = true;
    dragStartPx.current = e?.chartX != null ? { x: e.chartX, y: e.chartY } : null;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((e: any) => {
    if (!isDragging.current || !refArea) return;
    if (e?.activePayload?.[0]) {
      const p = e.activePayload[0].payload as DotPlotDatum;
      setRefArea((prev) => prev ? { ...prev, x2: p.x, y2: p.y } : null);
    } else if (e?.xValue != null && e?.yValue != null) {
      setRefArea((prev) => prev ? { ...prev, x2: e.xValue, y2: e.yValue } : null);
    }
  }, [refArea]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !refArea) {
      isDragging.current = false;
      setRefArea(null);
      return;
    }
    isDragging.current = false;

    const { x1, y1, x2, y2 } = refArea;
    setRefArea(null);

    // Check minimum drag distance (avoid zooming on click)
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    if (dx < 1e-10 && dy < 1e-10) return;

    // Also check pixel distance
    if (dragStartPx.current) {
      // We can't get current chartX in mouseUp easily, but if x/y values barely changed, skip
    }

    const xMin = Math.min(x1, x2);
    const xMax = Math.max(x1, x2);
    const yMin = Math.min(y1, y2);
    const yMax = Math.max(y1, y2);

    // Only zoom if the selection has meaningful size
    if (xMax - xMin > 0 || yMax - yMin > 0) {
      setXDomain([xMin, xMax]);
      setYDomain([yMin, yMax]);
    }
  }, [refArea]);

  const resetZoom = useCallback(() => {
    setXDomain(null);
    setYDomain(null);
    setRefArea(null);
  }, []);

  const renderDot = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      const { cx, cy, fill, payload } = props as { cx: number; cy: number; fill: string; payload: DotPlotDatum };
      if (cx == null || cy == null) return <circle cx={0} cy={0} r={0} />;
      const isSelected = payload?.id === selectedId;
      if (isSelected) {
        return (
          <g style={{ outline: 'none' }} tabIndex={-1}>
            <circle cx={cx} cy={cy} r={14} fill={fill} opacity={0.12} />
            <circle cx={cx} cy={cy} r={7} fill={fill} stroke="#1a1a1a" strokeWidth={2.5} />
          </g>
        );
      }
      return <circle cx={cx} cy={cy} r={5} fill={fill} opacity={0.75} style={{ outline: 'none' }} />;
    },
    [selectedId],
  );

  return (
    <div
      className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm sm:p-4 [&_svg_*:focus]:outline-none"
      style={{ userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
      onClick={(e) => {
        if (dotClickedRef.current) { dotClickedRef.current = false; return; }
        if ((e.target as HTMLElement).closest?.('svg') && onDotClick) {
          onDotClick({ x: 0, y: 0, label: '', id: '' }); // deselect
        }
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2 px-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Reset Zoom
            </button>
          )}
          <button
            onClick={() => { setUseLog(!useLog); resetZoom(); }}
            className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              useLog
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {useLog ? 'Log' : 'Linear'}
          </button>
        </div>
      </div>
      {!isZoomed && (
        <p className="mb-1 px-2 text-[10px] text-gray-400">Drag to zoom into a region</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 10, right: 35, bottom: 20, left: 5 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            type="number"
            scale={useLog ? 'log' : 'auto'}
            domain={xDomain ?? (useLog ? ['auto', 'auto'] : undefined)}
            allowDataOverflow={isZoomed}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={xFormatter}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#475569' }}
            {...(xTicks && !isZoomed ? { ticks: xTicks } : {})}
          />
          <YAxis
            dataKey="y"
            type="number"
            scale={useLog ? 'log' : 'auto'}
            domain={yDomain ?? (useLog ? ['auto', 'auto'] : undefined)}
            allowDataOverflow={isZoomed}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={yFormatter}
            width={55}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: '#475569' }}
          />
          <Tooltip content={<DefaultTooltip renderTooltip={renderTooltip} />} cursor={false} />
          {refArea && (
            <ReferenceArea
              x1={refArea.x1}
              y1={refArea.y1}
              x2={refArea.x2}
              y2={refArea.y2}
              strokeOpacity={0.3}
              fill="#3b82f6"
              fillOpacity={0.1}
              stroke="#3b82f6"
            />
          )}
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
      {Object.keys(categoryColors).length > 0 && Object.keys(categoryColors).length <= 15 && (
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
