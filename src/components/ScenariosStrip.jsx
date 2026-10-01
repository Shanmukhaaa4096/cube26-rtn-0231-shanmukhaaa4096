import React from 'react';
import { BoxIcon } from './Icons.jsx';
import { PRD_TEST_SCENARIOS } from '../data/testScenarios.js';

// Human-friendly titles for the sample scenarios
const SAMPLE_TITLES = {
  1: '1. Sealed Headphone (Pristine)',
  2: '2. Headphone (Missing Cable)',
  3: '3. Desk Lamp (Light Wear)',
  4: '4. Puzzle Box (Heavy Damage)',
  5: '5. Incorrect Item in Box',
  6: '6. Lookalike Lamp (Check Markings)',
  7: '7. Unclear Label Photo',
  8: '8. No Photos Attached',
  9: '9. Unclear Condition',
  10: '10. Lookalike Earbuds'
};

export function ScenariosStrip({ onSelectScenario, activeScenarioId }) {
  return (
    <div className="scenarios-strip" aria-label="Sample test cases">
      <div className="scenarios-header">
        <div className="scenarios-title">
          <BoxIcon size={14} />
          <span>Sample Return Cases</span>
        </div>
        <span className="scenarios-subtitle">
          Click any example to load its photos and test the inspection
        </span>
      </div>

      <div className="scenarios-scroll">
        {PRD_TEST_SCENARIOS.map((scen) => {
          const isActive = activeScenarioId === scen.id;
          const displayTitle = SAMPLE_TITLES[scen.id] || `Sample #${scen.id}`;

          return (
            <button
              key={scen.id}
              type="button"
              className={`scenario-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(scen)}
              title={scen.subtitle || displayTitle}
            >
              <span className="scenario-dot" aria-hidden="true" />
              <span>{displayTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
