import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Tag,
  message,
  Space,
  Popconfirm,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/api';
import type { IEventWithRegistrationCount } from '../../types/event';
import dayjs from 'dayjs';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<IEventWithRegistrationCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEventWithRegistrationCount | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await adminApi.getEvents(token);
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditingEvent(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = async (eventId: number) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    setEditingEvent(event);
    form.setFieldsValue({
      name: event.name,
      description: event.description,
      dateTime: dayjs(event.dateTime),
      address: event.address,
      registrationDeadline: dayjs(event.registrationDeadline),
      handler: event.handler,
      capacity: event.capacity,
    });
    setModalOpen(true);
  };

  const handleDelete = async (eventId: number) => {
    try {
      const res = await adminApi.deleteEvent(token, eventId);
      if (res.success) {
        message.success('Event deleted');
        loadEvents();
      }
    } catch {
      message.error('Failed to delete event');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        name: values.name,
        description: values.description,
        dateTime: values.dateTime.toISOString(),
        address: values.address,
        registrationDeadline: values.registrationDeadline.toISOString(),
        handler: values.handler,
        capacity: parseInt(values.capacity, 10),
      };

      if (editingEvent) {
        const res = await adminApi.updateEvent(token, editingEvent.id, payload);
        if (res.success) {
          message.success('Event updated');
        }
      } else {
        const res = await adminApi.createEvent(token, payload);
        if (res.success) {
          message.success('Event created');
        }
      }

      setModalOpen(false);
      loadEvents();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: IEventWithRegistrationCount) => (
        <a
          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
          onClick={() => navigate(`/admin/event/${record.id}`)}
        >
          {name}
        </a>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dateTime',
      render: (_: unknown, record: IEventWithRegistrationCount) =>
        dayjs(record.dateTime).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Handler',
      dataIndex: 'handler',
      key: 'handler',
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: unknown, record: IEventWithRegistrationCount) =>
        `${record.registrationCount || 0} / ${record.capacity}`,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: IEventWithRegistrationCount) => {
        const deadline = dayjs(record.registrationDeadline);
        const now = dayjs();
        const isOpen = deadline.isAfter(now) && (record.registrationCount || 0) < record.capacity;
        return (
          <Tag color={isOpen ? 'green' : 'red'} className="rounded-full px-3">
            {isOpen ? 'Open' : 'Closed'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: IEventWithRegistrationCount) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/event/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record.id)}
          />
          <Popconfirm
            title="Delete this event?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Events</h1>
          <p className="text-gray-500 mt-1">Create and manage your events</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          size="large"
          className="rounded-lg"
        >
          Create Event
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          dataSource={events}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="[&_.ant-table-thead_.ant-table-cell]:bg-gray-50"
        />
      </div>

      <Modal
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        width={560}
        okText={editingEvent ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Event Name"
            rules={[{ required: true, message: 'Please enter event name' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} size="large" />
          </Form.Item>

          <Form.Item
            name="dateTime"
            label="Date & Time"
            rules={[{ required: true, message: 'Please select date & time' }]}
          >
            <DatePicker showTime size="large" className="w-full" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="registrationDeadline"
            label="Registration Deadline"
            rules={[{ required: true, message: 'Please select deadline' }]}
          >
            <DatePicker showTime size="large" className="w-full" />
          </Form.Item>

          <Form.Item
            name="handler"
            label="Handler"
            rules={[{ required: true, message: 'Please enter handler name' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[
              { required: true, message: 'Please enter capacity' },
              { pattern: /^\d+$/, message: 'Only integer numbers are allowed' },
            ]}
          >
            <Input size="large" min={1} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
