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

          {/* Bar Chart */}
          <div className="relative" style={{ height: 220 }}>
            <div className="absolute inset-0 flex items-end gap-1 px-2">
              {data.points.map((point, i) => {
                const height = Math.max((point.count / maxCount) * 100, point.count > 0 ? 4 : 0);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer relative"
                      style={{ height: `${height}%`, minHeight: point.count > 0 ? '4px' : '0' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                        {point.count} registrations
                      </div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center leading-tight">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Y-axis legend */}
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>0</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>{maxCount}</span>
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
