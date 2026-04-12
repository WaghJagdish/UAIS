"""
timer.py
Utilities for measuring algorithm execution time.
"""

import time
import functools
from contextlib import contextmanager


@contextmanager
def timer_context():
    """Context manager that returns elapsed seconds."""
    state = {"elapsed": 0.0}
    start = time.perf_counter()
    try:
        yield state
    finally:
        state["elapsed"] = time.perf_counter() - start


def timed(fn):
    """
    Decorator – wraps an algorithm function and returns
    (result, elapsed_seconds) tuple.
    """
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        return result, elapsed
    return wrapper


def measure_multiple(func_dict: dict, *args, **kwargs) -> dict:
    """
    Run multiple callables with the same arguments and return a dict of
    {name: {"result": ..., "elapsed": float}} for each.

    Parameters
    ----------
    func_dict : {name: callable}
    *args, **kwargs : forwarded to every callable
    """
    results = {}
    for name, fn in func_dict.items():
        start = time.perf_counter()
        res   = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        results[name] = {"result": res, "elapsed": elapsed}
    return results
