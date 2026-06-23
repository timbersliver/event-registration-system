import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Spin, Progress } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IOverviewReport } from '../../types/api';
import dayjs from 'dayjs';

export default function AdminEventReportPage() {
  const [reports, setReports] = useState<IOverviewReport[]>([]);
  const [loading, setLoading] = useState(true);
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
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
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
      title: 'Pending',
      dataIndex: 'pendingRegistrations',
      key: 'pending',
      render: (val: number) => (
        <span className="text-orange-600 font-medium">{val}</span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalRegistrations',
      key: 'total',
      render: (val: number) => (
        <span className="font-medium">{val}</span>
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
        <h1 className="text-3xl font-bold text-gray-800">Event Reports</h1>
        <p className="text-gray-500 mt-1">Detailed registration report for all events</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50"
        />
      </div>
    </div>
  );
}
