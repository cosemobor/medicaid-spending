'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import type { ProviderSummary } from '@/types';
import { type ColorMetric, buildColorExpression, METRIC_LABELS } from './colors';
import ProviderTooltip, { type TooltipData } from './ProviderTooltip';
import ProviderInfoPanel from './ProviderInfoPanel';
import ProviderSearch from './ProviderSearch';
import MapLegend from './MapLegend';
import MetricToggle from './MetricToggle';

// ---------- Constants ----------

const US_CENTER: [number, number] = [-98.5, 39.8];
const DEFAULT_ZOOM = 4;
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// ---------- Helpers ----------

function buildGeoJSON(providers: ProviderSummary[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: providers
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        type: 'Feature' as const,
        id: p.npi,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng!, p.lat!],
        },
        properties: {
          npi: p.npi,
          name: p.name ?? '',
          state: p.state ?? '',
          totalPaid: p.totalPaid,
          avgCostIndex: p.avgCostIndex ?? 0,
          avgCostPerClaim: p.avgCostPerClaim ?? 0,
          totalBeneficiaries: p.totalBeneficiaries,
          spendingGrowthPct: p.spendingGrowthPct ?? 0,
          procedureCount: p.procedureCount,
          avgCostPerBeneficiary: p.avgCostPerBeneficiary ?? 0,
          totalClaims: p.totalClaims,
          costPerClaimGrowthPct: p.costPerClaimGrowthPct ?? 0,
          volumeGrowthPct: p.volumeGrowthPct ?? 0,
        },
      })),
  };
}

function computeExtent(providers: ProviderSummary[], metric: ColorMetric): [number, number] {
  const values = providers
    .map((p) => {
      switch (metric) {
        case 'avgCostIndex': return p.avgCostIndex;
        case 'avgCostPerClaim': return p.avgCostPerClaim;
        case 'avgCostPerBeneficiary': return p.avgCostPerBeneficiary;
        case 'totalPaid': return p.totalPaid;
        case 'totalBeneficiaries': return p.totalBeneficiaries;
        case 'spendingGrowthPct': return p.spendingGrowthPct;
      }
    })
    .filter((v): v is number => v != null);
  if (values.length === 0) return [0, 1];
  // Use percentiles to avoid outlier skew
  values.sort((a, b) => a - b);
  const p5 = values[Math.floor(values.length * 0.05)];
  const p95 = values[Math.floor(values.length * 0.95)];
  return [p5, p95];
}

function computeSizeExtent(providers: ProviderSummary[]): [number, number] {
  const paid = providers.map((p) => p.totalPaid).filter((v) => v > 0);
  if (paid.length === 0) return [0, 1];
  paid.sort((a, b) => a - b);
  return [paid[Math.floor(paid.length * 0.05)], paid[Math.floor(paid.length * 0.95)]];
}

// ---------- Component ----------

interface ProviderMapGLProps {
  providers: ProviderSummary[];
  initialProviderNpi?: string;
}

