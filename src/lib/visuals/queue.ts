import type { Scenario, ScenarioStep } from "../stepper";

// Draws a queue as a row of array cells, with TailPointer above and
// HeadPointer below. Each pointer can sit one place beyond either end. A
// circular queue also shows that the end of the array wraps round to index 0.
export function createQueueVisual(container: HTMLElement, { circular = false } = {}) {
  container.innerHTML = `<div class="queue${circular ? " queue--circular" : ""}">
      <div class="queue__pointer queue__pointer--tail" data-tail><code data-tail-label></code></div>
      <ol class="queue__cells" data-cells></ol>
      <div class="queue__pointer queue__pointer--head" data-head><code data-head-label></code></div>
      ${circular ? '<p class="queue__wrap"><span>Wraps round to index 0</span></p>' : ""}
    </div>`;
  const queue = container.querySelector<HTMLElement>(".queue")!;
  const tail = container.querySelector<HTMLElement>("[data-tail]")!;
  const tailLabel = container.querySelector<HTMLElement>("[data-tail-label]")!;
  const head = container.querySelector<HTMLElement>("[data-head]")!;
  const headLabel = container.querySelector<HTMLElement>("[data-head-label]")!;
  const cells = container.querySelector<HTMLElement>("[data-cells]")!;

  let size = 0;
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
      size = scenario.steps.at(-1)!.vars.QueueSize as number;
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
    render(steps: ScenarioStep[], current: number) {
      const step = steps[current];
      const previous = steps[current - 1];
      const values = step.vars.Queue as string[] | undefined;
      const headIndex = step.vars.HeadPointer as number | undefined;
      let count = step.vars.NumberItems as number | undefined;
      // Inside Dequeue, HeadPointer moves before NumberItems goes down. In
      // between, the count still includes the item just removed.
      if (step.scope === "Dequeue" && count !== undefined) {
        let callStart = current;
        while (steps[callStart - 1]?.scope === "Dequeue") callStart -= 1;
        const start = steps[callStart].vars;
        if (headIndex !== start.HeadPointer && count === start.NumberItems) count -= 1;
      }
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
        // Count places from the head, so a circular queue's items can wrap round.
        const placeInQueue = circular ? (index - headIndex + size) % size : index - headIndex;
        const inQueue =
          value !== "" && isTracking && ((placeInQueue >= 0 && placeInQueue < count) || justStored);
        cell.classList.toggle("is-in-queue", inQueue);
        cell.classList.toggle("is-leftover", isTracking && value !== "" && !inQueue);
        cell.classList.toggle("is-changed", changed);
      });
      lastQueue = values ?? [];
      return cells.querySelector(".is-leftover") !== null;
    },
  };
}
