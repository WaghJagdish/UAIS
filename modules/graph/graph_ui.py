"""
graph_ui.py
Streamlit UI for the Graph Algorithms module.
Supports manual edge input and image upload.
"""

import streamlit as st
import pandas as pd

from modules.graph.graph_algorithms import dijkstra, kruskal, prim, reconstruct_path
from modules.graph.graph_visualizer import draw_graph, fig_to_bytes
from modules.graph.graph_image_parser import parse_graph_from_image
from utils.timer import timer_context
from utils.plotting import timing_bar_chart
from utils.constants import GRAPH_ALGORITHMS


DEFAULT_EDGES_STR = """A,B,4
A,C,2
B,C,1
B,D,5
C,D,8
C,E,10
D,E,2
D,F,6
E,F,3"""


def _parse_edges(raw: str):
    nodes_set, edges = set(), []
    for line in raw.strip().split("\n"):
        parts = [p.strip() for p in line.split(",")]
        if len(parts) == 3:
            u, v, w = parts[0], parts[1], float(parts[2])
            edges.append((u, v, w))
            nodes_set.update([u, v])
    return sorted(nodes_set), edges


def _build_adj(nodes, edges):
    adj = {n: [] for n in nodes}
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    return adj


def _build_graph_dict(nodes, edges):
    gd = {n: {} for n in nodes}
    for u, v, w in edges:
        gd[u][v] = w
        gd[v][u] = w
    return gd


