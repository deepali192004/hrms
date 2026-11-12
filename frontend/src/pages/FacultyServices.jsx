import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureState } from '../components/FeatureState.jsx';
import { WorkspaceShell } from '../components/WorkspaceShell.jsx';
import './FacultyServices.css';

function getFacultyPaths(isPreview) {
  const prefix = isPreview ? '/preview/faculty' : '/faculty';
  return {
    dashboard: `${prefix}/dashboard`,
    timetable: `${prefix}/timetable`,
    profile: `${prefix}/profile`,
    notifications: `${prefix}/notifications`,
  };
}

function getFacultyNav(paths) {
  return [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: paths.dashboard },
    { key: 'attendance', label: 'Attendance', icon: Clock3 },
    { key: 'timetable', label: 'Timetable', icon: CalendarDays, to: paths.timetable },
    { key: 'leave', label: 'Leave summary', icon: BookOpen },
    { key: 'profile', label: 'Profile', icon: UserRound, to: paths.profile },
    { key: 'notifications', label: 'Notifications', icon: Bell, to: paths.notifications },
  ];
}

function getDisplayName(session) {
  return typeof session?.name === 'string' && session.name.trim()
    ? session.name.trim()
    : 'Faculty Member';
}

function FacultyServiceShell({ children, pageTitle, activeKey, isPreview, session }) {
  const navigate = useNavigate();
  const paths = getFacultyPaths(isPreview);
  const displayName = getDisplayName(session);

  function handleSelect(key) {
    if (key === 'attendance') {
      navigate(`${paths.dashboard}#attendance`);
      return;
    }
    if (key === 'leave') {
      navigate(`${paths.dashboard}#leave`);
      return;
    }
    navigate(paths.dashboard);
  }

  return (
    <WorkspaceShell
      roleLabel="WORKSPACE"
      displayName={displayName}
      subtitle="Faculty workspace"
      pageTitle={pageTitle}
      navItems={getFacultyNav(paths)}
      activeKey={activeKey}
      onSelect={handleSelect}
      notificationTo={paths.notifications}
      isPreview={isPreview}
    >
      {children}
    </WorkspaceShell>
  );
}

export function FacultyProfilePage({ isPreview = false, session = null }) {
  return (
    <FacultyServiceShell pageTitle="Profile" activeKey="profile" isPreview={isPreview} session={session}>
      <section className="faculty-service-page" aria-labelledby="faculty-profile-title">
        <div className="page-heading-row faculty-service-heading">
          <div>
            <div className="eyebrow eyebrow-indigo">FACULTY PROFILE</div>
            <h1 id="faculty-profile-title">Your profile<span className="heading-period">.</span></h1>
            <p className="page-date"><UserRound size={15} aria-hidden="true" /> Faculty identity and account details <span className="date-divider" /> Not connected</p>
          </div>
        </div>

        <div className="faculty-profile-layout">
          <article className="content-card faculty-identity-card">
            <FeatureState
              state="unavailable"
              title="Profile unavailable"
              message="No verified profile API exists for this workspace, so no faculty identity or account record is displayed."
            />
          </article>

          <article className="content-card faculty-details-card">
            <FeatureState
              state="unavailable"
              title="Professional information unavailable"
              message="No verified profile API exists for this workspace, so professional fields are intentionally not shown."
            />
          </article>
        </div>
      </section>
    </FacultyServiceShell>
  );
}

export function NotificationsPage({ isPreview = false, session = null }) {
  return (
    <FacultyServiceShell pageTitle="Notifications" activeKey="notifications" isPreview={isPreview} session={session}>
      <section className="faculty-service-page" aria-labelledby="faculty-notifications-title">
        <div className="page-heading-row faculty-service-heading">
          <div>
            <div className="eyebrow eyebrow-indigo">FACULTY NOTIFICATIONS</div>
            <h1 id="faculty-notifications-title">Notifications<span className="heading-period">.</span></h1>
            <p className="page-date"><Bell size={15} aria-hidden="true" /> Updates from connected HRMS services <span className="date-divider" /> Not connected</p>
          </div>
        </div>

        <section className="content-card faculty-notifications-card" aria-label="Notifications unavailable">
          <FeatureState
            state="unavailable"
            title="Notifications unavailable"
            message="No verified notifications API exists for this workspace, so no notification records or read/unread state are shown."
          />
        </section>
      </section>
    </FacultyServiceShell>
  );
}
