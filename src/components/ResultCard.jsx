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
  translatePhotoQuality,
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
        <h2 className="loading-state-title">Checking the return...</h2>
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
        <h2 className="empty-state-title">No return selected</h2>
        <p className="empty-state-desc">
          Select a returned item to start an inspection.
        </p>
      </div>
    );
  }

  // Active decision translation
  const effectiveDisposition = overrideState ? overrideState.revised_verdict : result.disposition;
  const actionMeta = translateDisposition(effectiveDisposition);
  const confidenceMeta = translateConfidence(result.confidence, result.confidenceGating);
  const conditionMeta = translateCondition(result.amazon_condition || result.condition, result.observed_state);
  const photoQualityMeta = translatePhotoQuality(result.image_quality);
  const whyExplanation = generateRecommendationWhy(result, effectiveDisposition, overrideState, activeProduct);
  const isHumanCheckNeeded = effectiveDisposition === 'pending_review';

  // Product check status
  const identityPassed = result.identity === 'PASS';
  const identityFailed = result.identity === 'FAIL';
  const productStatusLabel = identityPassed ? 'Looks correct' : (identityFailed ? 'Problem found' : 'Not clear');
  const productStatusClass = identityPassed ? 'status-tag-pass' : (identityFailed ? 'status-tag-fail' : 'status-tag-uncertain');

  // Included items calculation (The single authoritative place for items info)
  const expectedItems = activeProduct?.expectedParts || [];
  const missingItems = Array.isArray(result.missing) ? result.missing : [];
  const foundItems = expectedItems.filter(item => !missingItems.includes(item));
  const hasMissing = missingItems.length > 0;
  const completenessPassed = result.completeness === 'PASS';

  // Contextual confidence description directly under title (replaces contradictory floating badge)
  const confidenceContextLine = isHumanCheckNeeded
    ? (identityFailed
        ? 'High confidence: item mismatch'
        : (result.identity === 'UNCERTAIN'
            ? 'Low confidence: item identity inconclusive'
            : (hasMissing
                ? 'High confidence: missing required items'
                : (result.image_quality?.is_blurry || result.image_quality?.glare_detected
                    ? 'Low confidence: photo clarity insufficient'
                    : 'Manual checking required: visual evidence inconclusive'))))
    : (confidenceMeta.level === 'High'
        ? 'High confidence: return verified'
        : `${confidenceMeta.level} confidence: inspection complete`);

  return (
    <div className="result-card-container">
      {/* HEADER: Inspection Complete + Product Title */}
      <section className="result-complete-header" aria-label="Inspection verdict header">
        <div className="result-kicker-row">
          <span className="result-kicker">Inspection complete</span>
          {(orderId || unitId) && (
            <span className="result-meta-ids mono">
              {orderId && <span>Order: {orderId}</span>}
              {unitId && <span> | Unit: {unitId}</span>}
            </span>
          )}
        </div>
        <h2 className="result-product-title">{activeProduct?.name || 'Returned Product'}</h2>
      </section>

      {/* WHAT WE FOUND (Section 79 Specification) */}
      <section className="what-we-found-card" aria-label="What we found">
        <h3 className="sub-section-title">What we found</h3>

        <div className="findings-rows-list">
          {/* 1. Product check */}
          <div className="finding-row-item">
            <span className="finding-row-label">Product</span>
            <div className="finding-row-content">
              <span className={`status-badge-clean ${productStatusClass}`}>
                {productStatusLabel}
              </span>
              <span className="finding-row-desc">
                {identityPassed
                  ? `Matches catalogue item specifications (${result.identity_basis || 'Visual markings match'})`
                  : (identityFailed
                      ? `Returned item does not match catalogue item (${result.identity_basis || 'Markings or form factor mismatch'})`
                      : `Identity uncertain (${result.identity_basis || 'Cannot confirm authentic markings from photos'})`)}
              </span>
            </div>
          </div>

          {/* 2. Included items (No checkmark bullets; uses clear Found/Missing status labels) */}
          <div className="finding-row-item">
            <span className="finding-row-label">Included items</span>
            <div className="finding-row-content">
              <span className={`status-badge-clean ${!hasMissing && completenessPassed ? 'status-tag-pass' : (hasMissing ? 'status-tag-fail' : 'status-tag-uncertain')}`}>
                {hasMissing
                  ? `${foundItems.length} found, ${missingItems.length} missing`
                  : (completenessPassed ? `All ${expectedItems.length || 'expected'} items found` : 'Not clear')}
              </span>
              <div className="items-breakdown-list">
                {missingItems.map(item => (
                  <div key={item} className="item-line item-line-missing">
                    <span className="item-status-tag tag-missing">Missing</span>
                    <span className="item-name">{item}</span>
                  </div>
                ))}
                {foundItems.map(item => (
                  <div key={item} className="item-line item-line-found">
                    <span className="item-status-tag tag-found">Found</span>
                    <span className="item-name">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Condition */}
          <div className="finding-row-item">
            <span className="finding-row-label">Condition</span>
            <div className="finding-row-content">
              <span className="status-badge-clean status-tag-neutral">
                {conditionMeta.title}
              </span>
              <span className="finding-row-desc">
                {result.condition_basis || conditionMeta.description}
              </span>
            </div>
          </div>

          {/* 4. Photos */}
          <div className="finding-row-item">
            <span className="finding-row-label">Photos</span>
            <div className="finding-row-content">
              <span className={`status-badge-clean ${photoQualityMeta.isGood ? 'status-tag-pass' : 'status-tag-uncertain'}`}>
                {photoQualityMeta.isGood ? 'Clear enough' : 'Not clear enough'}
              </span>
              <span className="finding-row-desc">
                {photoQualityMeta.headline}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDATION (Section 79 Specification) */}
      <section className={`recommendation-box hero-${actionMeta.heroClass}`} aria-label="Recommendation">
        <div className="rec-box-header">
          <span className="rec-box-kicker">Recommendation</span>
          <span className="rec-context-sub">{confidenceContextLine}</span>
        </div>

        <h3 className="rec-action-heading">
          {overrideState ? overrideState.revised_verdict : actionMeta.title}
        </h3>

        <p className="rec-action-why">
          {whyExplanation}
        </p>

        {overrideState && (
          <div className="override-notice-banner">
            <EditIcon size={14} />
            <span>
              Decision updated by operator <strong>{overrideState.operator_id}</strong>: "{overrideState.reason}" (Original AI: {translateDisposition(result.disposition).actionLabel})
            </span>
          </div>
        )}
      </section>

      {/* HOW SURE ARE WE? (Section 79 Specification) */}
      <section className="confidence-assessment-box" aria-label="How sure are we">
        <div className="confidence-assessment-header">
          <span className="confidence-q-title">How sure are we?</span>
          <span className={`confidence-level-tag level-${confidenceMeta.level.toLowerCase()}`}>
            {confidenceMeta.level}
          </span>
        </div>
        <p className="confidence-assessment-text">
          {confidenceMeta.description}
        </p>
      </section>

      {/* OPERATOR ACTIONS */}
      <section className="operator-actions-section" aria-label="Operator actions">
        <div className="actions-button-row">
          <button
            type="button"
            className="btn-operator-primary"
            onClick={() => setShowSaveConfirm(true)}
            title="Approve recommendation and save this return"
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
                    {overrideState ? overrideState.revised_verdict : actionMeta.title}
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
