import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiConnectionMessage } from '../services/api.js';
import { isFacultyRegistrationEnabled, registerFaculty } from '../services/auth.js';
import './AuthPages.css';

function AuthBrandStory({ mode }) {
  const registration = mode === 'register';
  return (
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
          <span className="eyebrow eyebrow-light"><Sparkles size={13} /> {registration ? 'Account access' : 'Account security'}</span>
          <h1>{registration ? <>A considered<br /><em>start.</em></> : <>Recovery,<br /><em>without guesswork.</em></>}</h1>
          <p>{registration ? 'Public account creation is limited to Faculty. Administrative roles require an authorized process.' : 'Password recovery will be available when a secure backend reset service is connected.'}</p>
        </div>
        <div className="story-foot"><div className="story-foot-line" /><span>Faculty · HOD · Administration</span></div>
      </div>
      <div className="story-glow" />
      <div className="story-decoration" aria-hidden="true"><div className="deco-ring deco-ring-a" /><div className="deco-ring deco-ring-b" /><div className="deco-dot" /></div>
    </section>
  );
}

function AuthPanelTop() {
  return <div className="login-panel-top"><span className="top-wordmark">BANASTHALI <span>VIDYAPITH</span></span><span className="secure-label"><ShieldCheck size={14} /> SECURE PORTAL</span></div>;
}

function AuthPanelFooter() {
  return <div className="login-panel-footer"><span>Academic community · Banasthali Vidyapith</span><span>© {new Date().getFullYear()}</span></div>;
}

export function RegistrationPage() {
  const navigate = useNavigate();
  const registrationEnabled = isFacultyRegistrationEnabled();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!registrationEnabled) {
      setError('Public registration is disabled until the backend is verified to enforce Faculty-only account creation.');
      return;
    }
    if (!username.trim() || !password || !confirmPassword) {
      setError('Enter a username and both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerFaculty(username.trim(), password);
      setSuccess('The backend confirmed registration. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.message || 'The backend could not complete registration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page auth-page">
      <AuthBrandStory mode="register" />
      <section className="login-panel">
        <AuthPanelTop />
        <div className="login-card-wrap">
          <div className="login-heading"><span className="eyebrow eyebrow-indigo">FACULTY ONBOARDING</span><h2>Create an account</h2><p>Registration requests are submitted to the HRMS backend; this page does not create local accounts.</p></div>
          <div className="auth-role-notice"><strong>Faculty registration only</strong><span>This form sends the role <b>Faculty</b>. HOD and Admin roles must be assigned through an authorized administrative process.</span></div>
          {!registrationEnabled && <div className="form-feedback feedback-notice auth-config-notice" role="status">Public registration is disabled. Enable it only after the backend enforces Faculty-only self-registration and rejects privileged roles. {getApiConnectionMessage()}</div>}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="register-username">Username</label>
            <div className="input-shell"><UserRound size={17} aria-hidden="true" /><input id="register-username" name="username" autoComplete="username" placeholder="Choose a username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={loading || !registrationEnabled} /></div>
            <label className="field-label auth-field-gap" htmlFor="register-password">Password</label>
            <div className="input-shell"><LockKeyhole size={17} aria-hidden="true" /><input id="register-password" name="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading || !registrationEnabled} /><button className="icon-button password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={loading || !registrationEnabled}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <label className="field-label auth-field-gap" htmlFor="register-confirm-password">Confirm password</label>
            <div className="input-shell"><LockKeyhole size={17} aria-hidden="true" /><input id="register-confirm-password" name="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={loading || !registrationEnabled} /><button className="icon-button password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} disabled={loading || !registrationEnabled}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            {error && <div className="form-feedback feedback-error" role="alert">{error}</div>}
            {success && <div className="form-feedback feedback-notice" role="status">{success}</div>}
            <button className="login-submit" type="submit" disabled={loading || !registrationEnabled}><span>{loading ? 'Submitting to HRMS…' : 'Create Faculty account'}</span>{loading ? <span className="button-spinner" aria-hidden="true" /> : <ArrowRight size={17} />}</button>
          </form>
          <p className="login-footnote auth-footnote"><ShieldCheck size={12} /> Passwords are sent only to the registration API and are never stored in browser session state.</p>
          <div className="auth-links"><Link className="text-button" to="/login">Back to sign in</Link></div>
        </div>
        <AuthPanelFooter />
      </section>
    </main>
  );
}

export function ForgotPasswordPage() {
  return (
    <main className="login-page auth-page">
      <AuthBrandStory mode="forgot" />
      <section className="login-panel">
        <AuthPanelTop />
        <div className="login-card-wrap">
          <div className="login-heading"><span className="eyebrow eyebrow-indigo">ACCOUNT RECOVERY</span><h2>Forgot password?</h2><p>Secure password recovery is not connected to the backend.</p></div>
          <div className="form-feedback feedback-notice auth-config-notice" role="status">No reset endpoint or recovery identifier could be verified because the backend source is not part of this project and is unreachable from this remote environment. No email, OTP, or reset request has been sent.</div>
          <label className="field-label auth-field-gap" htmlFor="recovery-identifier">Recovery identifier <span className="auth-unconfirmed">(method not confirmed)</span></label>
          <div className="input-shell"><Mail size={17} aria-hidden="true" /><input id="recovery-identifier" name="recovery-identifier" type="text" placeholder="Email or username — backend method not confirmed" disabled /></div>
          <section className="auth-reset-contract" aria-labelledby="reset-contract-title"><h3 id="reset-contract-title">Backend work required</h3><p>Confirm the recovery identifier and implement secure endpoints before enabling this page:</p><code>POST /api/auth/password-reset/request</code><code>POST /api/auth/password-reset/confirm</code><p>Use generic request responses to prevent account enumeration, rate-limit requests, deliver a short-lived single-use token through a verified channel, and validate that token server-side before changing the password. Never send reset tokens in the browser URL or log them.</p></section>
          <div className="auth-links"><Link className="text-button" to="/login">Back to sign in</Link></div>
        </div>
        <AuthPanelFooter />
      </section>
    </main>
  );
}
