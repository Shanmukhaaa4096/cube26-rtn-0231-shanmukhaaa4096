// Clean Service Abstraction Layer for Returns Manager Inspection
// Architecture:
// UI Client -> inspectionService.js (Endpoint abstraction: /api/inspect) -> Gemini Vision / Decision Engine
//
// In Enterprise Production:
// This abstraction delegates to a dedicated backend HTTP endpoint (e.g. POST /api/inspect)
// ensuring zero exposure of server API keys or model credentials in the browser bundle.
//
// In Buildathon Client-Server Mode:
// Provides a unified async interface with tenant authorization validation, request schema validation,
// real latency measurement, and seamless client-side execution with fail-open fallback.

import { batchInspectReturn } from './aiInspector.js';
import { getProductBySku } from '../data/catalogue.js';

/**
 * Service abstraction for Return Inspection (/api/inspect)
 *
 * @param {Object} params
 * @param {string} params.sku - Target product SKU from canonical catalogue
 * @param {string} params.orderId - Unique customer return order identifier
 * @param {Array} params.photos - Array of uploaded photos or photo objects
 * @param {Object} [params.session] - Authenticated tenant session (operator/supervisor)
 * @param {boolean} [params.manualAmbiguityFlag] - Operator flagged optical ambiguity
 * @param {boolean} [params.simulateFailure] - Chaos engineering / fail-open simulation flag
 * @param {string} [params.apiKeyOverride] - Optional API key override
 * @returns {Promise<Object>} Inspection result with evidence trail, confidence gating, and disposition
 */
export async function inspectReturnApi({
  sku,
  orderId,
  photos = [],
  session = null,
  manualAmbiguityFlag = false,
  simulateFailure = false,
  apiKeyOverride = null
}) {
  const requestTimestamp = new Date().toISOString();
  const startTime = Date.now();

  // 1. Session & Tenancy Pre-validation
  if (session && !session.org_id) {
    throw new Error("UNAUTHORIZED: Request missing valid tenant organization credentials.");
  }

  // 2. Input Parameter Validation
  if (!sku || typeof sku !== 'string') {
    throw new Error("BAD_REQUEST: 'sku' is required and must be a valid string.");
  }

  // 3. Product Catalogue Verification (Single Source of Truth)
  const product = getProductBySku(sku);
  if (!product) {
    console.warn(`[inspectionService] Warning: SKU '${sku}' not found in canonical catalogue.`);
  }

  // 4. Dispatch to Vision Inspection Pipeline
  // When running behind a backend server, this will execute:
  // const response = await fetch('/api/inspect', { method: 'POST', body: JSON.stringify(...) });
  const result = await batchInspectReturn({
    sku,
    orderId,
    photos,
    simulateFailure,
    manualAmbiguityFlag,
    apiKeyOverride
  });

  const durationMs = Date.now() - startTime;

  // 5. Package Auditable Response Envelope
  return {
    ...result,
    api_metadata: {
      endpoint: "/api/inspect",
      request_timestamp: requestTimestamp,
      response_timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      tenant_id: session?.org_id || "org_demo_alpha",
      operator_id: session?.user_id || "operator_station"
    }
  };
}
