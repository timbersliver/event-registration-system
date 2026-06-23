import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';

const navItems = [
  { path: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { path: '/admin/event', icon: <CalendarOutlined />, label: 'Events' },
  { path: '/admin/report', icon: <FileTextOutlined />, label: 'Reports' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const adminEmail = localStorage.getItem('adminEmail');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-indigo-900 text-white flex flex-col transition-all duration-200 fixed h-full z-30`}
      >
        <div className="flex items-center gap-0 py-6 px-3 border-b border-indigo-800">
          <Button
            onClick={() => setCollapsed(!collapsed)}
            type='text'
          >
            <MenuOutlined className='text-white' />
          </Button>
          {!collapsed && (
            <div>
              <div className="font-bold text-lg">ERS</div>
              <div className="text-xs text-indigo-300">Event Registration</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              {item.icon}
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          {!collapsed && (
            <div className="flex items-center gap-3 text-sm text-indigo-300 mb-3">
              <UserOutlined />
              <span className="truncate">{adminEmail}</span>
            </div>
          )}
          <Button
            onClick={handleLogout}
            color="danger" 
            variant="solid"
            className='w-full'
          >
            <LogoutOutlined />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${collapsed ? 'ml-16' : 'ml-64'} flex-1 transition-all duration-200`}>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
