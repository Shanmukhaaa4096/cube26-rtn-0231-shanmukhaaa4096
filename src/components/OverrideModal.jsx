import React, { useState } from 'react';
import { CrossIcon, EditIcon, CheckIcon, ActionIcon } from './Icons.jsx';
import { sanitizeInput } from '../services/authAndStorage.js';
import { translateDisposition, ACTION_DEFINITIONS } from '../utils/userFacingText.js';

export function OverrideModal({
  isOpen,
  onClose,
  currentDisposition,
  operatorId,
  onApplyOverride
}) {
  const currentAction = translateDisposition(currentDisposition);
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

  const revisedAction = translateDisposition(revisedDisposition);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title">
            <EditIcon size={16} />
            <span>Change Decision</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close"
          >
            <CrossIcon size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!confirmStep ? (
              <>
                <div className="override-current-box">
                  <span className="override-current-label">Current recommendation:</span>
                  <div className="override-current-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ActionIcon disposition={currentDisposition} size={15} />
                    <strong>{currentAction.title}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="override-disp-select">
                    New decision
                  </label>
                  <select
                    id="override-disp-select"
                    className="form-select"
                    value={revisedDisposition}
                    onChange={(e) => setRevisedDisposition(e.target.value)}
                  >
                    {Object.keys(ACTION_DEFINITIONS).map(key => (
                      <option key={key} value={key}>
                        {ACTION_DEFINITIONS[key].title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="override-reason-input">
                    Why are you changing this decision? <span style={{ color: '#b91c1c' }}>*</span>
                  </label>
                  <textarea
                    id="override-reason-input"
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Inspected on physical bench — outer sleeve has handling scuffs and requires clean packaging before resale."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <span className="form-help-text">
                    The original AI recommendation will be preserved in the audit record alongside this note.
                  </span>
                </div>
              </>
            ) : (
              <div className="override-confirm-panel">
                <p className="override-confirm-title">
                  Confirm updated decision
                </p>
                <div className="confirm-summary-box">
                  <div className="confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>From:</span>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ActionIcon disposition={currentDisposition} size={13} />
                      <span>{currentAction.title}</span>
                    </strong>
                  </div>
                  <div className="confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span>To:</span>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ActionIcon disposition={revisedDisposition} size={13} />
                      <span>{revisedAction.title}</span>
                    </strong>
                  </div>
                  <div className="confirm-reason-text">
                    "{reason}"
                  </div>
                  <div className="confirm-audit-text">
                    This update will be recorded under your operator profile.
                  </div>
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
              <CheckIcon size={14} />
              <span>{confirmStep ? "Confirm and save change" : "Continue to confirm"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
