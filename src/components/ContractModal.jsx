import React, { useState } from 'react';
import { CrossIcon, CodeIcon, CopyIcon, CheckIcon, DownloadIcon } from './Icons.jsx';

export function ContractModal({ isOpen, onClose, contractData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !contractData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(contractData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contractData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${contractData.record_id}_audit_contract.json`);
    dlAnchor.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title">
            <CodeIcon size={16} />
            <span>Technical Audit Record ({contractData.record_id})</span>
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

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span>Schema: <strong>{contractData.schema_version}</strong></span>
            <span className="mono" style={{ fontSize: '0.7rem' }}>Hash: {contractData.content_hash}</span>
          </div>

          <pre className="json-viewer" aria-label="Raw audit record JSON">
            {JSON.stringify(contractData, null, 2)}
          </pre>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={handleDownload}>
            <DownloadIcon size={13} />
            <span>Download JSON</span>
          </button>
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? <CheckIcon size={13} color="#15803d" /> : <CopyIcon size={13} />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
