import React, { useRef, useState } from 'react';
import { CameraIcon, UploadIcon, SearchIcon, CheckIcon, CrossIcon, AlertIcon } from './Icons.jsx';
import { PRODUCT_CATALOGUE } from '../data/catalogue.js';
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
  const [showTestControls, setShowTestControls] = useState(false);

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
            label: `Photo ${prev.length + 1}: ${sanitizeInput(file.name)}`
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <div className="ops-card intake-card">
      <div className="card-header">
        <div className="card-title">
          <CameraIcon size={16} />
          <span>Intake & Inspection</span>
        </div>
        <div className="card-header-badge">
          <span>Item: <strong>{unitId || 'New'}</strong></span>
        </div>
      </div>

      <div className="card-body">
        {/* Order / Tracking Lookup */}
        <div className="input-row form-group">
          <div>
            <label className="form-label" htmlFor="order-input">Order or Tracking Number</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                id="order-input"
                type="text"
                className="form-input"
                placeholder="e.g. ORD-10001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={onLookupOrder}
                title="Look up order details"
              >
                <SearchIcon size={13} />
                <span>Find</span>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="unit-input">Unit or Barcode ID</label>
            <input
              id="unit-input"
              type="text"
              className="form-input"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              placeholder="e.g. UNIT-001"
            />
          </div>
        </div>

        {/* Expected Product Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="sku-select">Expected Product</label>
          <select
            id="sku-select"
            className="form-select"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="">[ Choose product from catalogue ]</option>
            {PRODUCT_CATALOGUE.map(prod => (
              <option key={prod.sku} value={prod.sku}>
                {prod.name} (${prod.retailPrice.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Photo Upload Area */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Inspection Photos ({photos.length} attached)
            </label>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Add front, accessories, and condition angles
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            aria-label="Upload photos of returned item"
          >
            <UploadIcon size={22} className="dropzone-icon" />
            <div className="dropzone-text">Click or drop photos here</div>
            <div className="dropzone-sub">
              Upload clear photos showing the product, accessories, and any visible wear
            </div>
          </div>

          {uploadError && (
            <div className="upload-error-banner" role="alert">
              <AlertIcon size={14} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Photo Gallery Grid */}
          {photos.length > 0 ? (
            <div className="photo-gallery">
              {photos.map((photo, idx) => (
                <div key={idx} className="photo-card">
                  <img src={photo.url || photo} alt={`Inspection photo angle ${idx + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(idx);
                    }}
                    title="Remove this photo"
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    ×
                  </button>
                  <div className="photo-badge">{photo.label || `Photo ${idx + 1}`}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-photos-hint">
              <AlertIcon size={14} />
              <span>No photos attached yet. Add photos to begin checking the item.</span>
            </div>
          )}
        </div>

        {/* Inspection Action Button */}
        <button
          type="button"
          className="btn-inspect"
          onClick={onRunInspection}
          disabled={isInspecting || !selectedSku}
        >
          <CameraIcon size={18} />
          <span>{isInspecting ? "Inspecting item..." : "Start inspection"}</span>
        </button>

        {/* Collapsible Test & Simulation Helpers (for evaluation / testing edge cases) */}
        <div className="test-controls-accordion">
          <button
            type="button"
            className="test-controls-toggle"
            onClick={() => setShowTestControls(!showTestControls)}
          >
            <span>{showTestControls ? "Hide test options" : "Show test options"}</span>
          </button>

          {showTestControls && (
            <div className="test-controls-panel">
              <label className="test-checkbox-label">
                <input
                  type="checkbox"
                  checked={isAmbiguous}
                  onChange={(e) => setIsAmbiguous(e.target.checked)}
                />
                <div>
                  <strong>Simulate unclear photos / ambiguous item</strong>
                  <span className="test-subtext">Tests the human review fallback path</span>
                </div>
              </label>

              <label className="test-checkbox-label">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                />
                <div>
                  <strong>Simulate temporary network error</strong>
                  <span className="test-subtext">Tests safe case preservation when offline</span>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
