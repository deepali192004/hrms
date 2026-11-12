import { useMemo, useState, useEffect, useCallback } from 'react';
import { apiRequest, getApiList } from '../services/api.js';
import { getSession } from '../services/auth.js';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileBarChart,
  LayoutDashboard,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { WorkspaceShell } from '../components/WorkspaceShell.jsx';
import './HodDashboard.css';

const facultyAttendance = [
  { id: 'eng-001', name: 'Dr. Meera Kapoor', title: 'Associate Professor', status: 'Present', checkIn: '08:42 AM', lateMinutes: 0 },
  { id: 'eng-002', name: 'Prof. Arjun Mehta', title: 'Assistant Professor', status: 'Present', checkIn: '08:57 AM', lateMinutes: 0 },
  { id: 'eng-003', name: 'Dr. Nandita Sen', title: 'Assistant Professor', status: 'Late', checkIn: '09:18 AM', lateMinutes: 18 },
  { id: 'eng-004', name: 'Prof. Rohan Iyer', title: 'Associate Professor', status: 'Present', checkIn: '08:49 AM', lateMinutes: 0 },
  { id: 'eng-005', name: 'Ms. Isha Bhat', title: 'Visiting Faculty', status: 'On leave', checkIn: 'â€”', lateMinutes: 0 },
  { id: 'eng-006', name: 'Dr. Kavya Menon', title: 'Professor', status: 'Late', checkIn: '09:31 AM', lateMinutes: 31 },
];

const initialLeaveRequests = [
  { id: 'leave-001', name: 'Dr. Nandita Sen', dates: '24â€“25 Oct 2026', type: 'Casual leave', reason: 'Family commitment', status: 'Pending' },
  { id: 'leave-002', name: 'Prof. Rohan Iyer', dates: '28 Oct 2026', type: 'Duty leave', reason: 'Academic conference', status: 'Pending' },
  { id: 'leave-003', name: 'Ms. Isha Bhat', dates: '02â€“04 Nov 2026', type: 'Earned leave', reason: 'Personal travel', status: 'Pending' },
];

const weeklyDepartmentReport = [
  { day: 'Wednesday', checkIns: 5, late: 1, onLeave: 1 },
  { day: 'Thursday', checkIns: 4, late: 0, onLeave: 2 },
  { day: 'Friday', checkIns: 4, late: 1, onLeave: 1 },
  { day: 'Saturday', checkIns: 5, late: 1, onLeave: 1 },
  { day: 'Sunday', off: true, checkIns: 0, late: 0, onLeave: 0 },
  { day: 'Monday', checkIns: 5, late: 2, onLeave: 1 },
];

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'attendance', label: 'Attendance', icon: Clock3 },
  { key: 'leave', label: 'Leave approvals', icon: ClipboardCheck },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
];

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function DemoBadge() {
  return <span className="sample-pill">DEMO DATA</span>;
}

