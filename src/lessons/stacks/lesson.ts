import {
  buildScenario,
  type Algorithm,
  type Explain,
  type ScenarioConfig,
  type Trace,
  type TraceColumn,
} from "../../lib/stepper";
import traces from "./traces.json";

const columns: TraceColumn[] = [
  { key: "TopPointer", label: "TopPointer" },
  { key: "Stack[0]", label: "Stack[0]" },
  { key: "Stack[1]", label: "Stack[1]" },
  { key: "Stack[2]", label: "Stack[2]" },
  { key: "Item", label: "Item" },
  { key: "Removed", label: "Removed" },
];

const pushCall: Explain = ({ step }) =>
  `Calls \`Push\` and sends it "${step.vars.Item}". Python jumps up to the function, where the parameter \`Item\` now holds "${step.vars.Item}".`;

const printResult =
  (name: string, purpose: string, note = ""): Explain =>
  ({ step }) =>
    step.event === "return"
      ? `\`${name}\` sent back ${step.output.at(-1)}, and \`print\` displays it.${note}`
      : `Calls \`${name}\` to ${purpose}. Python jumps up to the function.`;

const sharedExplanations: Record<string, Explain> = {
  "StackSize = 3":
    "Sets how many items the stack can hold. The array has a fixed size, so this stack can never hold more than 3 items.",
  'Stack = [""] * StackSize':
    "Creates the array with 3 spaces, at indexes 0, 1 and 2. Each space starts with an empty string.",
  'Stack = ["A", "B", "C"]':
    "This example starts with an array that is already full, so every space holds an item.",
  "def Push(Item):":
    "Defines the `Push` function. Python remembers these instructions, but doesn't run them until the function is called.",
  "def Pop():":
    "Defines the `Pop` function. Nothing inside it runs until it is called.",
  "def Peek():":
    "Defines the `Peek` function, which looks at the top item without removing it. Nothing inside it runs until it is called.",
  "def IsEmpty():":
    "Defines the `IsEmpty` function, which answers `True` or `False`. Nothing inside it runs until it is called.",
  "def IsFull():":
    "Defines the `IsFull` function, which answers `True` or `False`. Nothing inside it runs until it is called.",
  "global TopPointer":
    "Tells Python this function uses the main program's `TopPointer`. Without this line, changing it inside the function would cause an error. `Stack` doesn't need this because the function only changes what's inside the array.",
  'Push("A")': pushCall,
  'Push("B")': pushCall,
  'Push("C")': pushCall,
  'Push("D")': pushCall,
  'return ""': ({ step }) =>
    step.scope === "Peek"
      ? "Ends the function and sends back an empty string, because there is no top item."
      : "Ends the function and sends back an empty string, because there is no item to return.",
  "return True": ({ step }) =>
    `Ends the function and sends back \`True\`, because the stack is ${step.scope === "IsFull" ? "full" : "empty"}.`,
  "return False": ({ step }) =>
    `Ends the function and sends back \`False\`, because the stack is not ${step.scope === "IsFull" ? "full" : "empty"}.`,
  "return Item": ({ step }) =>
    `Ends the function and sends "${step.vars.Item}" back to the line that called it. \`Item\` only exists inside the function, so it disappears now.`,
  "Removed = Pop()": ({ step }) =>
    step.event === "return"
      ? `\`Pop\` has finished. The value it sent back, ${step.vars.Removed === "" ? "an empty string" : `"${step.vars.Removed}"`}, is stored in \`Removed\`.`
      : "Calls `Pop`. Python jumps up to the function. `Pop` needs no parameters because it always takes the top item.",
  "print(Removed)": ({ step }) =>
    step.vars.Removed === ""
      ? "Displays `Removed`. It holds an empty string, so this prints a blank line."
      : `Displays the value in \`Removed\`, which is "${step.vars.Removed}".`,
  "print(IsEmpty())": printResult("IsEmpty", "check if the stack is empty"),
  "print(IsFull())": printResult("IsFull", "check if the stack is full"),
  "print(Peek())": printResult(
    "Peek",
    "look at the top item",
    " The stack hasn't changed, because `Peek` doesn't move the pointer.",
  ),
};

