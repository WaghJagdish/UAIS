"""
shortest_path.py
Dijkstra and Floyd-Warshall wrappers for the paradigm UI.
(Imports from graph_algorithms.py)
"""

from modules.graph.graph_algorithms import dijkstra, floyd_warshall, reconstruct_path


def compare_shortest_path(graph_dict: dict, nodes: list, edges: list, source: str, target: str) -> dict:
    """
    Run Dijkstra and Floyd-Warshall on the same graph, return combined results.

    Parameters
    ----------
    graph_dict : {node: {neighbor: weight}} for Dijkstra
    nodes      : list of node names for Floyd-Warshall
    edges      : [(u, v, weight)] for Floyd-Warshall
    source     : start node
    target     : end node
    """
    from utils.timer import timer_context

    # Dijkstra
    with timer_context() as td:
        dijk = dijkstra(graph_dict, source)
    dijk_path = reconstruct_path(dijk["predecessors"], source, target)
    dijk_dist = dijk["distances"].get(target, float("inf"))

    # Floyd-Warshall
    with timer_context() as t_fw:
        fw = floyd_warshall(nodes, edges)
    idx = fw["idx"]
    fw_dist = fw["dist"][idx[source]][idx[target]] if source in idx and target in idx else float("inf")

    return {
        "dijkstra": {
            "distance": dijk_dist,
            "path": dijk_path,
            "steps": dijk["steps"],
            "all_distances": dijk["distances"],
            "elapsed": td["elapsed"],
        },
        "floyd_warshall": {
            "distance": fw_dist,
            "dist_matrix": fw["dist"],
            "nodes": fw["nodes"],
            "steps": fw["steps"],
            "elapsed": t_fw["elapsed"],
        },
    }
