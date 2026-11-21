import { guides, type Choice, type QuestId, type ScenarioId } from './content';
export interface Point {
  x: number;
  y: number;
}
export const WORLD = {
  width: 960,
  height: 600,
  radius: 12,
  step: 18,
  proximity: 80,
};
export const START: Point = { x: 320, y: 530 };
export function collides(point: Point): boolean {
  return guides.some(({ building: b }) => {
    const x = Math.max(b.x, Math.min(point.x, b.x + b.width));
    const y = Math.max(b.y, Math.min(point.y, b.y + b.height));
    return Math.hypot(point.x - x, point.y - y) < WORLD.radius;
  });
}
export function movePlayer(point: Point, dx: number, dy: number): Point {
  // Sweep small steps so a repeated or large input cannot tunnel through a wall.
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / WORLD.radius)
  );
  let current = point;
  for (let i = 0; i < steps; i++) {
    const next = {
      x: Math.max(24, Math.min(WORLD.width - 24, current.x + dx / steps)),
      y: Math.max(24, Math.min(WORLD.height - 24, current.y + dy / steps)),
    };
    if (!collides(next)) current = next;
  }
  return current;
}
export function nearestGuide(point: Point) {
  return (
    guides
      .map((guide) => ({
        guide,
        distance: Math.hypot(point.x - guide.x, point.y - guide.y),
      }))
      .filter(({ distance }) => distance <= WORLD.proximity)
      .sort((a, b) => a.distance - b.distance)[0]?.guide ?? null
  );
}
export interface AcademyState {
  completed: QuestId[];
  guideId: string | null;
  nodeId: string;
  scenario: ScenarioId | null;
  returnNode: string;
}
export const initialState: AcademyState = {
  completed: [],
  guideId: null,
  nodeId: 'start',
  scenario: null,
  returnNode: 'start',
};
export const available = (choice: Choice, completed: QuestId[]) =>
  !choice.requires ||
  choice.requires.every((quest) => completed.includes(quest));
export type AcademyAction =
  | { type: 'open'; guideId: string }
  | { type: 'close' }
  | { type: 'choice'; index: number }
  | { type: 'scenario-complete' }
  | { type: 'scenario-cancel' }
  | { type: 'reset' };
export function academyReducer(
  state: AcademyState,
  action: AcademyAction
): AcademyState {
  if (action.type === 'reset') return initialState;
  if (action.type === 'open')
    return guides.some((g) => g.id === action.guideId)
      ? { ...state, guideId: action.guideId, nodeId: 'start', scenario: null }
      : state;
  if (action.type === 'close')
    return { ...state, guideId: null, scenario: null };
  if (action.type === 'scenario-cancel') return { ...state, scenario: null };
  if (action.type === 'scenario-complete')
    return state.scenario
      ? { ...state, scenario: null, nodeId: state.returnNode }
      : state;
  if (state.scenario) return state;
  const guide = guides.find((g) => g.id === state.guideId);
  const node = guide?.nodes.find((n) => n.id === state.nodeId);
  const choice = node?.choices[action.index];
  if (!choice || !available(choice, state.completed)) return state;
  if (choice.scenario)
    return {
      ...state,
      scenario: choice.scenario,
      returnNode: choice.next ?? state.nodeId,
    };
  return {
    ...state,
    nodeId: choice.next ?? state.nodeId,
    completed:
      choice.completeQuest && !state.completed.includes(choice.completeQuest)
        ? [...state.completed, choice.completeQuest]
        : state.completed,
  };
}
