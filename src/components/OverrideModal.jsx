import React, { useState } from 'react';
import { CrossIcon, EditIcon, CheckIcon } from './Icons.jsx';
import { DISPOSITION_DEFINITIONS } from '../data/seedReturns.js';
import { sanitizeInput } from '../services/authAndStorage.js';

export function OverrideModal({
  isOpen,
  onClose,
  currentDisposition,
  operatorId,
  onApplyOverride
}) {
  const [revisedDisposition, setRevisedDisposition] = useState(
    currentDisposition === 'restock' ? 'refurbish' : 'restock'
  );
  const [reason, setReason] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    onApplyOverride({
      original_verdict: currentDisposition,
      revised_verdict: revisedDisposition,
      reason: sanitizeInput(reason.trim()),
      operator_id: operatorId,
      timestamp: new Date().toISOString()
    });
    setConfirmStep(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title">
            <EditIcon size={16} />
            <span>Operator Override (History Preserved)</span>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close override modal">
            <CrossIcon size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!confirmStep ? (
              <>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '3px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Original AI Verdict: </span>
                  <strong className="badge badge-uncertain">{currentDisposition}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="override-disp-select">Revised Operator Disposition</label>
                  <select
                    id="override-disp-select"
                    className="form-select"
                    value={revisedDisposition}
                    onChange={(e) => setRevisedDisposition(e.target.value)}
                  >
                    {Object.keys(DISPOSITION_DEFINITIONS).map(key => (
                      <option key={key} value={key}>
                        {DISPOSITION_DEFINITIONS[key].label}: {DISPOSITION_DEFINITIONS[key].desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="override-reason-input">
                    Operational Disagreement Reason <span style={{ color: '#b91c1c' }}>*</span>
                  </label>
                  <textarea
                    id="override-reason-input"
                    className="form-input"
                    rows={3}
                    placeholder="Provide specific physical justification (e.g. Battery capacity degraded below 60% upon bench test)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Engineering Rule 3: The system preserves original verdict alongside this revision in the audit ledger.
                  </span>
                </div>
              </>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Confirm Operator Override Submission?
                </p>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '3px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <div>From: <strong className="mono">{currentDisposition}</strong> ➔ To: <strong className="mono">{revisedDisposition}</strong></div>
                  <div style={{ marginTop: '0.25rem' }}>Reason: "{reason}"</div>
                  <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>This action will be permanently recorded under your operator ID.</div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (confirmStep) setConfirmStep(false);
                else onClose();
              }}
            >
              {confirmStep ? "Back" : "Cancel"}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!reason.trim()}
            >
              <CheckIcon size={12} />
              <span>{confirmStep ? "Confirm and Commit Override" : "Proceed to Confirm"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
