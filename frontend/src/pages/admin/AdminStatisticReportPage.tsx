import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Spin, Segmented, Progress, Button } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IOverviewReport, IRegistrationAnalytics, IRegistrationAnalyticsPoint } from '../../types/api';
import dayjs from 'dayjs';

const periods = [
  { label: 'Last 1 Hour', value: '1h' },
  { label: 'Last 1 Day', value: '1d' },
  { label: 'Last 1 Week', value: '1w' },
  { label: 'Last 1 Month', value: '1m' },
];

function AnalyticsChart({ token, eventId }: { token: string; eventId: number }) {
  const [period, setPeriod] = useState('1d');
  const [data, setData] = useState<IRegistrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const response = await adminApi.getRegistrationAnalytics(token, period, eventId);
        if (!cancelled && response.success && response.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, period, eventId]);

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
  const chartH = 220;
  const pad = { top: 16, right: 16, bottom: 40, left: 44 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  // Build SVG path for the area (transparent fill) and line
  const pts = data?.points ?? [];
  const toX = (_: unknown, i: number) =>
    pad.left + (pts.length > 1 ? (i / (pts.length - 1)) * plotW : plotW / 2);
  const toY = (v: number) => pad.top + plotH - (v / yMax) * plotH;

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p, i).toFixed(1)},${toY(p.count).toFixed(1)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L${toX(pts[pts.length - 1], pts.length - 1).toFixed(1)},${pad.top + plotH}` +
    ` L${toX(pts[0], 0).toFixed(1)},${pad.top + plotH} Z`;

  return (
    <div className="py-4">
      <div className="mb-4 max-w-md mx-auto">
        <Segmented
          value={period}
          onChange={(val) => setPeriod(val as string)}
          options={periods.map((p) => ({ label: p.label, value: p.value }))}
          block
          size="middle"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : data && data.points.length > 0 ? (
        <div>
          <div className="text-center mb-3">
            <span className="text-xl font-bold text-gray-800">{data.total}</span>
            <span className="text-gray-500 ml-2 text-sm">
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
              {pts.map((p, i) => (
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
              {pts.map((p, i) => {
                const skip = pts.length > 20 ? Math.ceil(pts.length / 12) : 1;
                if (i % skip !== 0 && i !== pts.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={toX(p, i)}
                    y={chartH - 6}
                    textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}
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
        <div className="text-center py-8 text-gray-400">
          <p>No registration data available for the selected period</p>
        </div>
      )}
    </div>
  );
}

export default function AdminStatisticReportPage() {
  const [reports, setReports] = useState<IOverviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const response = await adminApi.getOverviewReport(token);
      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: IOverviewReport) => (
        <Link
          to={`/admin/event/${record.id}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {name}
        </Link>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Handler',
      dataIndex: 'handler',
      key: 'handler',
    },
    {
      title: 'Verified',
      dataIndex: 'verifiedRegistrations',
      key: 'verified',
      render: (val: number) => (
        <span className="text-green-600 font-medium">{val}</span>
      ),
    },
    {
      title: 'Utilization',
      key: 'utilization',
      render: (_: unknown, record: IOverviewReport) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={record.capacityUtilization}
            size="small"
            className="flex-1 min-w-[80px]"
            strokeColor={
              record.capacityUtilization >= 90
                ? '#ef4444'
                : record.capacityUtilization >= 70
                ? '#f59e0b'
                : '#4f46e5'
            }
          />
          <span className="text-sm text-gray-600 w-10 text-right">
            {record.capacityUtilization}%
          </span>
        </div>
      ),
    },
    {
      title: '',
      key: 'expand',
      width: 60,
      render: (_: unknown, record: IOverviewReport) => {
        const isExpanded = expandedRowKeys.includes(record.id);
        return (
          <Button
            type="text"
            icon={isExpanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleExpand(record.id)}
          />
        );
      },
    },
  ];

  return (
    <div>
      <Link
        to="/admin/report"
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        <ArrowLeftOutlined /> Back to Reports
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Statistic Report</h1>
        <p className="text-gray-500 mt-1">
          Click the eye icon on any event to view registration analytics with time-based breakdowns
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} events` }}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50"
          expandable={{
            expandedRowKeys,
            columnWidth: 0,
            expandedRowRender: (record) => (
              <div className="px-4 py-2">
                <AnalyticsChart token={token} eventId={record.id} />
              </div>
            ),
            rowExpandable: () => true,
            showExpandColumn: false,
          }}
        />
      </div>
    </div>
  );
}
