"""
graph_algorithms.py
Dijkstra, Kruskal, and Prim algorithms with step-by-step histories.
"""

import heapq


def dijkstra(graph: dict, source: str) -> dict:
    """
    Dijkstra's Shortest Path.
    graph: {node: {neighbor: weight, ...}, ...}
    Returns distances, predecessors, and steps.
    """
    dist = {n: float("inf") for n in graph}
    dist[source] = 0
    prev = {n: None for n in graph}
    visited = set()
    heap = [(0, source)]
    steps = []

    while heap:
        d, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)
        steps.append({
            "action": "visit",
            "node": u,
            "dist": dict(dist),
            "visited": set(visited),
            "highlighted_edge": None,
            "description": f"Visiting node {u} with distance {d}",
        })
        for v, w in graph[u].items():
            if v not in visited:
                new_dist = dist[u] + w
                if new_dist < dist[v]:
                    dist[v] = new_dist
                    prev[v] = u
                    heapq.heappush(heap, (new_dist, v))
                    steps.append({
                        "action": "relax",
                        "node": v,
                        "dist": dict(dist),
                        "visited": set(visited),
                        "highlighted_edge": (u, v),
                        "description": f"Relaxed edge {u}→{v}: dist[{v}] = {new_dist}",
                    })

    return {"distances": dist, "predecessors": prev, "steps": steps}


def reconstruct_path(prev: dict, source: str, target: str) -> list:
    path = []
    cur = target
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    if path[0] == source:
        return path
    return []


def floyd_warshall(nodes: list, edges: list) -> dict:
    """
    Floyd-Warshall All-Pairs Shortest Path.
    edges: [(u, v, weight), ...]
    Returns dist matrix as dict, steps list.
    """
    n = len(nodes)
    idx = {node: i for i, node in enumerate(nodes)}
    dist = [[float("inf")] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[idx[u]][idx[v]] = w
        dist[idx[v]][idx[u]] = w  # undirected

    steps = []
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    steps.append({
                        "k": nodes[k], "i": nodes[i], "j": nodes[j],
                        "new_dist": dist[i][j],
                        "description": (
                            f"Via {nodes[k]}: dist[{nodes[i]}][{nodes[j]}] "
                            f"updated to {dist[i][j]:.2f}"
                        ),
                    })

    return {"dist": dist, "nodes": nodes, "steps": steps, "idx": idx}


def kruskal(nodes: list, edges: list) -> dict:
    """
    Kruskal's MST – sort edges by weight, union-find.
    edges: [(weight, u, v), ...]
    """
    parent = {n: n for n in nodes}
    rank   = {n: 0  for n in nodes}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        px, py = find(x), find(y)
        if px == py:
            return False
        if rank[px] < rank[py]:
            px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]:
            rank[px] += 1
        return True

    sorted_edges = sorted(edges, key=lambda e: e[0])
    mst = []
    steps = []

    for w, u, v in sorted_edges:
        steps.append({
            "action": "consider",
            "edge": (u, v, w),
            "mst": [e for e in mst],
            "description": f"Considering edge {u}-{v} (weight={w})",
        })
        if union(u, v):
            mst.append((u, v, w))
            steps.append({
                "action": "add",
                "edge": (u, v, w),
                "mst": [e for e in mst],
                "description": f"✅ Added edge {u}-{v} (weight={w}) to MST",
            })
        else:
            steps.append({
                "action": "skip",
                "edge": (u, v, w),
                "mst": [e for e in mst],
                "description": f"❌ Skipped edge {u}-{v} (would create cycle)",
            })

    total_weight = sum(e[2] for e in mst)
    return {"mst": mst, "total_weight": total_weight, "steps": steps}


def prim(nodes: list, adj: dict) -> dict:
    """
    Prim's MST starting from first node in list.
    adj: {node: [(neighbor, weight), ...], ...}
    """
    if not nodes:
        return {"mst": [], "total_weight": 0, "steps": []}

    start = nodes[0]
    in_mst = {start}
    mst = []
    steps = []
    heap = []

    for neighbor, w in adj.get(start, []):
        heapq.heappush(heap, (w, start, neighbor))

    while heap and len(in_mst) < len(nodes):
        w, u, v = heapq.heappop(heap)
        if v in in_mst:
            steps.append({
                "action": "skip",
                "edge": (u, v, w),
                "mst": list(mst),
                "description": f"❌ Skipped {u}-{v} (already in MST tree)",
            })
            continue
        in_mst.add(v)
        mst.append((u, v, w))
        steps.append({
            "action": "add",
            "edge": (u, v, w),
            "mst": list(mst),
            "description": f"✅ Added edge {u}-{v} (weight={w}) to MST",
        })
        for neighbor, nw in adj.get(v, []):
            if neighbor not in in_mst:
                heapq.heappush(heap, (nw, v, neighbor))

    total_weight = sum(e[2] for e in mst)
    return {"mst": mst, "total_weight": total_weight, "steps": steps}
