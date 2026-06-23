import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Spin,
  Button,
  Modal,
  Input,
  Steps,
  Result,
  Tag,
  Progress,
  message,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  MailOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { eventApi, registrationApi } from '../services/api';
import type { IEventWithRegistrationCount } from '../types/event';
import dayjs from 'dayjs';

function generateIcsContent(event: IEventWithRegistrationCount): string {
  const dtStart = new Date(event.dateTime);
  const dtEnd = new Date(dtStart.getTime() + 2 * 60 * 60 * 1000);

  const formatICSDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escape = (str: string): string =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventHub//Event Registration System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.name.replace(/[^a-zA-Z0-9]/g, '-')}-${formatICSDate(dtStart)}@event-registration.com`,
    `DTSTART:${formatICSDate(dtStart)}`,
    `DTEND:${formatICSDate(dtEnd)}`,
    `SUMMARY:${escape(event.name)}`,
    `DESCRIPTION:${escape(event.description || '')}`,
    `LOCATION:${escape(event.address)}`,
    `ORGANIZER;CN=${escape(event.handler)}:mailto:noreply@event-registration.com`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function downloadIcs(event: IEventWithRegistrationCount): void {
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<IEventWithRegistrationCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  async function loadEvent() {
    try {
      setLoading(true);
      const response = await eventApi.getEvent(parseInt(eventId!));
      if (response.success && response.data) {
        setEvent(response.data);
      }
    } catch (err) {
      console.error('Failed to load event', err);
    } finally {
      setLoading(false);
    }
  }

  const isOpen = event
    ? dayjs(event.registrationDeadline).isAfter(dayjs(new Date())) &&
      (event.registrationCount || 0) < event.capacity
    : false;

  const handleSendCode = async () => {
    if (!email || !event) return;
    try {
      setSendingCode(true);
      const response = await registrationApi.sendVerificationCode(event.id, email);
      if (response.success) {
        setCodeSent(true);
        setCurrentStep(1);
        if (response.data?.previewUrl) {
          setPreviewUrl(response.data.previewUrl);
          message.info('📧 Since this is dev mode, check the Mailpit preview link below!');
        } else {
          message.success('Verification code sent! Check your email.');
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send verification code';
      message.error(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!code || !event) return;
    try {
      setVerifying(true);
      const response = await registrationApi.verifyAndRegister(event.id, email, code);
      if (response.success) {
        setCurrentStep(2);
        setRegistered(true);
        loadEvent(); // Refresh event data
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Verification failed';
      message.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const resetRegistration = () => {
    setCurrentStep(0);
    setEmail('');
    setCode('');
    setCodeSent(false);
    setRegistered(false);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Link to="/">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const capacityPercent = event.capacity > 0
    ? Math.round(((event.registrationCount || 0) / event.capacity) * 100)
    : 0;

  return (
    <div>
      {/* Back navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2">
            <ArrowLeftOutlined /> Back to events
          </Link>
        </div>
      </div>

      {/* Event Header - Meetup.com inspired */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Tag color={isOpen ? 'green' : 'red'} className="rounded-full px-3 text-sm border-none">
                  {isOpen ? 'Open for Registration' : 'Registration Closed'}
                </Tag>
                <span className="text-primary-200 text-sm">
                  {dayjs(event.dateTime).format('dddd, MMMM D, YYYY')}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                {event.name}
              </h1>
            </div>
            <div className="flex-shrink-0">
              {isOpen ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setRegisterOpen(true)}
                  className="bg-white text-primary-700 hover:bg-gray-100 border-none font-semibold h-12 px-8 rounded-full shadow-lg"
                >
                  Register Now
                </Button>
              ) : (
                <Button
                  size="large"
                  disabled
                  className="h-12 px-8 rounded-full"
                >
                  Registration Closed
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this event</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* Event Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-50 p-3 rounded-lg">
                    <CalendarOutlined className="text-primary-600 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-800">
                      {dayjs(event.dateTime).format('dddd, MMMM D, YYYY')}
                    </p>
                    <p className="text-gray-600">
                      {dayjs(event.dateTime).format('h:mm A')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <EnvironmentOutlined className="text-green-600 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">{event.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <ClockCircleOutlined className="text-orange-600 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Deadline</p>
                    <p className="font-medium text-gray-800">
                      {dayjs(event.registrationDeadline).format('MMM D, YYYY h:mm A')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <UserOutlined className="text-purple-600 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organizer</p>
                    <p className="font-medium text-gray-800">{event.handler}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Registration</h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary-600">
                  {event.registrationCount || 0}
                </div>
                <p className="text-gray-500 text-sm">Registered</p>
              </div>
              <Progress
                percent={capacityPercent}
                showInfo={false}
                strokeColor={capacityPercent >= 90 ? '#ef4444' : capacityPercent >= 70 ? '#f59e0b' : '#4f46e5'}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{event.registrationCount || 0} registered</span>
                <span>{event.capacity} capacity</span>
              </div>
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-primary-600 text-lg" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{event.handler}</p>
                  <p className="text-sm text-gray-500">Event Handler</p>
                </div>
              </div>
            </div>

            {/* Register CTA */}
            {isOpen && (
              <div className="bg-gradient-to-br from-primary-500 to-indigo-700 rounded-2xl shadow-lg p-6 text-white text-center">
                <h3 className="font-bold text-lg mb-2">Interested?</h3>
                <p className="text-primary-100 text-sm mb-4">
                  Register now to secure your spot!
                </p>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => setRegisterOpen(true)}
                  className="bg-white text-primary-700 hover:bg-gray-100 border-none font-semibold rounded-full"
                >
                  Register Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        title={null}
        open={registerOpen}
        onCancel={() => {
          setRegisterOpen(false);
          if (currentStep === 2) {
            resetRegistration();
          }
        }}
        afterClose={() => {
          // Reset form when modal finishes closing animation (covers steps 0 & 1)
          if (currentStep !== 2) {
            resetRegistration();
          }
        }}
        footer={null}
        width={480}
        centered
        closable={currentStep === 2}
      >
        {registered ? (
          <Result
            status="success"
            title="Registration Successful!"
            subTitle={`You have successfully registered for ${event.name}. A confirmation email with iCal attachment has been sent to ${email}.`}
            extra={[
              <Button
                key="ics"
                icon={<DownloadOutlined />}
                onClick={() => downloadIcs(event)}
                className="rounded-full"
              >
                Add to Calendar (.ics)
              </Button>,
              <Button
                type="primary"
                key="close"
                onClick={() => {
                  setRegisterOpen(false);
                  resetRegistration();
                }}
                className="rounded-full"
              >
                Done
              </Button>,
            ]}
          />
        ) : (
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <MailOutlined className="text-primary-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Register for Event</h3>
              <p className="text-gray-500 text-sm mt-1">
                Enter your email to receive a verification code
              </p>
            </div>

            <Steps
              current={currentStep}
              className="mb-8"
              items={[
                { title: 'Email', icon: <MailOutlined /> },
                { title: 'Verify', icon: <CheckCircleOutlined /> },
                { title: 'Done', icon: <CheckCircleOutlined /> },
              ]}
            />

            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Email Address</p>
                  <Input
                    size="large"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    prefix={<MailOutlined className="text-gray-400" />}
                  />
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleSendCode}
                  loading={sendingCode}
                  disabled={!email}
                  className="rounded-lg"
                >
                  Send Verification Code
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                  <Input
                    size="large"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    style={{ fontSize: 24, letterSpacing: 8 }}
                  />
                </div>
                {previewUrl && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-1">
                      📧 Dev mode: Email sent via Mailpit
                    </p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      View email preview
                    </a>
                  </div>
                )}
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleVerify}
                  loading={verifying}
                  disabled={code.length !== 6}
                  className="rounded-lg"
                >
                  Verify & Register
                </Button>
                <Button
                  type="link"
                  block
                  onClick={handleSendCode}
                  loading={sendingCode}
                  className="text-gray-500"
                >
                  Resend code
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
