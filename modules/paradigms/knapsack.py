"""
knapsack.py
0/1 Knapsack solved by Greedy (approx), DP, and Branch & Bound.
"""

import math


def knapsack_dp(weights: list, values: list, capacity: int) -> dict:
    """0/1 Knapsack Dynamic Programming – O(nW) time and space."""
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    steps = []

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]])
            else:
                dp[i][w] = dp[i - 1][w]

    # Traceback
    selected = []
    w = capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected.append(i - 1)
            w -= weights[i - 1]
    selected.reverse()

    steps = [{"dp_row": dp[i][:], "item": i, "description": f"Processed item {i}"} for i in range(n + 1)]

    return {
        "max_value": dp[n][capacity],
        "selected_items": selected,
        "dp_table": dp,
        "steps": steps,
    }


def knapsack_greedy(weights: list, values: list, capacity: int) -> dict:
    """
    Greedy Fractional Knapsack (approximation for 0/1).
    Items sorted by value/weight ratio.
    """
    n = len(weights)
    ratios = [(values[i] / weights[i], i) for i in range(n)]
    ratios.sort(reverse=True)

    total_value = 0
    total_weight = 0
    selected = []
    steps = []

    for ratio, i in ratios:
        if total_weight + weights[i] <= capacity:
            total_weight += weights[i]
            total_value  += values[i]
            selected.append(i)
            steps.append({
                "item": i, "action": "added",
                "total_weight": total_weight, "total_value": total_value,
                "description": f"Added item {i} (val={values[i]}, wt={weights[i]}, ratio={ratio:.2f})",
            })
        else:
            steps.append({
                "item": i, "action": "skipped",
                "total_weight": total_weight, "total_value": total_value,
                "description": f"Skipped item {i} (would exceed capacity)",
            })

    return {
        "max_value": total_value,
        "selected_items": sorted(selected),
        "steps": steps,
        "note": "Greedy gives approximate solution for 0/1 knapsack",
    }


def knapsack_branch_bound(weights: list, values: list, capacity: int) -> dict:
    """
    Branch & Bound for 0/1 Knapsack.
    Returns optimal value and explored nodes count.
    """
    n = len(weights)
    # Sort by ratio
    items = sorted(range(n), key=lambda i: values[i] / weights[i], reverse=True)
    best_val = [0]
    best_sel = [[]]
    nodes_explored = [0]
    steps = []

    def upper_bound(idx, cur_w, cur_v):
        ub = cur_v
        w = cur_w
        for k in range(idx, n):
            i = items[k]
            if w + weights[i] <= capacity:
                w += weights[i]; ub += values[i]
            else:
                ub += (capacity - w) * (values[i] / weights[i])
                break
        return ub

    def bnb(idx, cur_w, cur_v, sel):
        nodes_explored[0] += 1
        if cur_w > capacity:
            return
        if idx == n or cur_v + upper_bound(idx, cur_w, cur_v) <= best_val[0]:
            if cur_v > best_val[0]:
                best_val[0] = cur_v
                best_sel[0] = list(sel)
            return
        i = items[idx]
        # Include item
        sel.append(i)
        steps.append({
            "node": nodes_explored[0], "item": i, "action": "include",
            "cur_val": cur_v + values[i], "cur_weight": cur_w + weights[i],
            "description": f"Include item {i}: val={cur_v+values[i]}, wt={cur_w+weights[i]}",
        })
        bnb(idx + 1, cur_w + weights[i], cur_v + values[i], sel)
        sel.pop()
        # Exclude item
        steps.append({
            "node": nodes_explored[0], "item": i, "action": "exclude",
            "cur_val": cur_v, "cur_weight": cur_w,
            "description": f"Exclude item {i}: val={cur_v}, wt={cur_w}",
        })
        bnb(idx + 1, cur_w, cur_v, sel)

    bnb(0, 0, 0, [])
    return {
        "max_value": best_val[0],
        "selected_items": sorted(best_sel[0]),
        "nodes_explored": nodes_explored[0],
        "steps": steps[:50],  # limit for display
    }
