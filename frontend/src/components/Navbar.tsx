import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from 'antd';
import { SearchOutlined, CalendarOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';

export default function Navbar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/?search=${encodeURIComponent(value.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <CalendarOutlined className="text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              EventHub
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <Input.Search
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="rounded-full"
              size="large"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium text-sm hidden md:block">
              <TeamOutlined className="mr-1" />
              Events
            </Link>
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium text-sm hidden md:block">
              <UserOutlined className="mr-1" />
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
