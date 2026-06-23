import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminEventDetailPage from './pages/admin/AdminEventDetailPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminEventReportPage from './pages/admin/AdminEventReportPage';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:eventId" element={<EventDetailPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="/admin/event" element={<AdminEventsPage />} />
        <Route path="/admin/event/:eventId" element={<AdminEventDetailPage />} />
        <Route path="/admin/report" element={<AdminReportsPage />} />
        <Route path="/admin/report/event-report" element={<AdminEventReportPage />} />
      </Route>
    </Routes>
  );
}

export default App;