def render():
    st.markdown("""
    <h1 style='text-align:center;background:linear-gradient(135deg,#a18cd1,#fbc2eb);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2.4rem;'>
    🕸️ Graph Algorithm Visualizer</h1>
    <p style='text-align:center;color:#95A5A6;'>
    Dijkstra · Kruskal · Prim — with manual or image input.</p>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
        <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Visualization Controls</h4>
    """, unsafe_allow_html=True)
    
    col_a, col_b = st.columns([1, 2])
    input_method = col_a.radio("Input Method", ["✏️ Manual edges", "🖼️ Upload image"])

    if input_method == "✏️ Manual edges":
        raw_edges = col_b.text_area("Edges (u,v,weight per line)", DEFAULT_EDGES_STR, height=135)
        nodes, edges = _parse_edges(raw_edges)
    else:
        uploaded = col_b.file_uploader("Upload graph image", type=["png","jpg","jpeg"])
        if uploaded:
            result = parse_graph_from_image(uploaded.read())
            col_b.info(result["message"])
            raw_fallback = col_b.text_area("Define edges manually below:", DEFAULT_EDGES_STR, height=100)
            nodes, edges = _parse_edges(raw_fallback)
        else:
            col_b.info("Upload an image or use Manual mode.")
            nodes, edges = _parse_edges(DEFAULT_EDGES_STR)

    c1, c2, c3, c4 = st.columns(4)
    source_node = c1.text_input("Source node (Dijkstra)", nodes[0] if nodes else "A")
    target_node = c2.text_input("Target node (Dijkstra)", nodes[-1] if nodes else "F")
    algorithm   = c3.selectbox("Highlight algorithm", ["Dijkstra", "Kruskal", "Prim"])
    explain_mode = c4.toggle("📖 Explain Mode", value=True)
    st.markdown("</div>", unsafe_allow_html=True)

    if not nodes or not edges:
        st.warning("No valid edges found. Add edges in the format `u,v,weight`.")
        return

    st.markdown(f"**Nodes:** `{nodes}` | **Edges:** `{len(edges)}`")
    st.divider()

    # ── Build data structures ─────────────────────────────────────────────────
    adj     = _build_adj(nodes, edges)
    gd      = _build_graph_dict(nodes, edges)
    kruskal_edges = [(w, u, v) for u, v, w in edges]

    with st.spinner("Running algorithms..."):
        with timer_context() as td:
            res_dijk = dijkstra(gd, source_node)
        with timer_context() as tk:
            res_krus = kruskal(nodes, kruskal_edges)
        with timer_context() as tp:
            res_prim = prim(nodes, adj)

    tab_graph, tab_results, tab_steps, tab_complexity = st.tabs(
        ["🗺️ Graph View", "📊 Results", "📖 Steps", "📚 Complexity"]
    )

    # ── Graph View ────────────────────────────────────────────────────────────
    with tab_graph:
        if algorithm == "Dijkstra":
            path = reconstruct_path(res_dijk["predecessors"], source_node, target_node)
            path_edges = [(path[i], path[i+1]) for i in range(len(path)-1)] if path else []
            fig = draw_graph(nodes, edges, highlight_edges=path_edges,
                             highlight_nodes=[source_node, target_node],
                             title=f"Dijkstra: {source_node}→{target_node}",
                             highlight_label="Shortest Path")
        elif algorithm == "Kruskal":
            mst_edges = [(u, v) for u, v, w in res_krus["mst"]]
            fig = draw_graph(nodes, edges, highlight_edges=mst_edges,
                             title="Kruskal MST", highlight_label="MST Edges")
        else:
            mst_edges = [(u, v) for u, v, w in res_prim["mst"]]
            fig = draw_graph(nodes, edges, highlight_edges=mst_edges,
                             title="Prim MST", highlight_label="MST Edges")

        st.image(fig_to_bytes(fig), use_container_width=True)

    # ── Results ───────────────────────────────────────────────────────────────
    with tab_results:
        path_dijk = reconstruct_path(res_dijk["predecessors"], source_node, target_node)
        dist_dijk = res_dijk["distances"].get(target_node, float("inf"))

        c1, c2, c3 = st.columns(3)
        c1.metric("Dijkstra Dist", f"{dist_dijk:.1f}" if dist_dijk != float("inf") else "∞")
        c1.markdown(f"Path: `{' → '.join(path_dijk)}`" if path_dijk else "No path")
        c2.metric("Kruskal MST Weight", res_krus["total_weight"])
        c2.markdown(f"Edges: {len(res_krus['mst'])}")
        c3.metric("Prim MST Weight", res_prim["total_weight"])
        c3.markdown(f"Edges: {len(res_prim['mst'])}")

        timings = {"Dijkstra": td["elapsed"], "Kruskal": tk["elapsed"], "Prim": tp["elapsed"]}
        st.plotly_chart(timing_bar_chart(timings, "⏱️ Runtime Comparison"), use_container_width=True)

        rows = [
            {"Algorithm": "Dijkstra", "Result": f"dist={dist_dijk:.1f}", "Steps": len(res_dijk["steps"]),
             "Complexity": GRAPH_ALGORITHMS["Dijkstra"]["time"]},
            {"Algorithm": "Kruskal",  "Result": f"MST={res_krus['total_weight']}", "Steps": len(res_krus["steps"]),
             "Complexity": GRAPH_ALGORITHMS["Kruskal"]["time"]},
            {"Algorithm": "Prim",     "Result": f"MST={res_prim['total_weight']}", "Steps": len(res_prim["steps"]),
             "Complexity": GRAPH_ALGORITHMS["Prim"]["time"]},
        ]
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    # ── Steps ─────────────────────────────────────────────────────────────────
    with tab_steps:
        if explain_mode:
            show_algo = st.selectbox("Steps for", ["Dijkstra", "Kruskal", "Prim"])
            steps_map = {"Dijkstra": res_dijk["steps"], "Kruskal": res_krus["steps"], "Prim": res_prim["steps"]}
            for i, s in enumerate(steps_map[show_algo][:25]):
                st.caption(f"[{i+1}] {s.get('description','')}")

    # ── Complexity ────────────────────────────────────────────────────────────
    with tab_complexity:
        ref = [{"Algorithm": k, "Time": v["time"], "Space": v["space"]} for k, v in GRAPH_ALGORITHMS.items()]
        st.dataframe(pd.DataFrame(ref), use_container_width=True, hide_index=True)
        st.markdown("""
        | Algorithm | Use Case |
        |---|---|
        | Dijkstra | Single-source shortest path (non-negative weights) |
        | Kruskal  | Minimum Spanning Tree (edge-sorted, union-find) |
        | Prim     | Minimum Spanning Tree (greedy, priority queue) |
        | Floyd-Warshall | All-pairs shortest path |
        """)