const fullCheck = (limitName: string, limit: (stackSize: number) => number): Explain =>
  ({ step }) => {
    const top = step.vars.TopPointer as number;
    const value = limit(step.vars.StackSize as number);
    const check = `Checks if the stack is full. \`TopPointer\` is ${top} and \`${limitName}\``;
    if (top === value) {
      return `${check} is also ${value}. They match, so the stack is full.`;
    }
    const nextStep = step.scope === "IsFull" ? "the stack isn't full" : "there is space";
    return `${check} is ${value}. They don't match, so ${nextStep} and Python moves to the \`else\` part.`;
  };

const emptyCheck = (emptyValue: number): Explain =>
  ({ step }) => {
    const top = step.vars.TopPointer;
    const check = "Checks if the stack is empty.";
    if (top === emptyValue) {
      const result =
        step.scope === "Pop"
          ? "there is nothing to remove"
          : step.scope === "Peek"
            ? "there is no top item to look at"
            : "the stack is empty";
      return `${check} \`TopPointer\` is ${emptyValue}, so ${result}.`;
    }
    const result =
      step.scope === "Pop"
        ? "there is an item to remove"
        : step.scope === "Peek"
          ? "there is a top item to look at"
          : "the stack isn't empty";
    return `${check} \`TopPointer\` is ${top}, not ${emptyValue}, so ${result} and Python moves to the \`else\` part.`;
  };

const stackFullMessage = (indexOffset: number): Explain =>
  ({ step }) =>
    `Displays a message. "${step.vars.Item}" is not stored and \`TopPointer\` doesn't change. Without the check, the code would try to use index ${(step.vars.TopPointer as number) + indexOffset}, which doesn't exist.`;

const overwriteNote = ({ step, previous }: Parameters<Exclude<Explain, string>>[0]) => {
  const top = step.vars.TopPointer as number;
  return (previous?.vars.Stack as string[])[top];
};

const startAtMinusOne: Record<string, Explain> = {
  ...sharedExplanations,
  "TopPointer = -1":
    "`TopPointer` stores the index of the top item. There is no index -1, so -1 means the stack is empty.",
  "TopPointer = 2":
    "`TopPointer` is 2 because the top item, C, is at index 2. That is the last space in the array.",
  "if TopPointer == StackSize - 1:": fullCheck("StackSize - 1", (size) => size - 1),
  'print("Stack full")': stackFullMessage(1),
  "TopPointer = TopPointer + 1": ({ step, previous }) =>
    `Moves the pointer up from ${previous?.vars.TopPointer} to ${step.vars.TopPointer}, so it points at the next free space. This must happen before storing the item, or the current top item would be overwritten.`,
  "Stack[TopPointer] = Item": (context) => {
    const { step } = context;
    const oldValue = overwriteNote(context);
    const stored = `Stores "${step.vars.Item}" at index ${step.vars.TopPointer}.`;
    return oldValue
      ? `${stored} This replaces the leftover "${oldValue}", which stopped being part of the stack when it was popped.`
      : `${stored} "${step.vars.Item}" is now the top item.`;
  },
  "if TopPointer == -1:": emptyCheck(-1),
  'print("Stack empty")':
    "Displays a message so the user knows nothing was removed. Without the check, `Stack[-1]` would run. Python would read the last space in the array instead of reporting an error, which is a hard bug to spot.",
  "Item = Stack[TopPointer]": ({ step }) =>
    `Copies the top item, "${step.vars.Item}", from index ${step.vars.TopPointer} into \`Item\`. It must be copied now, before the pointer moves.`,
  "TopPointer = TopPointer - 1": ({ step, previous }) =>
    `Moves the pointer down from ${previous?.vars.TopPointer} to ${step.vars.TopPointer}. "${step.vars.Item}" is still in the array, but it is above the pointer, so it is no longer part of the stack.`,
  "return Stack[TopPointer]": ({ step }) =>
    `Sends back the item at index ${step.vars.TopPointer}, "${(step.vars.Stack as string[])[step.vars.TopPointer as number]}". The pointer already points at the top item, so nothing needs adjusting.`,
};

