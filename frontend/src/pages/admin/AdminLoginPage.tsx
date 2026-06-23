import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, message } from 'antd';
import { MailOutlined, LockOutlined, CalendarOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await adminApi.login(values.email, values.password);
      if (response.success && response.data) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminEmail', response.data.email);
        message.success('Login successful');
        navigate('/admin');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarOutlined className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Event Registration System</h1>
          <p className="text-gray-500 mt-1">Admin Portal</p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ email: 'admin@erm.com', password: '12345678' }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              size="large"
              placeholder="admin@erm.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="rounded-lg"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500">
          <p>Demo credentials pre-filled</p>
        </div>
      </div>
    </div>
  );
}
