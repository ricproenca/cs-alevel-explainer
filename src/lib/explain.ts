import type { Explain } from "./stepper";

// Explains a call such as Push("A") that passes the function an Item.
export const callWithItem =
  (name: string): Explain =>
  ({ step }) =>
    `Calls \`${name}\` and sends it "${step.vars.Item}". Python jumps up to the function, where the parameter \`Item\` now holds "${step.vars.Item}".`;

// Explains a line such as print(IsEmpty()), both when it calls the function
// and when the function's answer comes back to be displayed.
export const printResult =
  (name: string, purpose: string, note = ""): Explain =>
  ({ step }) =>
    step.event === "return"
      ? `\`${name}\` sent back ${step.output.at(-1)}, and \`print\` displays it.${note}`
      : `Calls \`${name}\` to ${purpose}. Python jumps up to the function.`;
