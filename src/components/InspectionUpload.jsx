import React, { useRef, useState } from 'react';
import { CameraIcon, UploadIcon, SearchIcon, CheckIcon, CrossIcon, BoxIcon, AlertIcon } from './Icons.jsx';
import { PRODUCT_CATALOGUE } from '../data/catalogue.js';
import { OBSERVED_STATES, AMAZON_CONDITIONS } from '../data/seedReturns.js';
import { validateAndStageUpload, sanitizeInput } from '../services/authAndStorage.js';

export function InspectionUpload({
  orderId,
  setOrderId,
  selectedSku,
  setSelectedSku,
  unitId,
  setUnitId,
  photos,
  setPhotos,
  activeProduct,
  missingParts,
  setMissingParts,
  observedState,
  setObservedState,
  amazonCondition,
  setAmazonCondition,
  isAmbiguous,
  setIsAmbiguous,
  simulateFailure,
  setSimulateFailure,
  onRunInspection,
  isInspecting,
  onLookupOrder,
  session
}) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = (e) => {
    setUploadError('');
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const validation = validateAndStageUpload(file, session, unitId);
      if (!validation.valid) {
        setUploadError(validation.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [
          ...prev,
          {
            url: event.target.result,
            tenant_path: validation.tenant_path,
            label: `Upload: ${sanitizeInput(file.name)}`
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const togglePartMissing = (part) => {
    if (missingParts.includes(part)) {
      setMissingParts(missingParts.filter(p => p !== part));
    } else {
      setMissingParts([...missingParts, part]);
    }
  };

  return (
    <div className="ops-card">
      <div className="card-header">
        <div className="card-title">
          <CameraIcon size={16} />
          <span>Intake and Inspection Station</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono" style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
            AI Check
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            UNIT: {unitId || 'PENDING'}
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* Order ID & Lookup */}
        <div className="input-row form-group">
          <div>
            <label className="form-label" htmlFor="order-input">Customer Order ID / Tracking</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                id="order-input"
                type="text"
                className="form-input mono"
                placeholder="e.g. ORD-DUMMY-50018 or ORD-SCEN-10001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={onLookupOrder}
                title="Lookup order from database"
              >
                <SearchIcon size={13} />
                <span>Lookup</span>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="unit-input">Unit Serial ID</label>
            <input
              id="unit-input"
              type="text"
              className="form-input mono"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              placeholder="e.g. UNIT-0018"
            />
          </div>
        </div>

        {/* Product Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="sku-select">Catalogue Product (Sold ASIN/SKU)</label>
          <select
            id="sku-select"
            className="form-select"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="">[ Select or Search Catalogue Entry ]</option>
            {PRODUCT_CATALOGUE.map(prod => (
              <option key={prod.sku} value={prod.sku}>
                [{prod.sku}] {prod.name} (${prod.retailPrice.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Catalogue Reference Card */}
        {activeProduct && (
          <div className="catalogue-preview">
            <img
              src={activeProduct.imageUrl}
              alt={`Reference photo for ${activeProduct.name}`}
              className="catalogue-thumb"
            />
            <div className="catalogue-details">
              <div className="catalogue-name">{activeProduct.name}</div>
              <div className="catalogue-meta mono">
                SKU: {activeProduct.sku} | ASIN: {activeProduct.asin} | Category: {activeProduct.category}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                {activeProduct.description}
              </p>

              <div style={{ marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Expected Accessories (Click to flag missing):
                </span>
                <div className="parts-pills">
                  {activeProduct.expectedParts.map(part => {
                    const isMissing = missingParts.includes(part);
                    return (
                      <button
                        type="button"
                        key={part}
                        onClick={() => togglePartMissing(part)}
                        className={`part-pill ${isMissing ? 'badge-fail' : 'badge-pass'}`}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        title={isMissing ? "Flagged MISSING" : "Confirmed PRESENT"}
                      >
                        {isMissing ? <CrossIcon size={10} /> : <CheckIcon size={10} />}
                        <span>{part}</span>
                        {isMissing && <span style={{ fontWeight: '700' }}>(MISSING)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload Zone */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Return Item Photographs ({photos.length} attached)
            </label>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              10MB max, JPEG/PNG/WEBP (Tenant-Isolated)
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />

          <div
            className="dropzone-box"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon size={20} className="dropzone-icon" />
            <div className="dropzone-text">Click or Drag and Drop Inspection Photos</div>
            <div className="dropzone-sub">
              Validated server-side and routed into authenticated organization storage vault
            </div>
          </div>

          {uploadError && (
            <div style={{ color: '#b91c1c', fontSize: '0.72rem', marginTop: '0.35rem', fontWeight: 600 }}>
              {uploadError}
            </div>
          )}

          {/* Photo Gallery Grid */}
          {photos.length > 0 && (
            <div className="photo-gallery">
              {photos.map((photo, idx) => (
                <div key={idx} className="photo-card">
                  <img src={photo.url || photo} alt={`Evidence photo angle ${idx + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(idx);
                    }}
                    title="Remove photo"
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    ×
                  </button>
                  <div className="photo-badge">{photo.label || `Angle #${idx + 1}`}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Condition Inputs: Separate Raw Observation vs Amazon Published Condition Scale */}
        <div className="input-row form-group">
          <div>
            <label className="form-label" htmlFor="observed-select">
              1. Raw Physical Observation (observed_state)
            </label>
            <select
              id="observed-select"
              className="form-select"
              value={observedState}
              onChange={(e) => setObservedState(e.target.value)}
            >
              {OBSERVED_STATES.map(obs => (
                <option key={obs.id} value={obs.id}>
                  {obs.label}: {obs.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="amazon-select">
              2. Amazon Published Condition Scale (amazon_condition)
            </label>
            <select
              id="amazon-select"
              className="form-select"
              value={amazonCondition}
              onChange={(e) => setAmazonCondition(e.target.value)}
            >
              {AMAZON_CONDITIONS.map(cond => (
                <option key={cond.id} value={cond.id}>
                  {cond.label}: {cond.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Engineering Flags: Ambiguity & Fail-Open */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
          <label className="ambiguity-toggle" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAmbiguous}
              onChange={(e) => setIsAmbiguous(e.target.checked)}
            />
            <div>
              <span style={{ fontWeight: '600' }}>Flag Ambiguity (UNCERTAIN)</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Forces UNCERTAIN check and pending_review.
              </span>
            </div>
          </label>

          <label className="ambiguity-toggle" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            <div>
              <span style={{ fontWeight: '600' }}>Simulate Fail-Open Timeout</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Preserves case and routes to pending_review.
              </span>
            </div>
          </label>
        </div>

        {/* Run Batched AI Inspection Button */}
        <button
          type="button"
          className="btn-inspect"
          onClick={onRunInspection}
          disabled={isInspecting || !selectedSku}
        >
          <CameraIcon size={16} />
          <span>{isInspecting ? "Executing AI Returns Inspection..." : "Run AI Returns Inspection"}</span>
        </button>

        {isInspecting && (
          <div style={{ marginTop: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Evaluating Identity, Accessories, Physical Condition, and Final Decision...</span>
          </div>
        )}
      </div>
    </div>
  );
}
