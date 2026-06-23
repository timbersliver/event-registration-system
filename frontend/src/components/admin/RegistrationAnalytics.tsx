import { useState, useEffect } from 'react';
import { Card, Segmented, Select, Spin } from 'antd';
import type { IRegistrationAnalytics, IRegistrationAnalyticsPoint } from '../../types/api';
import { adminApi } from '../../services/api';

const periods = [
  { label: 'Last 1 Hour', value: '1h' },
  { label: 'Last 1 Day', value: '1d' },
  { label: 'Last 1 Week', value: '1w' },
  { label: 'Last 1 Month', value: '1m' },
];

interface Props {
  token: string;
  events?: { id: number; name: string }[];
}

export default function RegistrationAnalytics({ token, events }: Props) {
  const [period, setPeriod] = useState('1d');
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<IRegistrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period, eventId]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const response = await adminApi.getRegistrationAnalytics(token, period, eventId);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }

  const maxCount = data ? Math.max(...data.points.map((p) => p.count), 1) : 1;

  /** Compute nice Y-axis scale steps */
  function getScaleSteps(max: number): { step: number; steps: number[] } {
    if (max <= 0) return { step: 1, steps: [0] };
    const roughStep = max / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    let niceStep: number;
    if (normalized <= 1.5) niceStep = 1;
    else if (normalized <= 3.5) niceStep = 2;
    else if (normalized <= 7.5) niceStep = 5;
    else niceStep = 10;
    const step = niceStep * magnitude;
    const steps: number[] = [];
    for (let i = 0; i * step <= max + step / 2; i++) {
      steps.push(i * step);
    }
    return { step, steps };
  }

  const { steps: ySteps } = getScaleSteps(maxCount);
  const yMax = ySteps[ySteps.length - 1] || 1;

  // Chart dimensions
  const chartW = 600;
  const chartH = 240;
  const pad = { top: 16, right: 16, bottom: 40, left: 44 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  // Build SVG path for the area (transparent fill) and line
  const points = data?.points ?? [];
  const toX = (_: unknown, i: number) =>
    pad.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const toY = (v: number) => pad.top + plotH - (v / yMax) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p, i).toFixed(1)},${toY(p.count).toFixed(1)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L${toX(points[points.length - 1], points.length - 1).toFixed(1)},${pad.top + plotH}` +
    ` L${toX(points[0], 0).toFixed(1)},${pad.top + plotH} Z`;

  return (
    <Card
      title="Registration Analytics"
      className="rounded-xl shadow-sm"
      extra={
        <Select
          allowClear
          placeholder="All events"
          style={{ width: 200 }}
          value={eventId}
          onChange={(val) => setEventId(val)}
          options={events?.map((e) => ({ label: e.name, value: e.id })) || []}
        />
      }
    >
      <div className="mb-6">
        <Segmented
          value={period}
          onChange={(val) => setPeriod(val as string)}
          options={periods.map((p) => ({ label: p.label, value: p.value }))}
          block
          size="large"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : data && data.points.length > 0 ? (
        <div>
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-gray-800">{data.total}</span>
            <span className="text-gray-500 ml-2">
              registrations in{' '}
              {period === '1h' ? 'last hour' : period === '1d' ? 'last day' : period === '1w' ? 'last week' : 'last month'}
            </span>
          </div>

          {/* Line / Area Chart */}
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full"
              style={{ minWidth: 360, maxWidth: '100%', height: 'auto' }}
            >
              {/* Horizontal grid lines & Y-axis labels */}
              {ySteps.map((s) => {
                const y = toY(s);
                return (
                  <g key={s}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={chartW - pad.right}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                    <text
                      x={pad.left - 6}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-gray-400"
                    >
                      {s}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              <path d={areaPath} fill="rgba(99,102,241,0.12)" />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Data dots & tooltips */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={toX(p, i)}
                    cy={toY(p.count)}
                    r={4}
                    fill="#fff"
                    stroke="#6366f1"
                    strokeWidth={2}
                    className="cursor-pointer"
                  />
                  <title>{p.count} registrations</title>
                </g>
              ))}

              {/* X-axis labels */}
              {points.map((p, i) => {
                // Show every nth label to avoid crowding
                const skip = points.length > 20 ? Math.ceil(points.length / 12) : 1;
                if (i % skip !== 0 && i !== points.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={toX(p, i)}
                    y={chartH - 6}
                    textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
                    className="text-[10px] fill-gray-400"
                  >
                    {p.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No registration data available</p>
          <p className="text-sm mt-1">for the selected period</p>
        </div>
      )}
    </Card>
  );
}
