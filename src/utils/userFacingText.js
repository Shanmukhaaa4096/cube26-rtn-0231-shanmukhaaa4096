// User-Facing Translation Layer for Returns Manager
// Translates technical backend terminology, enum values, and AI reasoning
// into simple, professional, human-understandable language for warehouse operators.
//
// Rules:
// - Never expose raw enums: PASS, FAIL, UNCERTAIN, restock, refurbish, liquidate, dispose, pending_review
// - Never expose: observed_state, completeness, confidence_score, latency, model_version, hashes, raw JSON
// - Keep explanations to 1-3 short, clear sentences.

/**
 * Translates check verdicts into simple human-friendly status objects.
 */
export function translateVerdict(verdict) {
  const norm = String(verdict || '').toUpperCase();
  if (norm === 'PASS') {
    return {
      status: 'pass',
      label: 'Looks correct',
      icon: 'check',
      ariaLabel: 'Looks correct',
      cssClass: 'status-tag-pass'
    };
  }
  if (norm === 'FAIL') {
    return {
      status: 'fail',
      label: 'Problem found',
      icon: 'cross',
      ariaLabel: 'Problem found',
      cssClass: 'status-tag-fail'
    };
  }
  return {
    status: 'uncertain',
    label: 'Not clear',
    icon: 'alert',
    ariaLabel: 'Not clear',
    cssClass: 'status-tag-uncertain'
  };
}

/**
 * Translates disposition internal keys into prominent user-friendly actions.
 */
export const ACTION_DEFINITIONS = {
  restock: {
    key: 'restock',
    title: 'Put back in stock',
    actionLabel: 'Put back in stock',
    shortLabel: 'Restock',
    icon: '📦',
    heroClass: 'restock',
    badgeClass: 'badge-restock',
    color: '#15803d',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    defaultWhy: 'The product matches the expected item, all required items are present, and there are no important visible issues.'
  },
  refurbish: {
    key: 'refurbish',
    title: 'Send for repair',
    actionLabel: 'Send for repair',
    shortLabel: 'Repair',
    icon: '🔧',
    heroClass: 'refurbish',
    badgeClass: 'badge-refurbish',
    color: '#b45309',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    defaultWhy: 'The item works but needs cleaning, repackaging, or replacement of missing accessories before selling again.'
  },
  liquidate: {
    key: 'liquidate',
    title: 'Sell through clearance',
    actionLabel: 'Sell through clearance',
    shortLabel: 'Clearance',
    icon: '💰',
    heroClass: 'liquidate',
    badgeClass: 'badge-liquidate',
    color: '#c2410c',
    bgColor: '#ffedd5',
    borderColor: '#fdba74',
    defaultWhy: 'The item is usable but shows noticeable signs of use, so regular stock is not recommended.'
  },
  dispose: {
    key: 'dispose',
    title: 'Dispose of item',
    actionLabel: 'Dispose of item',
    shortLabel: 'Dispose',
    icon: '🗑️',
    heroClass: 'dispose',
    badgeClass: 'badge-dispose',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    defaultWhy: 'The item has serious damage, missing core components, or does not match the product, and should not be returned to stock.'
  },
  pending_review: {
    key: 'pending_review',
    title: 'Needs human checking',
    actionLabel: 'Needs human checking',
    shortLabel: 'Check',
    icon: '👤',
    heroClass: 'review',
    badgeClass: 'badge-review',
    color: '#334155',
    bgColor: '#f1f5f9',
    borderColor: '#94a3b8',
    defaultWhy: 'The photos are not clear enough or details conflict, so a human inspection is needed before deciding.'
  }
};

/**
 * Returns translated action metadata for a given disposition key.
 */
export function translateDisposition(disposition) {
  const norm = String(disposition || '').toLowerCase();
  return ACTION_DEFINITIONS[norm] || ACTION_DEFINITIONS.pending_review;
}

/**
 * Translates condition grades & observed state into user-friendly everyday terms.
 */
