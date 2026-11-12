import { AlertCircle, CircleHelp, LoaderCircle, WifiOff } from 'lucide-react';
import './FeatureState.css';

const STATE_DETAILS = {
  loading: { label: 'Loading', icon: LoaderCircle, className: 'is-loading' },
  empty: { label: 'No records', icon: CircleHelp, className: 'is-empty' },
  error: { label: 'Unable to load', icon: AlertCircle, className: 'is-error' },
  unavailable: { label: 'Feature not connected', icon: WifiOff, className: 'is-unavailable' },
};

export function FeatureState({ state = 'unavailable', title, message, children }) {
  const details = STATE_DETAILS[state] || STATE_DETAILS.unavailable;
  const Icon = details.icon;
  return (
    <section className={`feature-state ${details.className}`} role={state === 'error' ? 'alert' : 'status'}>
      <span className="feature-state-icon" aria-hidden="true"><Icon size={19} /></span>
      <div className="feature-state-copy">
        <span className="feature-state-label">{details.label}</span>
        {title && <h2>{title}</h2>}
        <p>{message}</p>
        {children}
      </div>
    </section>
  );
}
