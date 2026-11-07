import {
  buildScenario,
  type Algorithm,
  type Explain,
  type ScenarioConfig,
  type Trace,
} from "../../lib/stepper";
import { columns, sharedExplanations } from "../queues/lesson";
import traces from "./traces.json" with { type: "json" };

export { variables } from "../queues/lesson";

// Explains the line that checks whether a pointer has gone past the end.
const wrapCheck =
  (pointer: string): Explain =>
  ({ step }) => {
    const value = step.vars[pointer] as number;
    return value === step.vars.QueueSize
      ? `Checks if \`${pointer}\` has gone past the end of the array. It is ${value}, and there is no index ${value}, so it must wrap round to the start.`
      : `Checks if \`${pointer}\` has gone past the end of the array. It is ${value}, which is inside the array, so it doesn't need to wrap round.`;
  };

const wrapToStart = (pointer: string) =>
  `Sends \`${pointer}\` back to index 0, the start of the array. This is what makes the queue circular: space freed at the front can be used again.`;

// Explains "HeadPointer = 0" or "TailPointer = 0", which is either the setup
// line in the main program or the wrap inside a function.
const startOrWrap =
  (pointer: string, setup: string): Explain =>
  ({ step }) =>
    step.scope === "<module>" ? setup : wrapToStart(pointer);

const pastEndNote = (value: number, size: unknown) =>
  value === size ? ` There is no index ${value}, so the next lines wrap it round to 0.` : "";

const leftoverNote = ({ step, previous }: Parameters<Exclude<Explain, string>>[0]) => {
  const oldValue = (previous?.vars.Queue as string[])[step.vars.TailPointer as number];
  return oldValue
    ? ` This replaces the leftover "${oldValue}", which stopped being part of the queue when it was dequeued.`
    : "";
};

const circularExplanations: Record<string, Explain> = {
  ...sharedExplanations,
  "HeadPointer = 0": startOrWrap("HeadPointer", sharedExplanations["HeadPointer = 0"] as string),
  "if NumberItems == QueueSize:": ({ step }) => {
    const count = step.vars.NumberItems;
    const size = step.vars.QueueSize;
    if (count === size) {
      return `Checks if the queue is full. \`NumberItems\` is ${count}, the same as \`QueueSize\`, so every space holds an item.`;
    }
    const nextStep = step.scope === "IsFull" ? "the queue isn't full" : "there is space";
    return `Checks if the queue is full. \`NumberItems\` is ${count} but \`QueueSize\` is ${size}, so ${nextStep} and Python moves to the \`else\` part. A circular queue checks the count, not \`TailPointer\`, because the tail can wrap round.`;
  },
  "if TailPointer == QueueSize:": wrapCheck("TailPointer"),
  "if HeadPointer == QueueSize:": wrapCheck("HeadPointer"),
  "HeadPointer = HeadPointer + 1": ({ step, previous }) => {
    const head = step.vars.HeadPointer as number;
    return `Moves \`HeadPointer\` from ${previous?.vars.HeadPointer} to ${head}. "${step.vars.Item}" is still in the array, but it is no longer part of the queue.${pastEndNote(head, step.vars.QueueSize)}`;
  },
};

const tailAtMinusOne: Record<string, Explain> = {
  ...circularExplanations,
  "TailPointer = -1":
    "`TailPointer` stores the index of the last item, at the back of the queue. There is no index -1, so -1 means nothing has been added yet.",
  "TailPointer = 0": wrapToStart("TailPointer"),
  "TailPointer = TailPointer + 1": ({ step, previous }) => {
    const tail = step.vars.TailPointer as number;
    return `Moves \`TailPointer\` from ${previous?.vars.TailPointer} to ${tail}, towards the next free space at the back. This must happen before storing the item, or the last item would be overwritten.${pastEndNote(tail, step.vars.QueueSize)}`;
  },
  "Queue[TailPointer] = Item": (context) =>
    `Stores "${context.step.vars.Item}" at index ${context.step.vars.TailPointer}, at the back of the queue.${leftoverNote(context)}`,
};

const tailAtZero: Record<string, Explain> = {
  ...circularExplanations,
  "TailPointer = 0": startOrWrap(
    "TailPointer",
    "`TailPointer` stores the index of the next free space at the back of the queue. Index 0 is free, so it starts at 0.",
  ),
  "Queue[TailPointer] = Item": (context) =>
    `Stores "${context.step.vars.Item}" at index ${context.step.vars.TailPointer}, the next free space at the back of the queue.${leftoverNote(context)}`,
  "TailPointer = TailPointer + 1": ({ step, previous }) => {
    const tail = step.vars.TailPointer as number;
    return `Moves \`TailPointer\` from ${previous?.vars.TailPointer} to ${tail}, towards the next free space. This must happen after storing the item, or the item would go in the wrong space.${pastEndNote(tail, step.vars.QueueSize)}`;
  },
};

const scenarioConfigs: ScenarioConfig[] = [
  {
    id: "enqueue-and-dequeue",
    label: "Enqueue and dequeue",
    summary: "Adds two items, removes one, then adds another.",
    ending:
      "The program has finished. The queue holds B and C, with B at the front. A was removed first because it joined first.",
  },
  {
    id: "peek-and-checks",
    label: "Peek, IsEmpty and IsFull",
    summary: "Checks the queue and looks at the front item without changing anything.",
    ending:
      "The program has finished. A is still in the queue, because only `Enqueue` changed it.",
  },
  {
    id: "queue-full",
    label: "When the queue is full",
    summary: "Fills the queue, then tries to add one more item.",
    ending: "The program has finished. The queue is still full, holding A, B and C.",
  },
  {
    id: "queue-empty",
    label: "When the queue is empty",
    summary: "Tries to remove an item when there is nothing to remove.",
    ending: "The program has finished, and the queue is still empty.",
  },
  {
    id: "tail-wraps-round",
    label: "Tail wraps round",
    summary:
      "The same program that made the linear queue report full: fill the queue, remove an item, then add another.",
    ending:
      "The program has finished. D went into index 0, the space A left behind. The queue holds B, C and D, with B at the front and D at the back.",
  },
  {
    id: "head-wraps-round",
    label: "Head wraps round",
    summary: "Fills the queue, then removes every item.",
    ending:
      "The program has finished. The queue is empty, and `HeadPointer` has wrapped round to 0, where the next item will go.",
  },
];

const allTraces = traces as unknown as Record<string, Trace>;

const buildScenarios = (folder: string, explanations: Record<string, Explain>) =>
  scenarioConfigs.map((config) =>
    buildScenario(config, allTraces[`${folder}/${config.id}`], explanations, columns),
  );

export const algorithms: Algorithm[] = [
  {
    id: "tail-at-minus-1",
    label: "TailPointer starts at -1",
    description:
      "`TailPointer` holds the index of the last item. It starts at -1 and moves up before each new item is stored.",
    scenarios: buildScenarios("tail-at-minus-1", tailAtMinusOne),
  },
  {
    id: "tail-at-0",
    label: "TailPointer starts at 0",
    description:
      "`TailPointer` holds the index of the next free space. It starts at 0 and moves up after each new item is stored.",
    scenarios: buildScenarios("tail-at-0", tailAtZero),
  },
];
