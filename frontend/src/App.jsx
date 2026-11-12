import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from './pages/AdminDashboard.jsx';
import { FacultyDashboard } from './pages/Dashboard.jsx';
import { FacultyProfilePage, NotificationsPage } from './pages/FacultyServices.jsx';
import { HodDashboardPage } from './pages/HodDashboard.jsx';
import { LoginPage } from './pages/Login.jsx';
import { getSession } from './services/auth.js';

const ROLE_HOME = {
  faculty: '/faculty/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
};

function ProtectedRoleRoute({ role, Page }) {
  const session = getSession();
  if (!session?.token) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={ROLE_HOME[session.role] || '/login'} replace />;
  return <Page isPreview={false} session={session} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/faculty/dashboard" element={<ProtectedRoleRoute role="faculty" Page={FacultyDashboard} />} />
      <Route path="/faculty/timetable" element={<ProtectedRoleRoute role="faculty" Page={FacultyDashboard} />} />
      <Route path="/faculty/profile" element={<ProtectedRoleRoute role="faculty" Page={FacultyProfilePage} />} />
      <Route path="/faculty/notifications" element={<ProtectedRoleRoute role="faculty" Page={NotificationsPage} />} />
      <Route path="/hod/dashboard" element={<ProtectedRoleRoute role="hod" Page={HodDashboardPage} />} />
      <Route path="/admin/dashboard" element={<ProtectedRoleRoute role="admin" Page={AdminDashboardPage} />} />
      <Route path="/preview/faculty/dashboard" element={<FacultyDashboard isPreview />} />
      <Route path="/preview/faculty/timetable" element={<FacultyDashboard isPreview />} />
      <Route path="/preview/faculty/profile" element={<FacultyProfilePage isPreview />} />
      <Route path="/preview/faculty/notifications" element={<NotificationsPage isPreview />} />
      <Route path="/preview/hod/dashboard" element={<HodDashboardPage isPreview />} />
      <Route path="/preview/admin/dashboard" element={<AdminDashboardPage isPreview />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
