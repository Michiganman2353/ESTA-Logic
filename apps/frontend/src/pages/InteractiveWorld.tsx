import { useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { guides, quests, CONTENT_VERSION } from '@/academy/content';
import {
  academyReducer,
  available,
  initialState,
  movePlayer,
  nearestGuide,
  START,
  WORLD,
} from '@/academy/model';
import { WorldMap } from '@/academy/WorldMap';
import { Scenario } from '@/academy/Scenario';
import { trackAcademyEvent } from '@/lib/analytics';
import '@/academy/academy.css';

export default function InteractiveWorld() {
  const [position, setPosition] = useState(START);
  const [state, dispatch] = useReducer(academyReducer, initialState);
  const map = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const nearby = nearestGuide(position);
  const guide = guides.find((g) => g.id === state.guideId);
  const node = guide?.nodes.find((n) => n.id === state.nodeId);
  const allComplete = state.completed.length === quests.length;
  const reportedCompletion = useRef(false);
  useEffect(() => {
    trackAcademyEvent('academy_entered');
  }, []);
  useEffect(() => {
    if (allComplete && !reportedCompletion.current) {
      reportedCompletion.current = true;
      trackAcademyEvent('academy_tour_completed');
    }
  }, [allComplete]);
  useEffect(() => {
    if (state.guideId) panel.current?.focus();
  }, [state.guideId, state.nodeId, state.scenario]);
  function open(id: string) {
    returnFocus.current = document.activeElement as HTMLElement;
    dispatch({ type: 'open', guideId: id });
    trackAcademyEvent('academy_conversation_started');
  }
  function close() {
    dispatch({ type: 'close' });
    returnFocus.current?.focus();
  }
  function move(dx: number, dy: number) {
    if (!state.guideId) setPosition((point) => movePlayer(point, dx, dy));
  }
  function restart() {
    dispatch({ type: 'reset' });
    setPosition(START);
    reportedCompletion.current = false;
    map.current?.focus();
  }
  return (
    <div className="academy">
      <header className="academy-topbar">
        <Link to="/" className="academy-brand">
          <img src="/logo-icon.svg" alt="" />
          ESTA Tracker <span>/ Academy</span>
        </Link>
        <nav aria-label="Academy navigation">
          <Link to="/learn">Employer guide</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>
      <main id="main-content" className="academy-main">
        <section className="academy-intro">
          <div>
            <p className="academy-kicker">
              Learn the process. Then make it real.
            </p>
            <h1>Explore ESTA Academy</h1>
            <p>
              A small world for a clearer first step. Meet the guides, try a
              scenario, and learn how your real workspace fits together.
            </p>
          </div>
          <div className="academy-demo-label">
            <span aria-hidden="true">◇</span>
            <div>
              <strong>Public learning mode</strong>
              <span>No account required. No records changed.</span>
            </div>
          </div>
        </section>
        <div className="academy-layout">
          <section className="academy-explore" aria-label="Explore the academy">
            <div className="academy-section-heading">
              <h2>The learning campus</h2>
              <span>6 places · 4 learning milestones</span>
            </div>
            <WorldMap
              ref={map}
              position={position}
              nearbyId={nearby?.id}
              onMove={move}
              onInteract={() => {
                if (nearby && !state.guideId) open(nearby.id);
              }}
            />
            <div className="academy-map-footer">
              <p id="academy-map-help">
                Focus the map and use arrow keys or W/A/S/D to move. Press E or
                Enter near a guide. On touch screens, tap the direction
                controls. Buildings block movement.
              </p>
              <div className="academy-pad" aria-label="Movement controls">
                {[
                  { label: 'north', x: 0, y: -1, mark: '↑' },
                  { label: 'west', x: -1, y: 0, mark: '←' },
                  { label: 'south', x: 0, y: 1, mark: '↓' },
                  { label: 'east', x: 1, y: 0, mark: '→' },
                ].map((direction) => (
                  <button
                    type="button"
                    key={direction.label}
                    disabled={!!state.guideId}
                    aria-label={`Move ${direction.label}`}
                    onClick={() =>
                      move(direction.x * WORLD.step, direction.y * WORLD.step)
                    }
                  >
                    {direction.mark}
                  </button>
                ))}
              </div>
            </div>
            <div className="academy-interaction">
              <p role="status" aria-live="polite">
                {state.guideId
                  ? `Conversation open with ${guide?.title}.`
                  : nearby
                    ? `${nearby.title} is nearby at ${nearby.location}.`
                    : 'Follow the paths to a guide, or choose a location below.'}
              </p>
              <button
                type="button"
                className="academy-primary"
                disabled={!nearby || !!state.guideId}
                onClick={() => {
                  if (nearby) open(nearby.id);
                }}
              >
                Talk to {nearby?.title ?? 'a guide'}
              </button>
            </div>
            <details className="academy-directory" open>
              <summary>
                Location list · accessible alternative to walking
              </summary>
              <p>
                Every lesson is available here. Select a location to meet its
                guide; movement is optional.
              </p>
              <div>
                {guides.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => {
                      setPosition({ x: person.x, y: person.y + 44 });
                      open(person.id);
                    }}
                  >
                    <span>{person.mark}</span>
                    <strong>{person.location}</strong>
                    <small>{person.title} →</small>
                  </button>
                ))}
              </div>
            </details>
          </section>
          <aside
            className="academy-sidebar"
            aria-label="Learning and conversations"
          >
            {guide && node ? (
              <section
                className="academy-dialogue"
                ref={panel}
                tabIndex={-1}
                aria-labelledby="academy-conversation-title"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    close();
                  }
                }}
              >
                <div className="academy-dialogue-heading">
                  <div>
                    <p className="academy-kicker">Educational conversation</p>
                    <h2 id="academy-conversation-title">
                      {guide.name} <span>· {guide.title}</span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="academy-close"
                    aria-label="Close conversation"
                    onClick={close}
                  >
                    ×
                  </button>
                </div>
                {state.scenario ? (
                  <Scenario
                    key={state.scenario}
                    id={state.scenario}
                    onCancel={() => dispatch({ type: 'scenario-cancel' })}
                    onComplete={() => {
                      dispatch({ type: 'scenario-complete' });
                      trackAcademyEvent('academy_scenario_completed');
                    }}
                  />
                ) : (
                  <>
                    <h3>{node.title}</h3>
                    <p>{node.text}</p>
                    <div className="academy-choices">
                      {node.choices.map((choice, index) =>
                        available(choice, state.completed) ? (
                          <button
                            type="button"
                            key={choice.label}
                            onClick={() => dispatch({ type: 'choice', index })}
                          >
                            {choice.label}
                            <span aria-hidden="true">→</span>
                          </button>
                        ) : null
                      )}
                    </div>
                  </>
                )}
              </section>
            ) : (
              <section className="academy-welcome">
                <span className="academy-compass" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M5 19 19 5M6 5h13v13" />
                  </svg>
                </span>
                <p className="academy-kicker">Your first visit</p>
                <h2>
                  Pick a path.
                  <br />
                  Find your next step.
                </h2>
                <p>
                  Start with the Employer Guide for company setup, or visit the
                  Employee Center to explore access and requests. There’s no
                  timer, score or wrong route.
                </p>
                <button
                  type="button"
                  className="academy-primary"
                  onClick={() => {
                    setPosition({ x: 160, y: 260 });
                    open('employer-guide');
                  }}
                >
                  Meet the Employer Guide
                </button>
              </section>
            )}
            <section
              className="academy-progress"
              aria-labelledby="academy-progress-title"
            >
              <div className="academy-section-heading">
                <h2 id="academy-progress-title">Your learning path</h2>
                <span>
                  {state.completed.length} / {quests.length}
                </span>
              </div>
              <progress
                aria-label="Learning milestones completed"
                max={quests.length}
                value={state.completed.length}
              />
              <ul>
                {quests.map((quest) => (
                  <li key={quest.id}>
                    <span
                      className={
                        state.completed.includes(quest.id) ? 'is-complete' : ''
                      }
                      aria-hidden="true"
                    >
                      {state.completed.includes(quest.id) ? '✓' : '○'}
                    </span>
                    <div>
                      <strong>{quest.label}</strong>
                      <p>{quest.detail}</p>
                      <span className="academy-sr-only">
                        {state.completed.includes(quest.id)
                          ? 'Completed'
                          : 'Not completed'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="academy-progress-note">
                Progress lasts for this visit only. These milestones are not a
                certification or an account approval.
              </p>
              <button
                type="button"
                className="academy-text-button"
                onClick={restart}
              >
                Restart this visit
              </button>
            </section>
            {allComplete && (
              <section className="academy-finish" role="status">
                <h2>You’ve connected the steps.</h2>
                <p>
                  Take your learning into a real process. Your workspace still
                  requires an account, email verification and company
                  authorization.
                </p>
              </section>
            )}
            <section className="academy-next">
              <h2>When you’re ready</h2>
              <p>
                Academy practice stays here. Use the existing app for your
                company’s actual records.
              </p>
              <Link
                className="academy-primary"
                to="/register/manager"
                onClick={() => trackAcademyEvent('academy_workspace_clicked')}
              >
                Set up company records →
              </Link>
              <div>
                <Link to="/register/employee">Join your employer</Link>
                <Link
                  to="/login"
                  onClick={() => trackAcademyEvent('academy_workspace_clicked')}
                >
                  Sign in to workspace
                </Link>
              </div>
            </section>
          </aside>
        </div>
        <footer className="academy-footnote">
          <p>
            Educational content {CONTENT_VERSION}. Practice examples are
            synthetic, never personal balances or live company records. Confirm
            current requirements with official guidance.
          </p>
          <a
            href="https://www.michigan.gov/leo/bureaus-agencies/ber/wage-and-hour/paid-medical-leave-act"
            target="_blank"
            rel="noreferrer"
          >
            Michigan ESTA guidance (opens a new tab)
          </a>
        </footer>
      </main>
    </div>
  );
}
