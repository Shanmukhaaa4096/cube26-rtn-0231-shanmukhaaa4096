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
import { batchInspectReturn } from './services/aiInspector.js';
import { generateEvidenceRecord } from './services/evidenceContract.js';
import { getTenantReturns, getTenantReturnById } from './services/authAndStorage.js';

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

  // Network State (Section 5: Offline & Slow network indicators)
  const [isOnline, setIsOnline] = useState(navigator.onLine !== false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

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
  const [orderId, setOrderId] = useState('ORD-SCEN-10001');
  const [unitId, setUnitId] = useState('UNIT-SCEN-001');
  const [selectedSku, setSelectedSku] = useState('SKU-HEADPHONE-BT');
  const [photos, setPhotos] = useState([
    {
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
      tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 1),
      label: "Front view - Headphone and molded hardshell case"
    },
    {
      url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80",
      tenant_path: generateTenantImageUri("org_demo_alpha", "UNIT-SCEN-001", 2),
      label: "Accessory check - USB-C, 3.5mm cable, manual laid out"
    }
  ]);
  const [missingParts, setMissingParts] = useState([]);
  const [observedState, setObservedState] = useState('factory_sealed');
  const [amazonCondition, setAmazonCondition] = useState('New');
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

  // Active product derived from catalogue
  const activeProduct = getProductBySku(selectedSku);

  // Run initial inspection on mount
  useEffect(() => {
    handleRunInspection(1);
  }, []);

  // Compute live stats for active tenant (Query level)
  const tenantItems = returnsLog.filter(item => item.org_id === activeTenant);
  const restockItems = tenantItems.filter(item => {
    const disp = item.overrides ? item.overrides.revised_verdict : item.disposition;
    return disp === 'restock';
  });
  const reviewItems = tenantItems.filter(item => {
    const disp = item.overrides ? item.overrides.revised_verdict : item.disposition;
    return disp === 'pending_review' || item.identity === 'UNCERTAIN' || item.condition === 'Uncertain';
  });
  const restockRate = tenantItems.length > 0
    ? Math.round((restockItems.length / tenantItems.length) * 100)
    : 0;

  // Unified Batched Model Inspection
  const handleRunInspection = async (forcedScenarioId = null) => {
    if (!selectedSku) return;

    setIsInspecting(true);
    setOverrideState(null);

    try {
      const scenarioToUse = forcedScenarioId !== null ? forcedScenarioId : activeScenarioId;

      const result = await batchInspectReturn({
        sku: selectedSku,
        orderId,
        photos,
        scenarioId: scenarioToUse,
        observedState,
        manualAmbiguityFlag: isAmbiguous,
        missingOverrides: missingParts,
        conditionOverride: amazonCondition,
        simulateFailure: simulateFailure
      });

      setInspectionResult(result);
    } catch (err) {
      console.error("Inspection failure:", err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Quick Load Scenario from PRD Bench
  const handleSelectScenario = (scenario) => {
    setActiveScenarioId(scenario.id);
    setOrderId(scenario.orderId);
    setUnitId(scenario.unitId);
    setSelectedSku(scenario.sku);
    setPhotos(scenario.photos);
    setMissingParts(scenario.expectedVerdict.missing || []);
    setObservedState(scenario.expectedVerdict.observed_state || 'opened_unused');
    setAmazonCondition(scenario.expectedVerdict.amazon_condition || 'Used - Good');
    setIsAmbiguous(scenario.id === 9);
    setSimulateFailure(false);

    handleRunInspection(scenario.id);
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
      setObservedState(foundPast.observed_state || 'opened_unused');
      setAmazonCondition(foundPast.amazon_condition || foundPast.condition);
      setPhotos(foundPast.photo_urls?.map((path, idx) => ({
        url: foundPast.photo_display_urls?.[idx] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        tenant_path: path,
        label: `Past Inspection Photo #${idx+1}`
      })) || []);
      setActiveScenarioId(null);
      handleRunInspection(null);
      return;
    }

    alert(`Order ID "${orderId}" not found in current organization records.`);
  };

  // Commit and Log Return
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
      operator_id: session.username,
      captured_at: new Date().toISOString(),
      status: overrideState ? "OVERRIDDEN" : (inspectionResult.disposition === 'pending_review' ? "PENDING_REVIEW" : "FINALIZED"),
      overrides: overrideState
    };

    setReturnsLog([newRecord, ...returnsLog]);
    setSaveSuccessMsg(`Saved record ${newRecordId} to ${activeTenant} ledger.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Reset Form
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

  // Handle Login Success (Section 1)
  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
    localStorage.setItem('returns_operator_session', JSON.stringify(newSession));
    setSaveSuccessMsg(`Signed in as ${newSession.username} (${newSession.org_id})`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Compile official 14-field evidence contract for active item
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
      {/* Offline State Banner (Section 5) */}
      {!isOnline && (
        <div className="offline-banner">
          <AlertIcon size={14} />
          <span>Offline Mode: Network disconnected. Staging returns locally until connection restores.</span>
        </div>
      )}

      {/* Slow Network Indicator (Section 5) */}
      {isSlowNetwork && (
        <div className="slow-network-banner">
          <AlertIcon size={14} />
          <span>High Network Latency Detected: Batched offline cache active.</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTenant={activeTenant}
        onSelectTenant={(t) => {
          // Switch session demo account when tenant selector clicked
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
          restockRate,
          uncertainCount: reviewItems.length,
          totalProcessed: tenantItems.length
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Menu Drawer (Section 2) */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('inspection'); setIsMobileMenuOpen(false); }}
          >
            <span>Inspection Station</span>
            <span className="mono">01</span>
          </button>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
          >
            <span>Returns Ledger ({tenantItems.length})</span>
            <span className="mono">02</span>
          </button>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={() => { setActiveTab('catalogue'); setIsMobileMenuOpen(false); }}
          >
            <span>Catalogue ({PRODUCT_CATALOGUE.length})</span>
            <span className="mono">03</span>
          </button>
          <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Tenant: {activeTenant}</span>
            <span>User: {session.username}</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Bar */}
      <nav className="nav-bar" aria-label="Main Navigation">
        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'inspection' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            <CameraIcon size={14} />
            <span>Inspection and Disposition Station</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <ListIcon size={14} />
            <span>Returns History and Audit Log</span>
            <span className="nav-pill-count">{tenantItems.length}</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activeTab === 'catalogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            <BookIcon size={14} />
            <span>Product Master Catalogue</span>
            <span className="nav-pill-count">{PRODUCT_CATALOGUE.length}</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--disp-restock)', fontSize: '0.78rem', fontWeight: 600 }}>
            <CheckIcon size={13} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </nav>

      {/* Main Content Area (Exactly 1 H1 per page) */}
      <main id="main-content" className="main-content">
        <h1 className="page-h1">
          {activeTab === 'inspection' && "Returns Inspection and Disposition Station"}
          {activeTab === 'history' && `Returns Audit Ledger (${activeTenant})`}
          {activeTab === 'catalogue' && "Product Master Catalogue and Specifications"}
        </h1>

        {/* Scenarios Quick-Runner Strip */}
        <ScenariosStrip
          onSelectScenario={handleSelectScenario}
          activeScenarioId={activeScenarioId}
        />

        {activeTab === 'inspection' && (
          <div className="inspection-grid">
            {/* Left: Input, Photo Upload & Order Lookup */}
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
              observedState={observedState}
              setObservedState={setObservedState}
              amazonCondition={amazonCondition}
              setAmazonCondition={setAmazonCondition}
              isAmbiguous={isAmbiguous}
              setIsAmbiguous={setIsAmbiguous}
              simulateFailure={simulateFailure}
              setSimulateFailure={setSimulateFailure}
              onRunInspection={() => handleRunInspection(null)}
              isInspecting={isInspecting}
              onLookupOrder={handleLookupOrder}
              session={session}
            />

            {/* Right: Decision Result Card */}
            <ResultCard
              result={inspectionResult}
              activeProduct={activeProduct}
              overrideState={overrideState}
              onOpenContractModal={() => setIsContractModalOpen(true)}
              onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
              onSaveToLog={handleSaveToLog}
              onResetInspection={handleResetInspection}
              isInspecting={isInspecting}
            />
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
                <span>Product Master Catalogue ({PRODUCT_CATALOGUE.length} Canonical SKUs)</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                {PRODUCT_CATALOGUE.map(prod => (
                  <div key={prod.sku} style={{ border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.85rem', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.65rem' }}>
                      <img src={prod.imageUrl} alt={`Reference photo for ${prod.name}`} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '3px', border: '1px solid var(--border-color)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{prod.name}</div>
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          SKU: {prod.sku} | ASIN: {prod.asin}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--disp-restock)', marginTop: '0.2rem' }}>
                          ${prod.retailPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {prod.description}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Expected Parts BOM ({prod.expectedParts.length}):
                    </div>
                    <div className="parts-pills" style={{ marginTop: '0.2rem' }}>
                      {prod.expectedParts.map(part => (
                        <span key={part} className="part-pill">
                          {part}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: '100%', marginTop: '0.65rem', justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedSku(prod.sku);
                        setActiveTab('inspection');
                        handleRunInspection(null);
                      }}
                    >
                      Inspect Return for this SKU
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Back to Top Floating Button (Section 3) */}
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

      {/* Footer (Section 2 & 3: Clean links, copyright 2026, clickable contact) */}
      <footer className="app-footer">
        <div>
          <span>Returns Manager v2.4 (Buildathon Stage 04) &copy; 2026</span>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>Tenant: <strong className="mono">{activeTenant}</strong></span>
        </div>

        <div className="footer-links">
          <button type="button" onClick={() => setIsFAQModalOpen(true)}>FAQ</button>
          <button type="button" onClick={() => setIsPrivacyModalOpen(true)}>Privacy Policy</button>
          <button type="button" onClick={() => setIsTermsModalOpen(true)}>Operating Terms</button>
          <a href="mailto:ops-support@cube-buildathon.local">Contact Support</a>
        </div>
      </footer>

      {/* Modal: Single Past Return Detail View */}
      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          session={session}
        />
      )}

      {/* Modal: Operator Override */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        currentDisposition={inspectionResult?.disposition || 'restock'}
        operatorId={session.username}
        onApplyOverride={(overrideData) => {
          setOverrideState(overrideData);
          setSaveSuccessMsg('Operator override staged. History will be preserved on commit.');
        }}
      />

      {/* Modal: Official Evidence Contract JSON */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractData={currentContractData}
      />

      {/* Modal: Operator Authentication & Tenant Switcher */}
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