const startAtZero: Record<string, Explain> = {
  ...sharedExplanations,
  "TopPointer = 0":
    "`TopPointer` stores the index of the next free space. Index 0 is free, so 0 means the stack is empty.",
  "TopPointer = 3":
    "`TopPointer` is 3 because the next free space would be index 3. The array stops at index 2, so 3 means the stack is full.",
  "if TopPointer == StackSize:": fullCheck("StackSize", (size) => size),
  'print("Stack full")': stackFullMessage(0),
  "Stack[TopPointer] = Item": (context) => {
    const { step } = context;
    const oldValue = overwriteNote(context);
    const stored = `Stores "${step.vars.Item}" at index ${step.vars.TopPointer}, the next free space.`;
    return oldValue
      ? `${stored} This replaces the leftover "${oldValue}", which stopped being part of the stack when it was popped.`
      : stored;
  },
  "TopPointer = TopPointer + 1": ({ step, previous }) =>
    `Moves the pointer up from ${previous?.vars.TopPointer} to ${step.vars.TopPointer}, so it points at the next free space. This must happen after storing the item, or the item would go in the wrong space.`,
  "if TopPointer == 0:": emptyCheck(0),
  'print("Stack empty")':
    "Displays a message so the user knows nothing was removed. Without the check, `TopPointer` would drop to -1. Python would then read the last space in the array instead of reporting an error, which is a hard bug to spot.",
  "TopPointer = TopPointer - 1": ({ step, previous }) =>
    `Moves the pointer down from ${previous?.vars.TopPointer} to ${step.vars.TopPointer}, so it points at the top item. That space now counts as free. This must happen before reading the item, because the pointer was above the top item.`,
  "Item = Stack[TopPointer]": ({ step }) =>
    `Copies "${step.vars.Item}" from index ${step.vars.TopPointer} into \`Item\`. "${step.vars.Item}" is still in the array, but it is no longer part of the stack.`,
  "return Stack[TopPointer - 1]": ({ step }) => {
    const index = (step.vars.TopPointer as number) - 1;
    return `Sends back the item at index ${index}, "${(step.vars.Stack as string[])[index]}". The pointer is one above the top item, so the index is \`TopPointer - 1\`. \`TopPointer\` itself doesn't change.`;
  },
};

const scenarioConfigs: ScenarioConfig[] = [
  {
    id: "push-and-pop",
    label: "Push and pop",
    summary: "Adds two items, removes one, then adds another.",
    ending:
      "The program has finished. The stack holds A and C, with C on top. B is gone because C replaced it.",
  },
  {
    id: "peek-and-checks",
    label: "Peek, IsEmpty and IsFull",
    summary: "Checks the stack and looks at the top item without changing anything.",
    ending:
      "The program has finished. A is still in the stack, because only `Push` changed it.",
  },
  {
    id: "stack-full",
    label: "When the stack is full",
    summary: "Tries to add an item when there is no space left.",
    ending: "The program has finished, and the stack is unchanged.",
  },
  {
    id: "stack-empty",
    label: "When the stack is empty",
    summary: "Tries to remove an item when there is nothing to remove.",
    ending: "The program has finished, and the stack is still empty.",
  },
];

const allTraces = traces as unknown as Record<string, Trace>;

const buildScenarios = (folder: string, explanations: Record<string, Explain>) =>
  scenarioConfigs.map((config) =>
    buildScenario(config, allTraces[`${folder}/${config.id}`], explanations, columns),
  );

export const algorithms: Algorithm[] = [
  {
    id: "start-at-minus-1",
    label: "TopPointer starts at -1",
    description:
      "`TopPointer` holds the index of the top item. It is -1 when the stack is empty and `StackSize - 1` when it is full.",
    itemsBelowPointer: 1,
    scenarios: buildScenarios("start-at-minus-1", startAtMinusOne),
  },
  {
    id: "start-at-0",
    label: "TopPointer starts at 0",
    description:
      "`TopPointer` holds the index of the next free space. It is 0 when the stack is empty and `StackSize` when it is full.",
    itemsBelowPointer: 0,
    scenarios: buildScenarios("start-at-0", startAtZero),
  },
];
