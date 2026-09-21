importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

let pyodidePromise = null;

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const py = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      });
      await py.runPythonAsync(`
import json, copy, time, tracemalloc

def _to_jsonable(val):
    if val is None or isinstance(val, (str, int, float, bool)):
        return val
    if isinstance(val, (list, tuple)):
        return [_to_jsonable(x) for x in val]
    if isinstance(val, dict):
        return {str(k): _to_jsonable(v) for k, v in val.items()}
    if isinstance(val, set):
        return sorted([_to_jsonable(x) for x in val])
    return str(val)

def _run_suite(code_str, fn_name, tests_json_str):
    tests_data = json.loads(tests_json_str)
    logs = []

    def safe_print(*values, sep=" ", end="\\n"):
        if len(logs) < 20:
            line = sep.join(str(v) for v in values)
            if end and end != "\\n":
                line += end.rstrip("\\n")
            logs.append(line[:300])

    builtins_dict = {
        "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
        "enumerate": enumerate, "filter": filter, "float": float, "int": int,
        "isinstance": isinstance, "len": len, "list": list, "map": map,
        "max": max, "min": min, "print": safe_print, "range": range,
        "reversed": reversed, "round": round, "set": set, "slice": slice,
        "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "type": type,
        "zip": zip, "Exception": Exception, "IndexError": IndexError,
        "KeyError": KeyError, "RuntimeError": RuntimeError,
        "TypeError": TypeError, "ValueError": ValueError
    }

    sandbox = {
        "__builtins__": builtins_dict,
        "__name__": "__student_solution__"
    }

    try:
        exec(compile(code_str, "student_solution.py", "exec"), sandbox, sandbox)
    except BaseException as error:
        err_msg = str(error or "Python error")[:500]
        results = []
        for t in tests_data:
            item = {
                "id": t.get("id"),
                "label": t.get("label"),
                "group": t.get("group"),
                "visible": bool(t.get("visible")),
                "passed": False,
                "error": err_msg,
                "durationMs": 0,
                "memoryBytes": 0,
                "size": t.get("size", 0)
            }
            if t.get("visible"):
                item["input"] = t.get("args")
                item["expected"] = _to_jsonable(t.get("expected"))
            results.append(item)
        return json.dumps({
            "ok": False,
            "setupError": None,
            "tests": results,
            "stdout": logs
        })

    candidate = sandbox.get(fn_name)
    if not callable(candidate):
        msg = f"Define a Python function named {fn_name} with def {fn_name}(...):"
        results = []
        for t in tests_data:
            item = {
                "id": t.get("id"),
                "label": t.get("label"),
                "group": t.get("group"),
                "visible": bool(t.get("visible")),
                "passed": False,
                "setupError": msg,
                "durationMs": 0,
                "memoryBytes": 0,
                "size": t.get("size", 0)
            }
            if t.get("visible"):
                item["input"] = t.get("args")
                item["expected"] = _to_jsonable(t.get("expected"))
            results.append(item)
        return json.dumps({
            "ok": False,
            "setupError": msg,
            "tests": results,
            "stdout": logs
        })

    results = []
    for t in tests_data:
        args = copy.deepcopy(t.get("args", []))
        start = time.perf_counter()
        peak_memory = 0
        try:
            try:
                tracemalloc.start()
                actual = candidate(*args)
                _, peak_memory = tracemalloc.get_traced_memory()
            finally:
                tracemalloc.stop()

            duration_ms = (time.perf_counter() - start) * 1000
            actual_json = _to_jsonable(actual)
            expected_json = _to_jsonable(t.get("expected"))
            passed = (actual_json == expected_json)
            item = {
                "id": t.get("id"),
                "label": t.get("label"),
                "group": t.get("group"),
                "visible": bool(t.get("visible")),
                "passed": passed,
                "durationMs": duration_ms,
                "memoryBytes": peak_memory,
                "size": t.get("size", 0),
                "actual": actual_json,
                "expected": expected_json
            }
            if t.get("visible"):
                item["input"] = t.get("args")
            results.append(item)
        except BaseException as error:
            duration_ms = (time.perf_counter() - start) * 1000
            err_msg = str(error or "Error during test execution")[:500]
            item = {
                "id": t.get("id"),
                "label": t.get("label"),
                "group": t.get("group"),
                "visible": bool(t.get("visible")),
                "passed": False,
                "error": err_msg,
                "durationMs": duration_ms,
                "memoryBytes": 0,
                "size": t.get("size", 0),
                "expected": _to_jsonable(t.get("expected"))
            }
            if t.get("visible"):
                item["input"] = t.get("args")
            results.append(item)

    all_passed = all(r.get("passed", False) for r in results)
    return json.dumps({
        "ok": all_passed,
        "setupError": None,
        "tests": results,
        "stdout": logs
    })
      `);
      return py;
    })();
  }
  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { jobId, code, functionName, tests, type } = event.data || {};
  if (type === "warmup") {
    try {
      await getPyodide();
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", error: err.message || String(err) });
    }
    return;
  }

  try {
    const pyodide = await getPyodide();
    pyodide.globals.set("__code_arg__", code);
    pyodide.globals.set("__fn_name_arg__", functionName);
    pyodide.globals.set("__tests_arg__", JSON.stringify(tests));

    const resultJson = await pyodide.runPythonAsync(`
_run_suite(__code_arg__, __fn_name_arg__, __tests_arg__)
    `);
    const runnerResult = JSON.parse(resultJson);
    self.postMessage({ jobId, ok: true, runnerResult });
  } catch (error) {
    self.postMessage({ jobId, ok: false, error: error.message || String(error) });
  }
};