export default function ProviderMapGL({ providers, initialProviderNpi }: ProviderMapGLProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredNpi = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ data: TooltipData; x: number; y: number } | null>(null);
  const [activeMetric, setActiveMetric] = useState<ColorMetric>('avgCostIndex');
  const [selectedProvider, setSelectedProvider] = useState<ProviderSummary | null>(null);

  // Refs for stale closure avoidance (same pattern as HAM)
  const activeMetricRef = useRef<ColorMetric>(activeMetric);
  activeMetricRef.current = activeMetric;
  const selectedProviderRef = useRef<ProviderSummary | null>(null);
  selectedProviderRef.current = selectedProvider;
  const providersRef = useRef(providers);
  providersRef.current = providers;

  // Lookup map for quick provider access by NPI
  const providerMap = useRef<Map<string, ProviderSummary>>(new Map());
  useEffect(() => {
    const m = new Map<string, ProviderSummary>();
    for (const p of providers) m.set(p.npi, p);
    providerMap.current = m;
  }, [providers]);

  // Compute extents
  const colorExtent = computeExtent(providers, activeMetric);
  const sizeExtent = computeSizeExtent(providers);

  // Update color expression when metric changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('providers-circle')) return;

    const extent = computeExtent(providers, activeMetric);
    const expr = buildColorExpression(activeMetric, extent);
    map.setPaintProperty('providers-circle', 'circle-color', expr as maplibregl.ExpressionSpecification);
  }, [activeMetric, providers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLE,
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 3,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.on('load', () => {
      const geojson = buildGeoJSON(providers);
      const extent = computeSizeExtent(providers);
      const cExtent = computeExtent(providers, 'avgCostIndex');

      map.addSource('providers', {
        type: 'geojson',
        data: geojson,
        promoteId: 'npi',
      });

      map.addLayer({
        id: 'providers-circle',
        type: 'circle',
        source: 'providers',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, [
              'interpolate', ['linear'],
              ['sqrt', ['/', ['-', ['coalesce', ['get', 'totalPaid'], extent[0]], extent[0]], ['-', extent[1], extent[0]]]],
              0, 2,
              1, 8,
            ],
            8, [
              'interpolate', ['linear'],
              ['sqrt', ['/', ['-', ['coalesce', ['get', 'totalPaid'], extent[0]], extent[0]], ['-', extent[1], extent[0]]]],
              0, 4,
              1, 20,
            ],
          ] as unknown as maplibregl.ExpressionSpecification,
          'circle-color': buildColorExpression('avgCostIndex', cExtent) as maplibregl.ExpressionSpecification,
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.95,
            0.7,
          ] as unknown as maplibregl.ExpressionSpecification,
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,
            0.5,
          ] as unknown as maplibregl.ExpressionSpecification,
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#1a1a1a',
            '#ffffff',
          ] as unknown as maplibregl.ExpressionSpecification,
        },
      });

      setLoading(false);
    });

    // Hover interaction
    map.on('mousemove', 'providers-circle', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feat = e.features[0];
      const npi = String(feat.properties?.npi ?? '');

      // Clear previous hover
      if (hoveredNpi.current != null) {
        map.setFeatureState(
          { source: 'providers', id: hoveredNpi.current },
          { hover: false },
        );
      }

      hoveredNpi.current = npi;
      map.setFeatureState(
        { source: 'providers', id: npi },
        { hover: true },
      );
      map.getCanvas().style.cursor = 'pointer';

      const metric = activeMetricRef.current;
      const props = feat.properties ?? {};

      setTooltip({
        data: {
          name: props.name as string,
          npi,
          state: props.state as string,
          value: (props[metric] as number) ?? null,
          metric,
        },
        x: e.point.x,
        y: e.point.y,
      });
    });

    map.on('mouseleave', 'providers-circle', () => {
      if (hoveredNpi.current != null) {
        map.setFeatureState(
          { source: 'providers', id: hoveredNpi.current },
          { hover: false },
        );
      }
      hoveredNpi.current = null;
      map.getCanvas().style.cursor = '';
      setTooltip(null);
    });

    // Click on circle → select provider
    map.on('click', 'providers-circle', (e) => {
      if (!e.features || e.features.length === 0) return;
      const npi = String(e.features[0].properties?.npi ?? '');
      const provider = providerMap.current.get(npi) ?? null;
      setSelectedProvider(provider);
    });

    // Click on empty → deselect
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['providers-circle'] });
      if (features.length === 0) {
        setSelectedProvider(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select provider from URL parameter
  useEffect(() => {
    if (!initialProviderNpi || loading) return;
    const provider = providerMap.current.get(initialProviderNpi);
    if (!provider) return;
    const timer = setTimeout(() => {
      if (provider.lat != null && provider.lng != null && mapRef.current) {
        mapRef.current.flyTo({
          center: [provider.lng, provider.lat],
          zoom: 10,
          duration: 1200,
        });
      }
      setSelectedProvider(provider);
    }, 300);
    return () => clearTimeout(timer);
  }, [initialProviderNpi, loading]);

  // Handle search selection — fly to provider
  const handleSearchSelect = useCallback((provider: ProviderSummary) => {
    if (provider.lat != null && provider.lng != null && mapRef.current) {
      mapRef.current.flyTo({
        center: [provider.lng, provider.lat],
        zoom: 10,
        duration: 1200,
      });
    }
    setSelectedProvider(provider);
  }, []);

  return (
    <div className="relative h-full w-full touch-none">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="h-full w-full" />

      <ProviderSearch providers={providers} onSelect={handleSearchSelect} />
      <MapLegend activeMetric={activeMetric} extent={colorExtent} />

      {!selectedProvider && (
        <ProviderTooltip data={tooltip?.data ?? null} x={tooltip?.x ?? 0} y={tooltip?.y ?? 0} />
      )}

      <MetricToggle active={activeMetric} onChange={setActiveMetric} />

      {selectedProvider && (
        <ProviderInfoPanel
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}
