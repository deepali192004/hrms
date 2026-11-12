import { useEffect, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronDown, Clock3, DoorOpen, LayoutDashboard, LogOut, Menu, MoreHorizontal,
  PanelLeftClose, PanelLeftOpen, Search, Sparkles, UserRound, X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../services/auth.js';
import { apiRequest, getApiList } from '../services/api.js';

const timetable = [];
const weeklyTimetable = [
  { day: 'Wednesday', label: 'WED', entries: [] },
  { day: 'Thursday', label: 'THU', entries: [] },
  { day: 'Friday', label: 'FRI', entries: [] },
  { day: 'Saturday', label: 'SAT', entries: [] },
  { day: 'Sunday', label: 'SUN', off: true, entries: [] },
  { day: 'Monday', label: 'MON', entries: [] },
];
const attendanceBars = [
  { day: 'W', value: 86 }, { day: 'T', value: 100 }, { day: 'F', value: 76 },
  { day: 'S', value: 0, off: true }, { day: 'S', value: 92 }, { day: 'M', value: 68 },
];

function getToday() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function formatClassTime(value) {
  if (!value) return '—';
  const parts = String(value).split(':');
  return `${parts[0] || '00'}:${parts[1] || '00'}`;
}

function WeeklyTimetablePage({ classes = [], loading = false, error = '', isPreview = false }) {
  const days = isPreview ? weeklyTimetable : ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'].map((day) => ({
    day,
    label: day.slice(0, 3).toUpperCase(),
    off: day === 'Tuesday',
    entries: day === 'Tuesday' ? [] : classes.filter((item) => String(item.class_day || '').toLowerCase() === day.toLowerCase()).map((item) => ({
      id: item.class_id,
      time: formatClassTime(item.start_time),
      end: formatClassTime(item.end_time),
      subject: item.subject_name || 'Scheduled class',
      detail: item.status || 'Scheduled',
      place: item.room_name || 'Room not specified',
    })),
  }));
  return (
    <section className="weekly-timetable-page" aria-labelledby="weekly-timetable-title">
      <div className="page-heading-row timetable-page-heading">
        <div>
          <div className="eyebrow eyebrow-indigo">FACULTY TIMETABLE</div>
          <h1 id="weekly-timetable-title">Weekly timetable<span className="heading-period">.</span></h1>
          <p className="page-date"><CalendarDays size={15} /> Wednesday to Monday <span className="date-divider" /> Tuesday · weekly off</p>
        </div>
      </div>
      {!isPreview && <div className="demo-modal-note timetable-demo-note"><CalendarDays size={14} /><span>Timetable entries are loaded from the faculty timetable service.</span></div>}
      {loading && <p role="status">Loading your timetableâ€¦</p>}
      {error && <p role="alert">Could not load timetable: {error}</p>}
      {!loading && !error && !isPreview && classes.length === 0 && <p>No classes are scheduled in the timetable returned by the server.</p>}
      <div className="weekly-grid weekly-grid-page">
        {days.map((day) => (
          <article className={`week-day ${day.off ? 'week-day-off' : ''}`} key={day.day}>
            <div className="week-day-heading"><span className="week-day-label">{day.label}</span><div><strong>{day.day}</strong><small>{day.off ? 'Weekly off' : isPreview ? 'Demo entries' : `${day.entries.length} class${day.entries.length === 1 ? '' : 'es'}`}</small></div></div>
            {day.off ? <div className="week-day-off-copy"><CalendarDays size={19} /><strong>Weekly off</strong><span>No classes scheduled</span></div> : <div className="week-day-entries">{day.entries.map((item) => <div className="week-entry" key={`${day.day}-${item.id || item.time}-${item.subject}`}><div className="week-entry-time"><strong>{item.time}</strong><span>{item.end}</span></div><div><strong>{item.subject}</strong><span>{item.detail}</span><small>{item.place}</small></div></div>)}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function FacultyDashboard({ isPreview = false, session = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isTimetablePage = location.pathname.endsWith('/timetable');
  const dashboardPath = isPreview ? '/preview/faculty/dashboard' : '/faculty/dashboard';
  const timetablePath = isPreview ? '/preview/faculty/timetable' : '/faculty/timetable';
  const profilePath = isPreview ? '/preview/faculty/profile' : '/faculty/profile';
  const notificationsPath = isPreview ? '/preview/faculty/notifications' : '/faculty/notifications';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  
const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
 
  
  const [classes, setClasses] = useState([]);
  const [verifiedClassIds, setVerifiedClassIds] = useState(() => new Set());
  const [checkingClassId, setCheckingClassId] = useState(null);
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState({});
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  useEffect(() => {
    if (isPreview) return undefined;

    const currentSession = session || getSession();

    if (!currentSession?.token) {
      setTimetableError('Your login session is missing. Please sign in again.');
      return undefined;
    }

    const controller = new AbortController();

    async function loadTimetable() {
      setTimetableLoading(true);
      setTimetableError('');

      try {
        const result = await apiRequest('/api/timetable/my', {
          requiresAuth: true,
          token: currentSession.token,
          signal: controller.signal,
        });

        const rows = getApiList(result, ['timetable', 'classes']);

        if (!Array.isArray(rows)) {
          throw new Error('Unexpected timetable response from server.');
        }

        setClasses(rows);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setTimetableError(error.message || 'Could not load timetable.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setTimetableLoading(false);
        }
      }
    }

    loadTimetable();

    return () => controller.abort();
  }, [isPreview, session?.token]);

  // Load today's verified classes from the database.
  useEffect(() => {
    if (isPreview) return undefined;

    const currentSession = session || getSession();
    if (!currentSession?.token) return undefined;

    const controller = new AbortController();

    async function loadTodayAttendance() {
      try {
        const result = await apiRequest('/api/attendance/today', {
          requiresAuth: true,
          token: currentSession.token,
          signal: controller.signal,
        });

        if (!Array.isArray(result?.verified_class_ids)) {
          throw new Error('Invalid attendance status response.');
        }

        setVerifiedClassIds(
          new Set(result.verified_class_ids.map((id) => String(id)))
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Could not load today's attendance:", error);
        }
      }
    }

    loadTodayAttendance();

    return () => controller.abort();
  }, [isPreview, session?.token]);


  const displayName = session?.name || 'Faculty Member';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'F';

  useEffect(() => {
    if (!activeModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setActiveModal(null);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  function scrollToSection(id) {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showNotice(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  function openLeaveModal() {
    setLeaveSubmitted(false);
    setActiveModal('leave');
  }

  function openTimetablePage() {
    setMobileOpen(false);
    navigate(timetablePath);
  }
  async function refreshLeaveHistory() {
    if (isPreview) {
      try {
        const savedRequests = JSON.parse(
          localStorage.getItem('hrms-demo-leave-requests') || '[]'
        );
        setLeaveHistory(
          savedRequests
            .filter((request) => request.name === (session?.name || 'Ananya Sharma'))
            .map((request) => ({
              id: request.id,
              type: request.type,
              dates: request.dates,
              reason: request.reason,
              status: request.status,
            }))
        );
      } catch {
        setLeaveHistory([]);
      }
      return;
    }

    const currentSession = session || getSession();
    if (!currentSession?.token) {
      setToast('Your session has expired. Please sign in again.');
      return;
    }

    setLeaveLoading(true);
    try {
      const result = await apiRequest('/api/leaves/my', {
        requiresAuth: true,
        token: currentSession.token,
      });
      const rows = getApiList(result, ['leaves']);
      if (!Array.isArray(rows)) {
        throw new Error('Unexpected leave history response from server.');
      }
      setLeaveHistory(rows.map((row) => ({
        id: row.leave_id,
        type: row.leave_type,
        dates: `${String(row.start_date || '').slice(0, 10)} – ${String(row.end_date || '').slice(0, 10)}`,
        reason: row.reason || '',
        status: row.status || 'Pending',
      })));
    } catch (error) {
      setToast(error.message || 'Could not load leave history.');
    } finally {
      setLeaveLoading(false);
    }
  }

  async function handleLeaveSubmit(event) {
    event.preventDefault();

    if (leaveForm.endDate < leaveForm.startDate) {
      setToast('End date cannot be earlier than start date.');
      return;
    }

    if (isPreview) {
      try {
        const savedRequests = JSON.parse(
          localStorage.getItem('hrms-demo-leave-requests') || '[]'
        );
        const newRequest = {
          id: `leave-${Date.now()}`,
          name: session?.name || 'Ananya Sharma',
          dates: `${leaveForm.startDate} – ${leaveForm.endDate}`,
          type: leaveForm.leaveType,
          reason: leaveForm.reason,
          status: 'Pending',
        };
        localStorage.setItem(
          'hrms-demo-leave-requests',
          JSON.stringify([...savedRequests, newRequest])
        );
        setLeaveSubmitted(true);
      } catch {
        setToast('Could not save the preview request. Please try again.');
      }
      return;
    }

    const currentSession = session || getSession();
    if (!currentSession?.token) {
      setToast('Your session has expired. Please sign in again.');
      return;
    }

    try {
      await apiRequest('/api/leaves', {
        method: 'POST',
        requiresAuth: true,
        token: currentSession.token,
        body: {
          leave_type: leaveForm.leaveType,
          start_date: leaveForm.startDate,
          end_date: leaveForm.endDate,
          reason: leaveForm.reason.trim(),
        },
      });
      setLeaveSubmitted(true);
      setToast('Leave application submitted successfully.');
      await refreshLeaveHistory();
    } catch (error) {
      setToast(error.message || 'Could not submit your leave application.');
    }
  }
  async function handleClassCheckIn(classItem) {
    if (isPreview) {
      showNotice('Check-in is unavailable in preview mode.');
      return;
    }
    if (!classItem?.class_id) {
      showNotice('This timetable entry has no class ID. Check the timetable data.');
      return;
    }
    const currentSession = session || getSession();
    if (!currentSession?.token) {
      showNotice('Your login session has expired. Please sign in again.');
      return;
    }
    if (!navigator.geolocation) {
      showNotice('This browser does not support GPS location.');
      return;
    }

    setCheckingClassId(classItem.class_id);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await apiRequest('/api/attendance/start-class', {
            method: 'POST',
            requiresAuth: true,
            token: currentSession.token,
            body: {
              class_id: classItem.class_id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          const verified = result?.verification_status === 'Verified'
            && String(result?.class_id) === String(classItem.class_id);
          if (!verified) {
            throw new Error(result?.message || 'The server did not confirm this class location.');
          }
          setVerifiedClassIds((previous) => new Set([...previous, String(classItem.class_id)]));
          showNotice(`${classItem.subject}: GPS verified and check-in recorded.`);
        } catch (error) {
          showNotice(error.message || 'Could not verify your location for this class.');
        } finally {
          setCheckingClassId(null);
        }
      },
      (error) => {
        const message = error.code === 1
          ? 'Location permission denied. Allow location access and try again.'
          : error.code === 2
            ? 'GPS location is unavailable. Please try again outdoors.'
            : 'Could not get your location. Please try again.';
        showNotice(message);
        setCheckingClassId(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function openStudentAttendance(classItem) {
    setSelectedAttendanceClass(classItem);
    setStudentAttendance({});
    setActiveModal('attendance');
  }

  function signOut() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-wordmark"><span className="brand-institution">BANASTHALI VIDYAPITH</span><span className="brand-product">FACULTY <b>HRMS</b></span></div>
          <button className="sidebar-collapse icon-button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
          <button className="sidebar-mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="sidebar-section-title">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Faculty dashboard navigation">
          <button className={isTimetablePage ? 'nav-item' : 'nav-item active'} onClick={() => isTimetablePage ? navigate(dashboardPath) : scrollToSection('overview')}><LayoutDashboard size={18} /><span>Overview</span>{!isTimetablePage && <span className="nav-active-dot" />}</button>
          <button className="nav-item" onClick={() => isTimetablePage ? navigate(dashboardPath) : scrollToSection('attendance')}><Clock3 size={18} /><span>Attendance</span></button>
          <button className={isTimetablePage ? 'nav-item active' : 'nav-item'} onClick={openTimetablePage}><CalendarDays size={18} /><span>Timetable</span>{isTimetablePage && <span className="nav-active-dot" />}</button>
          <button className="nav-item" onClick={() => { setActiveModal('history'); refreshLeaveHistory(); }}><BookOpen size={18} /><span>Leave summary</span></button>
          <button className="nav-item" onClick={() => navigate(profilePath)}><UserRound size={18} /><span>My profile</span></button>
          <button className="nav-item" onClick={() => navigate(notificationsPath)}><Bell size={18} /><span>Notifications</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-mark"><Sparkles size={15} /></span><span className="sidebar-note-copy"><strong>Made for the academic day</strong><small>A calmer view of your workweek.</small></span></div>
          <div className="sidebar-profile">
            <div className="profile-avatar">{initials}</div>
            <div className="sidebar-profile-copy"><strong>{displayName}</strong><small>Faculty · English</small></div>
            <button className="icon-button signout-icon" aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumbs"><span>Faculty portal</span><span className="breadcrumb-slash">/</span><strong>{isTimetablePage ? 'Timetable' : 'Overview'}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="search-box"><Search size={15} /><input aria-label="Search dashboard" placeholder="Search" onKeyDown={(event) => event.key === 'Enter' && showNotice('Search is a visual placeholder in this first release.')} /><kbd>âŒ˜ K</kbd></div>
            <button className="notification-button icon-button" aria-label="Notifications" onClick={() => navigate(notificationsPath)}><Bell size={18} /><span className="notification-pip" /></button>
            <button className="top-profile" onClick={() => showNotice(`${displayName} · Faculty dashboard`)}><span className="top-avatar">{initials}</span><span className="top-profile-name">{displayName}</span><ChevronDown size={14} /></button>
          </div>
        </header>

       
<main className={`dashboard-main ${isTimetablePage ? 'timetable-page-main' : ''}`} id={isTimetablePage ? 'timetable-page' : 'overview'}>
  {isPreview && (
    <div className="preview-banner">
      <span className="preview-banner-dot" />
      <strong>Demo mode</strong>
      <span>All figures below are demo data · No attendance or leave records are connected.</span>
      <button onClick={() => navigate('/login')}>
        Back to sign in <ArrowRight size={13} />
      </button>
    </div>
  )}

  {isTimetablePage ? <WeeklyTimetablePage classes={classes} loading={!isPreview && timetableLoading} error={!isPreview ? timetableError : ''} isPreview={isPreview} /> : <>
    <div className="page-heading-row">
      <div>
        <div className="eyebrow eyebrow-indigo">
          FACULTY OVERVIEW
        </div>
        <h1>
          Good morning, {displayName.split(' ')[0]}
          <span className="heading-period">.</span>
        </h1>
        <p className="page-date">
          <CalendarDays size={15} /> {getToday()}
          <span className="date-divider" /> Your day, at a glance
        </p>
      </div>

      <button
        className="date-chip"
        onClick={() => showNotice('The calendar is a visual placeholder in this first release.')}
      >
        <span className="date-chip-icon"><CalendarDays size={16} /></span>
        <span>
          <small>ACADEMIC WEEK</small>
          <strong>Wednesday – Monday</strong>
        </span>
        <ChevronDown size={14} />
      </button>
    </div>

    {/* Timetable directly below the faculty heading */}
   

          <section className="dashboard-lower-grid">
            <article className="content-card timetable-card" id="timetable">
              <div className="card-heading"><div><span className="section-kicker">YOUR ACADEMIC DAY</span><h2>Today's timetable</h2></div><button className="card-action" onClick={openTimetablePage}>View full week <ArrowRight size={14} /></button></div>
              <div className="timetable-date-row"><span className="today-marker" /> <strong>{new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(new Date())}</strong><span>·</span><span>{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(new Date())}</span><span className="placeholder-caption">{isPreview ? 'DEMO ENTRIES' : 'LIVE ENTRIES'}</span></div>
              <div className="schedule-list">
                {(isPreview ? timetable : classes
                  .filter((item) => String(item.class_day || '').toLowerCase() === new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(new Date()).toLowerCase())
                  .map((item) => ({
                    class_id: item.class_id,
                    time: formatClassTime(item.start_time),
                    end: formatClassTime(item.end_time),
                    subject: item.subject_name || 'Scheduled class',
                    detail: item.status || 'Scheduled class',
                    place: item.room_name || 'Room not specified',
                    tone: 'lavender',
                  })))
                  .map((item, index) => {
                    const isVerified = verifiedClassIds.has(String(item.class_id));
                    const isChecking = String(checkingClassId) === String(item.class_id);
                    return (
                      <div className="schedule-row" key={item.class_id || `${item.time}-${item.subject}`}>
                        <div className="schedule-time"><strong>{item.time}</strong><span>{item.end}</span></div>
                        <div className={`schedule-marker marker-${item.tone || 'lavender'}`}><i /></div>
                        <div className="schedule-detail">
                          <strong>{item.subject}</strong>
                          <span>{item.detail}</span>
                          <small>{item.place}</small>
                          {!isPreview && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                              <button
                                type="button"
                                className="dashboard-checkin-button"
                                style={{ width: 'auto', padding: '9px 13px', fontSize: 13 }}
                                disabled={isChecking || isVerified || !item.class_id}
                                onClick={() => handleClassCheckIn(item)}
                              >
                                <CheckCircle2 size={15} />
                                {isChecking ? 'Verifying…' : isVerified ? 'Verified' : 'Check In'}
                              </button>
                              <button
                                type="button"
                                className="dashboard-checkin-button"
                                style={{ width: 'auto', padding: '9px 13px', fontSize: 13, opacity: isVerified ? 1 : 0.45, cursor: isVerified ? 'pointer' : 'not-allowed' }}
                                disabled={!isVerified}
                                onClick={() => openStudentAttendance(item)}
                              >
                                Take Attendance
                              </button>
                            </div>
                          )}
                          {isPreview && <small>Preview only — no attendance actions</small>}
                        </div>
                        <span className="schedule-index">0{index + 1}</span>
                      </div>
                    );
                  })}
                {!isPreview && !timetableLoading && !timetableError && classes.filter((item) => String(item.class_day || '').toLowerCase() === new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(new Date()).toLowerCase()).length === 0 && <p>No classes scheduled for today.</p>}
              </div>
              <div className="week-note"><span className="week-note-mark"><CalendarDays size={15} /></span><span>Academic week: <strong>Wednesday to Monday</strong></span><span className="week-off">Tuesday · weekly off</span></div>
            </article>
<article className="content-card attendance-chart-card">
              <div className="card-heading"><div><span className="section-kicker">THIS MONTH</span><h2>Attendance rhythm</h2></div><button className="subtle-icon" aria-label="Attendance summary options" onClick={() => showNotice('Monthly attendance figures are illustrative demo data.')}><MoreHorizontal size={18} /></button></div>
              <div className="attendance-chart-heading"><div><strong>—</strong><small>No attendance summary available yet</small></div></div>
              <div className="chart-footnote"><Clock3 size={14} /><span>Attendance statistics will appear here when the attendance summary API is connected.</span></div>
            </article>
          </section>
                     <section className="faculty-home-timetable">
      <WeeklyTimetablePage classes={classes} loading={!isPreview && timetableLoading} error={!isPreview ? timetableError : ''} isPreview={isPreview} />
    </section>
                  <section className="request-leave-section">
  <article className="content-card request-leave-card">
    <div className="card-heading">
      <div>
        <span className="section-kicker">LEAVE MANAGEMENT</span>
        <h2>Request Leave</h2>
      </div>
      <span className="quick-action-icon quick-action-sage">
        <BookOpen size={20} />
      </span>
    </div>

    <p>Need time off? Submit your leave request for approval.</p>

    <button
      className="request-leave-button"
      onClick={openLeaveModal}
    >
      <BookOpen size={18} />
      Apply for Leave
      <ArrowRight size={16} />
    </button>
  </article>
</section>
          {isPreview && <div className="dashboard-disclaimer"><span className="disclaimer-mark">i</span><span>Preview mode uses illustrative sample data.</span></div>}
          </>}
          <footer className="dashboard-footer"><span>Faculty HRMS <i /> Banasthali Vidyapith</span><span>Designed for the academic community</span></footer>
        </main>
      </div>
      
{activeModal === 'history' && (
  <div
    className="modal-backdrop"
    role="presentation"
    onMouseDown={(event) =>
      event.target === event.currentTarget && setActiveModal(null)
    }
  >
    <section
      className="modal-dialog leave-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-history-title"
    >
      <div className="modal-header">
        <div>
          <span className="section-kicker">FACULTY SERVICES</span>
          <h2 id="leave-history-title">Leave history</h2>
          <p>Your submitted leave applications and their current status.</p>
        </div>
        <button
          className="modal-close icon-button"
          aria-label="Close leave history"
          onClick={() => setActiveModal(null)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="leave-form">
        {leaveLoading ? (
          <p>Loading leave history...</p>
        ) : leaveHistory.length === 0 ? (
          <p>No leave applications found.</p>
        ) : (
          leaveHistory.map((request) => (
            <article key={request.id} className="content-card">
              <strong>{request.type}</strong>
              <p>{request.dates}</p>
              <p>{request.reason}</p>
              <span>{request.status}</span>
            </article>
          ))
        )}

        <div className="modal-actions">
  <button
    className="modal-secondary-button"
    type="button"
    disabled={leaveLoading}
    onClick={refreshLeaveHistory}
  >
    {leaveLoading ? 'Refreshing...' : 'Refresh status'}
  </button>
  <button
    className="modal-primary-button"
    type="button"
    onClick={() => {
      setLeaveForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
      setLeaveSubmitted(false);
      setToast('');
      setActiveModal('leave');
    }}
  >
    Apply for leave <ArrowRight size={14} />
  </button>
</div>
      </div>
    </section>
  </div>
)}

      {activeModal === 'attendance' && selectedAttendanceClass && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setActiveModal(null)}>
          <section className="modal-dialog leave-modal" role="dialog" aria-modal="true" aria-labelledby="student-attendance-title">
            <div className="modal-header">
              <div>
                <span className="section-kicker">CLASS ATTENDANCE · DEMO</span>
                <h2 id="student-attendance-title">{selectedAttendanceClass.subject}</h2>
                <p>{selectedAttendanceClass.time}–{selectedAttendanceClass.end} · {selectedAttendanceClass.place}</p>
              </div>
              <button className="modal-close icon-button" aria-label="Close student attendance" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="demo-modal-note"><Sparkles size={14} /><span>Demo student list only. These selections are not saved to the database.</span></div>
            <div className="leave-form">
              {['Student 001', 'Student 002', 'Student 003', 'Student 004', 'Student 005'].map((student) => (
                <div key={student} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{student}</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Present', 'Absent'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={studentAttendance[student] === status ? 'modal-primary-button' : 'modal-secondary-button'}
                        onClick={() => setStudentAttendance((previous) => ({ ...previous, [student]: status }))}
                      >{status}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="modal-secondary-button" onClick={() => setActiveModal(null)}>Close</button>
                <button type="button" className="modal-primary-button" onClick={() => showNotice('Demo selections only — student attendance was not saved.')}>Finish demo</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeModal === 'leave' && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setActiveModal(null)}>
        <section className="modal-dialog leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title">
          <div className="modal-header"><div><span className="section-kicker">FACULTY SERVICES</span><h2 id="leave-modal-title">Leave application</h2><p>Submit your leave request for review.</p></div><button className="modal-close icon-button" aria-label="Close leave application" onClick={() => setActiveModal(null)}><X size={18} /></button></div>
          {leaveSubmitted ? <div className="demo-success-state"><span className="demo-success-icon"><CheckCircle2 size={24} /></span><h3>Leave application submitted</h3><p>Your request has been submitted. You can check its status in Leave History.</p><button className="modal-secondary-button" type="button" onClick={() => setActiveModal(null)}>Close preview</button></div> : <form className="leave-form" onSubmit={handleLeaveSubmit}>
            <div className="demo-modal-note"><Sparkles size={14} /><span><strong>Leave request</strong> · Submit this form to send your application.</span></div>
            <div className="form-grid-two"><div className="modal-field"><label htmlFor="leave-type">Leave type</label><select id="leave-type" value={leaveForm.leaveType} onChange={(event) => setLeaveForm({ ...leaveForm, leaveType: event.target.value })}><option>Casual Leave</option><option>Earned Leave</option><option>Medical Leave</option></select></div><div className="modal-field"><span className="modal-field-label">Request status</span><div className="modal-readonly-field"><span className="leave-pending-dot" /> Demo draft</div></div></div>
            <div className="form-grid-two"><div className="modal-field"><label htmlFor="leave-start">Start date</label><input id="leave-start" type="date" required value={leaveForm.startDate} onChange={(event) => setLeaveForm({ ...leaveForm, startDate: event.target.value })} /></div><div className="modal-field"><label htmlFor="leave-end">End date</label><input id="leave-end" type="date" min={leaveForm.startDate || undefined} required value={leaveForm.endDate} onChange={(event) => setLeaveForm({ ...leaveForm, endDate: event.target.value })} /></div></div>
            <div className="modal-field"><label htmlFor="leave-reason">Reason</label><textarea id="leave-reason" rows="4" required placeholder="Enter the reason for your leave" value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} /></div>
            <div className="modal-actions"><button className="modal-secondary-button" type="button" onClick={() => setActiveModal(null)}>Cancel</button><button className="modal-primary-button" type="submit">Submit leave application <ArrowRight size={14} /></button></div>
          </form>}
        </section>
      </div>}
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}