function SummaryCard({ icon: Icon, label, value, detail, tone = 'lavender' }) {
  return (
    <article className={`stat-card hod-summary-card hod-summary-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-icon"><Icon size={18} /></span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="hod-summary-value">{value}</div>
      <p className="stat-subline">{detail}</p>
    </article>
  );
}

function EmptyState({ children }) {
  return <div className="hod-empty-state">{children}</div>;
}

export function HodDashboardPage({ isPreview = false, session = null }) {
  const displayName = session?.name || 'Dr. Kavita Rao';
  const [activeKey, setActiveKey] = useState('overview');
 
const [leaveRequests, setLeaveRequests] = useState(() => isPreview ? initialLeaveRequests : []);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveActionId, setLeaveActionId] = useState(null);

  const [reportFeedback, setReportFeedback] = useState('');
  const [reportRuns, setReportRuns] = useState(0);

  const metrics = useMemo(() => {
    const present = facultyAttendance.filter((person) => person.status === 'Present').length;
    const late = facultyAttendance.filter((person) => person.status === 'Late').length;
    const onLeave = facultyAttendance.filter((person) => person.status === 'On leave').length;
    return { present, late, onLeave, total: facultyAttendance.length };
  }, []);

  const lateArrivals = facultyAttendance.filter((person) => person.lateMinutes > 0);
  const pendingCount = leaveRequests.filter((request) => request.status === 'Pending').length;
  const approvedCount = leaveRequests.filter((request) => request.status.startsWith('Approved')).length;
  const rejectedCount = leaveRequests.filter((request) => request.status.startsWith('Rejected')).length;

  
const loadPendingLeaves = useCallback(async () => {
    if (isPreview) return;
    const activeSession = session || getSession();
    if (!activeSession?.token) {
      setLeaveError('Please sign in again to view department leave requests.');
      return;
    }

    setLeaveLoading(true);
    setLeaveError('');
    try {
      const result = await apiRequest('/api/leaves/pending', {
        requiresAuth: true,
        token: activeSession.token,
      });
      const rows = getApiList(result, ['leaves']);
      if (!Array.isArray(rows)) throw new Error('Unexpected pending-leaves response.');

      setLeaveRequests(rows.map((row) => ({
        id: row.leave_id,
        name: row.faculty_name || row.name || 'Faculty member',
        dates: `${String(row.start_date || '').slice(0, 10)} – ${String(row.end_date || '').slice(0, 10)}`,
        type: row.leave_type || 'Leave',
        reason: row.reason || '',
        status: row.status || 'Pending',
        department: row.department_name || '',
      })));
    } catch (error) {
      setLeaveError(error.message || 'Unable to load pending leave requests.');
    } finally {
      setLeaveLoading(false);
    }
  }, [isPreview, session]);

  useEffect(() => {
    if (!isPreview) loadPendingLeaves();
  }, [isPreview, loadPendingLeaves]);

  async function resolveLeave(id, decision) {
    if (isPreview) {
      setLeaveRequests((requests) => requests.map((request) =>
        request.id === id && request.status === 'Pending'
          ? { ...request, status: decision === 'approve' ? 'Approved · demo' : 'Rejected · demo' }
          : request
      ));
      return;
    }

    const activeSession = session || getSession();
    if (!activeSession?.token) {
      setLeaveError('Please sign in again before reviewing a leave request.');
      return;
    }

    setLeaveActionId(id);
    setLeaveError('');
    try {
      await apiRequest(`/api/leaves/${id}/review`, {
        method: 'PATCH',
        requiresAuth: true,
        token: activeSession.token,
        body: { status: decision === 'approve' ? 'Approved' : 'Rejected' },
      });
      await loadPendingLeaves();
    } catch (error) {
      setLeaveError(error.message || 'Unable to update this leave request.');
    } finally {
      setLeaveActionId(null);
    }
  }


  function renderOverview() {
    return (
      <>
        <section className="hod-summary-grid" aria-label="English department summary">
          <SummaryCard icon={Users} label="FACULTY IN ENGLISH" value={metrics.total} detail="Demo faculty records in this department" tone="lavender" />
          <SummaryCard icon={CheckCircle2} label="PRESENT TODAY" value={`${metrics.present}/${metrics.total}`} detail="Demo check-ins recorded by 09:45 AM" tone="sage" />
          <SummaryCard icon={Clock3} label="LATE ARRIVALS" value={metrics.late} detail="Demo arrivals after the 09:00 AM start" tone="sand" />
          <SummaryCard icon={ClipboardCheck} label="LEAVE TO REVIEW" value={pendingCount} detail="Demo requests awaiting your decision" tone="blue" />
        </section>

        <div className="hod-overview-grid">
          <section className="content-card hod-panel" aria-labelledby="hod-pulse-title">
            <div className="card-heading">
              <div>
                <span className="section-kicker">DEPARTMENT PULSE</span>
                <h2 id="hod-pulse-title">English at a glance</h2>
              </div>
              <span className="hod-soft-label">Today Â· demo</span>
            </div>
            <div className="hod-pulse-list">
              <div className="hod-pulse-row"><span className="hod-pulse-marker hod-marker-sage" /><div><strong>Attendance is being monitored</strong><small>{metrics.present} faculty marked present in the demo register.</small></div><span className="hod-pulse-value">{Math.round((metrics.present / metrics.total) * 100)}%</span></div>
              <div className="hod-pulse-row"><span className="hod-pulse-marker hod-marker-sand" /><div><strong>Late arrivals need a quick review</strong><small>{metrics.late} demo records are more than 15 minutes past start time.</small></div><span className="hod-pulse-value">{metrics.late}</span></div>
              <div className="hod-pulse-row"><span className="hod-pulse-marker hod-marker-lavender" /><div><strong>Leave queue is ready</strong><small>{pendingCount} demo request{pendingCount === 1 ? '' : 's'} still need{pendingCount === 1 ? 's' : ''} a decision.</small></div><span className="hod-pulse-value">{pendingCount}</span></div>
            </div>
          </section>

          <section className="content-card hod-panel hod-note-panel" aria-labelledby="hod-scope-title">
            <div className="hod-note-icon"><ShieldAlert size={18} /></div>
            <span className="section-kicker">PROTOTYPE SCOPE</span>
            <h2 id="hod-scope-title">A calm review surface, not a live HRMS.</h2>
            <p>These English department records are illustrative demo data. Attendance, late minutes, and leave decisions stay in local React state and are not sent to an HOD API or written to live records.</p>
            <button className="hod-link-button" type="button" onClick={() => setActiveKey('attendance')}>Review attendance <span aria-hidden="true">â†’</span></button>
          </section>
        </div>
      </>
    );
  }

  function renderAttendance() {
    return (
      <>
        <section className="hod-section-intro">
          <div>
            <span className="section-kicker">ENGLISH DEPARTMENT <DemoBadge /></span>
            <h2>Faculty attendance monitoring</h2>
            <p>One readable register for the English department. Every value below is labelled as demo data and reflects no live attendance system.</p>
          </div>
          <div className="hod-intro-meta"><CalendarDays size={15} /><span>Today Â· demo date</span></div>
        </section>

        <section className="content-card hod-table-card" aria-labelledby="attendance-table-title">
          <div className="card-heading">
            <div><span className="section-kicker">ATTENDANCE REGISTER</span><h2 id="attendance-table-title">Faculty check-ins</h2></div>
            <span className="hod-table-count">{facultyAttendance.length} demo records</span>
          </div>
          <div className="hod-table-wrap">
            <table className="hod-table">
              <caption className="sr-only">Demo attendance records for English department faculty</caption>
              <thead><tr><th scope="col">Faculty</th><th scope="col">Status Â· demo</th><th scope="col">Check-in Â· demo</th><th scope="col">Late minutes Â· demo</th></tr></thead>
              <tbody>{facultyAttendance.map((person) => <tr key={person.id}><td><div className="hod-person"><span className="hod-person-avatar">{person.name.split(' ').filter(Boolean).slice(1, 3).map((part) => part[0]).join('').toUpperCase()}</span><span><strong>{person.name}</strong><small>{person.title} Â· English</small></span></div></td><td><span className={`hod-status hod-status-${statusClass(person.status)}`}><i />{person.status}</span></td><td className="hod-time">{person.checkIn}</td><td className={person.lateMinutes > 0 ? 'hod-late-minutes' : 'hod-muted-value'}>{person.lateMinutes > 0 ? `${person.lateMinutes} min` : 'â€”'}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="hod-table-footnote"><CheckCircle2 size={14} /> Check-in times are illustrative placeholders for the English department prototype.</p>
        </section>

        <section className="content-card hod-table-card hod-late-card" aria-labelledby="late-arrivals-title">
          <div className="card-heading"><div><span className="section-kicker">FOLLOW-UP LIST</span><h2 id="late-arrivals-title">Late arrivals</h2></div><span className="hod-alert-count">{lateArrivals.length} demo flags</span></div>
          {lateArrivals.length ? <div className="hod-table-wrap"><table className="hod-table hod-late-table"><caption className="sr-only">Demo late arrival list for English department faculty</caption><thead><tr><th scope="col">Faculty</th><th scope="col">Arrived Â· demo</th><th scope="col">Late by Â· demo</th><th scope="col">Review</th></tr></thead><tbody>{lateArrivals.map((person) => <tr key={person.id}><td><div className="hod-person"><span className="hod-person-avatar hod-avatar-warm">{person.name.split(' ').filter(Boolean).slice(1, 3).map((part) => part[0]).join('').toUpperCase()}</span><span><strong>{person.name}</strong><small>{person.title} Â· English</small></span></div></td><td className="hod-time">{person.checkIn}</td><td className="hod-late-minutes">{person.lateMinutes} minutes</td><td><span className="hod-review-label">Demo review</span></td></tr>)}</tbody></table></div> : <EmptyState>No late arrivals in the demo register.</EmptyState>}
          <p className="hod-helper-copy">Late flags are for review only; they do not trigger notifications, payroll changes, or live attendance updates.</p>
        </section>
      </>
    );
  }

  function renderLeave() {
    return (
      <>
        <section className="hod-section-intro">
          <div>
            <span className="section-kicker">ENGLISH DEPARTMENT <DemoBadge /></span>
            <h2>Leave approvals</h2>
            <p>Review illustrative requests from one department. Decisions are intentionally local to this prototype.</p>
          </div>
          <div className="hod-intro-meta"><ClipboardCheck size={15} /><span>{pendingCount} pending Â· demo</span></div>
        </section>

        <section className="content-card hod-table-card" aria-labelledby="leave-table-title">
          <div className="card-heading"><div><span className="section-kicker">REQUEST QUEUE</span><h2 id="leave-table-title">Pending leave requests</h2></div><span className="hod-table-count">{leaveRequests.length} pending requests</span></div>
          <div className="hod-table-wrap"><table className="hod-table hod-leave-table"><caption className="sr-only">Pending leave requests for your department</caption><thead><tr><th scope="col">Faculty</th><th scope="col">Dates Â· demo</th><th scope="col">Type & reason</th><th scope="col">Status</th><th scope="col">Decision</th></tr></thead><tbody>{leaveLoading ? <tr><td colSpan={5}>Loading pending leave requests...</td></tr> : leaveError ? <tr><td colSpan={5} role="alert">{leaveError} <button type="button" onClick={loadPendingLeaves}>Retry</button></td></tr> : leaveRequests.length === 0 ? <tr><td colSpan={5}>No pending leave requests.</td></tr> : leaveRequests.map((request) => { const resolved = request.status !== 'Pending'; return <tr key={request.id}><td><div className="hod-person"><span className="hod-person-avatar hod-avatar-blue">{request.name.split(' ').filter(Boolean).slice(1, 3).map((part) => part[0]).join('').toUpperCase()}</span><span><strong>{request.name}</strong><small>Faculty Â· English</small></span></div></td><td className="hod-time">{request.dates}</td><td><strong className="hod-leave-type">{request.type}</strong><small className="hod-reason">{request.reason} Â· demo</small></td><td><span className={`hod-request-status ${resolved ? 'hod-request-resolved' : 'hod-request-pending'}`}>{request.status}</span></td><td><div className="hod-decision-buttons"><button className="hod-decision hod-approve" type="button" disabled={resolved || leaveActionId === request.id} onClick={() => resolveLeave(request.id, 'approve')}><Check size={13} />Approve</button><button className="hod-decision hod-reject" type="button" disabled={resolved || leaveActionId === request.id} onClick={() => resolveLeave(request.id, 'reject')}><X size={13} />Reject</button></div></td></tr>; })}</tbody></table></div>
          <div className="hod-action-note"><ShieldAlert size={15} /><p><strong>Leave approvals.</strong> Decisions are saved to the HRMS backend.</p></div>
        </section>
      </>
    );
  }

  function renderReports() {
    const workingDays = weeklyDepartmentReport.filter((day) => !day.off);
    const totalCheckIns = workingDays.reduce((total, day) => total + day.checkIns, 0);
    const totalLate = workingDays.reduce((total, day) => total + day.late, 0);

    return (
      <>
        <section className="hod-section-intro">
          <div>
            <span className="section-kicker">ENGLISH DEPARTMENT <DemoBadge /></span>
            <h2>Department reports</h2>
            <p>Attendance and leave snapshots for the Wednesday-to-Monday academic week. Every figure is illustrative demo data.</p>
          </div>
          <button className="hod-report-button" type="button" onClick={() => { setReportRuns((count) => count + 1); setReportFeedback('Department report preview prepared locally. No records were queried or exported.'); }}><Download size={14} /> Generate report Â· PROTOTYPE</button>
        </section>

        {reportFeedback && <div className="hod-report-feedback" role="status"><CheckCircle2 size={14} />{reportFeedback}</div>}

        <section className="hod-summary-grid hod-report-summary-grid" aria-label="Department report totals Â· demo">
          <SummaryCard icon={CheckCircle2} label="WEEKLY CHECK-INS Â· DEMO" value={`${totalCheckIns}/${workingDays.length * metrics.total}`} detail="Illustrative faculty check-ins across five working days" tone="sage" />
          <SummaryCard icon={Clock3} label="LATE ARRIVALS Â· DEMO" value={totalLate} detail="Demo late flags across the working week" tone="sand" />
          <SummaryCard icon={ClipboardCheck} label="LEAVE REQUESTS Â· DEMO" value={leaveRequests.length} detail={`${pendingCount} pending Â· ${approvedCount} approved Â· ${rejectedCount} rejected`} tone="blue" />
        </section>

        <div className="hod-report-layout">
          <section className="content-card hod-table-card" aria-labelledby="hod-weekly-report-title">
            <div className="card-heading"><div><span className="section-kicker">ATTENDANCE REPORT Â· DEMO</span><h2 id="hod-weekly-report-title">Weekly department attendance</h2></div><span className="hod-table-count">Wedâ€“Mon Â· DEMO</span></div>
            <div className="hod-table-wrap"><table className="hod-table hod-report-table"><caption className="sr-only">Demo weekly English department attendance, Wednesday to Monday with Sunday off</caption><thead><tr><th scope="col">Academic day Â· demo</th><th scope="col">Check-ins Â· demo</th><th scope="col">Late Â· demo</th><th scope="col">On leave Â· demo</th><th scope="col">Attendance</th></tr></thead><tbody>{weeklyDepartmentReport.map((day) => <tr key={day.day}><td><strong>{day.day}</strong>{day.off && <span className="hod-report-off-label"> Â· WEEKLY OFF</span>}</td>{day.off ? <td colSpan="4" className="hod-muted-value">No scheduled attendance Â· demo</td> : <><td>{day.checkIns}/{metrics.total}</td><td className={day.late ? 'hod-late-minutes' : 'hod-muted-value'}>{day.late}</td><td>{day.onLeave}</td><td>{Math.round((day.checkIns / metrics.total) * 100)}% Â· DEMO</td></>}</tr>)}</tbody></table></div>
            <p className="hod-helper-copy">Check-in totals, late flags and leave counts are illustrative. Sunday is the weekly off.</p>
          </section>

          <section className="content-card hod-table-card hod-leave-report-card" aria-labelledby="hod-leave-report-title">
            <div className="card-heading"><div><span className="section-kicker">LEAVE REPORT Â· DEMO</span><h2 id="hod-leave-report-title">Request status</h2></div><span className="hod-table-count">LOCAL VIEW</span></div>
            <div className="hod-report-status-list">
              <div><span>Pending Â· DEMO</span><strong>{pendingCount}</strong></div>
              <div><span>Approved Â· DEMO</span><strong>{approvedCount}</strong></div>
              <div><span>Rejected Â· DEMO</span><strong>{rejectedCount}</strong></div>
              <div><span>Total requests Â· DEMO</span><strong>{leaveRequests.length}</strong></div>
            </div>
            <p className="hod-helper-copy">Counts reflect this preview sessionâ€™s local leave decisions only; nothing is saved or sent to an API.</p>
            <div className="hod-report-run"><span><CheckCircle2 size={14} /> Local preview runs: {reportRuns}</span><span className="hod-alert-count">NO EXPORT</span></div>
          </section>
        </div>
      </>
    );
  }

  return (
    <WorkspaceShell roleLabel="HOD WORKSPACE" displayName={displayName} subtitle="HOD Â· English" pageTitle={activeKey === 'overview' ? 'Overview' : activeKey === 'attendance' ? 'Attendance' : activeKey === 'leave' ? 'Leave approvals' : 'Reports'} navItems={navItems} activeKey={activeKey} onSelect={setActiveKey} notificationTo={undefined} isPreview={isPreview}>
      <div className="hod-page">
        <header className="page-heading-row hod-heading">
          <div>
            <div className="eyebrow eyebrow-indigo">HOD WORKSPACE <DemoBadge /></div>
            <h1>{activeKey === 'overview' ? 'Department overview' : activeKey === 'attendance' ? 'Attendance review' : activeKey === 'leave' ? 'Leave approvals' : 'Department reports'}<span className="heading-period">.</span></h1>
            <p className="page-date"><Users size={15} /> English department <span className="date-divider" /> Prototype workspace Â· demo only</p>
          </div>
          <div className="hod-department-chip"><span className="hod-chip-icon"><Users size={16} /></span><span><small>DEPARTMENT</small><strong>English Â· demo</strong></span></div>
        </header>

        <div className="hod-demo-callout" role="note"><ShieldAlert size={16} /><span><strong>Prototype, not connected to an HOD API.</strong> This page uses one English department's sample records. Actions are local demo interactions and do not change live HRMS data.</span></div>

        {activeKey === 'overview' && renderOverview()}
        {activeKey === 'attendance' && renderAttendance()}
        {activeKey === 'leave' && renderLeave()}
        {activeKey === 'reports' && renderReports()}
      </div>
    </WorkspaceShell>
  );
}


