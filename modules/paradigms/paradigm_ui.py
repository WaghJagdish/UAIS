"""
paradigm_ui.py
Streamlit UI for the Algorithm Paradigms module.
Covers: 0/1 Knapsack (Greedy/DP/B&B), Shortest Path (Dijkstra/Floyd-Warshall),
        TSP (DP/B&B).
"""

import streamlit as st
import pandas as pd
import time

from modules.paradigms.knapsack import knapsack_dp, knapsack_greedy, knapsack_branch_bound
from modules.paradigms.tsp import tsp_dp, tsp_branch_bound
from modules.paradigms.shortest_path import compare_shortest_path
from modules.paradigms.paradigm_visualizer import render_dp_table, render_bnb_tree, render_fw_matrix
from modules.graph.graph_visualizer import draw_graph, fig_to_bytes
from utils.plotting import timing_bar_chart
from utils.timer import timer_context


# ── Knapsack UI ───────────────────────────────────────────────────────────────
def _knapsack_ui():
    st.markdown("### 📦 0/1 Knapsack Problem")

    st.markdown("""
    <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
        <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Knapsack Inputs</h4>
    """, unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)
    capacity = c1.slider("Bag capacity", 5, 100, 50)
    n_items  = c2.slider("Number of items", 2, 10, 5)
    explain_mode = c3.toggle("📖 Explain Mode", value=True)

    st.markdown("**Item values & weights:**")
    cols = st.columns(min(n_items, 5))
    values, weights = [], []
    for i in range(n_items):
        with cols[i % 5]:
            v = st.number_input(f"Val {i+1}", 1, 200, [10,40,30,50,35,25,15,45,20,60][i], key=f"v{i}")
            w = st.number_input(f"Wt {i+1}", 1, 50,  [5, 4, 6, 3, 7, 8, 2, 9, 4, 6][i], key=f"w{i}")
            values.append(v)
            weights.append(w)
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown(f"**Capacity:** `{capacity}` | **Items:** {n_items}")
    col_v, col_w = st.columns(2)
    col_v.write(f"Values: `{values}`")
    col_w.write(f"Weights: `{weights}`")
    st.divider()

    # Run all three
    with st.spinner("Computing..."):
        with timer_context() as t_dp:
            res_dp  = knapsack_dp(weights, values, capacity)
        with timer_context() as t_gr:
            res_gr  = knapsack_greedy(weights, values, capacity)
        with timer_context() as t_bb:
            res_bb  = knapsack_branch_bound(weights, values, capacity)

    timings = {"DP": t_dp["elapsed"], "Greedy": t_gr["elapsed"], "Branch & Bound": t_bb["elapsed"]}
    values_found = {"DP": res_dp["max_value"], "Greedy": res_gr["max_value"], "Branch & Bound": res_bb["max_value"]}

    tab1, tab2, tab3, tab4 = st.tabs(["📊 Results", "🗂️ DP Table", "🌳 B&B Tree", "📖 Steps"])

    with tab1:
        metrics_cols = st.columns(3)
        metrics_cols[0].metric("DP (Optimal)", res_dp["max_value"], f"{t_dp['elapsed']*1000:.3f}ms")
        metrics_cols[1].metric("Greedy (Approx)", res_gr["max_value"], f"{t_gr['elapsed']*1000:.3f}ms")
        metrics_cols[2].metric("B&B (Optimal)", res_bb["max_value"], f"{t_bb['elapsed']*1000:.3f}ms")

        rows = [
            {"Method": "DP", "Max Value": res_dp["max_value"], "Selected Items": str([i+1 for i in res_dp["selected_items"]]), "Optimal?": "✅ Yes", "Time (ms)": f"{t_dp['elapsed']*1000:.4f}"},
            {"Method": "Greedy", "Max Value": res_gr["max_value"], "Selected Items": str([i+1 for i in res_gr["selected_items"]]), "Optimal?": "⚠️ Approximate", "Time (ms)": f"{t_gr['elapsed']*1000:.4f}"},
            {"Method": "B&B",   "Max Value": res_bb["max_value"], "Selected Items": str([i+1 for i in res_bb["selected_items"]]), "Optimal?": "✅ Yes", "Time (ms)": f"{t_bb['elapsed']*1000:.4f}"},
        ]
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
        st.plotly_chart(timing_bar_chart(timings, "⏱️ Time Comparison"), use_container_width=True)

        approx_gap = abs(res_dp["max_value"] - res_gr["max_value"])
        if approx_gap > 0:
            st.warning(f"⚠️ Greedy approximation gap: **{approx_gap}** units below optimal.")
        else:
            st.success("✅ Greedy found the optimal solution for this input!")

    with tab2:
        st.markdown("DP fills a `(n+1) × (W+1)` table where `dp[i][w]` = max value using first `i` items with capacity `w`.")
        st.plotly_chart(render_dp_table(res_dp["dp_table"], weights, capacity), use_container_width=True)

    with tab3:
        st.markdown("Each node explores an Include/Exclude decision for an item. Green = include, Red = exclude.")
        st.plotly_chart(render_bnb_tree(res_bb["steps"]), use_container_width=True)
        st.caption(f"Total nodes explored: **{res_bb['nodes_explored']}**")

    with tab4:
        if explain_mode:
            algo_steps = st.selectbox("Show steps for", ["DP", "Greedy", "B&B"])
            step_data  = {"DP": res_dp, "Greedy": res_gr, "B&B": res_bb}[algo_steps]
            for i, s in enumerate(step_data["steps"][:20]):
                st.text(f"[{i+1}] {s.get('description','')}")


