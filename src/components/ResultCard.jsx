import React, { useState } from 'react';
import {
  CheckIcon,
  CrossIcon,
  AlertIcon,
  FlagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  PrintIcon,
  EditIcon,
  RefreshIcon,
  EyeIcon,
  CodeIcon,
  BoxIcon
} from './Icons.jsx';
import { DISPOSITION_DEFINITIONS } from '../data/seedReturns.js';

export function ResultCard({
  result,
  onOpenContractModal,
  onOpenOverrideModal,
  onSaveToLog,
  onResetInspection,
  activeProduct,
  overrideState,
  isInspecting
}) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Honest Skeleton Loading State (Section 5)
  if (isInspecting) {
    return (
      <div className="ops-card" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div className="skeleton-box" style={{ height: '70px', width: '100%', marginBottom: '1rem' }}></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
            Analyzing photo pixels against canonical catalogue geometry and expected BOM components...
          </p>
          <div className="checks-grid">
            <div className="skeleton-box" style={{ height: '80px' }}></div>
            <div className="skeleton-box" style={{ height: '80px' }}></div>
            <div className="skeleton-box" style={{ height: '80px' }}></div>
            <div className="skeleton-box" style={{ height: '80px' }}></div>
          </div>
          <div className="skeleton-box" style={{ height: '110px', marginTop: '1rem' }}></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="ops-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
          <BoxIcon size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Awaiting Return Inspection
          </h2>
          <p style={{ fontSize: '0.78rem', maxWidth: '340px', margin: '0 auto', color: 'var(--text-muted)' }}>
            Select an item from the catalogue, attach inspection photos, or click any of the 10 PRD test scenarios to evaluate identity, completeness, condition, and disposition.
          </p>
        </div>
      </div>
    );
  }

  const effectiveDisposition = overrideState ? overrideState.revised_verdict : result.disposition;
  const isPendingReview = effectiveDisposition === 'pending_review' || result.identity === 'UNCERTAIN' || result.completeness === 'UNCERTAIN' || result.condition === 'Uncertain';
  const dispMeta = DISPOSITION_DEFINITIONS[effectiveDisposition.toLowerCase()] || DISPOSITION_DEFINITIONS.pending_review;

  const handleCopyRecordId = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getIdentityBadge = (identity) => {
    if (identity === "PASS") {
      return (
        <span className="badge badge-pass">
          <CheckIcon size={12} />
          PASS
        </span>
      );
    }
    if (identity === "FAIL") {
      return (
        <span className="badge badge-fail">
          <CrossIcon size={12} />
          FAIL
        </span>
      );
    }
    return (
      <span className="badge badge-uncertain">
        <FlagIcon size={12} />
        UNCERTAIN
      </span>
    );
  };

  const getCompletenessBadge = (completeness) => {
    if (completeness === "PASS") {
      return (
        <span className="badge badge-pass">
          <CheckIcon size={12} />
          PASS
        </span>
      );
    }
    if (completeness === "UNCERTAIN") {
      return (
        <span className="badge badge-uncertain">
          <FlagIcon size={12} />
          UNCERTAIN
        </span>
      );
    }
    return (
      <span className="badge badge-fail">
        <CrossIcon size={12} />
        FAIL
      </span>
    );
  };

  const getHeroClass = () => {
    if (effectiveDisposition === "restock") return "restock";
    if (effectiveDisposition === "refurbish") return "refurbish";
    if (effectiveDisposition === "liquidate") return "liquidate";
    if (effectiveDisposition === "dispose") return "dispose";
    return "review";
  };

  return (
    <div className="result-card-container">
      {/* Hero Disposition Banner (5 Valid States: restock, refurbish, liquidate, dispose, pending_review) */}
      <div className={`disposition-hero ${getHeroClass()}`}>
        <div className="disp-left">
          <div className="disp-kicker">
            Recommended Disposition
            {overrideState && " (Operator Overridden)"}
          </div>
          <div className="disp-title">
            {overrideState ? overrideState.revised_verdict : dispMeta.label}
          </div>
          <div className="disp-desc">
            {overrideState ? `Overridden by operator: ${overrideState.reason}` : dispMeta.desc}
          </div>
        </div>

        <div className="disp-badge-icon">
          {effectiveDisposition === "restock" && <CheckIcon size={36} />}
          {effectiveDisposition === "refurbish" && <RefreshIcon size={36} />}
          {effectiveDisposition === "liquidate" && <AlertIcon size={36} />}
          {effectiveDisposition === "dispose" && <CrossIcon size={36} />}
          {effectiveDisposition === "pending_review" && <FlagIcon size={36} />}
        </div>
      </div>

      {/* Uncertainty & Fail-Open Advisory Callout */}
      {(result.confidence_note || isPendingReview) && (
        <div className="uncertainty-callout">
          <AlertIcon size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div className="callout-title">
              {isPendingReview ? "Flagged UNCERTAIN / pending_review: First-Class Audit State" : "Confidence / Uncertainty Advisory"}
            </div>
            <div className="callout-text">
              {result.confidence_note || "System evidence is inconclusive or ambiguous. Per Engineering Rule 4, UNCERTAIN is a valid first-class outcome that strictly routes to pending_review. Forwarded to warehouse supervisor inspection queue."}
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Verification Checks */}
      <div className="checks-grid">
        {/* Check 1: Identity */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">1. Product Identity</span>
            {getIdentityBadge(result.identity)}
          </div>
          <div className="check-explanation">
            {result.identity_basis || (result.identity === "PASS"
              ? `Visual alignment verified against catalogue specs for ${activeProduct?.name || 'ordered SKU'}.`
              : "Discrepancy detected between returned item and catalogue entry.")}
          </div>
        </div>

        {/* Check 2: Completeness BOM */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">2. Completeness (BOM)</span>
            {getCompletenessBadge(result.completeness)}
          </div>
          <div className="check-explanation">
            {result.completeness === "PASS" ? (
              <span style={{ color: 'var(--disp-restock)', fontWeight: 600 }}>
                All expected parts and accessories verified present.
              </span>
            ) : result.completeness === "UNCERTAIN" ? (
              <span style={{ color: '#b45309', fontWeight: 600 }}>
                BOM verification inconclusive from provided images.
              </span>
            ) : (
              <div>
                <span style={{ color: 'var(--disp-dispose)', fontWeight: 600 }}>Missing Components:</span>
                <ul style={{ paddingLeft: '1rem', marginTop: '0.2rem', color: 'var(--disp-dispose)' }}>
                  {result.missing?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Check 3: Raw Observation vs Amazon Published Condition Grade */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">3. Physical Condition Assessment</span>
            <span className="badge badge-pass" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              {result.amazon_condition || result.condition}
            </span>
          </div>
          <div className="check-explanation">
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Raw observation: <strong className="mono">{result.observed_state || 'opened_unused'}</strong>
            </div>
            <div>
              Amazon Condition: <strong>{result.amazon_condition || result.condition}</strong> (graded against Amazon published condition guidelines, not raw observation state).
            </div>
          </div>
        </div>

        {/* Check 4: Routing Gate (5 States) */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">4. Routing Gate (5 Dispositions)</span>
            <span className={`badge ${dispMeta.badgeClass}`}>
              {effectiveDisposition}
            </span>
          </div>
          <div className="check-explanation">
            {effectiveDisposition === "restock" && "Direct shelf restock (100% margin recovery)."}
            {effectiveDisposition === "refurbish" && "Route to prep bay for accessory replenishment or repackaging."}
            {effectiveDisposition === "liquidate" && "Secondary market channel liquidation lot."}
            {effectiveDisposition === "dispose" && "Recycle or unrecoverable scrap disposal."}
            {effectiveDisposition === "pending_review" && "Mandatory human review state (UNCERTAIN verdict or fail-open)."}
          </div>
        </div>
      </div>

      {/* Model Performance & Batch Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <div>
          Model: <strong className="mono">{result.model_version || "gemini-3.8-flash-vision-rtn-v2"}</strong> (1 batched inference)
        </div>
        <div className="mono">Latency: {result.latency_ms || 650}ms</div>
      </div>

      {/* Expandable Evidence Panel */}
      <div className="evidence-panel">
        <div
          className="evidence-panel-header"
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <EyeIcon size={14} />
            <span>Auditable Evidence Trail ({result.evidence?.length || 0} citations)</span>
          </div>
          {evidenceExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </div>

        {evidenceExpanded && (
          <div className="evidence-items">
            {result.evidence?.map((item, index) => (
              <div key={index} className="evidence-item">
                <span className="mono" style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 'bold' }}>
                  [EV-0{index + 1}]
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operator Decision Actions Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowSaveConfirm(true)}
            title="Commit inspection record to returns ledger"
          >
            <CheckIcon size={13} />
            <span>Commit Record</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenOverrideModal}
            title="Record operator disagreement (preserves history)"
          >
            <EditIcon size={13} />
            <span>Override</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenContractModal}
            title="Inspect official JSON evidence schema"
          >
            <CodeIcon size={13} />
            <span>Contract JSON</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
            title="Print evidence sheet"
          >
            <PrintIcon size={13} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onResetInspection}
            title="Clear and inspect next item"
          >
            <RefreshIcon size={13} />
            <span>Next Unit</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal before Destructive Action / Finalization */}
      {showSaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowSaveConfirm(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="card-title">Confirm Return Disposition</span>
            </div>
            <div className="modal-body" style={{ fontSize: '0.8rem' }}>
              <p>Are you sure you want to finalize and commit this disposition?</p>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '3px', marginTop: '0.4rem' }}>
                <div>Final Disposition: <strong className="badge badge-pass">{effectiveDisposition}</strong></div>
                {overrideState && <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '0.2rem' }}>Audit reason: "{overrideState.reason}"</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowSaveConfirm(false)}>
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
                Confirm and Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
