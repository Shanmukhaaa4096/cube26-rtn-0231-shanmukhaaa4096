import React from 'react';
import { BoxIcon, CheckIcon, CrossIcon, AlertIcon, FlagIcon } from './Icons.jsx';
import { PRD_TEST_SCENARIOS } from '../data/testScenarios.js';

export function ScenariosStrip({ onSelectScenario, activeScenarioId }) {
  const getScenarioIcon = (scenario) => {
    if (scenario.id === 9) {
      return <FlagIcon size={13} color="#f59e0b" />;
    }
    if (scenario.id === 10) {
      return <AlertIcon size={13} color="#f97316" />;
    }
    if (scenario.expectedVerdict.identity === "FAIL") {
      return <CrossIcon size={13} color="#b91c1c" />;
    }
    if (scenario.expectedVerdict.completeness === "FAIL") {
      return <AlertIcon size={13} color="#b45309" />;
    }
    return <CheckIcon size={13} color="#15803d" />;
  };

  return (
    <div className="scenarios-strip">
      <div className="scenarios-header">
        <div className="scenarios-title">
          <BoxIcon size={14} />
          <span>PRD Evaluation Bench: 10 Required Test Scenarios</span>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Click any scenario to populate test inputs
        </span>
      </div>

      <div className="scenarios-scroll">
        {PRD_TEST_SCENARIOS.map((scen) => {
          const isActive = activeScenarioId === scen.id;

          return (
            <button
              key={scen.id}
              className={`scenario-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(scen)}
              title={`${scen.title}: ${scen.subtitle}`}
            >
              {getScenarioIcon(scen)}
              <span>#{scen.id} {scen.title.replace(/Scenario \d+:\s*/i, '').trim()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
