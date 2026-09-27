import React from 'react';
import { BoxIcon, ShieldIcon, AlertIcon, BuildingIcon, UserIcon, MoonIcon, SunIcon, MenuIcon, LockIcon } from './Icons.jsx';

export function Header({
  activeTenant,
  onSelectTenant,
  session,
  stats,
  darkMode,
  onToggleDarkMode,
  onOpenAuthModal,
  onToggleMobileMenu
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <MenuIcon size={20} />
        </button>

        <a href="#main-content" className="brand-badge">
          <div className="brand-icon">
            <BoxIcon size={18} />
          </div>
          <span>Returns Manager</span>
        </a>

        <span className="stage-tag">Step 04 : Customer Return</span>

        <div className="header-stats">
          <div className="stat-pill restock" title="Restock Rate for active tenant">
            <ShieldIcon size={13} color="#4ade80" />
            <span>Restock:</span>
            <span className="val">{stats.restockRate}%</span>
          </div>

          <div className="stat-pill uncertain" title="Requires Human Inspection Review">
            <AlertIcon size={13} color="#fbbf24" />
            <span>Review Queue:</span>
            <span className="val">{stats.uncertainCount}</span>
          </div>

          <div className="stat-pill" title="Total Units in Tenant Ledger">
            <span>Total Units:</span>
            <span className="val">{stats.totalProcessed}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Tenancy Isolation Indicator & Switcher */}
        <div className="tenant-badge-verified" title="Active Tenant Isolated Session">
          <BuildingIcon size={13} />
          <span className="mono" style={{ fontSize: '0.72rem' }}>{activeTenant}</span>
        </div>

        {/* Authenticated Operator */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onOpenAuthModal}
          title="Operator Authentication & Role"
        >
          <UserIcon size={13} />
          <span className="mono">{session?.username || 'op_fatima'}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({session?.role || 'operator'})</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {darkMode ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>
      </div>
    </header>
  );
}
