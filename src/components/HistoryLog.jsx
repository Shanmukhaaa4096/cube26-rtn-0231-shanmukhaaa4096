import React, { useState } from 'react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  BuildingIcon,
  BoxIcon
} from './Icons.jsx';
import {
  translateDisposition,
  translateVerdict,
  translateCondition,
  ACTION_DEFINITIONS
} from '../utils/userFacingText.js';

export function HistoryLog({
  returnsLog,
  activeTenant,
  onSelectRecord,
  selectedRecordId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('ALL');

  // Tenancy isolation (Query level)
  const tenantRecords = returnsLog.filter(item => item.org_id === activeTenant);

  const filteredRecords = tenantRecords.filter(item => {
    // 5 Dispositions filter
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

  const exportCSV = () => {
    const headers = [
      "Return ID",
      "Unit ID",
      "Facility",
      "Order ID",
      "Product Name",
      "Product Check",
      "Items Check",
      "Condition",
      "Action",
      "Date",
      "Operator"
    ];
    const rows = filteredRecords.map(r => {
      const currentDisp = r.overrides ? r.overrides.revised_verdict : r.disposition;
      const action = translateDisposition(currentDisp);
      const cond = translateCondition(r.amazon_condition || r.condition, r.observed_state);
      const identity = translateVerdict(r.identity);
      const completeness = translateVerdict(r.completeness);

      return [
        r.record_id,
        r.unit_id,
        r.org_id,
        r.order_id,
        `"${r.product_name}"`,
        `"${identity.label}"`,
        `"${completeness.label}"`,
        `"${cond.title}"`,
        `"${action.title}"`,
        r.captured_at,
        r.operator_id
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `returns_log_${activeTenant}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const facilityLabel = activeTenant === 'org_demo_alpha' ? 'Facility Alpha (Main)' : 'Facility Bravo';

  return (
    <div className="ops-card history-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="card-title">
            <FilterIcon size={16} />
            <span>Returns Log & Audit Trail</span>
          </div>
          <div className="tenant-badge-verified">
            <BuildingIcon size={12} />
            <span>
              {facilityLabel} ({filteredRecords.length} items)
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={exportCSV}
          title="Download returns report as CSV"
        >
          <DownloadIcon size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="card-body">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="search-input-wrap">
            <input
              type="text"
              className="form-input"
              placeholder="Search by order number, product name, or item ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search returns records"
            />
            <SearchIcon size={14} className="search-icon-pos" />
          </div>

          <div className="filter-group">
            <label htmlFor="action-filter" className="filter-label">Filter by action:</label>
            <select
              id="action-filter"
              className="form-select action-filter-select"
              value={dispositionFilter}
              onChange={(e) => setDispositionFilter(e.target.value)}
            >
              <option value="ALL">All Actions ({tenantRecords.length})</option>
              {Object.keys(ACTION_DEFINITIONS).map(key => (
                <option key={key} value={key}>
                  {ACTION_DEFINITIONS[key].icon} {ACTION_DEFINITIONS[key].title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop & Tablet Ledger Table */}
        <div className="table-scroll-container table-desktop-view">
          <table className="returns-table" aria-label="Returns audit records">
            <thead>
              <tr>
                <th scope="col">Return ID</th>
                <th scope="col">Order & Item</th>
                <th scope="col">Product</th>
                <th scope="col">Product check</th>
                <th scope="col">Items included</th>
                <th scope="col">Condition</th>
                <th scope="col">Action</th>
                <th scope="col">Date</th>
                <th scope="col" style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <BoxIcon size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <div>No returns match your search or filter.</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const currentDisp = item.overrides ? item.overrides.revised_verdict : item.disposition;
                  const action = translateDisposition(currentDisp);
                  const identity = translateVerdict(item.identity);
                  const completeness = translateVerdict(item.completeness);
                  const cond = translateCondition(item.amazon_condition || item.condition, item.observed_state);
                  const isSelected = selectedRecordId === item.record_id;

                  const dateFormatted = item.captured_at
                    ? new Date(item.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Recent';

                  return (
                    <tr
                      key={item.record_id}
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => onSelectRecord(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {item.record_id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.order_id}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Unit: {item.unit_id}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.product_name}>
                          {item.product_name}
                        </div>
                      </td>

                      <td>
                        <span className={`status-pill ${identity.cssClass}`}>
                          {identity.status === 'pass' && '✓ '}
                          {identity.status === 'fail' && '✗ '}
                          {identity.status === 'uncertain' && '⚠ '}
                          {identity.label}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill ${completeness.cssClass}`}>
                          {completeness.status === 'pass' && '✓ '}
                          {completeness.status === 'fail' && '✗ '}
                          {completeness.status === 'uncertain' && '⚠ '}
                          {completeness.label}
                        </span>
                      </td>

                      <td>
                        <span className="condition-pill">
                          {cond.title}
                        </span>
                      </td>

                      <td>
                        <div className="table-action-badge">
                          <span aria-hidden="true">{action.icon}</span>
                          <span className={`badge ${action.badgeClass}`}>
                            {action.title}
                          </span>
                        </div>
                        {item.overrides && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            (Updated by human)
                          </div>
                        )}
                      </td>

                      <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {dateFormatted}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(item);
                          }}
                          title="View complete inspection report"
                        >
                          <EyeIcon size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (Section 31: Stacked cards on mobile) */}
        <div className="returns-cards-mobile" aria-label="Returns records mobile view">
          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-card)' }}>
              <BoxIcon size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <div>No returns match your search or filter.</div>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const currentDisp = item.overrides ? item.overrides.revised_verdict : item.disposition;
              const action = translateDisposition(currentDisp);
              const identity = translateVerdict(item.identity);
              const completeness = translateVerdict(item.completeness);
              const cond = translateCondition(item.amazon_condition || item.condition, item.observed_state);
              const isSelected = selectedRecordId === item.record_id;
              const dateFormatted = item.captured_at
                ? new Date(item.captured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Recent';

              return (
                <div
                  key={item.record_id}
                  className={`mobile-return-card ${isSelected ? 'row-selected' : ''}`}
                  onClick={() => onSelectRecord(item)}
                >
                  <div className="mobile-return-header">
                    <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.record_id}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dateFormatted}</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    {item.product_name}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <span>Order: <strong>{item.order_id}</strong></span>
                    <span>Unit: <strong>{item.unit_id}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem' }}>
                    <span aria-hidden="true">{action.icon}</span>
                    <span className={`badge ${action.badgeClass}`}>{action.title}</span>
                    {item.overrides && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>(Updated)</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.65rem' }}>
                    <span className={`status-pill ${identity.cssClass}`}>
                      {identity.status === 'pass' && '✓ '}{identity.status === 'fail' && '✗ '}{identity.status === 'uncertain' && '⚠ '}{identity.label}
                    </span>
                    <span className={`status-pill ${completeness.cssClass}`}>
                      {completeness.status === 'pass' && '✓ '}{completeness.status === 'fail' && '✗ '}{completeness.status === 'uncertain' && '⚠ '}{completeness.label}
                    </span>
                    <span className="condition-pill">{cond.title}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRecord(item);
                    }}
                  >
                    <EyeIcon size={13} />
                    <span>View Inspection Details</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
