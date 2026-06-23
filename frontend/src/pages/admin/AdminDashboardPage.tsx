import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Statistic, Row, Col, Spin } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IOverviewReport } from '../../types/api';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<IOverviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const response = await adminApi.getOverviewReport(token);
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + e.totalRegistrations, 0);
  const upcomingEvents = events.filter((e) => new Date(e.dateTime) > new Date()).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to the Event Registration System</p>
      </div>

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Total Events"
              value={totalEvents}
              prefix={<CalendarOutlined className="text-indigo-600" />}
              valueStyle={{ color: '#4f46e5' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Total Registrations"
              value={totalRegistrations}
              prefix={<TeamOutlined className="text-green-600" />}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl shadow-sm">
            <Statistic
              title="Upcoming Events"
              value={upcomingEvents}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              valueStyle={{ color: '#ea580c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Link to="/admin/event">
            <Card
              hoverable
              className="rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <PlusCircleOutlined className="text-indigo-600 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Manage Events</h3>
                  <p className="text-sm text-gray-500">Create and manage your events</p>
                </div>
              </div>
            </Card>
          </Link>
        </Col>
        <Col xs={24} md={12}>
          <Link to="/admin/report">
            <Card
              hoverable
              className="rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <BarChartOutlined className="text-green-600 text-2xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">View Reports</h3>
                  <p className="text-sm text-gray-500">View registration analytics</p>
                </div>
              </div>
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
}
