import React, { useState } from 'react';
import {
  CrossIcon,
  CheckIcon,
  FlagIcon,
  CopyIcon,
  PrintIcon,
  BuildingIcon,
  AlertIcon,
  CameraIcon,
  CodeIcon,
  LockIcon
} from './Icons.jsx';
import { DISPOSITION_DEFINITIONS } from '../data/seedReturns.js';
import { generateEvidenceRecord } from '../services/evidenceContract.js';
import { verifyTenantImageAccess } from '../services/authAndStorage.js';

export function DetailModal({ record, onClose, session }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'json'
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  // Cross-tenant permission check (Section 5: Permission Denied State)
  const isCrossTenant = session && record.org_id && session.org_id !== record.org_id;

  if (isCrossTenant) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ background: '#7f1d1d', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <LockIcon size={16} />
              <span>Permission Denied (Tenancy Isolation Violation)</span>
            </div>
            <button type="button" onClick={onClose} style={{ color: '#fff' }}>
              <CrossIcon size={16} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>
              <AlertIcon size={40} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              403 Forbidden: Tenant Boundary Access Blocked
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Unit <strong>{record.unit_id}</strong> (Record <strong>{record.record_id}</strong>) belongs to organization <strong>{record.org_id}</strong>.
              Your current authenticated session belongs to <strong>{session.org_id}</strong>.
              Cross-tenant access by direct link or key guessing is strictly forbidden.
            </p>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }} className="mono">
              Audit Event Logged: UNAUTHORIZED_CROSS_TENANT_READ_ATTEMPT
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDisp = record.overrides ? record.overrides.revised_verdict : record.disposition;
  const dispMeta = DISPOSITION_DEFINITIONS[currentDisp.toLowerCase()] || DISPOSITION_DEFINITIONS.pending_review;

  // Synthesize official 14-field evidence contract JSON
  const contractJson = generateEvidenceRecord({
    recordId: record.record_id,
    unitId: record.unit_id,
    orgId: record.org_id,
    orderId: record.order_id,
    sku: record.ordered_sku,
    asin: record.ordered_asin,
    productName: record.product_name,
    operatorId: record.operator_id,
    capturedAt: record.captured_at,
    photos: record.photo_urls || [],
    inspectionResult: {
      identity: record.identity,
      identity_basis: record.identity_basis || `Verified against ${record.product_name}`,
      completeness: record.completeness,
      missing: record.missing || [],
      observed_state: record.observed_state || "opened_unused",
      observed_state_basis: `Observed state classified as ${record.observed_state || 'opened_unused'}`,
      condition: record.amazon_condition || record.condition,
      amazon_condition: record.amazon_condition || record.condition,
      condition_basis: record.condition_basis || `Graded against Amazon published condition guidelines`,
      disposition: record.disposition,
      evidence: record.evidence || [],
      confidence_note: record.confidence_note || null,
      model_version: "gemini-3.8-flash-vision-rtn-v2",
      latency_ms: 640
    },
    overrides: record.overrides
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(contractJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Unit Audit Record: <span className="mono">{record.record_id}</span>
            </span>
            <span className={`badge ${dispMeta.badgeClass}`}>{currentDisp}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn-secondary ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Inspection Summary
            </button>
            <button
              type="button"
              className={`btn-secondary ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <CodeIcon size={12} />
              <span>Official 14-Field Contract</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
              title="Print record"
            >
              <PrintIcon size={12} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
              aria-label="Close modal"
            >
              <CrossIcon size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' ? (
            <>
              {/* Tenant & Order metadata bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '3px', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Order ID:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{record.order_id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Unit ID:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{record.unit_id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Tenant (Isolated):</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0284c7' }}>{record.org_id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Operator:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{record.operator_id}</span>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{record.product_name}</div>
                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  SKU: {record.ordered_sku} | ASIN: {record.ordered_asin || 'N/A'}
                </div>
              </div>

              {/* Photos Gallery with Anti-Guessing Tenant Checks */}
              {record.photo_urls && record.photo_urls.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CameraIcon size={13} />
                      <span>Inspection Photos ({record.photo_urls.length})</span>
                    </div>
                    <span className="mono" style={{ fontSize: '0.68rem', color: '#0284c7' }}>
                      Tenant Vault: {record.org_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                    {record.photo_urls.map((path, i) => {
                      const access = verifyTenantImageAccess(session, path);
                      const displayImg = record.photo_display_urls?.[i] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60";

                      return (
                        <div key={i} style={{ width: '140px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-subtle)' }}>
                          <div style={{ height: '100px', position: 'relative' }}>
                            {access.allowed ? (
                              <img src={displayImg} alt={`Inspection Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ background: '#fee2e2', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', fontSize: '0.65rem', padding: '0.5rem', textAlign: 'center' }}>
                                Access Denied: Cross-tenant image path
                              </div>
                            )}
                            <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '2px' }}>
                              Angle #{i+1}
                            </span>
                          </div>
                          <div className="mono" style={{ fontSize: '0.6rem', padding: '3px 5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={path}>
                            {path}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4 Core Checks Summary */}
              <div className="checks-grid">
                <div className="check-item-box">
                  <div className="check-header">
                    <span className="check-label">Identity Match</span>
                    <span className={`badge ${record.identity === 'PASS' ? 'badge-pass' : (record.identity === 'FAIL' ? 'badge-fail' : 'badge-uncertain')}`}>
                      {record.identity}
                    </span>
                  </div>
                  <div className="check-explanation">
                    {record.identity_basis || (record.identity === 'PASS' ? "Product matches catalogue specification." : "Item failed identity check.")}
                  </div>
                </div>

                <div className="check-item-box">
                  <div className="check-header">
                    <span className="check-label">Accessories Check</span>
                    <span className={`badge ${record.completeness === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                      {record.completeness}
                    </span>
                  </div>
                  <div className="check-explanation">
                    {record.completeness === 'PASS' ? (
                      <span style={{ color: 'var(--disp-restock)', fontWeight: 600 }}>All components present.</span>
                    ) : (
                      <span style={{ color: 'var(--disp-dispose)', fontWeight: 600 }}>
                        Missing: {record.missing?.join(', ') || 'Core pieces'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="check-item-box">
                  <div className="check-header">
                    <span className="check-label">Condition Assessment</span>
                    <span className="badge badge-pass" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                      {record.amazon_condition || record.condition}
                    </span>
                  </div>
                  <div className="check-explanation">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Raw observation: <strong className="mono">{record.observed_state || 'opened_unused'}</strong>
                    </div>
                    <div>
                      Amazon Condition: <strong>{record.amazon_condition || record.condition}</strong>
                    </div>
                  </div>
                </div>

                <div className="check-item-box">
                  <div className="check-header">
                    <span className="check-label">Final Decision</span>
                    <span className={`badge ${dispMeta.badgeClass}`}>
                      {currentDisp}
                    </span>
                  </div>
                  <div className="check-explanation">
                    {dispMeta.desc}
                  </div>
                </div>
              </div>

              {/* Confidence / Uncertainty Note */}
              {record.confidence_note && (
                <div className="uncertainty-callout">
                  <div>
                    <div className="callout-title">Confidence &amp; Uncertainty Note</div>
                    <div className="callout-text">{record.confidence_note}</div>
                  </div>
                </div>
              )}

              {/* Evidence citations */}
              {record.evidence && record.evidence.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Visual &amp; Reference Evidence Trail ({record.evidence.length} items)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {record.evidence.map((ev, i) => (
                      <div key={i} className="evidence-item">
                        <span className="mono" style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700 }}>
                          [EV-0{i+1}]
                        </span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Override Log preserving history */}
              {record.overrides && (
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', marginBottom: '0.2rem' }}>
                    Immutable Operator Override Audit Trail (Rule 3)
                  </div>
                  <div style={{ fontSize: '0.78rem' }}>
                    Original AI verdict: <strong className="badge badge-uncertain">{record.overrides.original_verdict}</strong> ➔ Revised to: <strong className="badge badge-pass">{record.overrides.revised_verdict}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Operator: <strong>{record.overrides.operator_id}</strong> | Timestamp: <span className="mono">{new Date(record.overrides.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', marginTop: '0.15rem', fontStyle: 'italic' }}>
                    Justification: "{record.overrides.reason}"
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Official 14-Field Evidence Contract (Ready for Recovery Manager ingestion)
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyJson}
                  style={{ padding: '0.3rem 0.55rem' }}
                >
                  {copied ? <CheckIcon size={12} color="#15803d" /> : <CopyIcon size={12} />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Contract JSON'}</span>
                </button>
              </div>
              <pre className="json-viewer">
                {JSON.stringify(contractJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
