## Product goal

Turn Cambridge International A Level Computer Science (9618) topics into
beginner-friendly, interactive website explainers.

Each lesson must include:

- Cambridge-style Python code (Python only, no pseudocode), written in plain,
  beginner-friendly Python that follows Cambridge naming and structure. Implement
  data structures the Cambridge way, e.g. a stack is a fixed-size array with a
  `TopPointer` pointer, not `list.append()` and `list.pop()`
- A line-by-line explanation and visualization
- A visual trace table

## Tech stack

Build the site with a static site framework (e.g. Astro) with interactive
components. Lessons share a layout and step-through widgets.

## Scope

Lessons so far: stacks, linear queues and circular queues (Abstract Data Types).
Don't start other topics until told what comes next.

## Working on lessons

- `npm run dev` starts the site at `http://localhost:4321/cs-alevel-explainer/`.
  `npm run build` checks it builds. `npm test` runs the Playwright browser tests.
- When run by an AI agent, Astro starts dev and preview servers in the background,
  so Playwright reports "webServer exited early". Run `npm run build`, then
  `npx astro preview --port 4322` (it backgrounds itself), then `npm test`, and
  `npx astro preview stop` afterwards.
- Pushing to `main` runs the tests and deploys to GitHub Pages.
- Each lesson's Python files are the source of truth. After changing one, run
  `npm run trace` to regenerate `traces.json`, which drives the step-through and
  trace table. Never edit `traces.json` by hand.
- Astro is pinned to 7.3.8 because newer releases need Node 22.23.4 or later.
