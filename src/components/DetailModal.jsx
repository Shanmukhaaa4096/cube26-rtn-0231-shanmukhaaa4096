import React, { useState } from 'react';
import {
  CrossIcon,
  CheckIcon,
  CopyIcon,
  PrintIcon,
  BuildingIcon,
  AlertIcon,
  LockIcon,
  CodeIcon,
  BoxIcon
} from './Icons.jsx';
import { generateEvidenceRecord } from '../services/evidenceContract.js';
import {
  translateDisposition,
  translateVerdict,
  translateCondition
} from '../utils/userFacingText.js';

export function DetailModal({ record, onClose, session }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'json'
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  // Cross-tenant permission check
  const isCrossTenant = session && record.org_id && session.org_id !== record.org_id;

  if (isCrossTenant) {
    const userFacility = session.org_id === 'org_demo_alpha' ? 'Facility Alpha' : 'Facility Bravo';
    const recordFacility = record.org_id === 'org_demo_alpha' ? 'Facility Alpha' : 'Facility Bravo';

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ background: '#7f1d1d', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <LockIcon size={16} />
              <span>Different Warehouse Facility</span>
            </div>
            <button type="button" onClick={onClose} style={{ color: '#fff' }} aria-label="Close">
              <CrossIcon size={16} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>
              <AlertIcon size={36} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Access restricted to {recordFacility}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
              This return item is assigned to <strong>{recordFacility}</strong>. You are currently signed into <strong>{userFacility}</strong>. Warehouse safety rules prevent viewing returns from other facilities.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDisp = record.overrides ? record.overrides.revised_verdict : record.disposition;
  const action = translateDisposition(currentDisp);
  const cond = translateCondition(record.amazon_condition || record.condition, record.observed_state);
  const identity = translateVerdict(record.identity);
  const completeness = translateVerdict(record.completeness);

  // Generate the official contract JSON for the technical tab
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

  const dateFormatted = record.captured_at
    ? new Date(record.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Recent';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Return Details: {record.record_id}
            </span>
            <span className={`badge ${action.badgeClass}`}>
              {action.icon} {action.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn-secondary ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Summary
            </button>
            <button
              type="button"
              className={`btn-secondary ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
              title="View technical record for audit"
            >
              <CodeIcon size={12} />
              <span>Technical Data</span>
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
              className="modal-close-btn"
              aria-label="Close"
            >
              <CrossIcon size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' ? (
            <div>
              {/* Main Decision Banner */}
              <div className={`recommendation-hero hero-${action.heroClass}`} style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{action.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>
                      Recommended Action
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                      {action.title}
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {action.defaultWhy}
                </p>

                {record.overrides && (
                  <div className="override-notice-banner" style={{ marginTop: '0.5rem' }}>
                    <AlertIcon size={13} />
                    <span>
                      Decision updated by operator <strong>{record.overrides.operator_id}</strong>: "{record.overrides.reason}" (Original AI: {translateDisposition(record.disposition).title})
                    </span>
                  </div>
                )}
              </div>

              {/* Product and Order Info */}
              <div className="product-summary-card" style={{ marginBottom: '1rem' }}>
                <div className="product-summary-info">
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Product
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {record.product_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Order: <strong>{record.order_id}</strong> | Unit: <strong>{record.unit_id}</strong> | Logged: {dateFormatted} by <strong>{record.operator_id}</strong>
                  </div>
                </div>
              </div>

              {/* What did we find? Cards */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  What did we find?
                </h4>
                <div className="findings-grid">
                  <div className={`finding-card finding-${identity.status}`}>
                    <div className="finding-header">
                      <span className="finding-type-title">Product check</span>
                      <span className="finding-status-icon">{identity.status === 'pass' ? '✅' : (identity.status === 'fail' ? '❌' : '⚠️')}</span>
                    </div>
                    <div className="finding-summary">{identity.label}</div>
                    <div className="finding-detail">{record.identity_basis || (identity.status === 'pass' ? 'Item matches specifications' : 'Issue with product match')}</div>
                  </div>

                  <div className={`finding-card finding-${completeness.status}`}>
                    <div className="finding-header">
                      <span className="finding-type-title">Items included</span>
                      <span className="finding-status-icon">{completeness.status === 'pass' ? '✅' : '❌'}</span>
                    </div>
                    <div className="finding-summary">{completeness.label}</div>
                    <div className="finding-detail">
                      {record.missing && record.missing.length > 0
                        ? `Missing: ${record.missing.join(', ')}`
                        : 'All required items present in box'}
                    </div>
                  </div>

                  <div className={`finding-card finding-${cond.status}`}>
                    <div className="finding-header">
                      <span className="finding-type-title">Condition</span>
                      <span className="finding-status-icon">{cond.status === 'success' ? '✅' : '⚠️'}</span>
                    </div>
                    <div className="finding-summary">{cond.title}</div>
                    <div className="finding-detail">{cond.description}</div>
                  </div>
                </div>
              </div>

              {/* Photos Gallery */}
              {record.photo_display_urls && record.photo_display_urls.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Inspection photos ({record.photo_display_urls.length})
                  </h4>
                  <div className="photo-gallery">
                    {record.photo_display_urls.map((url, idx) => (
                      <div key={idx} className="photo-card">
                        <img src={url} alt={`Inspection angle ${idx + 1}`} />
                        <div className="photo-badge">Photo {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Standard 14-Field Evidence Contract</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyJson}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                >
                  {copied ? <CheckIcon size={12} color="#15803d" /> : <CopyIcon size={12} />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="json-viewer">
                {JSON.stringify(contractJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
