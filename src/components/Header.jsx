import React from 'react';
import { BoxIcon, BuildingIcon, UserIcon, MoonIcon, SunIcon, MenuIcon } from './Icons.jsx';

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
  const warehouseName = activeTenant === 'org_demo_alpha' ? 'Facility Alpha (Main)' : 'Facility Bravo';

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
            <BoxIcon size={20} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">Returns Manager</span>
            <span className="brand-tagline">Warehouse Inspection Assistant</span>
          </div>
        </a>

        {/* Operational Counters (Section 11: Real operational information) */}
        <div className="header-stats" aria-label="Warehouse operational metrics">
          <div className="stat-pill" title="Total returned items logged today">
            <span className="stat-label">Returns today:</span>
            <span className="val">{stats.totalProcessed || 0}</span>
          </div>

          <div className="stat-pill stat-waiting" title="Items waiting for automated or operator check">
            <span className="stat-label">Waiting for checking:</span>
            <span className="val">{stats.waitingCount || 0}</span>
          </div>

          <div className="stat-pill stat-uncertain" title="Items requiring human operator checking">
            <span className="stat-label">Needs your attention:</span>
            <span className="val">{stats.uncertainCount || 0}</span>
          </div>

          <div className="stat-pill stat-completed" title="Completed returns with finalized decision">
            <span className="stat-label">Completed:</span>
            <span className="val">{stats.completedCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Warehouse Facility Indicator */}
        <div className="tenant-badge-verified" title={`Active warehouse facility: ${activeTenant}`}>
          <BuildingIcon size={14} />
          <span>{warehouseName}</span>
        </div>

        {/* Current Operator */}
        <button
          type="button"
          className="theme-toggle-btn operator-btn"
          onClick={onOpenAuthModal}
          title="Current signed-in operator"
        >
          <UserIcon size={14} />
          <span>{session?.fullName || session?.username || 'Fatima Al-Mansoor'}</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleDarkMode}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {darkMode ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </header>
  );
}
