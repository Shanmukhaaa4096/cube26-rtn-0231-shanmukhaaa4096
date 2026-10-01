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
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [expandedCard, setExpandedCard] = useState({});

  const toggleCard = (cardKey) => {
    setExpandedCard(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  // Honest Skeleton Loading State (Section 5)
  if (isInspecting) {
    return (
      <div className="ops-card" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div className="skeleton-box" style={{ height: '70px', width: '100%', marginBottom: '1rem' }}></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
            Analyzing inspection photos against catalogue specifications and expected accessories...
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
  const rawErrorText = result.raw_error || (
    (result.confidence_note && (
      result.confidence_note.includes('FAIL_OPEN') ||
      result.confidence_note.includes('GoogleGenerativeAI') ||
      result.confidence_note.includes('Error fetching') ||
      result.confidence_note.includes('503') ||
      result.confidence_note.includes('Model error')
    )) ? result.confidence_note : null
  );
  const isAnalysisFailed = Boolean(rawErrorText);
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

      {/* Uncertainty & Error Advisory Callout */}
      {(isAnalysisFailed || result.confidence_note || isPendingReview) && (
        <div className="uncertainty-callout">
          <AlertIcon size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div className="callout-title">
              {isAnalysisFailed ? "Manual Review Required" : (isPendingReview ? "Pending Manual Review" : "Advisory Note")}
            </div>
            <div className="callout-text">
              {isAnalysisFailed ? (
                <div>
                  <div>Could not analyze — sent for manual review.</div>
                  {rawErrorText && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowTechDetails(!showTechDetails)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b45309',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {showTechDetails ? "Hide technical details ▲" : "Technical details ▼"}
                      </button>
                      {showTechDetails && (
                        <div
                          className="mono"
                          style={{
                            marginTop: '0.35rem',
                            padding: '0.4rem 0.5rem',
                            background: 'rgba(0,0,0,0.06)',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            wordBreak: 'break-all',
                            maxHeight: '120px',
                            overflowY: 'auto'
                          }}
                        >
                          {rawErrorText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                result.confidence_note || "Visual evidence is inconclusive — queued for supervisor review."
              )}
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
            <div style={{ fontWeight: 600, color: result.identity === 'PASS' ? 'var(--disp-restock)' : (result.identity === 'FAIL' ? 'var(--disp-dispose)' : '#b45309'), marginBottom: '2px' }}>
              {result.identity === 'PASS' && (activeProduct ? `Matches ${activeProduct.name}` : "Product identity verified.")}
              {result.identity === 'FAIL' && "Item mismatch — wrong product returned."}
              {result.identity === 'UNCERTAIN' && (isAnalysisFailed ? "Could not analyze — sent for manual review." : "Product identity unconfirmed.")}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {result.identity === 'PASS' && "Visual features and branding align with master specification."}
              {result.identity === 'FAIL' && "Visual features do not match expected catalogue entry."}
              {result.identity === 'UNCERTAIN' && (isAnalysisFailed ? "Automated check unavailable." : "Visual evidence is ambiguous or low resolution.")}
            </div>
            {result.identity_basis && !isAnalysisFailed && (
              <div style={{ marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => toggleCard('identity')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {expandedCard.identity ? "Less ▲" : "Details ▼"}
                </button>
                {expandedCard.identity && (
                  <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>
                    {result.identity_basis}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Check 2: Accessories Check */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">2. Accessories Check</span>
            {getCompletenessBadge(result.completeness)}
          </div>
          <div className="check-explanation">
            <div style={{ fontWeight: 600, color: result.completeness === 'PASS' ? 'var(--disp-restock)' : (result.completeness === 'FAIL' ? 'var(--disp-dispose)' : '#b45309'), marginBottom: '2px' }}>
              {result.completeness === 'PASS' && "All expected accessories present."}
              {result.completeness === 'FAIL' && (
                result.missing?.length > 0
                  ? `Missing: ${result.missing.slice(0, 2).join(', ')}${result.missing.length > 2 ? ` (+${result.missing.length - 2} more)` : ''}`
                  : "One or more expected accessories missing."
              )}
              {result.completeness === 'UNCERTAIN' && (isAnalysisFailed ? "Could not analyze — sent for manual review." : "Accessories check inconclusive.")}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {result.completeness === 'PASS' && "All required parts and documentation verified in parcel."}
              {result.completeness === 'FAIL' && `${result.missing?.length || 1} required accessory item(s) absent from package.`}
              {result.completeness === 'UNCERTAIN' && (isAnalysisFailed ? "Automated check unavailable." : "Photos do not show all contents or compartments.")}
            </div>
            {result.missing?.length > 0 && !isAnalysisFailed && (
              <div style={{ marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => toggleCard('completeness')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {expandedCard.completeness ? "Less ▲" : "Details ▼"}
                </button>
                {expandedCard.completeness && (
                  <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--disp-dispose)' }}>
                    {result.missing.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Check 3: Physical Condition */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">3. Physical Condition</span>
            <span className="badge badge-pass" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
              {result.amazon_condition || result.condition || 'Uncertain'}
            </span>
          </div>
          <div className="check-explanation">
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
              Grade: {result.amazon_condition || result.condition || 'Uncertain'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {(() => {
                const cond = result.amazon_condition || result.condition;
                if (cond === 'New') return "Unopened in original retail packaging with intact factory seals.";
                if (cond === 'Used - Like New') return "Pristine item condition with zero cosmetic wear or marks.";
                if (cond === 'Used - Very Good') return "Minor cosmetic blemishes; fully functional housing.";
                if (cond === 'Used - Good') return "Moderate signs of consistent normal use; fully functional.";
                if (cond === 'Used - Acceptable') return "Noticeable cosmetic wear or scratches; fully functional.";
                if (cond === 'Unacceptable') return "Physical damage, cracked casing, or defect detected.";
                return isAnalysisFailed ? "Could not analyze — sent for manual review." : "Condition cannot be reliably graded from provided photos.";
              })()}
            </div>
            {(result.observed_state || result.condition_basis) && (
              <div style={{ marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => toggleCard('condition')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {expandedCard.condition ? "Less ▲" : "Details ▼"}
                </button>
                {expandedCard.condition && (
                  <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                    <div>Raw observation: <strong className="mono">{result.observed_state || 'opened_unused'}</strong></div>
                    {result.condition_basis && <div style={{ marginTop: '0.15rem' }}>{result.condition_basis}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Check 4: Final Decision */}
        <div className="check-item-box">
          <div className="check-header">
            <span className="check-label">4. Final Decision</span>
            <span className={`badge ${dispMeta.badgeClass}`}>
              {effectiveDisposition}
            </span>
          </div>
          <div className="check-explanation">
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
              {effectiveDisposition === "restock" && "Return to active shelf inventory."}
              {effectiveDisposition === "refurbish" && "Route to prep bay for repackaging."}
              {effectiveDisposition === "liquidate" && "Route to secondary liquidation lot."}
              {effectiveDisposition === "dispose" && "Send to scrap recycling or disposal."}
              {effectiveDisposition === "pending_review" && "Hold for supervisor review."}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {effectiveDisposition === "restock" && "Complete and pristine — 100% margin recovery."}
              {effectiveDisposition === "refurbish" && "Requires accessory replenishment before resale."}
              {effectiveDisposition === "liquidate" && "Cosmetic wear exceeds primary shelf standards."}
              {effectiveDisposition === "dispose" && "Item is defective or unrecoverable scrap."}
              {effectiveDisposition === "pending_review" && (isAnalysisFailed ? "Could not analyze — sent for manual review." : (overrideState ? `Overridden by operator: ${overrideState.reason}` : "Uncertain checks require operator confirmation."))}
            </div>
            {dispMeta.desc && (
              <div style={{ marginTop: '0.3rem' }}>
                <button
                  type="button"
                  onClick={() => toggleCard('decision')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {expandedCard.decision ? "Less ▲" : "Details ▼"}
                </button>
                {expandedCard.decision && (
                  <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                    {dispMeta.desc}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Performance & Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <div>
          {result.is_demo_mode ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.65rem', padding: '1px 6px' }}>
                OFFLINE BENCHMARK
              </span>
              <span>Model: <strong className="mono">{result.model_version}</strong></span>
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '0.65rem', padding: '1px 6px' }}>
                AI CHECK
              </span>
              <span>Model: <strong className="mono">{result.model_version}</strong></span>
            </span>
          )}
        </div>
        <div className="mono">Latency: {result.latency_ms || 0}ms</div>
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
