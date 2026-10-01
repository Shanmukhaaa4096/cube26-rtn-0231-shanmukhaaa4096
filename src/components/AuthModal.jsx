import React, { useState } from 'react';
import { CrossIcon, LockIcon, UnlockIcon, UserIcon, BuildingIcon, CheckIcon, AlertIcon } from './Icons.jsx';
import { authenticateUser, OPERATOR_DIRECTORY } from '../services/authAndStorage.js';

export function AuthModal({ isOpen, onClose, currentSession, onLoginSuccess }) {
  const [username, setUsername] = useState(currentSession?.username || 'op_fatima');
  const [password, setPassword] = useState('OperatorPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const authResult = authenticateUser(username, password);
      setIsLoading(false);

      if (authResult.success) {
        onLoginSuccess(authResult.session);
        onClose();
      } else {
        setErrorMsg(authResult.error);
      }
    }, 300);
  };

  const handleQuickSelect = (user) => {
    setUsername(user.username);
    setPassword(user.passwordHash);
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title">
            <LockIcon size={16} />
            <span>Operator Authentication</span>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close login modal">
            <CrossIcon size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sign in with your warehouse staff account to access your facility's returns station.
            </p>

            {errorMsg && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.5rem 0.75rem', borderRadius: '4px', color: '#b91c1c', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertIcon size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Staff Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-username"
                  type="text"
                  className="form-input mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. op_fatima, op_chen"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" htmlFor="auth-password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  {showPassword ? <UnlockIcon size={11} /> : <LockIcon size={11} />}
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="form-input mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Security check: 5 incorrect password attempts locks login for 30s.
              </span>
            </div>

            {/* Quick Demo Operator Picker */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Demo Accounts (Click to test):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.35rem' }}>
                {OPERATOR_DIRECTORY.map(user => (
                  <button
                    key={user.username}
                    type="button"
                    className="scenario-chip"
                    style={{ fontSize: '0.74rem', justifyContent: 'space-between', padding: '0.35rem 0.55rem' }}
                    onClick={() => handleQuickSelect(user)}
                  >
                    <span className="mono">{user.username}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({user.org_id.includes('alpha') ? 'Alpha' : 'Bravo'})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !username.trim()}
            >
              <CheckIcon size={12} />
              <span>{isLoading ? "Authenticating..." : "Sign In & Bind Session"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