# ── Shortest Path UI ──────────────────────────────────────────────────────────
def _shortest_path_ui():
    st.markdown("### 🧭 Shortest Path Comparison — Dijkstra vs Floyd-Warshall")

    DEFAULT_EDGES = [
        ("A","B",4),("A","C",2),("B","C",1),("B","D",5),
        ("C","D",8),("C","E",10),("D","E",2),("D","F",6),("E","F",3)
    ]
    DEFAULT_NODES = ["A","B","C","D","E","F"]

    st.markdown("""
    <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
        <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Graph Input</h4>
    """, unsafe_allow_html=True)
    c1, c2, c3 = st.columns([2, 1, 1])
    raw_edges = c1.text_area(
        "Edges (u,v,weight per line)",
        "\n".join(f"{u},{v},{w}" for u,v,w in DEFAULT_EDGES),
        height=100
    )
    source = c2.text_input("Source node", "A")
    target = c2.text_input("Target node", "F")
    explain_mode = c3.toggle("📖 Explain Mode", value=True, key="sp_exp")
    st.markdown("</div>", unsafe_allow_html=True)

    # Parse edges
    nodes, edges, graph_dict = [], [], {}
    node_set = set()
    try:
        for line in raw_edges.strip().split("\n"):
            parts = [p.strip() for p in line.split(",")]
            if len(parts) == 3:
                u, v, w = parts[0], parts[1], float(parts[2])
                edges.append((u, v, w))
                node_set.update([u, v])
        nodes = sorted(node_set)
        for u, v, w in edges:
            graph_dict.setdefault(u, {})[v] = w
            graph_dict.setdefault(v, {})[u] = w
    except Exception as e:
        st.error(f"Edge parsing error: {e}"); return

    if source not in nodes or target not in nodes:
        st.error(f"Source '{source}' or target '{target}' not in the node list."); return

    with st.spinner("Running Dijkstra and Floyd-Warshall..."):
        results = compare_shortest_path(graph_dict, nodes, edges, source, target)

    dijk = results["dijkstra"]
    fw   = results["floyd_warshall"]

    tab1, tab2, tab3 = st.tabs(["📊 Comparison", "🗺️ Graph", "📐 FW Matrix"])

    with tab1:
        c1, c2 = st.columns(2)
        c1.metric("Dijkstra Distance", f"{dijk['distance']:.1f}" if dijk['distance'] != float('inf') else "∞")
        c1.markdown(f"**Path:** `{' → '.join(dijk['path'])}`")
        c2.metric("Floyd-Warshall Distance", f"{fw['distance']:.1f}" if fw['distance'] != float('inf') else "∞")

        rows = [
            {"Algorithm": "Dijkstra", "Distance": dijk["distance"], "Path": " → ".join(dijk["path"]),
             "Complexity": "O((V+E) log V)", "Time (ms)": f"{dijk['elapsed']*1000:.4f}", "Steps": len(dijk["steps"])},
            {"Algorithm": "Floyd-Warshall", "Distance": fw["distance"], "Path": "(all pairs)",
             "Complexity": "O(V³)", "Time (ms)": f"{fw['elapsed']*1000:.4f}", "Steps": len(fw["steps"])},
        ]
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        timings_sp = {"Dijkstra": dijk["elapsed"], "Floyd-Warshall": fw["elapsed"]}
        st.plotly_chart(timing_bar_chart(timings_sp, "⏱️ Runtime Comparison"), use_container_width=True)

        if explain_mode and dijk["steps"]:
            st.markdown("**Dijkstra Steps (first 15):**")
            for s in dijk["steps"][:15]:
                st.caption(f"→ {s['description']}")

    with tab2:
        path_edges = [(dijk["path"][i], dijk["path"][i+1]) for i in range(len(dijk["path"])-1)] if dijk["path"] else []
        ec_map = {(u, v): "#E67E22" for u, v in path_edges}
        fig    = draw_graph(nodes, [(u,v,w) for u,v,w in edges], highlight_label="Shortest Path")
        # Overlay path
        fig_with_path = draw_graph(
            nodes, [(u,v,w) for u,v,w in edges],
            highlight_edges=path_edges,
            highlight_nodes=[source, target],
            edge_color_map=ec_map,
            title=f"Dijkstra: {source} → {target}  (dist={dijk['distance']:.1f})",
            highlight_label="Shortest Path",
        )
        st.image(fig_to_bytes(fig_with_path), use_container_width=True)

    with tab3:
        st.plotly_chart(render_fw_matrix(fw["dist_matrix"], fw["nodes"]), use_container_width=True)


