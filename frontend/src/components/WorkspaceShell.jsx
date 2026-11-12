import { useState } from 'react';
import {
  Bell, CheckCircle2, ChevronDown, LogOut, Menu, PanelLeftClose,
  PanelLeftOpen, Search, Sparkles, UserRound, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../services/auth.js';
import './WorkspaceShell.css';

export function WorkspaceShell({
  roleLabel,
  displayName,
  subtitle,
  pageTitle,
  navItems,
  activeKey,
  onSelect,
  notificationTo,
  isPreview = false,
  children,
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';

  function showNotice(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  function selectItem(item) {
    setMobileOpen(false);
    if (item.to) {
      navigate(item.to);
      return;
    }
    onSelect?.(item.key);
  }

  function signOut() {
    if (!isPreview) clearSession();
    navigate('/login');
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-wordmark">
            <span className="brand-institution">BANASTHALI VIDYAPITH</span>
            <span className="brand-product">FACULTY <b>HRMS</b></span>
          </div>
          <button className="sidebar-collapse icon-button" type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button className="sidebar-mobile-close icon-button" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="sidebar-section-title">{roleLabel}</div>
        <nav className="sidebar-nav" aria-label={`${roleLabel} navigation`}>
          {navItems.map((item) => {
            const Icon = item.icon || UserRound;
            return (
              <button className={activeKey === item.key ? 'nav-item active' : 'nav-item'} type="button" key={item.key} onClick={() => selectItem(item)}>
                <Icon size={18} />
                <span>{item.label}</span>
                {activeKey === item.key && <span className="nav-active-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-mark"><Sparkles size={15} /></span>
            <span className="sidebar-note-copy"><strong>Demo workspace</strong><small>Mock records · no new APIs connected.</small></span>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">{initials}</div>
            <div className="sidebar-profile-copy"><strong>{displayName}</strong><small>{subtitle}</small></div>
            <button className="icon-button signout-icon" type="button" aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumbs"><span>Faculty portal</span><span className="breadcrumb-slash">/</span><strong>{pageTitle}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="search-box"><Search size={15} /><input aria-label="Search workspace" placeholder="Search" onKeyDown={(event) => event.key === 'Enter' && showNotice('Search is a prototype control; no records are queried.')} /><kbd>⌘ K</kbd></div>
            <button className="notification-button icon-button" type="button" aria-label="Notifications" onClick={() => notificationTo ? navigate(notificationTo) : showNotice('Notification actions are demo-only in this prototype.')}><Bell size={18} /><span className="notification-pip" /></button>
            <button className="top-profile" type="button" onClick={() => showNotice(`${displayName} · ${roleLabel.toLowerCase()} demo workspace`)}><span className="top-avatar">{initials}</span><span className="top-profile-name">{displayName}</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="preview-banner workspace-preview-banner"><span className="preview-banner-dot" /><strong>{isPreview ? 'Demo mode' : 'Prototype mode'}</strong><span>Mock records and actions only · No new HRMS APIs are connected.</span><button type="button" onClick={signOut}>Back to sign in <X size={13} /></button></div>
          {children}
          <footer className="dashboard-footer"><span>Faculty HRMS <i /> Banasthali Vidyapith</span><span>Designed for the academic community</span></footer>
        </main>
      </div>
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} /><span>{toast}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}
