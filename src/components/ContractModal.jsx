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
    dlAnchor.setAttribute("download", `${contractData.record_id}_evidence_contract.json`);
    dlAnchor.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="card-title">
            <CodeIcon size={16} />
            <span>Official Evidence Contract Payload (<span className="mono">{contractData.record_id}</span>)</span>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close contract modal">
            <CrossIcon size={15} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Schema: <strong>{contractData.schema_version}</strong> | Agent: <strong>{contractData.agent}</strong></span>
            <span className="mono">Hash: {contractData.content_hash}</span>
          </div>

          <pre className="json-viewer">
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
            <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
