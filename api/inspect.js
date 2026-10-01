// Server-side Inspection Endpoint (Vercel Serverless Function & Vite dev middleware)
// - Keeps Gemini API key strictly on server (GEMINI_API_KEY, no VITE_ prefix required)
// - Never exposes raw API key to client
// - Enforces server-side rate limiting (max 20 requests per minute per org/IP)
// - Enforces server-side image upload validation (10MB limit, JPEG/PNG/WEBP only)
// - Calls AI Inspection Engine and deterministic decision rules

import { getProductBySku } from '../src/data/catalogue.js';
import { batchInspectReturn } from '../src/services/aiInspector.js';

// Server-side Rate Limiter State (in-memory)
const rateLimitMap = new Map(); // key -> { count, resetTime }
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }
  record.count += 1;
  rateLimitMap.set(key, record);
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((record.resetTime - now) / 1000)
    };
  }
  return { allowed: true };
}

// Server-Side Upload Security Validator
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

function validatePhotosServerSide(photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return { valid: true };
  }
  if (photos.length > 4) {
    return { valid: false, error: 'Maximum 4 photographs allowed per inspection.' };
  }
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const photoStr = typeof photo === 'string' ? photo : (photo?.url || photo?.path || '');

    // Check photo object metadata if present
    if (photo && typeof photo === 'object') {
      if (photo.type && !ALLOWED_MIME.includes(photo.type.toLowerCase())) {
        return {
          valid: false,
          error: `Photo #${i + 1} has unauthorized format '${photo.type}'. Only standard formats (JPEG, PNG, WEBP) are authorized.`
        };
      }
      if (photo.size && photo.size > MAX_IMAGE_BYTES) {
        return {
          valid: false,
          error: `Photo #${i + 1} exceeds 10MB limit (${(photo.size / (1024 * 1024)).toFixed(2)}MB). Upload rejected.`
        };
      }
    }

    // Check Data URL
    if (photoStr && photoStr.startsWith('data:')) {
      const match = photoStr.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return { valid: false, error: `Photo #${i + 1} has malformed image data.` };
      }
      const mimeType = match[1].toLowerCase();
      if (!ALLOWED_MIME.includes(mimeType)) {
        return {
          valid: false,
          error: `Invalid file format '${mimeType}' for photo #${i + 1}. Only standard formats (JPEG, PNG, WEBP) are authorized.`
        };
      }
      const approxBytes = Math.ceil((match[2].length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return {
          valid: false,
          error: `Photo #${i + 1} exceeds 10MB limit (${(approxBytes / (1024 * 1024)).toFixed(2)}MB). Upload rejected.`
        };
      }
    } else if (photoStr) {
      const lower = photoStr.toLowerCase().split('?')[0];
      if (lower.match(/\.[a-z0-9]+$/)) {
        const validExtension = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
        if (!validExtension) {
          return {
            valid: false,
            error: `File type not supported for photo #${i + 1}. Authorized formats: JPEG, PNG, WEBP.`
          };
        }
      }
    }
  }
  return { valid: true };
}

export default async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Inspection endpoint accepts POST requests only.'
    });
  }

  const body = req.body || {};
  const {
    sku,
    orderId = 'ORD-UNKNOWN',
    unitId = 'UNIT-UNKNOWN',
    photos = [],
    session,
    manualAmbiguityFlag = false,
    simulateFailure = false,
    forceOfflineAnalyzer = false
  } = body;

  // 2. Rate Limiting Check (per organization or client IP)
  const clientKey = session?.org_id || req.headers?.['x-forwarded-for'] || 'client_anonymous';
  const rateLimitCheck = checkRateLimit(clientKey);
  if (!rateLimitCheck.allowed) {
    res.setHeader('Retry-After', String(rateLimitCheck.retryAfterSec));
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Inspection rate limit exceeded for facility '${clientKey}'. Please retry in ${rateLimitCheck.retryAfterSec}s.`
    });
  }

  // 3. Server-side File Upload Validation
  const uploadValidation = validatePhotosServerSide(photos);
  if (!uploadValidation.valid) {
    return res.status(400).json({
      error: 'INVALID_FILE_UPLOAD',
      message: uploadValidation.error
    });
  }

  // 4. Validate SKU against Master Catalogue
  if (!sku) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Product SKU is required for return inspection.'
    });
  }
  const product = getProductBySku(sku);
  if (!product) {
    return res.status(404).json({
      error: 'SKU_NOT_FOUND',
      message: `Ordered SKU '${sku}' does not exist in the master product catalogue.`
    });
  }

  // 5. Retrieve Server-Only Gemini API Key (No VITE_ prefix required in production)
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  try {
    // 6. Run AI Inspection Pipeline with server-held API key
    const result = await batchInspectReturn({
      sku,
      orderId,
      unitId,
      photos,
      session,
      simulateFailure,
      manualAmbiguityFlag,
      apiKeyOverride: apiKey,
      forceOfflineAnalyzer
    });

    // 7. Sanitize output: never leak raw API key or internal credentials to client
    const sanitized = { ...result };
    delete sanitized.apiKey;
    delete sanitized.apiKeyOverride;

    return res.status(200).json(sanitized);
  } catch (error) {
    console.error("[api/inspect] Server inspection error:", error);
    return res.status(500).json({
      error: 'INTERNAL_INSPECTION_ERROR',
      message: error.message || 'An error occurred during server-side inspection.'
    });
  }
}
