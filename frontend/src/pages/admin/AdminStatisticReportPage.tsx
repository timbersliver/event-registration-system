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

          <div className="relative" style={{ height: 180 }}>
            <div className="absolute inset-0 flex items-end gap-[2px] px-2">
              {data.points.map((point, i) => {
                const height = Math.max((point.count / maxCount) * 100, point.count > 0 ? 4 : 0);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer"
                      style={{ height: `${height}%`, minHeight: point.count > 0 ? '4px' : '0' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                        {point.count} registrations
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center leading-tight">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
            <span>0</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>{maxCount}</span>
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
