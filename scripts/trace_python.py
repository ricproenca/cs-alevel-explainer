"""Runs every .py file in a lesson folder and records what each line did.

The step-through widget and trace table are built from the traces.json this
writes, so what students see always matches what the code really does.

Usage: python3 scripts/trace_python.py src/lessons/stacks
"""

import contextlib
import copy
import io
import json
import pathlib
import sys
import types


def snapshot(frame, stdout):
    module_vars = {
        name: copy.deepcopy(value)
        for name, value in frame.f_globals.items()
        if not name.startswith("__") and not isinstance(value, types.FunctionType)
    }
    local_vars = {} if frame.f_code.co_name == "<module>" else dict(frame.f_locals)
    return {
        "scope": frame.f_code.co_name,
        "vars": {**module_vars, **local_vars},
        "output": stdout.getvalue().splitlines(),
    }


def trace_program(path):
    source = path.read_text()
    lines = source.splitlines()
    filename = str(path)
    stdout = io.StringIO()
    steps = []
    pending = None

    def finish_pending(frame):
        nonlocal pending
        if pending is None:
            return
        steps.append({**pending, **snapshot(frame, stdout)})
        pending = None

    def tracer(frame, event, arg):
        nonlocal pending
        if frame.f_code.co_filename != filename:
            return None
        is_function = frame.f_code.co_name != "<module>"

        if event == "call" and is_function:
            finish_pending(frame)
            # A global statement runs no code, so Python never reports it as a
            # line. It still gets a step because students need it explained.
            def_index = frame.f_lineno - 1
            if lines[def_index + 1].strip().startswith("global "):
                steps.append(
                    {"line": def_index + 2, "event": "global", **snapshot(frame, stdout)}
                )
        elif event == "line":
            finish_pending(frame)
            pending = {"line": frame.f_lineno, "event": "line"}
        elif event == "return":
            finish_pending(frame)
            # Returning to a line like Push("A") changes nothing, so only a
            # function that sends back a value gets a step for its caller.
            caller = frame.f_back
            if is_function and arg is not None and caller.f_code.co_filename == filename:
                pending = {"line": caller.f_lineno, "event": "return"}
        return tracer

    program_globals = {"__name__": "__main__"}
    code = compile(source, filename, "exec")
    with contextlib.redirect_stdout(stdout):
        sys.settrace(tracer)
        try:
            exec(code, program_globals)
        finally:
            sys.settrace(None)

    return {"source": lines, "steps": steps}


def main():
    lesson_dir = pathlib.Path(sys.argv[1])
    traces = {
        path.relative_to(lesson_dir).with_suffix("").as_posix(): trace_program(path.resolve())
        for path in sorted(lesson_dir.rglob("*.py"))
    }
    out_path = lesson_dir / "traces.json"
    out_path.write_text(json.dumps(traces, indent=2) + "\n")
    for name, trace in traces.items():
        print(f"{name}: {len(trace['steps'])} steps")


if __name__ == "__main__":
    main()
