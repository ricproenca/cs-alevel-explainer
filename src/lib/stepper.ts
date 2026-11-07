export type Value = string | number | string[];

export interface TraceStep {
  line: number;
  event: "line" | "global" | "return";
  scope: string;
  vars: Record<string, Value>;
  output: string[];
}

export interface Trace {
  source: string[];
  steps: TraceStep[];
}

export interface ExplainContext {
  step: TraceStep;
  previous?: TraceStep;
}

export type Explain = string | ((context: ExplainContext) => string);

export interface TraceColumn {
  key: string;
  label: string;
}

export interface ScenarioConfig {
  id: string;
  label: string;
  summary: string;
  ending: string;
}

const PYTHON_TOKEN =
  /(#.*$)|("[^"]*")|\b(def|global|if|else|return)\b|\b(-?\d+)\b/g;
const TOKEN_CLASSES = ["comment", "string", "keyword", "number"];

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightPython(line: string) {
  let html = "";
  let position = 0;
  for (const match of line.matchAll(PYTHON_TOKEN)) {
    const groupIndex = match.slice(1).findIndex((group) => group !== undefined);
    html += escapeHtml(line.slice(position, match.index));
    html += `<span class="py-${TOKEN_CLASSES[groupIndex]}">${escapeHtml(match[0])}</span>`;
    position = match.index + match[0].length;
  }
  return html + escapeHtml(line.slice(position));
}

// Reads a trace column's value, e.g. "Stack[1]" looks inside the Stack array.
function readColumn(vars: TraceStep["vars"], key: string): string | undefined {
  const arrayCell = key.match(/^(\w+)\[(\d+)\]$/);
  const value = arrayCell
    ? (vars[arrayCell[1]] as string[] | undefined)?.[Number(arrayCell[2])]
    : vars[key];
  if (value === undefined) return undefined;
  return value === "" ? '""' : String(value);
}

// Follows the Cambridge convention: a row only shows the values that changed.
function buildRows(trace: Trace, columns: TraceColumn[]) {
  const rows: { step: number; line: number; cells: string[]; output: string }[] = [];
  let previous: TraceStep | undefined;

  trace.steps.forEach((step, index) => {
    const cells = columns.map(({ key }) => {
      const value = readColumn(step.vars, key);
      return previous && readColumn(previous.vars, key) === value ? "" : (value ?? "");
    });
    const newOutput = step.output.slice(previous?.output.length ?? 0);
    const output = newOutput
      .map((line) => (line === "" ? "(blank line)" : line))
      .join(", ");
    if (output || cells.some(Boolean)) {
      rows.push({ step: index, line: step.line, cells, output });
    }
    previous = step;
  });
  return rows;
}

export interface FunctionRange {
  name: string;
  start: number;
  end: number;
}

// Finds each function's lines and the first line of the main program.
function analyseProgram(source: string[]) {
  const functions: FunctionRange[] = [];
  source.forEach((text, index) => {
    const definition = text.match(/^def (\w+)\(/);
    if (definition) {
      functions.push({ name: definition[1], start: index + 1, end: index + 1 });
    } else if (/^\s+\S/.test(text) && functions.length) {
      functions[functions.length - 1].end = index + 1;
    }
  });
  const lastFunctionEnd = functions.at(-1)?.end ?? 0;
  const mainStart =
    source.findIndex((text, index) => index >= lastFunctionEnd && /^[^\s#]/.test(text)) + 1;
  return { functions, mainStart };
}

export function buildScenario(
  config: ScenarioConfig,
  trace: Trace,
  explanations: Record<string, Explain>,
  columns: TraceColumn[],
) {
  const { functions, mainStart } = analyseProgram(trace.source);
  // Each main program line is one operation, e.g. Push("A"), and owns every
  // step it causes inside a function.
  const operations: { label: string; isCode: boolean; step: number }[] = [];
  let operationLine = 0;

  const steps = trace.steps.map((step, index) => {
    const lineText = trace.source[step.line - 1].trim();
    const explain = explanations[lineText];
    if (explain === undefined) {
      throw new Error(`No explanation for line: ${lineText}`);
    }
    const context = { step, previous: trace.steps[index - 1] };
    const text = typeof explain === "function" ? explain(context) : explain;
    const isLast = index === trace.steps.length - 1;

    const isMainLine = step.line >= mainStart;
    if (!isMainLine && operations.length === 0) {
      operations.push({ label: "Setup", isCode: false, step: index });
    } else if (isMainLine && step.line !== operationLine) {
      operationLine = step.line;
      operations.push({ label: lineText, isCode: true, step: index });
    }

    return {
      line: step.line,
      scope: step.scope,
      vars: step.vars,
      output: step.output,
      text: isLast ? `${text} ${config.ending}` : text,
      operation: operations.length - 1,
      inFunction: !isMainLine && step.scope !== "<module>",
    };
  });

  return {
    ...config,
    lines: trace.source.map(highlightPython),
    functions,
    operations,
    columns: columns.map((column) => column.label),
    rows: buildRows(trace, columns),
    steps,
  };
}

export type Scenario = ReturnType<typeof buildScenario>;

export interface Algorithm {
  id: string;
  label: string;
  description: string;
  // How many items sit at or below index TopPointer: 1 if it marks the top
  // item, 0 if it marks the next free space.
  itemsBelowPointer: number;
  scenarios: Scenario[];
}
