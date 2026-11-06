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

The first lesson is Abstract Data Types: stacks. Don't start other topics until
told what comes next.

## Working on lessons

- `npm run dev` starts the site. `npm run build` checks it builds.
- Each lesson's Python files are the source of truth. After changing one, run
  `npm run trace` to regenerate `traces.json`, which drives the step-through and
  trace table. Never edit `traces.json` by hand.
- Astro is pinned to 7.3.8 because newer releases need Node 22.23.4 or later.
