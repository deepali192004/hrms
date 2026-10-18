
import { useState } from "react";
import "./App.css";

function App() {
  const [role, setRole] = useState("Faculty");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activePage, setActivePage] = useState("Overview");

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Login failed. Please try again.");
        return;
      }

      if (data.user.role !== role) {
        setMessage(`This account belongs to the ${data.user.role} role.`);
        return;
      }

      sessionStorage.setItem("hrmsToken", data.token);
      sessionStorage.setItem("hrmsUser", JSON.stringify(data.user));
      setLoggedInUser(data.user);
    } catch {
      setMessage("Cannot connect to the server. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("hrmsToken");
    sessionStorage.removeItem("hrmsUser");
    setLoggedInUser(null);
    setPassword("");
    setMessage("");
    setActivePage("Overview");
  };

  if (loggedInUser) {
    return (
      <Dashboard
        user={loggedInUser}
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <h2>BANASTHALI VIDYAPITH</h2>
            <p>FACULTY MANAGEMENT SYSTEM</p>
          </div>
        </div>

        <div className="visual-content">
          <span className="eyebrow">SMART CAMPUS · CONNECTED FACULTY</span>
          <h1>One campus.<br />One connected system.</h1>
          <p>
            A unified space to manage faculty attendance, leave,
            schedules and campus activities.
          </p>

          <div className="visual-card">
            <div className="visual-card-icon">✦</div>
            <div>
              <strong>Faculty HRMS</strong>
              <span>Secure · Organised · Connected</span>
            </div>
            <span className="online-dot" />
          </div>
        </div>

        <p className="visual-footer">
          Banasthali Vidyapith · Faculty Portal
        </p>
      </section>

      <section className="login-panel">
        <div className="login-box">
          <div className="mobile-brand">BV <span>FACULTY HRMS</span></div>

          <span className="welcome-label">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="subtitle">
            Enter your credentials to access your workspace.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="role">Sign in as</label>

            <div className="role-options">
              {["Faculty", "HOD", "Admin"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`role-option ${role === item ? "selected" : ""}`}
                  onClick={() => setRole(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            <div className="form-note">
              <span>Secure faculty access</span>
              <span>● Protected login</span>
            </div>

            {message && (
              <div className="login-message" role="alert">
                {message}
              </div>
            )}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to dashboard"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-divider">
            <span>INSTITUTIONAL ACCESS</span>
          </div>

          <p className="institution-note">
            Use your registered HRMS account to sign in.
            For account assistance, contact your administrator.
          </p>

          <p className="copyright">
            © Banasthali Vidyapith · Faculty HRMS
          </p>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ user, activePage, setActivePage, onLogout }) {
  const navigation = [
    { name: "Overview", icon: "▦" },
    { name: "Attendance", icon: "◷" },
    { name: "Leave Management", icon: "▤" },
    { name: "Timetable", icon: "▦" },
    { name: "Notifications", icon: "♧" },
    { name: "My Profile", icon: "◉" },
  ];

  const firstName = user.username
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="brand-mark">B</div>
          <div>
            <strong>BANASTHALI</strong>
            <span>FACULTY HRMS</span>
          </div>
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav className="dashboard-nav">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? "active" : ""}`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "Notifications" && (
                <span className="nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Need assistance?</strong>
              <span>Contact your administrator</span>
            </div>
          </div>

          <button className="logout-button" onClick={onLogout}>
            <span>↪</span> Sign out
          </button>

          <p className="sidebar-version">Faculty HRMS · Demo</p>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="breadcrumb">
              WORKSPACE / {activePage.toUpperCase()}
            </span>
            <p className="topbar-context">
              Banasthali Vidyapith · Faculty Portal
            </p>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{firstName}</strong>
              <span>{user.role}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activePage === "Overview" ? (
            <>
              <div className="dashboard-welcome">
                <div>
                  <span className="eyebrow">YOUR FACULTY WORKSPACE</span>
                  <h1>Welcome back, {firstName} <span>✦</span></h1>
                  <p>Here's an overview of your faculty activities.</p>
                </div>

                <div className="date-chip">
                  <span>◷</span>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="dashboard-notice">
                <span className="notice-symbol">i</span>
                <div>
                  <strong>Welcome to your Faculty HRMS</strong>
                  <p>
                    Your workspace is ready. Attendance and leave data will
                    appear here as those features are connected.
                  </p>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Your workspace</h2>
                  <p>Quick access to your faculty services</p>
                </div>
                <span className="live-label"><span /> SYSTEM ONLINE</span>
              </div>

              <div className="dashboard-cards">
                <button
                  className="dashboard-card"
                  onClick={() => setActivePage("Attendance")}
                >
                  <div className="card-icon teal">◷</div>
                  <span className="card-label">ATTENDANCE</span>
                  <strong>My attendance</strong>
                  <p>Check your attendance records and working hours.</p>
                  <span className="card-link">View attendance <b>→</b></span>
                </button>

                <button
                  className="dashboard-card"
                  onClick={() => setActivePage("Leave Management")}
                >
                  <div className="card-icon purple">▤</div>
                  <span className="card-label">LEAVE SERVICES</span>
                  <strong>Leave management</strong>
                  <p>Apply for leave and check your request status.</p>
                  <span className="card-link">Manage leave <b>→</b></span>
                </button>

                <button
                  className="dashboard-card"
                  onClick={() => setActivePage("Timetable")}
                >
                  <div className="card-icon blue">▦</div>
                  <span className="card-label">SCHEDULE</span>
                  <strong>My timetable</strong>
                  <p>Access your teaching schedule and class details.</p>
                  <span className="card-link">View timetable <b>→</b></span>
                </button>

                <button
                  className="dashboard-card"
                  onClick={() => setActivePage("Notifications")}
                >
                  <div className="card-icon amber">♧</div>
                  <span className="card-label">UPDATES</span>
                  <strong>Notifications</strong>
                  <p>Stay informed about attendance and leave updates.</p>
                  <span className="card-link">View updates <b>→</b></span>
                </button>
              </div>

              <div className="bottom-panels">
                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Today's activity</h3>
                      <p>Your current attendance overview</p>
                    </div>
                    <span className="panel-icon">◷</span>
                  </div>

                  <div className="empty-state">
                    <div className="empty-symbol">◷</div>
                    <strong>No attendance recorded yet</strong>
                    <p>
                      Attendance details will appear here when the module is
                      connected.
                    </p>
                    <button onClick={() => setActivePage("Attendance")}>
                      Open attendance →
                    </button>
                  </div>
                </section>

                <section className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick information</h3>
                      <p>Your account details</p>
                    </div>
                    <span className="panel-icon">◉</span>
                  </div>

                  <div className="account-detail">
                    <span>Username</span>
                    <strong>{user.username}</strong>
                  </div>
                  <div className="account-detail">
                    <span>Account role</span>
                    <strong>{user.role}</strong>
                  </div>
                  <div className="account-detail">
                    <span>Account ID</span>
                    <strong>#{user.userId}</strong>
                  </div>

                  <button
                    className="profile-link"
                    onClick={() => setActivePage("My Profile")}
                  >
                    View account details →
                  </button>
                </section>
              </div>
            </>
          ) : (
            <section className="module-page">
              <span className="eyebrow">FACULTY SERVICES</span>
              <h1>{activePage}</h1>
              <p className="module-intro">
                This section is part of your Faculty HRMS workspace.
              </p>

              <div className="dashboard-notice">
                <span className="notice-symbol">i</span>
                <div>
                  <strong>{activePage} module is coming next</strong>
                  <p>
                    Navigation is working. This module's forms and database
                    operations have not been implemented yet.
                  </p>
                </div>
              </div>

              <button
                className="back-overview"
                onClick={() => setActivePage("Overview")}
              >
                ← Back to overview
              </button>
            </section>
          )}

          <footer className="dashboard-footer">
            <span>Banasthali Vidyapith · Faculty HRMS</span>
            <span>Faculty workspace</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
