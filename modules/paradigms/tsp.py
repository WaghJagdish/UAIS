"""
tsp.py
Travelling Salesman Problem – DP (Held-Karp) and Branch & Bound.
"""

import math
from itertools import combinations


def tsp_dp(dist_matrix: list, node_names: list = None) -> dict:
    """
    Held-Karp DP – O(n²·2ⁿ) time, O(n·2ⁿ) space.
    dist_matrix: n×n list of lists (0-indexed).
    """
    n = len(dist_matrix)
    if n == 0:
        return {"min_cost": 0, "path": [], "steps": []}
    FULL = (1 << n) - 1
    dp = [[float("inf")] * n for _ in range(1 << n)]
    parent = [[-1] * n for _ in range(1 << n)]
    dp[1][0] = 0
    steps = []

    for mask in range(1, 1 << n):
        if not (mask & 1):
            continue
        for u in range(n):
            if not (mask & (1 << u)):
                continue
            if dp[mask][u] == float("inf"):
                continue
            for v in range(n):
                if mask & (1 << v):
                    continue
                new_mask = mask | (1 << v)
                new_cost = dp[mask][u] + dist_matrix[u][v]
                if new_cost < dp[new_mask][v]:
                    dp[new_mask][v] = new_cost
                    parent[new_mask][v] = u
                    steps.append({
                        "mask": bin(new_mask), "from": u, "to": v,
                        "cost": new_cost,
                        "description": f"DP: {node_names[u] if node_names else u}→{node_names[v] if node_names else v} cost={new_cost}",
                    })

    # Find best ending city
    min_cost = float("inf")
    last = -1
    for u in range(1, n):
        cost = dp[FULL][u] + dist_matrix[u][0]
        if cost < min_cost:
            min_cost = cost
            last = u

    # Reconstruct path
    path = []
    if last != -1:
        mask = FULL
        cur = last
        while cur != -1:
            path.append(cur)
            prev = parent[mask][cur]
            mask ^= (1 << cur)
            cur = prev
        path.append(0)
        path.reverse()

    if node_names:
        path_named = [node_names[i] for i in path]
    else:
        path_named = path

    return {
        "min_cost": min_cost if min_cost != float("inf") else None,
        "path": path_named,
        "raw_path": path,
        "steps": steps[:60],
    }


def tsp_branch_bound(dist_matrix: list, node_names: list = None) -> dict:
    """
    Branch & Bound for TSP (greedy lower-bound pruning).
    Suitable for small n (≤ 10).
    """
    n = len(dist_matrix)
    if n == 0:
        return {"min_cost": 0, "path": [], "steps": [], "nodes_explored": 0}

    best_cost  = [float("inf")]
    best_path  = [[]]
    nodes_exp  = [0]
    steps      = []

    def bnb(path, visited, cur_cost):
        nodes_exp[0] += 1
        u = path[-1]
        if len(path) == n:
            total = cur_cost + dist_matrix[u][0]
            steps.append({
                "path": list(path) + [0], "cost": total,
                "description": f"Complete tour cost={total}",
            })
            if total < best_cost[0]:
                best_cost[0] = total
                best_path[0] = list(path) + [0]
            return

        for v in range(n):
            if not visited[v]:
                new_cost = cur_cost + dist_matrix[u][v]
                if new_cost < best_cost[0]:   # pruning
                    visited[v] = True
                    path.append(v)
                    steps.append({
                        "path": list(path), "cost": new_cost,
                        "description": f"Explore {node_names[u] if node_names else u}→{node_names[v] if node_names else v} cost={new_cost}",
                    })
                    bnb(path, visited, new_cost)
                    path.pop()
                    visited[v] = False

    visited = [False] * n
    visited[0] = True
    bnb([0], visited, 0)

    path_named = [node_names[i] for i in best_path[0]] if node_names else best_path[0]
    return {
        "min_cost": best_cost[0] if best_cost[0] != float("inf") else None,
        "path": path_named,
        "raw_path": best_path[0],
        "nodes_explored": nodes_exp[0],
        "steps": steps[:60],
    }
