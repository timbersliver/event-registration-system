import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Spin } from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IOverviewReport } from '../../types/api';

export default function AdminReportsPage() {
  const [events, setEvents] = useState<IOverviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      const response = await adminApi.getOverviewReport(token);
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const totalRegistrations = events.reduce((sum, e) => sum + e.totalRegistrations, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-500 mt-1">View registration analytics and statistics</p>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{events.length}</div>
              <p className="text-gray-500 text-sm">Total Events</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalRegistrations}</div>
              <p className="text-gray-500 text-sm">Total Registrations</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {events.filter((e) => new Date(e.dateTime) > new Date()).length}
              </div>
              <p className="text-gray-500 text-sm">Upcoming</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {events.filter((e) => e.capacityUtilization >= 100).length}
              </div>
              <p className="text-gray-500 text-sm">Full Events</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Link to="/admin/report/event-report">
            <Card
              hoverable
              className="rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <FileTextOutlined className="text-indigo-600 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Event Report</h3>
                  <p className="text-sm text-gray-500">Detailed registration report for all events</p>
                </div>
              </div>
            </Card>
          </Link>
        </Col>
        <Col xs={24} md={12}>
          <Link to="/admin/report/statistic-report">
            <Card
              hoverable
              className="rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <BarChartOutlined className="text-green-600 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Statistic Report</h3>
                  <p className="text-sm text-gray-500">Per-event registration analytics with time-based charts</p>
                </div>
              </div>
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
