import type { Algorithm, Scenario, ScenarioStep } from "../stepper";

// Draws a stack as a tower of array cells with a TopPointer arrow beside it.
export function createStackVisual(container: HTMLElement) {
  container.innerHTML = `<div class="tower">
      <div class="tower__pointer" data-pointer><code data-pointer-label></code></div>
      <ol class="tower__cells" data-cells></ol>
      <p class="tower__floor">Bottom of stack</p>
    </div>`;
  const tower = container.querySelector<HTMLElement>(".tower")!;
  const pointer = container.querySelector<HTMLElement>("[data-pointer]")!;
  const pointerLabel = container.querySelector<HTMLElement>("[data-pointer-label]")!;
  const cells = container.querySelector<HTMLElement>("[data-cells]")!;

  let algorithm: Algorithm;
  let size = 0;
  let lastStack: string[] = [];

  return {
    leftoverKey: "Crossed out: still in the array, but no longer in the stack.",

    load(nextAlgorithm: Algorithm, scenario: Scenario) {
      algorithm = nextAlgorithm;
      size = scenario.steps.at(-1)!.vars.StackSize as number;
      lastStack = [];
      cells.innerHTML = Array.from(
        { length: size },
        (_, position) => `<li class="tower__cell" data-cell="${size - 1 - position}">
            <span class="tower__index">${size - 1 - position}</span>
            <code class="tower__value" data-value></code>
          </li>`,
      ).join("");
    },

    // Returns whether any cell holds a leftover value, so the key can be shown.
    render(steps: ScenarioStep[], current: number) {
      const step = steps[current];
      const previous = steps[current - 1];
      const stack = step.vars.Stack as string[] | undefined;
      const top = step.vars.TopPointer as number | undefined;
      const itemsBelowPointer = algorithm.itemsBelowPointer ?? 1;
      // A pointer that marks the next free space can sit one place above the array.
      const hasSlotAbove = itemsBelowPointer === 0;
      const itemCount = top === undefined ? 0 : top + itemsBelowPointer;
      const previousStack = previous?.vars.Stack as string[] | undefined;
      tower.classList.toggle("is-uncreated", stack === undefined);
      tower.classList.toggle("has-slot-above", hasSlotAbove);
      pointer.hidden = top === undefined;
      if (top !== undefined) {
        const rowsFromTop = hasSlotAbove ? size - top : size - 1 - top;
        pointer.style.setProperty("--rows-from-top", String(rowsFromTop));
        pointerLabel.textContent = `TopPointer = ${top}`;
      }
      cells.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
        const index = Number(cell.dataset.cell);
        const value = stack?.[index] ?? "";
        const changed = stack !== undefined && lastStack[index] !== undefined && lastStack[index] !== value;
        cell.querySelector("[data-value]")!.textContent = value;
        // An item just stored counts as in the stack, even before the pointer moves past it.
        const justStored = top !== undefined && previousStack?.[index] !== value;
        const inStack = value !== "" && (index < itemCount || justStored);
        cell.classList.toggle("is-in-stack", inStack);
        cell.classList.toggle("is-leftover", top !== undefined && value !== "" && !inStack);
        cell.classList.toggle("is-changed", changed);
      });
      lastStack = stack ?? [];
      return cells.querySelector(".is-leftover") !== null;
    },
  };
}