export function translateCondition(conditionGrade, observedState) {
  const cond = String(conditionGrade || '').trim();
  const state = String(observedState || '').toLowerCase();

  if (cond === 'Unacceptable' || state === 'damaged' || state === 'empty_box') {
    return {
      title: 'Damaged',
      description: 'The item appears damaged and may not be suitable for normal resale.',
      tag: 'Damaged',
      status: 'error'
    };
  }

  if (cond === 'New' || state === 'factory_sealed') {
    return {
      title: 'Like new',
      description: 'Looks almost unused with little or no visible wear.',
      tag: 'Like new',
      status: 'success'
    };
  }

  if (cond === 'Used - Like New' || state === 'opened_unused') {
    return {
      title: 'Like new',
      description: 'Looks almost unused with little or no visible wear.',
      tag: 'Like new',
      status: 'success'
    };
  }

  if (cond === 'Used - Very Good') {
    return {
      title: 'Lightly used',
      description: 'Minor signs of use such as small scratches or marks.',
      tag: 'Lightly used',
      status: 'info'
    };
  }

  if (cond === 'Used - Good') {
    return {
      title: 'Used',
      description: 'Clear signs of use, but the item appears usable.',
      tag: 'Used',
      status: 'warning'
    };
  }

  if (cond === 'Used - Acceptable' || state === 'signs_of_use') {
    return {
      title: 'Heavily used',
      description: 'Significant wear or damage is visible.',
      tag: 'Heavily used',
      status: 'warning'
    };
  }

  return {
    title: 'Not clear',
    description: 'Condition cannot be clearly determined from the available photos.',
    tag: 'Not clear',
    status: 'uncertain'
  };
}

/**
 * Translates confidence into a simple 3-tier traffic-light system.
 * Never exposes raw decimal numbers (e.g. 0.7834).
 */
export function translateConfidence(confidence, gating) {
  let tier = 'HIGH';

  if (gating && gating.tier) {
    tier = gating.tier.toUpperCase();
  } else if (typeof confidence === 'number') {
    if (confidence >= 0.90) tier = 'HIGH';
    else if (confidence >= 0.70) tier = 'MEDIUM';
    else tier = 'LOW';
  } else if (confidence && typeof confidence === 'object') {
    const minVal = Math.min(
      confidence.identity ?? 1,
      confidence.completeness ?? 1,
      confidence.condition ?? 1
    );
    if (minVal >= 0.90) tier = 'HIGH';
    else if (minVal >= 0.70) tier = 'MEDIUM';
    else tier = 'LOW';
  }

  if (tier === 'HIGH') {
    return {
      level: 'High',
      icon: '🟢',
      color: '#15803d',
      bgColor: '#dcfce7',
      label: 'High',
      description: 'The photos provide enough information to make a reliable recommendation.'
    };
  }

  if (tier === 'MEDIUM') {
    return {
      level: 'Medium',
      icon: '🟡',
      color: '#b45309',
      bgColor: '#fef3c7',
      label: 'Medium',
      description: 'The recommendation looks reasonable, but some details are unclear.'
    };
  }

  return {
    level: 'Low',
    icon: '🔴',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    label: 'Low',
    description: 'There is not enough reliable information. Human checking is required.'
  };
}

/**
 * Translates photo quality findings into friendly advice for the operator.
 */
export function translatePhotoQuality(imageQuality) {
  if (!imageQuality) {
    return {
      isGood: true,
      headline: 'Photos look good',
      advice: 'Photos are clear enough to inspect.',
      notices: []
    };
  }

  const notices = [];

  if (imageQuality.blur) {
    notices.push({
      icon: '⚠️',
      title: 'Photo is too blurry',
      detail: 'Please upload a clearer photo of the front of the product.'
    });
  }

  if (imageQuality.glare) {
    notices.push({
      icon: '⚠️',
      title: 'Too much glare or reflection',
      detail: 'Please take the photo in better lighting without direct glare.'
    });
  }

  if (imageQuality.occlusion) {
    notices.push({
      icon: '⚠️',
      title: 'Product is partly hidden',
      detail: 'Please upload another photo showing the full product.'
    });
  }

  if (imageQuality.missing_views && imageQuality.missing_views.length > 0) {
    for (const view of imageQuality.missing_views) {
      if (view.toLowerCase().includes('accessory')) {
        notices.push({
          icon: '⚠️',
          title: 'Accessories cannot be checked',
          detail: 'Please upload a photo showing the included cables and accessories.'
        });
      } else {
        notices.push({
          icon: '⚠️',
          title: 'Missing camera angle',
          detail: view.replace(/required/i, 'needed').trim()
        });
      }
    }
  }

  const isGood = notices.length === 0 && !imageQuality.insufficient_evidence;

  return {
    isGood,
    headline: isGood ? 'Clear enough to inspect' : 'Some photos need attention',
    advice: isGood
      ? 'The photos are clear and easy to read.'
      : 'Adding clearer photos will help make a more reliable recommendation.',
    notices
  };
}