# ── TSP UI ────────────────────────────────────────────────────────────────────
def _tsp_ui():
    st.markdown("### 🧳 Travelling Salesman Problem — DP (Held-Karp) vs Branch & Bound")

    DEFAULT_MATRIX = [
        [0,  10, 15, 20],
        [10,  0, 35, 25],
        [15, 35,  0, 30],
        [20, 25, 30,  0],
    ]
    DEFAULT_NAMES = ["A","B","C","D"]

    st.markdown("""
    <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
        <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ TSP Inputs</h4>
    """, unsafe_allow_html=True)
    c1, c2 = st.columns([1, 2])
    n_cities = c1.slider("Number of cities", 3, 7, 4)
    explain_mode = c1.toggle("📖 Explain Mode", value=True, key="tsp_exp")
    
    Cols = c2.columns(n_cities)
    city_names = [Cols[i].text_input(f"City {i+1}", DEFAULT_NAMES[i] if i < len(DEFAULT_NAMES) else f"C{i+1}", key=f"cn{i}") for i in range(n_cities)]
    
    st.markdown("**Distance matrix (row-by-row, comma-separated):**")
    raw_matrix = st.text_area(
        "Distance matrix",
        "\n".join(",".join(str(DEFAULT_MATRIX[i][j]) if i < 4 and j < 4 else "0" for j in range(n_cities)) for i in range(n_cities)),
        height=100, label_visibility="collapsed"
    )
    st.markdown("</div>", unsafe_allow_html=True)

    # Parse matrix
    try:
        dist_matrix = []
        for line in raw_matrix.strip().split("\n"):
            dist_matrix.append([float(x.strip()) for x in line.split(",")])
        if len(dist_matrix) != n_cities or any(len(r) != n_cities for r in dist_matrix):
            st.error("Distance matrix must be n×n."); return
    except Exception as e:
        st.error(f"Matrix parse error: {e}"); return

    if n_cities <= 8:
        with st.spinner("Running TSP algorithms..."):
            with timer_context() as t_dp:
                res_dp = tsp_dp(dist_matrix, city_names)
            with timer_context() as t_bb:
                res_bb = tsp_branch_bound(dist_matrix, city_names)
    else:
        st.warning("TSP for >8 cities may be slow. Showing DP only.")
        with st.spinner("Running TSP DP..."):
            with timer_context() as t_dp:
                res_dp = tsp_dp(dist_matrix, city_names)
        res_bb = None

    tab1, tab2 = st.tabs(["📊 Results", "📖 Steps"])

    with tab1:
        c1, c2 = st.columns(2)
        c1.metric("DP Min Cost", res_dp["min_cost"])
        c1.markdown(f"**Optimal tour:** `{' → '.join(str(x) for x in res_dp['path'])}`")
        if res_bb:
            c2.metric("B&B Min Cost", res_bb["min_cost"])
            c2.markdown(f"**Tour:** `{' → '.join(str(x) for x in res_bb['path'])}`")
            c2.caption(f"Nodes explored: {res_bb.get('nodes_explored',0)}")

        rows = [{"Method": "DP (Held-Karp)", "Min Cost": res_dp["min_cost"],
                 "Path": " → ".join(str(x) for x in res_dp["path"]),
                 "Time (ms)": f"{t_dp['elapsed']*1000:.4f}"}]
        if res_bb:
            rows.append({"Method": "Branch & Bound", "Min Cost": res_bb["min_cost"],
                         "Path": " → ".join(str(x) for x in res_bb["path"]),
                         "Time (ms)": f"{t_bb['elapsed']*1000:.4f}"})
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    with tab2:
        if explain_mode:
            show = st.selectbox("Steps for", ["DP", "B&B"] if res_bb else ["DP"])
            data = res_dp if show == "DP" else res_bb
            for i, s in enumerate(data["steps"][:25]):
                st.caption(f"[{i+1}] {s.get('description','')}")


# ── Main render ───────────────────────────────────────────────────────────────
def render():
    st.markdown("""
    <h1 style='text-align:center;background:linear-gradient(135deg,#4facfe,#00f2fe);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2.4rem;'>
    🧩 Algorithm Paradigms</h1>
    <p style='text-align:center;color:#95A5A6;'>
    Compare Greedy / DP / Branch & Bound on classic problems.</p>
    """, unsafe_allow_html=True)

    problem = st.selectbox(
        "Select Problem",
        ["📦 0/1 Knapsack", "🧭 Shortest Path", "🧳 TSP"],
        label_visibility="collapsed",
    )
    st.divider()

    if problem == "📦 0/1 Knapsack":
        _knapsack_ui()
    elif problem == "🧭 Shortest Path":
        _shortest_path_ui()
    elif problem == "🧳 TSP":
        _tsp_ui()
