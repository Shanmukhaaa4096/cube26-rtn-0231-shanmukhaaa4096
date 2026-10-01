import React, { useState } from 'react';
import {
  CheckIcon,
  CrossIcon,
  AlertIcon,
  BoxIcon,
  RefreshIcon,
  PrintIcon,
  EditIcon,
  CodeIcon
} from './Icons.jsx';
import {
  translateDisposition,
  translateConfidence,
  translateCondition,
  generateRecommendationWhy
} from '../utils/userFacingText.js';

export function ResultCard({
  result,
  activeProduct,
  orderId,
  unitId,
  photos = [],
  overrideState,
  onOpenOverrideModal,
  onOpenContractModal,
  onResetInspection,
  onSaveToLog,
  isInspecting = false
}) {
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // 1. Loading State during AI inspection
  if (isInspecting) {
    return (
      <div className="ops-card result-loading-state" role="status" aria-live="polite">
        <div className="spinner-large" aria-hidden="true" />
        <h2 className="loading-state-title">Checking return parcel...</h2>
        <p className="loading-state-desc">
          Examining photos, identifying product, checking accessories, and grading condition.
        </p>
      </div>
    );
  }

  // 2. Empty State
  if (!result) {
    return (
      <div className="ops-card result-empty-state">
        <BoxIcon size={40} className="empty-state-icon" />
        <h2 className="empty-state-title">No result yet</h2>
        <p className="empty-state-desc">
          Select a returned item and add photos to start checking it.
        </p>
      </div>
    );
  }

  // Active decision translation
  const effectiveDisposition = overrideState ? overrideState.revised_verdict : result.disposition;
  const actionMeta = translateDisposition(effectiveDisposition);
  const confidenceMeta = translateConfidence(result.confidence, result.confidenceGating);
  const whyExplanation = generateRecommendationWhy(result, effectiveDisposition, overrideState, activeProduct);
  const isHumanCheckNeeded = effectiveDisposition === 'pending_review';

  // Contextual confidence description directly under title (eliminates contradictory floating pill)
  const confidenceContextLine = isHumanCheckNeeded
    ? (result.identity === 'FAIL'
        ? 'High confidence: item mismatch'
        : (result.identity === 'UNCERTAIN'
            ? 'Low confidence: item identity inconclusive'
            : (result.completeness === 'FAIL' || (result.missing && result.missing.length > 0)
                ? 'High confidence: missing required items'
                : (result.image_quality?.is_blurry || result.image_quality?.glare_detected
                    ? 'Low confidence: photo clarity insufficient'
                    : 'Manual checking required: visual evidence inconclusive'))))
    : (confidenceMeta.level === 'High'
        ? 'High confidence: verified return'
        : `${confidenceMeta.level} confidence: inspection complete`);

  // Build the 4 core check results (each one line)
  // 1) Identity
  const identityPassed = result.identity === 'PASS';
  const identityFailed = result.identity === 'FAIL';
  const identityText = identityPassed
    ? `Matches ${activeProduct?.name || 'catalogue item'} (${result.identity_basis || 'Visual markings match'})`
    : (identityFailed
        ? `Item mismatch — ${result.identity_basis || 'Returned item does not match ordered product'}`
        : `Identity uncertain — ${result.identity_basis || 'Cannot confirm authentic markings from photos'}`);

  // 2) Completeness (The single authoritative place for missing items)
  const completenessPassed = result.completeness === 'PASS';
  const missingList = Array.isArray(result.missing) ? result.missing : [];
  const completenessText = completenessPassed
    ? `Complete — all expected parts present (${activeProduct?.expectedParts?.join(', ') || 'All items accounted for'})`
    : (missingList.length > 0
        ? `Missing: ${missingList.join(', ')}`
        : (result.completeness === 'FAIL'
            ? 'Incomplete — required accessory missing'
            : 'Uncertain — could not verify all accessories from photos'));

  // 3) Condition
  const conditionMeta = translateCondition(result.amazon_condition || result.condition, result.observed_state);
  const conditionText = `${conditionMeta.title} (${result.condition_basis || conditionMeta.description})`;

  // 4) Recommended Action
  const actionText = `${actionMeta.title} — ${actionMeta.actionLabel}`;

  return (
    <div className="result-card-container">
      {/* Result Area:
          1) One-line verdict
          2) One-line why
          3) The four check results (identity/completeness/condition/disposition) each one line
      */}
      <section className={`recommendation-hero hero-${actionMeta.heroClass}`} aria-label="Inspection verdict and results">
        {/* 1. ONE-LINE VERDICT */}
        <div className="rec-hero-header">
          <div className="rec-hero-badge">
            <span className="rec-icon" aria-hidden="true">{actionMeta.icon}</span>
            <span className="rec-kicker">Recommended Action</span>
          </div>
        </div>

        <h2 className="rec-hero-title">
          {overrideState ? overrideState.revised_verdict : actionMeta.title}
        </h2>

        {/* Clear contextual finding directly under title (replaces contradictory floating pill) */}
        <div className="rec-context-label">
          {confidenceContextLine}
        </div>

        {/* Override banner if supervisor modified decision */}
        {overrideState && (
          <div className="override-notice-banner">
            <EditIcon size={14} />
            <span>
              Decision updated by operator <strong>{overrideState.operator_id}</strong>: "{overrideState.reason}" (Original AI: {translateDisposition(result.disposition).actionLabel})
            </span>
          </div>
        )}

        {/* 2. ONE-LINE WHY */}
        <div className="rec-why-box">
          <span className="rec-why-label">Why:</span>
          <span className="rec-why-text">{whyExplanation}</span>
        </div>

        {/* 3. THE FOUR CHECK RESULTS (each one line, no duplicate catalogue lists) */}
        <div className="four-checks-card" aria-label="Four core check results">
          {/* Check 1: Identity */}
          <div className="check-row">
            <span className="check-row-label">
              <span className="check-row-icon" aria-hidden="true">
                {identityPassed ? '✅' : (identityFailed ? '❌' : '⚠️')}
              </span>
              <strong>Product check:</strong>
            </span>
            <span className="check-row-value">{identityText}</span>
          </div>

          {/* Check 2: Completeness (Single authoritative place for missing items) */}
          <div className="check-row">
            <span className="check-row-label">
              <span className="check-row-icon" aria-hidden="true">
                {completenessPassed ? '✅' : (missingList.length > 0 || result.completeness === 'FAIL' ? '❌' : '⚠️')}
              </span>
              <strong>Items included:</strong>
            </span>
            <span className="check-row-value">
              {completenessText}
            </span>
          </div>

          {/* Check 3: Condition */}
          <div className="check-row">
            <span className="check-row-label">
              <span className="check-row-icon" aria-hidden="true">
                {conditionMeta.status === 'success' ? '✅' : (conditionMeta.status === 'error' ? '❌' : '⚠️')}
              </span>
              <strong>Condition:</strong>
            </span>
            <span className="check-row-value">{conditionText}</span>
          </div>

          {/* Check 4: Recommended Action */}
          <div className="check-row">
            <span className="check-row-label">
              <span className="check-row-icon" aria-hidden="true">
                {actionMeta.icon}
              </span>
              <strong>Recommended action:</strong>
            </span>
            <span className="check-row-value">{actionText}</span>
          </div>
        </div>
      </section>

      {/* OPERATOR ACTIONS */}
      <section className="operator-actions-section" aria-label="Operator actions">
        <div className="actions-button-row">
          <button
            type="button"
            className="btn-operator-primary"
            onClick={() => setShowSaveConfirm(true)}
            title="Approve and save this recommendation"
          >
            <CheckIcon size={16} />
            <span>{overrideState ? "Confirm updated decision" : "Approve recommendation"}</span>
          </button>

          <button
            type="button"
            className="btn-operator-secondary"
            onClick={onOpenOverrideModal}
            title="Change this decision if you disagree"
          >
            <EditIcon size={15} />
            <span>Change decision</span>
          </button>

          <button
            type="button"
            className="btn-operator-secondary"
            onClick={() => window.print()}
            title="Print inspection sheet"
          >
            <PrintIcon size={15} />
            <span>Print sheet</span>
          </button>

          <button
            type="button"
            className="btn-operator-secondary"
            onClick={onResetInspection}
            title="Start inspection on the next return item"
          >
            <RefreshIcon size={15} />
            <span>Next item</span>
          </button>
        </div>

        {/* Discreet technical audit link */}
        <div className="secondary-tech-link-row">
          <button
            type="button"
            className="link-btn-subtle"
            onClick={onOpenContractModal}
            title="View technical evidence contract for audit verification"
          >
            <CodeIcon size={12} />
            <span>View technical audit record</span>
          </button>
        </div>
      </section>

      {/* CONFIRMATION MODAL BEFORE SAVING */}
      {showSaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowSaveConfirm(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="card-title">Confirm Return Decision</span>
            </div>
            <div className="modal-body" style={{ fontSize: '0.85rem' }}>
              <p style={{ marginBottom: '0.65rem' }}>
                Are you ready to finalize this return with the following action?
              </p>
              <div className="confirm-summary-box">
                <div className="confirm-row">
                  <span>Action:</span>
                  <strong className="confirm-action-name">
                    {actionMeta.icon} {overrideState ? overrideState.revised_verdict : actionMeta.title}
                  </strong>
                </div>
                {overrideState ? (
                  <div className="confirm-override-note">
                    Operator reason: "{overrideState.reason}" (Original AI: {translateDisposition(result.disposition).actionLabel})
                  </div>
                ) : (
                  <div className="confirm-normal-note">
                    {actionMeta.defaultWhy}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowSaveConfirm(false);
                  onSaveToLog();
                }}
              >
                <CheckIcon size={14} />
                <span>Confirm and save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
