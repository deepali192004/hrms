import * as React from 'react';
import {
  Building2,
  Clock3,
  FileBarChart,
  Info,
  LayoutDashboard,
  MapPin,
  UserCog,
  Users,
} from 'lucide-react';
import { FeatureState } from '../components/FeatureState.jsx';
import { WorkspaceShell } from '../components/WorkspaceShell.jsx';
import './AdminDashboard.css';

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'faculty', label: 'Faculty', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'roles', label: 'User roles', icon: UserCog },
  { key: 'attendance', label: 'Attendance rules', icon: Clock3 },
  { key: 'geofence', label: 'Geofence settings', icon: MapPin },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
];

const sectionDetails = {
  overview: {
    kicker: 'ADMIN OVERVIEW',
    title: 'Workspace overview',
    description: 'Overview data is unavailable until an admin data source is connected.',
    stateTitle: 'Admin overview is not connected',
    stateMessage: 'No admin overview API is connected. This section does not contain records, metrics, or actions until a supported backend feature is available.',
  },
  faculty: {
    kicker: 'FACULTY MANAGEMENT',
    title: 'Faculty directory',
    description: 'Faculty directory data is unavailable until an admin data source is connected.',
    stateTitle: 'Faculty management is not connected',
    stateMessage: 'No faculty directory API is connected. Faculty records and management actions are not available in this workspace.',
  },
  departments: {
    kicker: 'DEPARTMENT MANAGEMENT',
    title: 'Academic departments',
    description: 'Department data is unavailable until an admin data source is connected.',
    stateTitle: 'Department management is not connected',
    stateMessage: 'No departments API is connected. Department records, faculty counts, and HOD assignments are not available in this workspace.',
  },
  roles: {
    kicker: 'USER ROLES',
    title: 'Access assignments',
    description: 'Role and access data is unavailable until an admin data source is connected.',
    stateTitle: 'User-role management is not connected',
    stateMessage: 'No roles or permissions API is connected. User assignments and access changes are not available in this workspace.',
  },
  attendance: {
    kicker: 'ATTENDANCE RULES',
    title: 'Attendance rules',
    description: 'Attendance configuration is unavailable until an admin data source is connected.',
    stateTitle: 'Attendance rules are not connected',
    stateMessage: 'No attendance-rules API is connected. Attendance settings cannot be viewed or changed in this workspace.',
  },
  geofence: {
    kicker: 'GEOFENCE SETTINGS',
    title: 'Geofence settings',
    description: 'Geofence configuration is unavailable until an admin data source is connected.',
    stateTitle: 'Geofence settings are not connected',
    stateMessage: 'No geofence-settings API is connected. Location boundaries and enforcement settings are not available in this workspace.',
  },
  reports: {
    kicker: 'REPORTS',
    title: 'Reports',
    description: 'Report data is unavailable until an admin data source is connected.',
    stateTitle: 'Reports are not connected',
    stateMessage: 'No reports API is connected. This section does not contain report metrics, exports, or generated files.',
  },
};

function SectionHeading({ kicker, title, description }) {
  return (
    <div className="page-heading-row admin-section-heading">
      <div>
        <div className="eyebrow eyebrow-indigo">{kicker}</div>
        <h1>{title}<span className="heading-period">.</span></h1>
        <p className="page-date"><Info size={15} /> {description}</p>
      </div>
      <span className="admin-status-chip"><span /> Not connected</span>
    </div>
  );
}

function UnavailableSection({ sectionKey }) {
  const details = sectionDetails[sectionKey] || sectionDetails.overview;

  return (
    <section className="admin-section" aria-labelledby={`${sectionKey}-title`}>
      <SectionHeading
        kicker={details.kicker}
        title={details.title}
        description={details.description}
      />
      <FeatureState
        state="unavailable"
        title={details.stateTitle}
        message={details.stateMessage}
      />
    </section>
  );
}

function AdminSection({ activeSection }) {
  return <UnavailableSection sectionKey={activeSection} />;
}

export function AdminDashboardPage({ isPreview = false, session = null }) {
  const [activeSection, setActiveSection] = React.useState('overview');
  const displayName = typeof session?.name === 'string' && session.name.trim()
    ? session.name
    : 'Admin preview';

  return (
    <WorkspaceShell
      roleLabel="ADMIN WORKSPACE"
      displayName={displayName}
      subtitle="Administrator"
      pageTitle="Admin dashboard"
      navItems={navItems}
      activeKey={activeSection}
      onSelect={setActiveSection}
      isPreview={isPreview}
    >
      <div className="admin-dashboard"><AdminSection activeSection={activeSection} /></div>
    </WorkspaceShell>
  );
}