/**
 * Generates the "Why?" 1-3 sentence natural explanation.
 */
export function generateRecommendationWhy(result, effectiveDisposition, overrideState, activeProduct) {
  if (overrideState) {
    const origAction = translateDisposition(result.disposition).actionLabel;
    const newAction = translateDisposition(overrideState.revised_verdict).actionLabel;
    return `Decision changed from "${origAction}" to "${newAction}". Reason: ${overrideState.reason}`;
  }

  const disp = (effectiveDisposition || result.disposition || 'pending_review').toLowerCase();
  const identity = String(result.identity || '').toUpperCase();
  const completeness = String(result.completeness || '').toUpperCase();
  const condObj = translateCondition(result.amazon_condition || result.condition, result.observed_state);
  const missing = Array.isArray(result.missing) ? result.missing : [];
  const quality = translatePhotoQuality(result.image_quality);

  // Wrong product / Mismatch
  if (identity === 'FAIL') {
    return 'The returned item does not match the product in the catalogue. It cannot be returned to inventory and should be disposed of or investigated.';
  }

  // Lookalike / Clone / Identity Uncertain
  if (identity === 'UNCERTAIN') {
    return 'The product looks similar to the expected item, but markings or features could not be verified with certainty. Human checking is needed.';
  }

  // Photo quality failure
  if (!quality.isGood && disp === 'pending_review') {
    return 'The photos are not clear enough to check the item properly. A team member should inspect the product in person.';
  }

  // Fail-open or system timeout
  if (result.confidence_note && result.confidence_note.includes('FAIL_OPEN')) {
    return 'Automated checking was temporarily unavailable. The return was saved safely and sent for human checking.';
  }

  // Missing items
  if (completeness === 'FAIL' || missing.length > 0) {
    const missingName = missing[0] || 'essential accessories';
    return `The product matches the expected item, but ${missingName} was missing. Sending it for repair or repackaging is recommended before selling again.`;
  }

  // Condition unacceptable / damaged
  if (condObj.title === 'Damaged' || disp === 'dispose') {
    return 'The item has serious physical damage and should not be returned to stock.';
  }

  // Lightly used / used -> Clearance
  if (disp === 'liquidate') {
    return 'The item is usable and complete, but shows noticeable signs of use, so selling it through clearance is recommended.';
  }

  // Send for repair
  if (disp === 'refurbish') {
    return 'The item works but needs cleaning, repackaging, or missing items before selling again.';
  }

  // Restock
  if (disp === 'restock') {
    return 'The product matches the expected item, all required items are present, and there are no visible defects.';
  }

  return ACTION_DEFINITIONS[disp]?.defaultWhy || 'Please check the item manually to determine the best next step.';
}

/**
 * Builds the simple, user-friendly "What we found" cards & evidence list.
 */
