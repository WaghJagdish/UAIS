"""
searching_algorithms.py
Linear Search and Binary Search with step-by-step history.
"""


def linear_search(arr: list, target) -> dict:
    """
    Linear Search – O(n) time, O(1) space.
    Works on unsorted arrays.
    """
    steps = []
    comparisons = 0
    found_idx = -1

    for i, val in enumerate(arr):
        comparisons += 1
        steps.append({
            "array": arr[:],
            "pointer": i,
            "highlights": {"active": [i], "found": []},
            "description": f"Checking index {i}: value={val} {'== target ✅' if val == target else '≠ target'}",
        })
        if val == target:
            found_idx = i
            steps[-1]["highlights"]["found"] = [i]
            steps[-1]["highlights"]["active"] = []
            break

    return {
        "found_at": found_idx,
        "steps": steps,
        "comparisons": comparisons,
    }


def binary_search(arr: list, target) -> dict:
    """
    Binary Search – O(log n) time, O(1) space.
    Requires sorted array.
    """
    sorted_arr = sorted(arr)
    steps = []
    comparisons = 0
    found_idx = -1
    low, high = 0, len(sorted_arr) - 1

    while low <= high:
        mid = (low + high) // 2
        comparisons += 1
        steps.append({
            "array": sorted_arr[:],
            "pointer": mid,
            "highlights": {"active": [mid], "range": list(range(low, high + 1)), "found": []},
            "description": (
                f"low={low}, high={high}, mid={mid} → "
                f"arr[mid]={sorted_arr[mid]} "
                f"{'== target ✅' if sorted_arr[mid] == target else ('> target, search left' if sorted_arr[mid] > target else '< target, search right')}"
            ),
        })
        if sorted_arr[mid] == target:
            found_idx = mid
            steps[-1]["highlights"]["found"] = [mid]
            steps[-1]["highlights"]["active"] = []
            break
        elif sorted_arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    if found_idx == -1:
        steps.append({
            "array": sorted_arr[:],
            "pointer": -1,
            "highlights": {"active": [], "range": [], "found": []},
            "description": f"Target {target} not found in array.",
        })

    return {
        "found_at": found_idx,
        "steps": steps,
        "comparisons": comparisons,
        "sorted_array": sorted_arr,
    }
