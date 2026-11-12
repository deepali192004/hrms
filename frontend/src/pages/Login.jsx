import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticate, saveSession } from '../services/auth.js';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedRole, setSelectedRole] = useState('faculty');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!username.trim() || !password) {
      setError('Enter your username and password to continue.');
      return;
    }
    setLoading(true);
    try {
      const session = await authenticate(username.trim(), password);
      const roleDestinations = {
        faculty: '/faculty/dashboard',
        hod: '/hod/dashboard',
        admin: '/admin/dashboard',
      };
      if (session.role !== selectedRole) {
       setError(`This account belongs to ${session.role.toUpperCase()}, but you selected ${selectedRole.toUpperCase()}. Please select the correct role.`);
        return;
      }
      const destination = roleDestinations[session.role];
      if (!destination) {
        setNotice(`Your ${session.role.toUpperCase()} sign-in was verified, but this role has no dashboard in this frontend release.`);
        return;
      }
      saveSession(session);
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function showResetNotice() {
    setError('');
    setNotice('Password reset is not connected in this first frontend release. Please contact your HRMS administrator.');
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Banasthali Vidyapith">
        <div className="story-orbit story-orbit-one" />
        <div className="story-orbit story-orbit-two" />
        <div className="story-grid" />
        <div className="story-content">
          <div className="institution-wordmark">
            <span className="wordmark-overline">BANASTHALI VIDYAPITH</span>
            <span className="wordmark-divider" />
            <span className="wordmark-sub">FACULTY HRMS</span>
          </div>
          <div className="story-copy">
            <span className="eyebrow eyebrow-light"><Sparkles size={13} /> A thoughtful campus, in sync</span>
            <h1>Make space for<br /><em>what matters.</em></h1>
            <p>One considered place for the people, rhythms and everyday work that shape our academic community.</p>
          </div>
          <div className="story-foot">
            <div className="story-foot-line" />
            <span>Faculty · HOD · Administration</span>
            <span className="story-foot-year">EST. 1935</span>
          </div>
        </div>
        <div className="story-glow" />
        <div className="story-decoration" aria-hidden="true">
          <div className="deco-ring deco-ring-a" />
          <div className="deco-ring deco-ring-b" />
          <div className="deco-dot" />
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-top">
          <span className="top-wordmark">BANASTHALI <span>VIDYAPITH</span></span>
          <span className="secure-label"><ShieldCheck size={14} /> SECURE PORTAL</span>
        </div>
        <div className="login-card-wrap">
          <div className="login-heading">
            <span className="eyebrow eyebrow-indigo">FACULTY SERVICES</span>
            <h2>Faculty Human Resource<br />Management System</h2>
            <p>Sign in with your institutional account to continue.</p>
          </div>

          <div className="role-strip" aria-label="Select your portal role">
            <span className="role-label">PORTAL ACCESS</span>
            {['faculty', 'hod', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                className={`role-option ${selectedRole === role ? 'selected' : ''}`}
                aria-pressed={selectedRole === role}
                onClick={() => { setSelectedRole(role); setError(''); setNotice(''); }}
              >
                {role === 'hod' ? 'HOD' : role === 'admin' ? 'Admin' : 'Faculty'}
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="username">Username</label>
            <div className="input-shell">
              <UserRound size={17} aria-hidden="true" />
              <input id="username" name="username" autoComplete="username" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={loading} />
            </div>

            <div className="password-label-row">
              <label className="field-label" htmlFor="password">Password</label>
              <button className="text-button forgot-button" type="button" onClick={showResetNotice}>Forgot password?</button>
            </div>
            <div className="input-shell">
              <LockKeyhole size={17} aria-hidden="true" />
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
              <button className="icon-button password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && <div className="form-feedback feedback-error" role="alert">{error}</div>}
            {notice && <div className="form-feedback feedback-notice" role="status">{notice}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Signing you in…' : 'Sign in to your account'}</span>
              {loading ? <span className="button-spinner" aria-hidden="true" /> : <ArrowRight size={17} />}
            </button>
          </form>
          <p className="login-footnote"><LockKeyhole size={12} /> Sign-in uses http://localhost:5000/api/auth/login; the backend must be reachable.</p>
        </div>
        <div className="login-panel-footer"><span>Academic community · Banasthali Vidyapith</span><span>© 2026</span></div>
      </section>
    </main>
  );
}
