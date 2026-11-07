# A Level Computer Science explainers

Interactive, beginner-friendly lessons for Cambridge International A Level
Computer Science (9618). Each lesson runs Cambridge-style Python one line at a
time, with an explanation of every line, a picture of what changed and a trace
table that fills in as you go.

**Try it:** https://ricproenca.github.io/cs-alevel-explainer/

## Lessons

- [Stacks](https://ricproenca.github.io/cs-alevel-explainer/lessons/stacks): push,
  pop, peek, `IsEmpty` and `IsFull`, with `TopPointer` starting at -1 or at 0.
- [Linear queues](https://ricproenca.github.io/cs-alevel-explainer/lessons/queues):
  enqueue, dequeue, peek, `IsEmpty` and `IsFull`, with `TailPointer` starting at
  -1 or at 0, and why a linear queue can fill up while space is free.
- [Circular queues](https://ricproenca.github.io/cs-alevel-explainer/lessons/circular-queues):
  the same operations, with both pointers wrapping round to index 0 so freed
  space is reused.

## Running it locally

You need Node.js 22.12 or later, and Python 3 to regenerate traces.

```sh
npm install
npm run dev     # start the site at http://localhost:4321/cs-alevel-explainer/
npm run build   # build the static site into dist/
npm test        # run the browser tests (uses your installed Chrome)
```

## How a lesson works

Each lesson's Python files, such as `src/lessons/stacks/start-at-0/push-and-pop.py`,
are the source of truth. `npm run trace` runs every one of them and records what
each line did in `traces.json`. The step-through and trace table are built from
that file, so what students see always matches what the code really does.

After changing a Python file, run `npm run trace` and commit the updated
`traces.json`. Never edit `traces.json` by hand.

The explanation for each line lives in the lesson's `lesson.ts`. The build fails
if any line that runs has no explanation.

## Deployment

Every push to `main` runs the tests and, if they pass, deploys the site to
GitHub Pages.
