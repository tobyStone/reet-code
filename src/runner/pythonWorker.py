import copy
import json
import multiprocessing
import queue
import sys
import time
import tracemalloc


LOG_LIMIT = 20
MAX_LOG_LENGTH = 300
MAX_INPUT_LENGTH = 1_000_000


def main():
    try:
        raw_input = sys.stdin.read(MAX_INPUT_LENGTH + 1)
        if len(raw_input) > MAX_INPUT_LENGTH:
            raise ValueError("Input too large.")

        job = json.loads(raw_input or "{}")
        output = run_job(job)
    except BaseException as error:
        output = {
            "ok": False,
            "setupError": clean_error(error),
            "tests": [],
            "stdout": [],
        }

    sys.stdout.write(json.dumps(output, separators=(",", ":")))


def run_job(job):
    results = []
    logs = []
    setup_error = None
    timeout_seconds = max(0.05, float(job.get("perTestTimeoutMs", 700)) / 1000)

    for test_case in job.get("tests", []):
        result = run_single_test(job, test_case, timeout_seconds)
        logs.extend(result.pop("_logs", []))
        logs = logs[:LOG_LIMIT]
        results.append(result)

        if result.get("setupError"):
            setup_error = result["setupError"]
            break

    return {
        "ok": setup_error is None,
        "setupError": setup_error,
        "tests": results,
        "stdout": logs,
    }


def run_single_test(job, test_case, timeout_seconds):
    context = multiprocessing.get_context("spawn")
    result_queue = context.Queue()
    process = context.Process(target=run_single_test_child, args=(job, test_case, result_queue))
    process.start()
    process.join(timeout_seconds)

    if process.is_alive():
        process.kill()
        process.join()
        return {
            **base_result(test_case),
            "passed": False,
            "error": "This test timed out. Have another look for an infinite loop or a very slow approach.",
            "durationMs": timeout_seconds * 1000,
            "memoryBytes": 0,
            "_logs": [],
        }

    try:
        return result_queue.get_nowait()
    except queue.Empty:
        return {
            **base_result(test_case),
            "passed": False,
            "error": f"Python runner stopped before returning a result. Exit code {process.exitcode}.",
            "durationMs": 0,
            "memoryBytes": 0,
            "_logs": [],
        }


def run_single_test_child(job, test_case, result_queue):
    result_queue.put(execute_test(job, test_case))


def execute_test(job, test_case):
    started_at = time.perf_counter()
    logs = []

    try:
        sys.setrecursionlimit(10000)
        sandbox = {
            "__builtins__": safe_builtins(logs),
            "__name__": "__student_solution__",
        }

        exec(compile(str(job.get("code", "")), "student_solution.py", "exec"), sandbox, sandbox)

        function_name = str(job.get("functionName", ""))
        candidate = sandbox.get(function_name)
        if not callable(candidate):
            return {
                **base_result(test_case),
                "passed": False,
                "setupError": f"Define a Python function named {function_name} with def {function_name}(...):",
                "durationMs": 0,
                "memoryBytes": 0,
                "_logs": logs,
            }

        args = copy.deepcopy(test_case.get("args", []))
        before_call = time.perf_counter()
        tracemalloc.start()
        try:
            actual = candidate(*args)
            _, peak_memory = tracemalloc.get_traced_memory()
        finally:
            tracemalloc.stop()

        duration_ms = (time.perf_counter() - before_call) * 1000
        actual_json = to_jsonable(actual)
        expected_json = to_jsonable(test_case.get("expected"))
        visible = bool(test_case.get("visible"))

        result = {
            **base_result(test_case),
            "passed": actual_json == expected_json,
            "durationMs": duration_ms,
            "memoryBytes": peak_memory,
            "size": test_case.get("size", 0),
            "_logs": logs,
        }

        if visible:
            result["input"] = test_case.get("args")
            result["expected"] = expected_json
            result["actual"] = actual_json

        return result
    except BaseException as error:
        result = {
            **base_result(test_case),
            "passed": False,
            "error": clean_error(error),
            "durationMs": (time.perf_counter() - started_at) * 1000,
            "memoryBytes": 0,
            "size": test_case.get("size", 0),
            "_logs": logs,
        }

        if test_case.get("visible"):
            result["input"] = test_case.get("args")
            result["expected"] = to_jsonable(test_case.get("expected"))

        return result


def safe_builtins(logs):
    def safe_print(*values, sep=" ", end="\n", file=None, flush=False):
        if len(logs) >= LOG_LIMIT:
            return

        line = sep.join(str(value) for value in values)
        if end and end != "\n":
            line += end.rstrip("\n")
        logs.append(line[:MAX_LOG_LENGTH])

    return {
        "Exception": Exception,
        "IndexError": IndexError,
        "KeyError": KeyError,
        "RuntimeError": RuntimeError,
        "TypeError": TypeError,
        "ValueError": ValueError,
        "abs": abs,
        "all": all,
        "any": any,
        "bool": bool,
        "dict": dict,
        "enumerate": enumerate,
        "filter": filter,
        "float": float,
        "int": int,
        "isinstance": isinstance,
        "len": len,
        "list": list,
        "map": map,
        "max": max,
        "min": min,
        "print": safe_print,
        "range": range,
        "reversed": reversed,
        "round": round,
        "set": set,
        "slice": slice,
        "sorted": sorted,
        "str": str,
        "sum": sum,
        "tuple": tuple,
        "type": type,
        "zip": zip,
    }


def base_result(test_case):
    return {
        "id": test_case.get("id"),
        "label": test_case.get("label"),
        "group": test_case.get("group"),
        "visible": bool(test_case.get("visible")),
    }


def to_jsonable(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, (list, tuple)):
        return [to_jsonable(item) for item in value]

    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}

    if isinstance(value, set):
        return sorted(to_jsonable(item) for item in value)

    return str(value)


def clean_error(error):
    return str(error or "Python runner failed.")[:500]


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
