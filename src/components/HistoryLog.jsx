import React, { useState } from 'react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  CheckIcon,
  CrossIcon,
  FlagIcon,
  BuildingIcon,
  CopyIcon,
  BoxIcon
} from './Icons.jsx';
import { DISPOSITION_DEFINITIONS } from '../data/seedReturns.js';

export function HistoryLog({
  returnsLog,
  activeTenant,
  onSelectRecord,
  selectedRecordId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState('');

  // Tenancy isolation (Query level)
  const tenantRecords = returnsLog.filter(item => item.org_id === activeTenant);

  const filteredRecords = tenantRecords.filter(item => {
    // 5 Dispositions
    if (dispositionFilter !== 'ALL') {
      const currentDisp = item.overrides ? item.overrides.revised_verdict : item.disposition;
      if (currentDisp.toLowerCase() !== dispositionFilter.toLowerCase()) return false;
    }

    // Text Search
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const match =
        (item.order_id && item.order_id.toLowerCase().includes(q)) ||
        (item.unit_id && item.unit_id.toLowerCase().includes(q)) ||
        (item.ordered_sku && item.ordered_sku.toLowerCase().includes(q)) ||
        (item.product_name && item.product_name.toLowerCase().includes(q)) ||
        (item.record_id && item.record_id.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const exportCSV = () => {
    const headers = [
      "Record ID",
      "Unit ID",
      "Tenant",
      "Order ID",
      "SKU",
      "Product",
      "Identity",
      "Completeness",
      "Observed State",
      "Amazon Condition",
      "Disposition",
      "Date",
      "Operator"
    ];
    const rows = filteredRecords.map(r => [
      r.record_id,
      r.unit_id,
      r.org_id,
      r.order_id,
      r.ordered_sku,
      `"${r.product_name}"`,
      r.identity,
      r.completeness,
      r.observed_state || 'opened_unused',
      `"${r.amazon_condition || r.condition}"`,
      r.overrides ? r.overrides.revised_verdict : r.disposition,
      r.captured_at,
      r.operator_id
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `returns_${activeTenant}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDispBadge = (disp) => {
    const key = disp.toLowerCase();
    const meta = DISPOSITION_DEFINITIONS[key] || DISPOSITION_DEFINITIONS.pending_review;
    return (
      <span className={`badge ${meta.badgeClass}`}>
        {disp}
      </span>
    );
  };

  return (
    <div className="ops-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="card-title">
            <FilterIcon size={16} />
            <span>Returns Inspection and Audit Ledger</span>
          </div>
          <div className="tenant-badge-verified" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}>
            <BuildingIcon size={12} />
            <span style={{ fontSize: '0.72rem' }}>
              Tenant: <strong className="mono">{activeTenant}</strong> ({filteredRecords.length} records, 0 cross-tenant leaks)
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={exportCSV}
          title="Export records to CSV"
        >
          <DownloadIcon size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="card-body">
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search Order, Unit ID, SKU, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem' }}
              aria-label="Search returns records"
            />
            <SearchIcon size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Disposition:
            </span>
            {['ALL', 'restock', 'refurbish', 'liquidate', 'dispose', 'pending_review'].map(disp => (
              <button
                key={disp}
                type="button"
                className={`scenario-chip ${dispositionFilter === disp ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                onClick={() => setDispositionFilter(disp)}
              >
                {disp === 'ALL' ? 'All Dispositions' : disp}
              </button>
            ))}
          </div>
        </div>

        {/* UI States (Section 5) */}
        {tenantRecords.length === 0 ? (
          /* Empty State for this organization */
          <div className="state-box">
            <BoxIcon size={36} className="state-icon" />
            <div className="state-title">No returns logged for this organization</div>
            <div className="state-desc">
              Your organization currently has zero processed return records. Switch to the Inspection station to evaluate and commit customer returns.
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          /* No Search Results State */
          <div className="state-box">
            <SearchIcon size={36} className="state-icon" />
            <div className="state-title">No matching records found</div>
            <div className="state-desc">
              No returns in {activeTenant} matched your search query "{searchTerm}". Try clearing the search filter or selecting another disposition.
            </div>
            <button type="button" className="btn-secondary" onClick={() => { setSearchTerm(''); setDispositionFilter('ALL'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="ops-table-container">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Record &amp; Unit ID</th>
                  <th>Order ID</th>
                  <th>Product &amp; SKU</th>
                  <th>Identity</th>
                  <th>Completeness</th>
                  <th>Observed State</th>
                  <th>Amazon Condition</th>
                  <th>Disposition</th>
                  <th>Last Updated</th>
                  <th>Operator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => {
                  const currentDisp = item.overrides ? item.overrides.revised_verdict : item.disposition;
                  const isSelected = selectedRecordId === item.record_id;

                  return (
                    <tr
                      key={item.record_id}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => onSelectRecord(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.record_id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopy(item.record_id); }}
                            title="Copy Record ID"
                            style={{ color: copiedId === item.record_id ? 'var(--disp-restock)' : 'var(--text-muted)' }}
                          >
                            <CopyIcon size={11} />
                          </button>
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {item.unit_id}
                        </div>
                      </td>

                      <td className="mono" style={{ fontWeight: 600 }}>
                        {item.order_id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product_name}
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {item.ordered_sku}
                        </div>
                      </td>

                      <td>
                        {item.identity === 'PASS' && (
                          <span className="badge badge-pass">
                            <CheckIcon size={10} /> PASS
                          </span>
                        )}
                        {item.identity === 'FAIL' && (
                          <span className="badge badge-fail">
                            <CrossIcon size={10} /> FAIL
                          </span>
                        )}
                        {item.identity === 'UNCERTAIN' && (
                          <span className="badge badge-uncertain">
                            <FlagIcon size={10} /> UNCERTAIN
                          </span>
                        )}
                      </td>

                      <td>
                        {item.completeness === 'PASS' ? (
                          <span className="badge badge-pass">PASS</span>
                        ) : item.completeness === 'UNCERTAIN' ? (
                          <span className="badge badge-uncertain">UNCERTAIN</span>
                        ) : (
                          <span className="badge badge-fail" title={item.missing?.join(', ')}>
                            FAIL ({item.missing?.length || 1} missing)
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="mono" style={{ fontSize: '0.72rem', background: 'var(--bg-subtle)', padding: '2px 5px', borderRadius: '2px' }}>
                          {item.observed_state || 'opened_unused'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.amazon_condition || item.condition}
                        </span>
                      </td>

                      <td>
                        {getDispBadge(currentDisp)}
                        {item.overrides && (
                          <span style={{ fontSize: '0.62rem', display: 'block', color: '#6366f1', fontWeight: 600 }}>
                            Overridden
                          </span>
                        )}
                      </td>

                      <td className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(item.captured_at).toLocaleDateString()}
                      </td>

                      <td className="mono" style={{ fontSize: '0.72rem' }}>
                        {item.operator_id}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(item);
                          }}
                        >
                          <EyeIcon size={11} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
