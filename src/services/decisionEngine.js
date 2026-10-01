// Deterministic Decision Engine for Returns Manager
// Evaluates AI-extracted visual evidence against deterministic warehouse business rules
// Pipeline: IMAGE EVIDENCE -> AI INSPECTION -> VALIDATED EVIDENCE -> DECISION ENGINE -> FINAL DISPOSITION
// Gemini NEVER directly decides the final business disposition.

/**
 * Calculates confidence gating across all critical inspection dimensions
 * - High Confidence (>= 0.90): Automatic recommendation allowed
 * - Medium Confidence (0.70 - 0.90): Recommendation allowed but marked "Review Recommended"
 * - Low Confidence (< 0.70): Mandatory pending_review
 * Considers the LOWEST confidence across identity, completeness, condition, and image quality.
 */
export function calculateConfidenceGating(evidence = {}) {
  const identityConf = typeof evidence.identity?.confidence === 'number'
    ? Math.max(0, Math.min(1, evidence.identity.confidence))
    : 0.50;

  const completenessConf = typeof evidence.completeness?.confidence === 'number'
    ? Math.max(0, Math.min(1, evidence.completeness.confidence))
    : 0.50;

  const conditionConf = typeof evidence.condition?.confidence === 'number'
    ? Math.max(0, Math.min(1, evidence.condition.confidence))
    : 0.50;

  const imageQualityScore = typeof evidence.image_quality?.score === 'number'
    ? Math.max(0, Math.min(1, evidence.image_quality.score))
    : 0.85;

  const minConfidence = Math.min(identityConf, completenessConf, conditionConf, imageQualityScore);

  let tier = "HIGH";
  let reviewRecommended = false;

  if (minConfidence >= 0.90) {
    tier = "HIGH";
    reviewRecommended = false;
  } else if (minConfidence >= 0.70) {
    tier = "MEDIUM";
    reviewRecommended = true;
  } else {
    tier = "LOW";
    reviewRecommended = true;
  }

  return {
    tier,
    minConfidence: Number(minConfidence.toFixed(2)),
    reviewRecommended,
    breakdown: {
      identity: Number(identityConf.toFixed(2)),
      completeness: Number(completenessConf.toFixed(2)),
      condition: Number(conditionConf.toFixed(2)),
      image_quality: Number(imageQualityScore.toFixed(2))
    }
  };
}

/**
 * Pure deterministic business rule engine
 * Strictly determines disposition from evidence and catalogue requirements.
 */
