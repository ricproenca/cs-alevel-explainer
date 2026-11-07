import { callWithItem, printResult } from "../../lib/explain";
import {
  buildScenario,
  type Algorithm,
  type Explain,
  type ScenarioConfig,
  type Trace,
  type TraceColumn,
} from "../../lib/stepper";
import traces from "./traces.json" with { type: "json" };

export const columns: TraceColumn[] = [
  { key: "HeadPointer", label: "HeadPointer" },
  { key: "TailPointer", label: "TailPointer" },
  { key: "NumberItems", label: "NumberItems" },
  { key: "Queue[0]", label: "Queue[0]" },
  { key: "Queue[1]", label: "Queue[1]" },
  { key: "Queue[2]", label: "Queue[2]" },
  { key: "Item", label: "Item" },
  { key: "Removed", label: "Removed" },
];

export const variables = ["QueueSize", "NumberItems", "Item", "Removed"];

const enqueueCall = callWithItem("Enqueue");

const fullCheck = (limitName: string, limit: (queueSize: number) => number): Explain =>
  ({ step }) => {
    const tail = step.vars.TailPointer as number;
    const size = step.vars.QueueSize as number;
    const value = limit(size);
    const check = `Checks if the queue is full. \`TailPointer\` is ${tail} and \`${limitName}\``;
    if (tail === value) {
      const items = step.vars.NumberItems as number;
      const wasted =
        items < size
          ? ` Only ${items} of the ${size} spaces hold queue items, but in a linear queue \`TailPointer\` can't go back to the start, so the free space at the front can't be used.`
          : "";
      return `${check} is also ${value}. They match, so there is no space left at the back of the array.${wasted}`;
    }
    const nextStep = step.scope === "IsFull" ? "the queue isn't full" : "there is space at the back";
    return `${check} is ${value}. They don't match, so ${nextStep} and Python moves to the \`else\` part.`;
  };

// Also used by the circular queue lesson, which shares most of its code.
export const sharedExplanations: Record<string, Explain> = {
  "QueueSize = 3":
    "Sets how many items the queue can hold. The array has a fixed size, so this queue can never hold more than 3 items.",
  'Queue = [""] * QueueSize':
    "Creates the array with 3 spaces, at indexes 0, 1 and 2. Each space starts with an empty string.",
  "HeadPointer = 0":
    "`HeadPointer` stores the index of the item at the front of the queue, which is the next one to leave. The first item will go in index 0.",
  "NumberItems = 0":
    "`NumberItems` counts how many items are in the queue. It starts at 0 because the queue is empty.",
  "def Enqueue(Item):":
    "Defines the `Enqueue` function, which adds an item to the back of the queue. Python remembers these instructions, but doesn't run them until the function is called.",
  "def Dequeue():":
    "Defines the `Dequeue` function, which removes the item at the front of the queue. Nothing inside it runs until it is called.",
  "def Peek():":
    "Defines the `Peek` function, which looks at the front item without removing it. Nothing inside it runs until it is called.",
  "def IsEmpty():":
    "Defines the `IsEmpty` function, which answers `True` or `False`. Nothing inside it runs until it is called.",
  "def IsFull():":
    "Defines the `IsFull` function, which answers `True` or `False`. Nothing inside it runs until it is called.",
  "global TailPointer":
    "Tells Python this function changes the main program's `TailPointer`. Without this line, changing it inside the function would cause an error.",
  "global HeadPointer":
    "Tells Python this function changes the main program's `HeadPointer`. Without this line, changing it inside the function would cause an error.",
  "global NumberItems":
    "Does the same for `NumberItems`, which this function also changes. `Queue` doesn't need this because the function only changes what's inside the array.",
  'Enqueue("A")': enqueueCall,
  'Enqueue("B")': enqueueCall,
  'Enqueue("C")': enqueueCall,
  'Enqueue("D")': enqueueCall,
  'print("Queue full")': ({ step }) =>
    `Displays a message. "${step.vars.Item}" is not added, and nothing in the queue changes.`,
  "NumberItems = NumberItems + 1": ({ step, previous }) => {
    const full = step.vars.NumberItems === step.vars.QueueSize ? " Every space is now in use." : "";
    return `Adds 1 to the count, from ${previous?.vars.NumberItems} to ${step.vars.NumberItems}.${full}`;
  },
  "if NumberItems == 0:": ({ step }) => {
    const count = step.vars.NumberItems;
    const check = "Checks if the queue is empty.";
    if (count === 0) {
      const result =
        step.scope === "Dequeue"
          ? "there is nothing to remove"
          : step.scope === "Peek"
            ? "there is no front item to look at"
            : "the queue is empty";
      return `${check} \`NumberItems\` is 0, so ${result}.`;
    }
    const result =
      step.scope === "Dequeue"
        ? "there is an item to remove"
        : step.scope === "Peek"
          ? "there is a front item to look at"
          : "the queue isn't empty";
    return `${check} \`NumberItems\` is ${count}, not 0, so ${result} and Python moves to the \`else\` part.`;
  },
  'print("Queue empty")':
    "Displays a message so the user knows nothing was removed. Without the check, `Dequeue` would return an empty space and move `HeadPointer` past it, so the queue would lose track of its front.",
  'return ""': ({ step }) =>
    step.scope === "Peek"
      ? "Ends the function and sends back an empty string, because there is no front item."
      : "Ends the function and sends back an empty string, because there is no item to return.",
  "Item = Queue[HeadPointer]": ({ step }) =>
    `Copies the front item, "${step.vars.Item}", from index ${step.vars.HeadPointer} into \`Item\`. It must be copied now, before \`HeadPointer\` moves.`,
  "HeadPointer = HeadPointer + 1": ({ step, previous }) => {
    const wasLastItem = step.vars.NumberItems === 1;
    const pointsAt = wasLastItem
      ? "where the next item will be added"
      : "the next item in the queue";
    return `Moves \`HeadPointer\` from ${previous?.vars.HeadPointer} to ${step.vars.HeadPointer}, so it points at ${pointsAt}. "${step.vars.Item}" is still in the array, but it is in front of the head, so it is no longer part of the queue.`;
  },
  "NumberItems = NumberItems - 1": ({ step, previous }) => {
    const empty = step.vars.NumberItems === 0 ? " The queue is now empty." : "";
    return `Takes 1 off the count, from ${previous?.vars.NumberItems} to ${step.vars.NumberItems}.${empty}`;
  },
  "return Item": ({ step }) =>
    `Ends the function and sends "${step.vars.Item}" back to the line that called it. \`Item\` only exists inside the function, so it disappears now.`,
  "return Queue[HeadPointer]": ({ step }) =>
    `Sends back the front item, "${(step.vars.Queue as string[])[step.vars.HeadPointer as number]}", from index ${step.vars.HeadPointer}. \`HeadPointer\` doesn't change, so the item stays in the queue.`,
  "return True": ({ step }) =>
    `Ends the function and sends back \`True\`, because the queue is ${step.scope === "IsFull" ? "full" : "empty"}.`,
  "return False": ({ step }) =>
    `Ends the function and sends back \`False\`, because the queue is not ${step.scope === "IsFull" ? "full" : "empty"}.`,
  "Removed = Dequeue()": ({ step }) =>
    step.event === "return"
      ? `\`Dequeue\` has finished. The value it sent back, ${step.vars.Removed === "" ? "an empty string" : `"${step.vars.Removed}"`}, is stored in \`Removed\`.`
      : "Calls `Dequeue`. Python jumps up to the function. `Dequeue` needs no parameters because it always takes the front item.",
  "print(Removed)": ({ step }) =>
    step.vars.Removed === ""
      ? "Displays `Removed`. It holds an empty string, so this prints a blank line."
      : `Displays the value in \`Removed\`, which is "${step.vars.Removed}".`,
  "print(IsEmpty())": printResult("IsEmpty", "check if the queue is empty"),
  "print(IsFull())": printResult("IsFull", "check if the queue is full"),
  "print(Peek())": printResult(
    "Peek",
    "look at the front item",
    " The queue hasn't changed, because `Peek` doesn't move `HeadPointer`.",
  ),
};

