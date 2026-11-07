import { expect, test, type Page } from "@playwright/test";
import { algorithms } from "../src/lessons/stacks/lesson";

const lessonUrl = "lessons/stacks";

const count = (page: Page) => page.locator("[data-count]");
const currentLine = (page: Page) => page.locator(".code__line.is-current");
const lineNumberOf = (page: Page) =>
  currentLine(page).evaluate((line) => [...line.parentElement!.children].indexOf(line) + 1);

for (const algorithm of algorithms) {
  for (const scenario of algorithm.scenarios) {
    test(`${algorithm.id} / ${scenario.id}: every step shows the traced state`, async ({ page }) => {
      await page.goto(lessonUrl);
      await page.getByRole("button", { name: algorithm.label, exact: true }).click();
      await page.getByRole("button", { name: scenario.label, exact: true }).click();

      // Checking every step in the browser keeps this test fast.
      const mismatches = await page.evaluate((steps) => {
        const next = document.querySelector<HTMLButtonElement>("[data-next]")!;
        const problems: string[] = [];
        steps.forEach((step, index) => {
          if (index > 0) next.click();
          const line = document.querySelector(".code__line.is-current")!;
          const lineNumber = [...line.parentElement!.children].indexOf(line) + 1;
          if (lineNumber !== step.line) problems.push(`step ${index + 1}: line ${lineNumber}`);
          const stack = (step.vars.Stack as string[] | undefined) ?? [];
          document.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
            const shown = cell.querySelector(".tower__value")!.textContent;
            if (shown !== (stack[Number(cell.dataset.cell)] ?? "")) {
              problems.push(`step ${index + 1}: cell ${cell.dataset.cell} shows "${shown}"`);
            }
          });
          const label = document.querySelector("[data-pointer-label]")!.textContent;
          if (step.vars.TopPointer !== undefined && label !== `TopPointer = ${step.vars.TopPointer}`) {
            problems.push(`step ${index + 1}: pointer shows "${label}"`);
          }
        });
        return problems;
      }, scenario.steps);

      expect(mismatches).toEqual([]);
      await expect(count(page)).toHaveText(`Step ${scenario.steps.length} of ${scenario.steps.length}`);
    });
  }
}

test("Skip function runs a whole call and stops in the main program", async ({ page }) => {
  await page.goto(`${lessonUrl}?algorithm=start-at-minus-1&example=push-and-pop&step=1`);
  const skip = page.getByRole("button", { name: "Skip function" });
  await expect(skip).toBeDisabled();

  await page.getByRole("button", { name: 'Push("A")' }).click();
  await expect(skip).toBeEnabled();
  await skip.click();
  await expect(currentLine(page)).toHaveText('Push("B")');
  await expect(page.locator("[data-cell='0'] .tower__value")).toHaveText("A");

  await page.getByRole("button", { name: "Removed = Pop()" }).click();
  await skip.click();
  // Stops on the return to the caller, where Removed is assigned.
  await expect(currentLine(page)).toHaveText("Removed = Pop()");
  await expect(page.locator("[data-vars]")).toContainText("Removed");
});

test("operation buttons jump to the start of each operation", async ({ page }) => {
  await page.goto(lessonUrl);
  const operation = page.getByRole("button", { name: 'Push("B")' });
  await operation.click();
  await expect(operation).toHaveAttribute("aria-current", "step");
  await expect(currentLine(page)).toHaveText('Push("B")');

  await page.getByRole("button", { name: "Next line" }).click();
  await expect(operation).toHaveAttribute("aria-current", "step");
});

test("functions that aren't running are dimmed", async ({ page }) => {
  await page.goto(`${lessonUrl}?algorithm=start-at-minus-1&example=push-and-pop&step=9`);
  await expect(page.locator("[data-running]")).toHaveText("Running inside Push");
  const dimmed = await page
    .locator(".code__line")
    .evaluateAll((lines) => lines.map((line) => line.classList.contains("is-dimmed")));
  // Lines 6-12 are Push, 15-23 are Pop.
  expect(dimmed.slice(5, 12).every((isDimmed) => !isDimmed)).toBe(true);
  expect(dimmed.slice(14, 23).every(Boolean)).toBe(true);
});

test("arrow keys step forwards and backwards", async ({ page }) => {
  await page.goto(lessonUrl);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(count(page)).toHaveText(/^Step 3 of/);
  await page.keyboard.press("ArrowLeft");
  await expect(count(page)).toHaveText(/^Step 2 of/);
});

test("Play steps automatically and Pause stops it", async ({ page }) => {
  await page.goto(lessonUrl);
  await page.getByLabel("Speed").selectOption("fast");
  const play = page.getByRole("button", { name: "Play" });
  await play.click();
  await expect(count(page)).toHaveText(/^Step [3-9] of/);
  await page.getByRole("button", { name: "Pause" }).click();
  const stoppedAt = await count(page).textContent();
  await page.waitForTimeout(1200);
  await expect(count(page)).toHaveText(stoppedAt!);
});

test("the URL keeps the current algorithm, example and step", async ({ page }) => {
  await page.goto(`${lessonUrl}?algorithm=start-at-0&example=stack-full&step=27`);
  await expect(count(page)).toHaveText("Step 27 of 27");
  await expect(page.locator("[data-pointer-label]")).toHaveText("TopPointer = 3");
  await expect(page.getByRole("button", { name: "TopPointer starts at 0" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page).toHaveURL(/step=26/);
});

test("clicking a trace table row jumps to that step", async ({ page }) => {
  await page.goto(`${lessonUrl}?step=20`);
  const firstRow = page.locator(".trace__jump").first();
  const target = Number(await firstRow.getAttribute("data-step"));
  await firstRow.click();
  await expect(count(page)).toHaveText(new RegExp(`^Step ${target + 1} of`));
  expect(await lineNumberOf(page)).toBe(2);
});

test("the lesson fits a phone screen without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(`${lessonUrl}?algorithm=start-at-0&example=stack-full&step=27`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