export function evaluateDispositionRules({ evidence, product }) {
  if (!evidence) {
    return {
      disposition: "pending_review",
      confidenceGating: { tier: "LOW", minConfidence: 0.0, reviewRecommended: true, breakdown: {} },
      ruleTriggered: "NO_EVIDENCE_PROVIDED",
      confidence_note: "No evidence provided for business rule evaluation.",
      explanationStage: {
        observed_evidence: "No photographic evidence provided",
        ai_assessment: "Inconclusive",
        business_rule: "Fail-safe: Hold for physical inspection",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: ["Missing visual inspection evidence"]
    };
  }

  const gating = calculateConfidenceGating(evidence);
  const evidenceTrail = [];

  const identityVerdict = (evidence.identity?.verdict || "UNCERTAIN").toUpperCase();
  const completenessVerdict = (evidence.completeness?.verdict || "UNCERTAIN").toUpperCase();
  const conditionGrade = evidence.condition?.grade || "Uncertain";
  const observedStateVal = (evidence.observed_state?.value || "uncertain").toLowerCase();
  const missingItems = Array.isArray(evidence.completeness?.missing_items)
    ? evidence.completeness.missing_items
    : [];
  const contradictions = Array.isArray(evidence.contradictions) ? evidence.contradictions : [];
  const imageQuality = evidence.image_quality || {};

  // Construct summarized observed evidence string
  const obsList = [];
  if (evidence.physical_observations && evidence.physical_observations.length > 0) {
    obsList.push(...evidence.physical_observations.map(o => `${o.severity || 'noticeable'} ${o.observation} (${o.location || 'chassis'})`));
  }
  if (missingItems.length > 0) {
    obsList.push(`missing [${missingItems.join(', ')}]`);
  } else if (completenessVerdict === "PASS") {
    obsList.push("all BOM accessories present");
  }
  if (observedStateVal) {
    obsList.push(`state: ${observedStateVal}`);
  }
  const observedEvidenceText = obsList.length > 0 ? obsList.join('; ') : "No defects visible";

  const aiAssessmentText = `${conditionGrade} (Identity: ${identityVerdict}, Completeness: ${completenessVerdict})`;

  // ==========================================
  // GATE 1: Optical & Image Quality Safety Gate
  // ==========================================
  if (imageQuality.insufficient_evidence || (imageQuality.score !== undefined && imageQuality.score < 0.60)) {
    const missingViewsDesc = (imageQuality.missing_views && imageQuality.missing_views.length > 0)
      ? imageQuality.missing_views.join('. ')
      : "Rear view or accessory compartment occluded";

    const rule = `Image quality insufficient (${Math.round((imageQuality.score || 0.5) * 100)}%). ${missingViewsDesc}. Upload required views.`;
    return {
      disposition: "pending_review",
      confidenceGating: gating,
      ruleTriggered: "OPTICAL_QUALITY_INSUFFICIENT",
      confidence_note: `OPTICAL_QUALITY_GATE: ${missingViewsDesc}`,
      explanationStage: {
        observed_evidence: `Poor optical evidence (blur: ${Boolean(imageQuality.blur)}, glare: ${Boolean(imageQuality.glare)}, occlusion: ${Boolean(imageQuality.occlusion)})`,
        ai_assessment: "Cannot reliably assess item condition or authenticity",
        business_rule: "Warehouse Policy Rule 1: Never guess on degraded imagery. Request operator re-shoot.",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: [
        `Image Quality Gate: Score ${imageQuality.score || 'inconclusive'}`,
        ...((imageQuality.missing_views || []).map(v => `Missing View: ${v}`))
      ]
    };
  }

  // ==========================================
  // GATE 2: Contradiction Detection Gate
  // ==========================================
  if (contradictions.length > 0) {
    const contradictionSummary = contradictions.join('; ');
    return {
      disposition: "pending_review",
      confidenceGating: gating,
      ruleTriggered: "CRITICAL_CONTRADICTION_DETECTED",
      confidence_note: `CONTRADICTION_GATE: ${contradictionSummary}`,
      explanationStage: {
        observed_evidence: `Contradictions detected: ${contradictionSummary}`,
        ai_assessment: "Conflicting evidence between multi-image views, packaging, or specifications",
        business_rule: "Warehouse Policy Rule 2: Incompatible evidence flags potential tampering or mismatch.",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: [
        `Contradiction Flag: ${contradictionSummary}`,
        "Routed to supervisor desk for physical reconciliation"
      ]
    };
  }

  // ==========================================
  // GATE 3: Product Identity Verification Gate
  // ==========================================
  if (identityVerdict === "UNCERTAIN") {
    return {
      disposition: "pending_review",
      confidenceGating: gating,
      ruleTriggered: "IDENTITY_UNCERTAIN",
      confidence_note: "IDENTITY_UNCERTAIN: Visual features ambiguous or lookalike suspected. Mandatory supervisor review.",
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: "Identity UNCERTAIN (cannot certify genuine OEM unit)",
        business_rule: "Warehouse Policy Rule 3: Unverified identities cannot enter resale or warranty inventory.",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: [
        "Identity check returned UNCERTAIN against catalogue master specification",
        "Held in intake triage quarantine pending physical authentication"
      ]
    };
  }

  if (identityVerdict === "FAIL") {
    return {
      disposition: "dispose",
      confidenceGating: gating,
      ruleTriggered: "IDENTITY_MISMATCH_FRAUD",
      confidence_note: "IDENTITY_FAIL: Returned item does not match product catalogue specification. Routed to scrap/fraud disposal.",
      explanationStage: {
        observed_evidence: "Product geometry, branding, and casing completely differ from catalogue specification",
        ai_assessment: "Identity FAIL (Counterfeit, substituted merchandise, or incorrect product returned)",
        business_rule: "Warehouse Policy Rule 4: Substituted/fraudulent goods are disqualified from inventory and marked for disposal/scrap.",
        final_recommendation: "DISPOSE"
      },
      evidenceTrail: [
        "Product Identity Check: [FAIL] - Substituted item does not match catalogue SKU",
        "Disqualified from active warehouse inventory"
      ]
    };
  }

  // ==========================================
  // GATE 4: Confidence Gating (< 0.70 -> Mandatory Review)
  // ==========================================
  if (gating.tier === "LOW") {
    return {
      disposition: "pending_review",
      confidenceGating: gating,
      ruleTriggered: "CONFIDENCE_GATE_LOW",
      confidence_note: `LOW_CONFIDENCE_GATE: Lowest component confidence (${Math.round(gating.minConfidence * 100)}%) falls below 70% threshold. Mandatory supervisor review.`,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: `${aiAssessmentText} with low confidence (${Math.round(gating.minConfidence * 100)}%)`,
        business_rule: "Warehouse Policy Rule 5: Low confidence (<70%) requires mandatory human supervisor signoff.",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: [
        `Confidence threshold breached: min confidence ${Math.round(gating.minConfidence * 100)}% < 70%`,
        "Enforced human-in-the-loop validation"
      ]
    };
  }

  // ==========================================
  // GATE 5: Completeness & Ambiguity
  // ==========================================
  if (completenessVerdict === "UNCERTAIN" || conditionGrade === "Uncertain") {
    return {
      disposition: "pending_review",
      confidenceGating: gating,
      ruleTriggered: "COMPLETENESS_OR_CONDITION_UNCERTAIN",
      confidence_note: "UNCERTAIN_EVIDENCE: Completeness or cosmetic grade cannot be certified from imagery.",
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: "Ambiguous accessory visibility or inconclusive wear grading",
        business_rule: "Warehouse Policy Rule 6: Ambiguous BOM or condition requires physical bench inspection.",
        final_recommendation: "PENDING_REVIEW"
      },
      evidenceTrail: [
        "Completeness or condition check is UNCERTAIN",
        "Routed to supervisor review bench"
      ]
    };
  }

  // ==========================================
  // GATE 6: Deterministic Disposition Rules
  // ==========================================

  // Rule 6A: Unacceptable Condition -> Dispose
  if (conditionGrade === "Unacceptable" || observedStateVal === "damaged" || observedStateVal === "empty_box") {
    return {
      disposition: "dispose",
      confidenceGating: gating,
      ruleTriggered: "CONDITION_UNACCEPTABLE_DISPOSE",
      confidence_note: null,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: "Unacceptable (severe damage, cracked housing, liquid ingress, or empty parcel)",
        business_rule: "Warehouse Policy Rule 7: Unrecoverable scrap or defective units must be safely recycled/disposed.",
        final_recommendation: "DISPOSE"
      },
      evidenceTrail: [
        "Condition graded as 'Unacceptable'",
        "Raw physical state reflects unrecoverable defect",
        "Disposition finalized as 'dispose'"
      ]
    };
  }

  // Rule 6B: Recoverable Condition with Missing Accessories -> Refurbish
  if (completenessVerdict === "FAIL" && ["New", "Used - Like New", "Used - Very Good", "Used - Good"].includes(conditionGrade)) {
    const missingListStr = missingItems.join(', ') || 'essential accessories';
    return {
      disposition: "refurbish",
      confidenceGating: gating,
      ruleTriggered: "MISSING_ACCESSORIES_REFURBISH",
      confidence_note: null,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: `${conditionGrade}, but missing required accessory items [${missingListStr}]`,
        business_rule: "Warehouse Policy Rule 8: Recoverable merchandise missing non-critical BOM accessories must be routed to prep bay for accessory replenishment and repackaging.",
        final_recommendation: "REFURBISH"
      },
      evidenceTrail: [
        `Missing accessories identified: [${missingListStr}]`,
        `Core unit in recoverable condition: '${conditionGrade}'`,
        "Disposition finalized as 'refurbish'"
      ]
    };
  }

  // Rule 6C: Pristine Condition + Complete BOM -> Restock
  if (completenessVerdict === "PASS" && ["New", "Used - Like New"].includes(conditionGrade)) {
    return {
      disposition: "restock",
      confidenceGating: gating,
      ruleTriggered: "PRISTINE_COMPLETE_RESTOCK",
      confidence_note: null,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: `${conditionGrade} with complete Bill of Materials`,
        business_rule: "Warehouse Policy Rule 9: Pristine item with complete BOM qualifies for immediate shelf restock (100% margin recovery).",
        final_recommendation: "RESTOCK"
      },
      evidenceTrail: [
        "Product identity verified [PASS]",
        "All expected accessories present [PASS]",
        `Condition graded '${conditionGrade}'`,
        "Disposition finalized as 'restock'"
      ]
    };
  }

  // Rule 6D: Used - Very Good + Complete BOM -> Restock / Light Prep
  if (completenessVerdict === "PASS" && conditionGrade === "Used - Very Good") {
    return {
      disposition: "restock",
      confidenceGating: gating,
      ruleTriggered: "VERY_GOOD_COMPLETE_RESTOCK",
      confidence_note: null,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: "Used - Very Good with all original accessories verified",
        business_rule: "Warehouse Policy Rule 10: Complete unit with minimal cosmetic handling scuffs qualifies for prime pre-owned restock.",
        final_recommendation: "RESTOCK"
      },
      evidenceTrail: [
        "Complete accessories verified [PASS]",
        "Condition graded as 'Used - Very Good'",
        "Disposition finalized as 'restock'"
      ]
    };
  }

  // Rule 6E: Noticeable Cosmetic Wear -> Liquidate
  if (["Used - Acceptable", "Used - Good"].includes(conditionGrade)) {
    const disp = conditionGrade === "Used - Acceptable" ? "liquidate" : "liquidate";
    return {
      disposition: disp,
      confidenceGating: gating,
      ruleTriggered: "DEGRADED_COSMETIC_LIQUIDATE",
      confidence_note: null,
      explanationStage: {
        observed_evidence: observedEvidenceText,
        ai_assessment: `${conditionGrade} (Noticeable surface scratches or scuffs)`,
        business_rule: "Warehouse Policy Rule 11: Unit is functional but cosmetic wear exceeds primary shelf standards. Route to secondary liquidation lot.",
        final_recommendation: "LIQUIDATE"
      },
      evidenceTrail: [
        `Cosmetic wear graded '${conditionGrade}'`,
        "Disqualified from primary shelf restock",
        "Disposition finalized as 'liquidate'"
      ]
    };
  }

  // Fallback safe routing
  return {
    disposition: "pending_review",
    confidenceGating: gating,
    ruleTriggered: "CONSERVATIVE_FAILSAFE_ROUTING",
    confidence_note: "Conservative fail-safe routing: Condition and completeness combination queued for supervisor verification.",
    explanationStage: {
      observed_evidence: observedEvidenceText,
      ai_assessment: aiAssessmentText,
      business_rule: "Warehouse Policy Rule 12: Unmapped condition state requires supervisor manual triage.",
      final_recommendation: "PENDING_REVIEW"
    },
    evidenceTrail: [
      "Rule engine reached boundary condition",
      "Routed to pending_review"
    ]
  };
}
