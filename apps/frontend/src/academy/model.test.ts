import { describe, expect, it } from 'vitest';
import { calculateAccrualV2 } from '@esta-tracker/accrual-engine';
import { guides, quests } from './content';
import {
  academyReducer,
  available,
  collides,
  initialState,
  movePlayer,
  nearestGuide,
  START,
} from './model';
import { practiceAccrual, scenarios } from './scenarios';

describe('academy movement and content integrity', () => {
  it('keeps movement in bounds and cannot tunnel through buildings', () => {
    expect(movePlayer(START, -5000, 0).x).toBe(24);
    expect(movePlayer(START, 0, 5000).y).toBe(576);
    const stopped = movePlayer({ x: 160, y: 230 }, 0, -220);
    expect(stopped.y).toBeGreaterThanOrEqual(193);
    expect(collides(stopped)).toBe(false);
    expect(collides({ x: 160, y: 100 })).toBe(true);
  });
  it('puts every accessible arrival near its guide and outside obstacles', () => {
    for (const guide of guides) {
      const arrival = { x: guide.x, y: guide.y + 44 };
      expect(collides(arrival)).toBe(false);
      expect(nearestGuide(arrival)?.id).toBe(guide.id);
    }
    expect(nearestGuide(START)).toBeNull();
  });
  it('validates all content transitions, conditions, quests and scenarios', () => {
    expect(new Set(guides.map((g) => g.id)).size).toBe(guides.length);
    for (const guide of guides) {
      const ids = guide.nodes.map((node) => node.id);
      expect(ids).toContain('start');
      expect(new Set(ids).size).toBe(ids.length);
      for (const node of guide.nodes)
        for (const choice of node.choices) {
          if (choice.next) expect(ids).toContain(choice.next);
          if (choice.scenario) expect(scenarios[choice.scenario]).toBeDefined();
          if (choice.completeQuest)
            expect(quests.map((q) => q.id)).toContain(choice.completeQuest);
          for (const required of choice.requires ?? [])
            expect(quests.map((q) => q.id)).toContain(required);
        }
    }
  });
  it('blocks conditional choices, does not skip an active scenario, and resets only learning state', () => {
    let state = academyReducer(initialState, {
      type: 'open',
      guideId: 'compliance-inspector',
    });
    expect(academyReducer(state, { type: 'choice', index: 2 })).toEqual(state);
    expect(available({ label: 'All done', requires: ['setup'] }, [])).toBe(
      false
    );
    state = academyReducer(state, { type: 'choice', index: 0 });
    expect(state.scenario).toBe('audit-review');
    expect(academyReducer(state, { type: 'choice', index: 0 })).toEqual(state);
    state = academyReducer(state, { type: 'scenario-complete' });
    state = academyReducer(state, { type: 'choice', index: 0 });
    expect(state.completed).toEqual(['records']);
    expect(academyReducer(state, { type: 'reset' })).toEqual(initialState);
  });
  it('uses the existing rules engine for every calculation example', () => {
    for (const worked of [30, 60, 90, 120]) {
      expect(practiceAccrual(worked).accrued).toBe(
        calculateAccrualV2(worked, 'large', 0, new Date('2026-01-01T00:00:00Z'))
          .accrued
      );
    }
  });
});
