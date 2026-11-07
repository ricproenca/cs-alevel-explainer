import type { Scenario, ScenarioStep } from "../stepper";

// Draws a queue as a row of array cells, with TailPointer above and
// HeadPointer below. Each pointer can sit one place beyond either end.
export function createQueueVisual(container: HTMLElement) {
  container.innerHTML = `<div class="queue">
      <div class="queue__pointer queue__pointer--tail" data-tail><code data-tail-label></code></div>
      <ol class="queue__cells" data-cells></ol>
      <div class="queue__pointer queue__pointer--head" data-head><code data-head-label></code></div>
    </div>`;
  const queue = container.querySelector<HTMLElement>(".queue")!;
  const tail = container.querySelector<HTMLElement>("[data-tail]")!;
  const tailLabel = container.querySelector<HTMLElement>("[data-tail-label]")!;
  const head = container.querySelector<HTMLElement>("[data-head]")!;
  const headLabel = container.querySelector<HTMLElement>("[data-head-label]")!;
  const cells = container.querySelector<HTMLElement>("[data-cells]")!;

  let lastQueue: string[] = [];

  function placePointer(element: HTMLElement, label: HTMLElement, name: string, index: unknown) {
    element.hidden = index === undefined;
    if (index === undefined) return;
    element.style.setProperty("--slot", String(index));
    label.textContent = `${name} = ${index}`;
  }

  return {
    leftoverKey: "Crossed out: still in the array, but no longer in the queue.",

    load(_algorithm: unknown, scenario: Scenario) {
      const size = scenario.steps.at(-1)!.vars.QueueSize as number;
      lastQueue = [];
      queue.style.setProperty("--queue-slots", String(size + 2));
      cells.innerHTML = Array.from(
        { length: size },
        (_, index) => `<li class="queue__cell" data-cell="${index}">
            <span class="queue__index">${index}</span>
            <code class="queue__value" data-value></code>
          </li>`,
      ).join("");
    },

    // Returns whether any cell holds a leftover value, so the key can be shown.
    render(step: ScenarioStep, previous: ScenarioStep | undefined) {
      const values = step.vars.Queue as string[] | undefined;
      const headIndex = step.vars.HeadPointer as number | undefined;
      const count = step.vars.NumberItems as number | undefined;
      const previousValues = previous?.vars.Queue as string[] | undefined;
      const isTracking = headIndex !== undefined && count !== undefined;
      queue.classList.toggle("is-uncreated", values === undefined);
      placePointer(tail, tailLabel, "TailPointer", step.vars.TailPointer);
      placePointer(head, headLabel, "HeadPointer", headIndex);
      cells.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
        const index = Number(cell.dataset.cell);
        const value = values?.[index] ?? "";
        const changed = values !== undefined && lastQueue[index] !== undefined && lastQueue[index] !== value;
        cell.querySelector("[data-value]")!.textContent = value;
        // An item just stored counts as queued, even before NumberItems goes up.
        const justStored = isTracking && previousValues?.[index] !== value;
        const inQueue =
          value !== "" && isTracking && ((index >= headIndex && index < headIndex + count) || justStored);
        cell.classList.toggle("is-in-queue", inQueue);
        cell.classList.toggle("is-leftover", isTracking && value !== "" && !inQueue);
        cell.classList.toggle("is-changed", changed);
      });
      lastQueue = values ?? [];
      return cells.querySelector(".is-leftover") !== null;
    },
  };
}
