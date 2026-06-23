import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Spin, Empty, Tag, Button, Input, Row, Col } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { eventApi } from '../services/api';
import type { IEventWithRegistrationCount } from '../types/event';
import dayjs from 'dayjs';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<IEventWithRegistrationCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    loadEvents();
  }, [searchParams]);

  async function loadEvents() {
    try {
      setLoading(true);
      const params: { search?: string; upcoming?: boolean } = {};
      const searchQuery = searchParams.get('search');
      if (searchQuery) params.search = searchQuery;
      params.upcoming = true;

      const response = await eventApi.getEvents({ ...params, limit: 20 });
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchParams({ search: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  const isEventOpen = (event: IEventWithRegistrationCount) => {
    const deadline = dayjs(event.registrationDeadline);
    const now = dayjs();
    return deadline.isAfter(now) && (event.registrationCount || 0) < event.capacity;
  };

  return (
    <div>
      {/* Hero Section - Meetup.com inspired */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Discover events
              <br />
              <span className="text-primary-200">that inspire you</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
              Find and register for events in your community. Connect with people who share your interests.
            </p>
            <div className="flex gap-3">
              <Input.Search
                placeholder="Search events by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={handleSearch}
                enterButton={
                  <Button type="primary" className="bg-white text-primary-700 hover:bg-gray-100 border-none font-medium">
                    <SearchOutlined /> Search
                  </Button>
                }
                size="large"
                className="max-w-lg"
                style={{ borderRadius: 999 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories / Stats - Meetup.com style */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Row gutter={[24, 16]} justify="center">
            <Col xs={12} md={6}>
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarOutlined className="text-orange-600 text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Upcoming Events</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TeamOutlined className="text-green-600 text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Community</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <EnvironmentOutlined className="text-blue-600 text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Locations</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClockCircleOutlined className="text-purple-600 text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Any Time</p>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Events List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {searchParams.get('search')
                ? `Events matching "${searchParams.get('search')}"`
                : 'Upcoming events'}
            </h2>
            <p className="text-gray-500 mt-1">
              {events.length > 0
                ? `${events.length} event${events.length > 1 ? 's' : ''} found`
                : 'Discover events near you'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Empty
              description={
                <span className="text-gray-500">
                  {searchParams.get('search')
                    ? 'No events found matching your search'
                    : 'No upcoming events available'}
                </span>
              }
            />
            {searchParams.get('search') && (
              <Button
                type="primary"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setSearchParams({});
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {events.map((event) => {
              const open = isEventOpen(event);
              return (
                <Col xs={24} sm={12} lg={8} key={event.id}>
                  <Link to={`/event/${event.id}`}>
                    <Card
                      hoverable
                      className="h-full rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
                      bodyStyle={{ padding: 0 }}
                    >
                      {/* Card Header with gradient */}
                      <div className="h-32 bg-gradient-to-br from-primary-500 to-indigo-700 p-6 flex items-end">
                        <div>
                          <p className="text-primary-100 text-sm font-medium">
                            {dayjs(event.dateTime).format('ddd, MMM D')}
                          </p>
                          <h3 className="text-white font-bold text-lg leading-tight mt-1">
                            {event.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <ClockCircleOutlined className="text-gray-400" />
                          <span className="text-sm">
                            {dayjs(event.dateTime).format('h:mm A')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <EnvironmentOutlined className="text-gray-400" />
                          <span className="text-sm truncate">{event.address}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <TeamOutlined className="text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {event.registrationCount || 0}/{event.capacity}
                            </span>
                          </div>
                          {open ? (
                            <Tag color="green" className="rounded-full px-3">Open</Tag>
                          ) : (
                            <Tag color="red" className="rounded-full px-3">Closed</Tag>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </Col>
              );
            })}
          </Row>
        )}
      </section>

      {/* CTA Section */}
      {!searchParams.get('search') && (
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Want to create your own events?
            </h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto">
              Our admin portal lets you create, manage, and track events with detailed registration reports.
            </p>
            <a
              href="http://localhost:3001/admin/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition"
            >
              <CalendarOutlined /> Admin Portal
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
