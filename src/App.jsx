import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { ScenariosStrip } from './components/ScenariosStrip.jsx';
import { InspectionUpload } from './components/InspectionUpload.jsx';
import { ResultCard } from './components/ResultCard.jsx';
import { HistoryLog } from './components/HistoryLog.jsx';
import { DetailModal } from './components/DetailModal.jsx';
import { OverrideModal } from './components/OverrideModal.jsx';
import { ContractModal } from './components/ContractModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { PrivacyModal, TermsModal, FAQModal } from './components/FooterModals.jsx';
import { ArrowUpIcon, AlertIcon, CheckIcon, CameraIcon, ListIcon, BookIcon } from './components/Icons.jsx';

import { PRODUCT_CATALOGUE, getProductBySku } from './data/catalogue.js';
import { INITIAL_RETURNS_LOG, generateTenantImageUri } from './data/seedReturns.js';
import { PRD_TEST_SCENARIOS } from './data/testScenarios.js';
import { inspectReturnApi } from './services/inspectionService.js';
import { generateEvidenceRecord } from './services/evidenceContract.js';
import { getTenantReturns } from './services/authAndStorage.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('inspection'); // 'inspection' | 'history' | 'catalogue'

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('returns_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('returns_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('returns_theme', 'light');
    }
  }, [darkMode]);

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine !== false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Back to Top button scroll listener
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowBackToTop(true);
      else setShowBackToTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Authenticated Session State (Security & Tenancy Isolation)
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('returns_operator_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      token: "tok_org_demo_alpha_op_fatima_init",
      username: "op_fatima",
      fullName: "Fatima Al-Mansoor",
      org_id: "org_demo_alpha",
      role: "operator",
      expiresAt: Date.now() + (30 * 60 * 1000)
    };
  });

  const activeTenant = session?.org_id || "org_demo_alpha";

  // Returns Ledger (Persisted in localStorage with seed fallback)
  const [returnsLog, setReturnsLog] = useState(() => {
    const saved = localStorage.getItem('returns_manager_ledger_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_RETURNS_LOG;
  });

  useEffect(() => {
    localStorage.setItem('returns_manager_ledger_v3', JSON.stringify(returnsLog));
  }, [returnsLog]);

  // Inspection Input State
  const [orderId, setOrderId] = useState('ORD-10001');
  const [unitId, setUnitId] = useState('UNIT-001');
  const [selectedSku, setSelectedSku] = useState('SKU-HEADPHONE-BT');
  const [photos, setPhotos] = useState([
    {
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
      tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 1),
      label: "Photo 1: Headphone and molded carrying case"
    },
    {
      url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80",
      tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 2),
      label: "Photo 2: Cables, adapters, and manuals"
    }
  ]);
  const [missingParts, setMissingParts] = useState([]);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState(1);

  // Inspection Results State
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [overrideState, setOverrideState] = useState(null);

  // Modals & Navigation
  const [detailRecord, setDetailRecord] = useState(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Active product derived from catalogue (single source of truth)
  const activeProduct = getProductBySku(selectedSku);

  // Run initial inspection on mount
  useEffect(() => {
    handleRunInspection();
  }, []);

  // Compute live operational stats for active tenant
  const tenantItems = returnsLog.filter(item => item.org_id === activeTenant);
  const restockItems = tenantItems.filter(item => {
    const disp = item.overrides ? item.overrides.revised_verdict : item.disposition;
    return disp === 'restock';
  });
  const reviewItems = tenantItems.filter(item => {
    const disp = item.overrides ? item.overrides.revised_verdict : item.disposition;
    return disp === 'pending_review' || item.identity === 'UNCERTAIN' || item.condition === 'Uncertain';
  });
  const completedItems = tenantItems.filter(item => {
    const disp = item.overrides ? item.overrides.revised_verdict : item.disposition;
    return disp !== 'pending_review' && item.identity !== 'UNCERTAIN' && item.condition !== 'Uncertain';
  });

  // Unified Inspection Execution
  const handleRunInspection = async (overridePhotos = null, overrideSku = null, overrideOrderId = null) => {
    const targetSku = overrideSku || selectedSku;
    if (!targetSku) return;

    setIsInspecting(true);
    setOverrideState(null);

    try {
      const targetPhotos = overridePhotos || photos;
      const targetOrderId = overrideOrderId || orderId;

      const result = await inspectReturnApi({
        sku: targetSku,
        orderId: targetOrderId,
        photos: targetPhotos,
        session,
        manualAmbiguityFlag: isAmbiguous,
        simulateFailure: simulateFailure
      });

      setInspectionResult(result);
    } catch (err) {
      console.error("Inspection error:", err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Quick Load Sample Case (Populates inputs and runs inspection)
  const handleSelectScenario = (scenario) => {
    setActiveScenarioId(scenario.id);
    setOrderId(scenario.orderId);
    setUnitId(scenario.unitId);
    setSelectedSku(scenario.sku);
    setPhotos(scenario.photos);
    setMissingParts([]);
    setIsAmbiguous(scenario.id === 9);
    setSimulateFailure(false);

    handleRunInspection(scenario.photos, scenario.sku, scenario.orderId);
  };

  // Order Lookup
  const handleLookupOrder = () => {
    const foundScenario = PRD_TEST_SCENARIOS.find(s => s.orderId.toLowerCase() === orderId.toLowerCase());
    if (foundScenario) {
      handleSelectScenario(foundScenario);
      return;
    }

    const queryResult = getTenantReturns(session, returnsLog);
    const foundPast = queryResult.records.find(r => r.order_id.toLowerCase() === orderId.toLowerCase());

    if (foundPast) {
      setSelectedSku(foundPast.ordered_sku);
      setUnitId(foundPast.unit_id);
      setMissingParts(foundPast.missing || []);
      setPhotos(foundPast.photo_urls?.map((path, idx) => ({
        url: foundPast.photo_display_urls?.[idx] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        tenant_path: path,
        label: `Past Inspection Photo #${idx+1}`
      })) || []);
      setActiveScenarioId(null);
      handleRunInspection(null);
      return;
    }

    alert(`Order ID "${orderId}" not found in current facility records.`);
  };

  // Save Return Record to Ledger
  const handleSaveToLog = () => {
    if (!inspectionResult || !activeProduct) return;

    const newRecordId = `RTN-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newRecord = {
      record_id: newRecordId,
      unit_id: unitId || `UNIT-${newRecordId.replace('RTN-', '')}`,
      org_id: activeTenant,
      order_id: orderId,
      ordered_sku: activeProduct.sku,
      ordered_asin: activeProduct.asin,
      product_name: activeProduct.name,
      identity: inspectionResult.identity,
      identity_basis: inspectionResult.identity_basis,
      completeness: inspectionResult.completeness,
      missing: inspectionResult.missing,
      observed_state: inspectionResult.observed_state,
      amazon_condition: inspectionResult.amazon_condition,
      condition: inspectionResult.amazon_condition,
      condition_basis: inspectionResult.condition_basis,
      disposition: inspectionResult.disposition,
      evidence: inspectionResult.evidence,
      confidence_note: inspectionResult.confidence_note,
      photo_urls: photos.map((p, idx) => p.tenant_path || generateTenantImageUri(activeTenant, unitId || newRecordId, idx+1)),
      photo_display_urls: photos.map(p => p.url || p),
      operator_id: session.fullName || session.username,
      captured_at: new Date().toISOString(),
      status: overrideState ? "OVERRIDDEN" : (inspectionResult.disposition === 'pending_review' ? "PENDING_REVIEW" : "FINALIZED"),
      overrides: overrideState
    };

    setReturnsLog([newRecord, ...returnsLog]);
    setSaveSuccessMsg(`Return record ${newRecordId} saved to log.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Reset Form for Next Return
  const handleResetInspection = () => {
    setInspectionResult(null);
    setOverrideState(null);
    setActiveScenarioId(null);
    setOrderId(`ORD-${Math.floor(50000 + Math.random() * 40000)}`);
    setUnitId(`UNIT-${Math.floor(100 + Math.random() * 899)}`);
    setMissingParts([]);
    setPhotos([]);
    setIsAmbiguous(false);
    setSimulateFailure(false);
  };

  // Handle Login Switcher
  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
    localStorage.setItem('returns_operator_session', JSON.stringify(newSession));
    setSaveSuccessMsg(`Signed in as ${newSession.fullName || newSession.username}`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Current Contract Payload
  const currentContractData = inspectionResult && activeProduct ? generateEvidenceRecord({
    recordId: `RTN-ACTIVE`,
    unitId: unitId || "UNIT-TEMP",
    orgId: activeTenant,
    orderId: orderId,
    sku: activeProduct.sku,
    asin: activeProduct.asin,
    productName: activeProduct.name,
    operatorId: session.username,
    photos: photos,
    inspectionResult: inspectionResult,
    overrides: overrideState
  }) : null;

  return (
    <div className="app-container">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner" role="alert">
          <AlertIcon size={14} />
          <span>Offline: Internet connection disconnected. Saved returns will be stored locally.</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTenant={activeTenant}
        onSelectTenant={(t) => {
          const targetUser = t === "org_demo_alpha" ? "op_fatima" : "op_chen";
          const newSession = {
            token: `tok_${t}_${targetUser}`,
            username: targetUser,
            fullName: targetUser === "op_fatima" ? "Fatima Al-Mansoor" : "Chen Wei",
            org_id: t,
            role: "operator",
            expiresAt: Date.now() + (30 * 60 * 1000)
          };
          handleLoginSuccess(newSession);
        }}
        session={session}
        stats={{
          totalProcessed: tenantItems.length,
          restockCount: restockItems.length,
          uncertainCount: reviewItems.length,
          completedCount: completedItems.length
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Mobile navigation">
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('inspection'); setIsMobileMenuOpen(false); }}
          >
            <span>Returns (Inspection)</span>
            <span className="mono">01</span>
          </button>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('attention'); setIsMobileMenuOpen(false); }}
          >
            <span>Needs Attention ({reviewItems.length})</span>
            <span className="mono">02</span>
          </button>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
          >
            <span>Completed ({completedItems.length})</span>
            <span className="mono">03</span>
          </button>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('catalogue'); setIsMobileMenuOpen(false); }}
          >
            <span>Catalogue ({PRODUCT_CATALOGUE.length})</span>
            <span className="mono">04</span>
          </button>
        </div>
      )}

      {/* Navigation Sub-Bar (Section 12: Clear operational navigation) */}
      <nav className="nav-bar" aria-label="Main Navigation">
        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'inspection' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            <CameraIcon size={14} />
            <span>Returns</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'attention' ? 'active' : ''}`}
            onClick={() => setActiveTab('attention')}
          >
            <AlertIcon size={14} />
            <span>Needs attention</span>
            {reviewItems.length > 0 && (
              <span className="nav-pill-count nav-pill-warning">{reviewItems.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <ListIcon size={14} />
            <span>Completed</span>
            <span className="nav-pill-count">{completedItems.length}</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'catalogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            <BookIcon size={14} />
            <span>Catalogue</span>
            <span className="nav-pill-count">{PRODUCT_CATALOGUE.length}</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--disp-restock)', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckIcon size={14} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </nav>

      {/* Main Content Area (Exactly 1 H1 per page) */}
      <main id="main-content" className="main-content">
        <h1 className="page-h1">
          {activeTab === 'inspection' && "Returns Inspection Station"}
          {activeTab === 'attention' && "Returns Needing Human Checking"}
          {activeTab === 'history' && "Completed Returns Log"}
          {activeTab === 'catalogue' && "Product Catalogue"}
        </h1>

        {/* Sample Return Cases Strip */}
        <ScenariosStrip
          onSelectScenario={handleSelectScenario}
          activeScenarioId={activeScenarioId}
        />

        {activeTab === 'inspection' && (
          <div className="inspection-grid">
            {/* Left: Product, Photos, and Actions */}
            <InspectionUpload
              orderId={orderId}
              setOrderId={setOrderId}
              selectedSku={selectedSku}
              setSelectedSku={setSelectedSku}
              unitId={unitId}
              setUnitId={setUnitId}
              photos={photos}
              setPhotos={setPhotos}
              activeProduct={activeProduct}
              missingParts={missingParts}
              setMissingParts={setMissingParts}
              isAmbiguous={isAmbiguous}
              setIsAmbiguous={setIsAmbiguous}
              simulateFailure={simulateFailure}
              setSimulateFailure={setSimulateFailure}
              onRunInspection={() => handleRunInspection(null)}
              isInspecting={isInspecting}
              onLookupOrder={handleLookupOrder}
              session={session}
            />

            {/* Right: User-Friendly Decision Result Card */}
            <ResultCard
              result={inspectionResult}
              activeProduct={activeProduct}
              overrideState={overrideState}
              onOpenContractModal={() => setIsContractModalOpen(true)}
              onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
              onSaveToLog={handleSaveToLog}
              onResetInspection={handleResetInspection}
              isInspecting={isInspecting}
              orderId={orderId}
              unitId={unitId}
              photos={photos}
            />
          </div>
        )}

        {activeTab === 'attention' && (
          <div className="ops-card attention-queue-card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="card-title">
                  <AlertIcon size={16} />
                  <span>Returns Needing Attention ({reviewItems.length})</span>
                </div>
                <div className="tenant-badge-verified">
                  <BuildingIcon size={12} />
                  <span>{activeTenant === 'org_demo_alpha' ? 'Facility Alpha (Main)' : 'Facility Bravo'}</span>
                </div>
              </div>
            </div>

            <div className="card-body">
              {reviewItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckIcon size={32} style={{ color: 'var(--disp-restock)', margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>All caught up!</h3>
                  <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
                    There are no returns waiting for human checking in this facility. All logged items have been verified and completed.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                  {reviewItems.map(item => {
                    const cond = translateCondition(item.amazon_condition || item.condition, item.observed_state);
                    const prod = PRODUCT_CATALOGUE.find(p => p.sku === item.ordered_sku);

                    return (
                      <div
                        key={item.record_id}
                        className="attention-item-box"
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-card)',
                          padding: '1rem',
                          background: 'var(--bg-surface)',
                          boxShadow: 'var(--shadow-brutal)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.record_id}</span>
                          <span className="badge badge-review">Needs human checking</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <img
                            src={item.photo_display_urls?.[0] || prod?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"}
                            alt={item.product_name}
                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-color)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Order: <strong>{item.order_id}</strong> | Unit: {item.unit_id}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: '0.35rem' }}>
                              Condition found: {cond.title}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', background: 'var(--bg-subtle)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-btn)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                          {item.evidence?.[0] || 'Image clarity or markings could not be confirmed automatically. Physical inspection required.'}
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem' }}
                            onClick={() => {
                              setSelectedSku(item.ordered_sku);
                              setOrderId(item.order_id);
                              setUnitId(item.unit_id);
                              setPhotos(item.photo_urls?.map((path, idx) => ({
                                url: item.photo_display_urls?.[idx] || prod?.imageUrl || "",
                                tenant_path: path,
                                label: `Inspection Photo #${idx+1}`
                              })) || []);
                              setActiveTab('inspection');
                              handleRunInspection(null, item.ordered_sku, item.order_id);
                            }}
                          >
                            <CameraIcon size={13} />
                            <span>Inspect Item</span>
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem' }}
                            onClick={() => setDetailRecord(item)}
                          >
                            <EyeIcon size={13} />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryLog
            returnsLog={returnsLog}
            activeTenant={activeTenant}
            onSelectRecord={(rec) => setDetailRecord(rec)}
            selectedRecordId={detailRecord?.record_id}
          />
        )}

        {activeTab === 'catalogue' && (
          <div className="ops-card">
            <div className="card-header">
              <div className="card-title">
                <BookIcon size={16} />
                <span>Product Catalogue ({PRODUCT_CATALOGUE.length} Products)</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                {PRODUCT_CATALOGUE.map(prod => (
                  <div key={prod.sku} style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.85rem', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.65rem' }}>
                      <img
                        src={prod.imageUrl}
                        alt={`Photo of ${prod.name}`}
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Category: {prod.category}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--disp-restock)', marginTop: '0.2rem' }}>
                          ${prod.retailPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {prod.description}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Expected items in box ({prod.expectedParts.length}):
                    </div>
                    <div className="parts-pills" style={{ marginTop: '0.25rem' }}>
                      {prod.expectedParts.map(part => (
                        <span key={part} className="part-pill">
                          {part}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedSku(prod.sku);
                        setActiveTab('inspection');
                        handleRunInspection(null, prod.sku);
                      }}
                    >
                      Check return for this product
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          aria-label="Back to top"
        >
          <ArrowUpIcon size={14} />
        </button>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <span>Returns Manager &copy; 2026</span>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>Facility: <strong>{activeTenant === 'org_demo_alpha' ? 'Facility Alpha (Main)' : 'Facility Bravo'}</strong></span>
        </div>

        <div className="footer-links">
          <button type="button" onClick={() => setIsFAQModalOpen(true)}>Help & FAQ</button>
          <button type="button" onClick={() => setIsPrivacyModalOpen(true)}>Privacy Policy</button>
          <button type="button" onClick={() => setIsTermsModalOpen(true)}>Operating Guidelines</button>
          <a href="mailto:ops-support@example.com">Contact Support</a>
        </div>
      </footer>

      {/* Past Return Detail Modal */}
      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          session={session}
        />
      )}

      {/* Decision Override Modal */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        currentDisposition={inspectionResult?.disposition || 'restock'}
        operatorId={session.fullName || session.username}
        onApplyOverride={(overrideData) => {
          setOverrideState(overrideData);
          setSaveSuccessMsg('Decision updated. Original AI recommendation will be preserved.');
        }}
      />

      {/* Technical Contract Modal (Hidden behind subtle link for auditors) */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractData={currentContractData}
      />

      {/* Operator Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentSession={session}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer Modals */}
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <FAQModal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} />
    </div>
  );
}
