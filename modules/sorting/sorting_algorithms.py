"""
sorting_algorithms.py
Four sorting algorithms, each returning a step-by-step history
suitable for visualization.

Each algorithm returns:
    steps: list of (array_snapshot, [highlighted_indices], action_description)
    comparisons: int
    swaps: int
"""

import copy


def selection_sort(arr: list) -> dict:
    """Selection Sort – O(n²) time, O(1) space."""
    a = arr[:]
    n = len(a)
    steps = []
    comparisons = 0
    swaps = 0

    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            comparisons += 1
            steps.append({
                "array": a[:],
                "highlights": {"compare": [min_idx, j], "sorted": list(range(i)), "active": [i]},
                "description": f"Comparing indices {j} ({a[j]}) and min_idx {min_idx} ({a[min_idx]})",
            })
            if a[j] < a[min_idx]:
                min_idx = j

        if min_idx != i:
            a[i], a[min_idx] = a[min_idx], a[i]
            swaps += 1
            steps.append({
                "array": a[:],
                "highlights": {"compare": [], "sorted": list(range(i + 1)), "active": [i, min_idx]},
                "description": f"Swapped index {i} ({a[i]}) ↔ {min_idx} ({a[min_idx]})",
            })

    steps.append({
        "array": a[:],
        "highlights": {"compare": [], "sorted": list(range(n)), "active": []},
        "description": "Array is fully sorted!",
    })
    return {"sorted": a, "steps": steps, "comparisons": comparisons, "swaps": swaps}


def insertion_sort(arr: list) -> dict:
    """Insertion Sort – O(n) best, O(n²) worst, O(1) space."""
    a = arr[:]
    n = len(a)
    steps = []
    comparisons = 0
    swaps = 0

    for i in range(1, n):
        key = a[i]
        j = i - 1
        steps.append({
            "array": a[:],
            "highlights": {"compare": [i], "sorted": list(range(i)), "active": [i]},
            "description": f"Picking key = {key} at index {i}",
        })
        while j >= 0 and a[j] > key:
            comparisons += 1
            a[j + 1] = a[j]
            swaps += 1
            steps.append({
                "array": a[:],
                "highlights": {"compare": [j, j + 1], "sorted": list(range(j)), "active": [j + 1]},
                "description": f"Shifting {a[j]} right; key={key}",
            })
            j -= 1
        if j >= 0:
            comparisons += 1
        a[j + 1] = key
        steps.append({
            "array": a[:],
            "highlights": {"compare": [], "sorted": list(range(i + 1)), "active": [j + 1]},
            "description": f"Inserted {key} at position {j + 1}",
        })

    steps.append({
        "array": a[:],
        "highlights": {"compare": [], "sorted": list(range(n)), "active": []},
        "description": "Array is fully sorted!",
    })
    return {"sorted": a, "steps": steps, "comparisons": comparisons, "swaps": swaps}


def merge_sort(arr: list) -> dict:
    """Merge Sort – O(n log n) always, O(n) space."""
    a = arr[:]
    steps = []
    comparisons = 0

    def _merge(arr, left, mid, right):
        nonlocal comparisons
        L = arr[left:mid + 1]
        R = arr[mid + 1:right + 1]
        i = j = 0
        k = left
        while i < len(L) and j < len(R):
            comparisons += 1
            if L[i] <= R[j]:
                arr[k] = L[i]; i += 1
            else:
                arr[k] = R[j]; j += 1
            steps.append({
                "array": arr[:],
                "highlights": {"compare": [k], "sorted": [], "active": list(range(left, right + 1))},
                "description": f"Merging [{left}:{right}]: placed {arr[k]} at index {k}",
            })
            k += 1
        while i < len(L):
            arr[k] = L[i]; i += 1; k += 1
        while j < len(R):
            arr[k] = R[j]; j += 1; k += 1
        steps.append({
            "array": arr[:],
            "highlights": {"compare": [], "sorted": list(range(left, right + 1)), "active": []},
            "description": f"Segment [{left}:{right}] merged",
        })

    def _merge_sort(arr, left, right):
        if left < right:
            mid = (left + right) // 2
            _merge_sort(arr, left, mid)
            _merge_sort(arr, mid + 1, right)
            _merge(arr, left, mid, right)

    _merge_sort(a, 0, len(a) - 1)
    steps.append({
        "array": a[:],
        "highlights": {"compare": [], "sorted": list(range(len(a))), "active": []},
        "description": "Array is fully sorted!",
    })
    return {"sorted": a, "steps": steps, "comparisons": comparisons, "swaps": 0}


def quick_sort(arr: list) -> dict:
    """Quick Sort – O(n log n) avg, O(n²) worst, O(log n) space."""
    a = arr[:]
    steps = []
    comparisons = 0
    swaps = 0

    def _partition(arr, low, high):
        nonlocal comparisons, swaps
        pivot = arr[high]
        i = low - 1
        steps.append({
            "array": arr[:],
            "highlights": {"compare": [high], "sorted": [], "active": list(range(low, high + 1))},
            "description": f"Pivot = {pivot} at index {high}",
        })
        for j in range(low, high):
            comparisons += 1
            steps.append({
                "array": arr[:],
                "highlights": {"compare": [j, high], "sorted": [], "active": list(range(low, high + 1))},
                "description": f"Comparing {arr[j]} with pivot {pivot}",
            })
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                swaps += 1
                steps.append({
                    "array": arr[:],
                    "highlights": {"compare": [i, j], "sorted": [], "active": list(range(low, high + 1))},
                    "description": f"Swapped {arr[j]} ↔ {arr[i]}",
                })
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        swaps += 1
        steps.append({
            "array": arr[:],
            "highlights": {"compare": [], "sorted": [i + 1], "active": []},
            "description": f"Pivot {pivot} placed at final position {i + 1}",
        })
        return i + 1

    def _quick_sort(arr, low, high):
        if low < high:
            pi = _partition(arr, low, high)
            _quick_sort(arr, low, pi - 1)
            _quick_sort(arr, pi + 1, high)

    _quick_sort(a, 0, len(a) - 1)
    steps.append({
        "array": a[:],
        "highlights": {"compare": [], "sorted": list(range(len(a))), "active": []},
        "description": "Array is fully sorted!",
    })
    return {"sorted": a, "steps": steps, "comparisons": comparisons, "swaps": swaps}