const tailAtMinusOne: Record<string, Explain> = {
  ...sharedExplanations,
  "TailPointer = -1":
    "`TailPointer` stores the index of the last item, at the back of the queue. There is no index -1, so -1 means nothing has been added yet.",
  "if TailPointer == QueueSize - 1:": fullCheck("QueueSize - 1", (size) => size - 1),
  "TailPointer = TailPointer + 1": ({ step, previous }) =>
    `Moves \`TailPointer\` from ${previous?.vars.TailPointer} to ${step.vars.TailPointer}, the next free space at the back. This must happen before storing the item, or the last item would be overwritten.`,
  "Queue[TailPointer] = Item": ({ step }) =>
    `Stores "${step.vars.Item}" at index ${step.vars.TailPointer}, at the back of the queue.`,
};

const tailAtZero: Record<string, Explain> = {
  ...sharedExplanations,
  "TailPointer = 0":
    "`TailPointer` stores the index of the next free space at the back of the queue. Index 0 is free, so it starts at 0.",
  "if TailPointer == QueueSize:": fullCheck("QueueSize", (size) => size),
  "Queue[TailPointer] = Item": ({ step }) =>
    `Stores "${step.vars.Item}" at index ${step.vars.TailPointer}, the next free space at the back of the queue.`,
  "TailPointer = TailPointer + 1": ({ step, previous }) => {
    const tail = step.vars.TailPointer as number;
    const atEnd =
      tail === step.vars.QueueSize
        ? ` There is no index ${tail}, so this means the back of the array has been reached.`
        : "";
    return `Moves \`TailPointer\` from ${previous?.vars.TailPointer} to ${tail}, so it points at the next free space. This must happen after storing the item, or the item would go in the wrong space.${atEnd}`;
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
    id: "full-with-free-space",
    label: "Full but with free space",
    summary: "Fills the queue, removes an item, then tries to add another.",
    ending:
      "The program has finished. Only 2 of the 3 spaces hold queue items, but the queue can't take any more. A circular queue fixes this by letting `TailPointer` wrap round to index 0.",
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
      "`TailPointer` holds the index of the last item. It starts at -1, and the queue is full when it reaches `QueueSize - 1`.",
    scenarios: buildScenarios("tail-at-minus-1", tailAtMinusOne),
  },
  {
    id: "tail-at-0",
    label: "TailPointer starts at 0",
    description:
      "`TailPointer` holds the index of the next free space. It starts at 0, and the queue is full when it reaches `QueueSize`.",
    scenarios: buildScenarios("tail-at-0", tailAtZero),
  },
];
