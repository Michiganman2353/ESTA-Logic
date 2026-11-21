import { useState } from 'react';
import type { ScenarioId } from './content';
import { practiceAccrual, scenarios } from './scenarios';

export function Scenario({
  id,
  onComplete,
  onCancel,
}: {
  id: ScenarioId;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [worked, setWorked] = useState(60);
  const [answer, setAnswer] = useState('');
  const scenario = scenarios[id];
  const result = id === 'accrual' ? practiceAccrual(worked) : null;
  const correct = answer === scenario.correct;
  return (
    <div className="academy-scenario">
      <p className="academy-kicker">Practice scenario · No real records</p>
      <h3>{scenario.title}</h3>
      <p>{scenario.context}</p>
      {result && (
        <label className="academy-field">
          Illustrative hours worked
          <select
            value={worked}
            onChange={(event) => {
              setWorked(Number(event.target.value));
              setAnswer('');
            }}
          >
            {[30, 60, 90, 120].map((hours) => (
              <option key={hours} value={hours}>
                {hours} hours
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset disabled={correct}>
        <legend>{scenario.question}</legend>
        <div className="academy-choices">
          {scenario.answers.map((choice) => (
            <button
              type="button"
              key={choice.id}
              aria-pressed={answer === choice.id}
              onClick={() => setAnswer(choice.id)}
            >
              {choice.label === 'engine-result'
                ? `${result?.accrued} hours, calculated for this period`
                : choice.label}
            </button>
          ))}
        </div>
      </fieldset>
      {answer && (
        <div
          className={`academy-answer ${correct ? 'is-correct' : ''}`}
          role="status"
        >
          <strong>
            {correct ? 'That’s the key idea.' : 'Take another look.'}
          </strong>
          <p>
            {correct
              ? scenario.explanation
              : 'Read the practice details again and try another choice. You can retry without losing your progress.'}
          </p>
          {correct && result && (
            <p>
              Engine ruleset {result.version} · {result.legislativeReference} ·
              Illustration date: January 1, 2026. This result is not saved.
            </p>
          )}
        </div>
      )}
      <div className="academy-panel-actions">
        {correct && (
          <button
            type="button"
            className="academy-primary"
            onClick={onComplete}
          >
            Continue lesson
          </button>
        )}
        <button type="button" onClick={onCancel}>
          Back to conversation
        </button>
      </div>
    </div>
  );
}
