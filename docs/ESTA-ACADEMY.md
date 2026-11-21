# ESTA Academy vertical slice

## Scope

`/interactive-world` is a public, lazy-loaded educational route, linked from the landing page by
**Explore ESTA Academy**. It is available even while authentication is loading or an account lookup
fails. The existing application retains its own loading, verification and authorization gates.

This is a React/TypeScript feature in the existing Vite application. It adds no dependencies,
API keys, paid services, multiplayer, AI generation, map providers or backend endpoints.

The SVG campus has six locations and guides: Employer Office, Payroll Desk, Employee Center,
Compliance Inspector, Rules Library and Audit Center. The four initial lessons cover company
setup, payroll review, employee request status and useful audit records.

## Content and state

- `apps/frontend/src/academy/content.ts`: NPC identity, positions, building obstacles, dialogue
  nodes, branching choices, prerequisite conditions, quest completion and scenario launches.
  Bump `CONTENT_VERSION` when making substantive educational changes.
- `model.ts`: pure movement/collision/proximity helpers and a dialogue/quest reducer. Conditional
  choices cannot execute before their requirements are met; an active scenario blocks dialogue
  transitions until it is completed or cancelled.
- `scenarios.ts`: versioned-engine adapter and scenario definitions. The accrual example calls
  `calculateAccrualV2` from the existing authoritative engine for a clearly specified illustrative
  large employer and a fixed example date. No ESTA formulas or legal policy constants are copied.
- `WorldMap.tsx`, `Scenario.tsx`, `InteractiveWorld.tsx`: presentation and interactions.
- `academy.css`: scoped responsive styles and reduced-motion behavior.

All learning state lives in React memory and is cleared by restart, reload or leaving the route.
No progress, identity, balances, requests or imported rosters are saved to Firebase or local storage.
Every scenario labels its examples as synthetic practice. Quest completion is not a compliance
certification and does not approve an account. QuickBooks content describes mapped CSV imports
and explicitly identifies live connection/synchronization as future work.

## Input and accessibility

Focus the map and use arrow keys or W/A/S/D. Keyboard repeat moves continuously in small steps.
Press E or Enter within range of a guide. Touch-friendly direction buttons provide discrete movement.
Map bounds and swept collision checks prevent movement through buildings.

The expanded location list is an equivalent, keyboard-accessible path to every guide and lesson.
It places the player at a safe arrival point and opens the conversation. No lesson requires walking.
Named regions, a native progress element, status announcements, visible focus outlines and controls
at least 44px high support keyboard and assistive-technology use. Conversation changes focus the
panel; closing or Escape returns focus to the entry control. No modal focus trap is needed because
the conversation is an ordinary page section. Reduced motion disables player transitions.

## Analytics

If the existing PostHog integration is already configured, the feature emits only these fixed events:
`academy_entered`, `academy_conversation_started`, `academy_scenario_completed`,
`academy_tour_completed`, and `academy_workspace_clicked`.
There are no custom event properties, sample details, answers or account identifiers. Existing
autocapture/replay restrictions remain intact. Missing analytics configuration does not affect use.
These aggregate counts can help assess exploration and the move into the workspace; they do not
establish improved legal understanding. Seek user feedback before expanding this slice.

## Verification

```sh
npm run test --workspace apps/frontend -- --run src/academy/model.test.ts src/academy/InteractiveWorld.test.tsx src/pages/__tests__/Landing.test.tsx
npm run typecheck --workspace apps/frontend
npm run lint --workspace apps/frontend
npm run check:claims
```

Start the existing frontend on port 5180 (or set `ACADEMY_BASE_URL`), then run:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/workspace/academy-browser.mjs
```

The browser test checks anonymous access while blocking account/cloud-service requests, desktop
movement, all four quests, a conditional branch, wrong-answer retry, focus recovery, restart,
landing-page entry and links back to the application. It also checks mobile touch controls,
reduced motion, horizontal overflow and the absence of authoritative record writes.

Automated tests do not constitute a complete screen-reader audit. Inspect with real assistive
technology and gather employer/employee feedback before expanding the experience.

## Release boundaries

This feature is stacked on draft PR #390's application work. It does not deploy or repair the
production workspace API, switch Firebase projects, migrate accounts or change balances.
The previously identified missing production `workspaceApi` and Firebase/account-migration
decisions remain higher-priority release gates. See `PRODUCT-DELIVERY.md` and
`tests/workspace/README.md`. No production configuration was changed for the academy.

### Recorded results

- Full frontend regression run: 46 files, 508 tests passed and 8 skipped.
- Additional public-route isolation test: passed without calling workspace authentication.
- Browser flows passed on desktop and mobile, with cloud services blocked and no record writes.
- No horizontal overflow at 320px, 390px or 768px; reduced-motion transition check passed.
- Frontend build, typecheck, lint and product-claims checks passed. Existing optional Edge Config
  requests fell back when the local proxy had no backend on port 3001.
- Production was not changed or promoted.
