import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Descriptions, Row, Col, Card, Statistic, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IEventReport } from '../../types/api';
import dayjs from 'dayjs';

export default function AdminEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [report, setReport] = useState<IEventReport | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    if (eventId) loadEventDetail();
  }, [eventId]);

  async function loadEventDetail() {
    try {
      setLoading(true);
      const response = await adminApi.getEventReport(token, parseInt(eventId!));
      if (response.success && response.data) {
        setReport(response.data);
      }
    } catch (err) {
      console.error('Failed to load event report', err);
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

  if (!report) {
    return <div className="text-center py-20 text-gray-500">Event not found</div>;
  }

  const event = report.event;

  return (
    <div>
      <Link
        to="/admin/event"
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        <ArrowLeftOutlined /> Back to Events
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{event.name}</h1>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Event Details" className="rounded-xl shadow-sm">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Description">
                {event.description || 'No description'}
              </Descriptions.Item>
              <Descriptions.Item label="Date & Time">
                {dayjs(event.dateTime).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Address">{event.address}</Descriptions.Item>
              <Descriptions.Item label="Registration Deadline">
                {dayjs(event.registrationDeadline).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Handler">{event.handler}</Descriptions.Item>
              <Descriptions.Item label="Capacity">{event.capacity}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Registration Statistics" className="rounded-xl shadow-sm">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card className="bg-indigo-50 rounded-xl">
                  <Statistic
                    title="Total Registrations"
                    value={report.totalRegistrations}
                    valueStyle={{ color: '#4f46e5' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card className="bg-green-50 rounded-xl">
                  <Statistic
                    title="Verified"
                    value={report.verifiedRegistrations}
                    valueStyle={{ color: '#16a34a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card className="bg-orange-50 rounded-xl">
                  <Statistic
                    title="Pending"
                    value={report.pendingRegistrations}
                    valueStyle={{ color: '#ea580c' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card className="bg-blue-50 rounded-xl">
                  <Statistic
                    title="Capacity Used"
                    value={`${report.capacityUtilization}%`}
                    valueStyle={{ color: '#2563eb' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