export function buildWhatWeFound(result, activeProduct) {
  const findings = [];
  const identity = String(result.identity || '').toUpperCase();
  const completeness = String(result.completeness || '').toUpperCase();
  const missing = Array.isArray(result.missing) ? result.missing : [];
  const condObj = translateCondition(result.amazon_condition || result.condition, result.observed_state);
  const observations = Array.isArray(result.physical_observations) ? result.physical_observations : [];
  const quality = translatePhotoQuality(result.image_quality);
  const contradictions = Array.isArray(result.contradictions) ? result.contradictions : [];

  // 1. Product check
  if (identity === 'PASS') {
    findings.push({
      type: 'product',
      icon: '✅',
      status: 'pass',
      title: 'Product check',
      summary: activeProduct ? `Looks like the correct product (${activeProduct.name})` : 'Looks like the correct product',
      detail: 'Brand logo, ports, and design match the catalogue specification.'
    });
  } else if (identity === 'FAIL') {
    findings.push({
      type: 'product',
      icon: '❌',
      status: 'fail',
      title: 'Product check',
      summary: 'Incorrect product returned',
      detail: 'The returned item does not match the product that was ordered.'
    });
  } else {
    findings.push({
      type: 'product',
      icon: '⚠️',
      status: 'uncertain',
      title: 'Product check',
      summary: 'Product match not clear',
      detail: 'The product looks similar, but markings could not be verified with certainty.'
    });
  }

  // 2. Items included
  if (completeness === 'PASS') {
    findings.push({
      type: 'items',
      icon: '✅',
      status: 'pass',
      title: 'Items included',
      summary: 'Everything expected was found',
      detail: activeProduct?.expectedParts?.length
        ? `All ${activeProduct.expectedParts.length} expected items were confirmed.`
        : 'All required parts were found.'
    });
  } else if (completeness === 'FAIL' || missing.length > 0) {
    const missingStr = missing.length > 0 ? missing.join(', ') : 'One or more items';
    findings.push({
      type: 'items',
      icon: '❌',
      status: 'fail',
      title: 'Items included',
      summary: `Missing: ${missingStr}`,
      detail: 'Some required accessories or parts were not found in the package.'
    });
  } else {
    findings.push({
      type: 'items',
      icon: '⚠️',
      status: 'uncertain',
      title: 'Items included',
      summary: 'Could not check all items',
      detail: 'Photos do not clearly show all compartments or included accessories.'
    });
  }

  // 3. Condition
  if (condObj.title === 'Like new') {
    findings.push({
      type: 'condition',
      icon: '✅',
      status: 'pass',
      title: 'Condition',
      summary: 'Like new',
      detail: condObj.description
    });
  } else if (condObj.title === 'Damaged') {
    findings.push({
      type: 'condition',
      icon: '❌',
      status: 'fail',
      title: 'Condition',
      summary: 'Physical damage found',
      detail: condObj.description
    });
  } else if (condObj.title === 'Not clear') {
    findings.push({
      type: 'condition',
      icon: '⚠️',
      status: 'uncertain',
      title: 'Condition',
      summary: 'Condition not clear',
      detail: condObj.description
    });
  } else {
    findings.push({
      type: 'condition',
      icon: '⚠️',
      status: 'warning',
      title: 'Condition',
      summary: condObj.title,
      detail: condObj.description
    });
  }

  // 4. Photos
  if (quality.isGood) {
    findings.push({
      type: 'photos',
      icon: '✅',
      status: 'pass',
      title: 'Photos',
      summary: 'Clear enough to inspect',
      detail: quality.advice
    });
  } else {
    const firstNotice = quality.notices[0];
    findings.push({
      type: 'photos',
      icon: '⚠️',
      status: 'uncertain',
      title: 'Photos',
      summary: firstNotice ? firstNotice.title : 'Photos need attention',
      detail: firstNotice ? firstNotice.detail : quality.advice
    });
  }

  // Specific physical observations connected to photos
  const detailedObservations = [];
  if (observations.length > 0) {
    for (const obs of observations) {
      const imgRef = obs.source_image ? `Found in Photo ${obs.source_image}` : null;
      detailedObservations.push({
        icon: obs.severity === 'severe' ? '❌' : '⚠️',
        label: capitalize(obs.observation || 'Visible issue'),
        photoRef: imgRef,
        location: obs.location || ''
      });
    }
  }

  // Contradictions
  const conflictingPoints = contradictions.map(c => {
    // Simplify technical contradiction strings
    if (c.toLowerCase().includes('mismatch')) {
      return 'The product in the photos does not match the product box or catalogue.';
    }
    if (c.toLowerCase().includes('clone') || c.toLowerCase().includes('lookalike')) {
      return 'The physical switches and logo do not match genuine manufacturer specifications.';
    }
    return c;
  });

  return {
    coreCards: findings,
    detailedObservations,
    conflictingPoints,
    photoAdvice: quality.notices
  };
}

/**
 * Builds the simple 6-step inspection activity list.
 */
export function buildInspectionActivity(result, photoCount = 1, activeProduct = null) {
  const steps = [
    { text: 'Product information loaded', status: 'done' },
    { text: `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} checked`, status: 'done' },
    {
      text: result.identity === 'PASS'
        ? 'Product matched'
        : (result.identity === 'FAIL' ? 'Product problem found' : 'Product check inconclusive'),
      status: result.identity === 'PASS' ? 'done' : 'warning'
    },
    {
      text: result.completeness === 'PASS'
        ? 'Included items checked'
        : (result.missing?.length > 0 ? 'Missing items identified' : 'Included items check inconclusive'),
      status: result.completeness === 'PASS' ? 'done' : 'warning'
    },
    {
      text: 'Condition checked',
      status: 'done'
    },
    {
      text: 'Recommendation created',
      status: 'done'
    }
  ];

  return steps;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
