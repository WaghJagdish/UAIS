"""
complexity.py
Complexity metadata and algorithm recommendation helpers.
"""

from utils.constants import SORTING_ALGORITHMS, SEARCHING_ALGORITHMS, STRING_ALGORITHMS


def get_sorting_recommendation(n: int, timings: dict) -> str:
    """Return a recommendation string based on input size and timings."""
    if n <= 10:
        return "Insertion Sort – best for tiny arrays (low overhead, adaptive)."
    if n <= 50:
        return "Insertion Sort or Quick Sort – small arrays with fast pivot selection."
    fastest = min(timings, key=lambda k: timings[k])
    if fastest in ("Quick Sort", "Merge Sort"):
        return f"{fastest} – fastest empirically for this input size of {n}."
    return f"{fastest} – fastest for this run (n={n})."


def get_searching_recommendation(n: int, is_sorted: bool) -> str:
    if not is_sorted:
        return "Linear Search – array is unsorted; binary search requires sorted input."
    if n < 16:
        return "Linear Search is fine for tiny arrays."
    return "Binary Search – O(log n) is significantly faster for sorted arrays."


def sort_complexity_table() -> list[dict]:
    """Return list of dicts suitable for pd.DataFrame."""
    rows = []
    for name, meta in SORTING_ALGORITHMS.items():
        rows.append({
            "Algorithm": name,
            "Best Case": meta["time_best"],
            "Average Case": meta["time_avg"],
            "Worst Case": meta["time_worst"],
            "Space": meta["space"],
            "Stable": "✅" if meta["stable"] else "❌",
        })
    return rows


def search_complexity_table() -> list[dict]:
    rows = []
    for name, meta in SEARCHING_ALGORITHMS.items():
        rows.append({
            "Algorithm": name,
            "Best Case": meta["time_best"],
            "Average Case": meta["time_avg"],
            "Worst Case": meta["time_worst"],
            "Space": meta["space"],
        })
    return rows
