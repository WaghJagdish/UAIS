"""
sorting_ui.py
Streamlit UI for the Sorting module.
"""

import streamlit as st
import random
import time
import pandas as pd

from modules.sorting.sorting_algorithms import selection_sort, insertion_sort, merge_sort, quick_sort
from modules.sorting.sorting_visualizer import build_sort_figure, build_legend
from utils.timer import measure_multiple
from utils.complexity import get_sorting_recommendation, sort_complexity_table
from utils.plotting import timing_bar_chart, operations_bar_chart
from utils.constants import SORTING_ALGORITHMS


ALGO_MAP = {
    "Selection Sort": selection_sort,
    "Insertion Sort": insertion_sort,
    "Merge Sort":     merge_sort,
    "Quick Sort":     quick_sort,
}


def render():
    st.markdown("""
    <h1 style='text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2.4rem;'>
    🔀 Sorting Algorithm Visualizer</h1>
    <p style='text-align:center;color:#95A5A6;'>
    Compare Selection, Insertion, Merge, and Quick Sort side-by-side.</p>
    """, unsafe_allow_html=True)

    # ── Top-level controls ────────────────────────────────────────────────────
    st.markdown("""
    <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
        <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Visualization Controls</h4>
    """, unsafe_allow_html=True)
    
    col_a, col_b, col_c = st.columns(3)
    algo_choice = col_a.selectbox("Algorithm to visualize", list(ALGO_MAP.keys()))
    input_mode  = col_b.radio("Input mode", ["Random", "Custom"], horizontal=True)
    
    if input_mode == "Random":
        n = col_c.slider("Array size", 5, 30, 12)
        seed = col_b.number_input("Random seed", value=42)
        arr  = random.Random(int(seed)).sample(range(1, 101), n)
    else:
        raw = col_c.text_input("Enter comma-separated ints", "38,27,43,3,9")
        try:
            arr = [int(x.strip()) for x in raw.split(",") if x.strip()]
        except ValueError:
            st.error("Invalid input. Use integers separated by commas.")
            return

    explain_mode = col_a.toggle("📖 Explain Mode", value=True)
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown(build_legend(), unsafe_allow_html=True)

    if not arr:
        st.warning("Please provide a valid array.")
        return

    st.markdown(f"**Input array** ({len(arr)} elements): `{arr}`")
    st.divider()

    # ── Tabs ──────────────────────────────────────────────────────────────────
    tab_viz, tab_compare, tab_complexity = st.tabs(["🎬 Visualize", "📊 Compare All", "📚 Complexity"])

    # ── TAB 1: Step-by-step visualizer ───────────────────────────────────────
    with tab_viz:
        result = ALGO_MAP[algo_choice](arr)
        steps  = result["steps"]
        total  = len(steps)

        st.markdown(f"**{algo_choice}** — {total} steps | "
                    f"Comparisons: `{result['comparisons']}` | "
                    f"Swaps: `{result.get('swaps', 0)}`")

        col1, col2, col3 = st.columns([1, 2, 1])
        step_num = col2.slider("Step", 1, total, 1, key=f"step_{algo_choice}")

        step = steps[step_num - 1]
        fig  = build_sort_figure(step, step_num, total)
        st.plotly_chart(fig, use_container_width=True)

        if explain_mode:
            st.info(f"📖 **Step {step_num}:** {step['description']}")

        # Auto-play button
        if st.button("▶️  Auto-Play (0.4s/step)", key="sort_autoplay"):
            placeholder = st.empty()
            expl_ph     = st.empty()
            for s_idx in range(total):
                s   = steps[s_idx]
                fig = build_sort_figure(s, s_idx + 1, total)
                placeholder.plotly_chart(fig, use_container_width=True)
                if explain_mode:
                    expl_ph.info(f"📖 **Step {s_idx+1}:** {s['description']}")
                time.sleep(0.4)

    # ── TAB 2: Comparison ────────────────────────────────────────────────────
    with tab_compare:
        st.markdown("""
        <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
            <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Benchmark Configuration</h4>
            <p style='color:#94a3b8;font-size:0.9rem;'>Configure a larger dataset strictly for performance comparison. (Max 500 to avoid memory overflow from step tracking)</p>
        </div>
        """, unsafe_allow_html=True)
        
        c_col1, c_col2 = st.columns(2)
        comp_n = c_col1.number_input("Array Size for Comparison", min_value=10, max_value=500, value=200, step=10)
        comp_seed = c_col2.number_input("Random Seed", value=42, key="comp_seed_sort")
        
        if st.button("🚀 Run Performance Comparison", type="primary", key="run_sort_comp"):
            comp_arr = random.Random(int(comp_seed)).sample(range(1, comp_n * 10), int(comp_n))
            with st.spinner(f"Running benchmarks on {comp_n} elements..."):
                timings = measure_multiple(ALGO_MAP, comp_arr)

            t_map  = {k: v["elapsed"] for k, v in timings.items()}
            op_map = {k: v["result"]["comparisons"] for k, v in timings.items()}
            
            st.session_state["sort_bench_results"] = {
                "timings": timings,
                "t_map": t_map,
                "op_map": op_map,
                "comp_arr": comp_arr
            }

        if "sort_bench_results" in st.session_state:
            res = st.session_state["sort_bench_results"]
            t_map, op_map, timings, comp_arr = res["t_map"], res["op_map"], res["timings"], res["comp_arr"]

            c1, c2 = st.columns(2)
            c1.plotly_chart(timing_bar_chart(t_map, "⏱️ Execution Time"), use_container_width=True)
            c2.plotly_chart(operations_bar_chart(op_map, "📈 Comparisons Made"), use_container_width=True)

            # Results table
            rows = []
            for name, r in timings.items():
                rows.append({
                    "Algorithm": name,
                    "Time (ms)": f"{r['elapsed']*1000:.4f}",
                    "Comparisons": r["result"]["comparisons"],
                    "Swaps": r["result"].get("swaps", 0),
                })
            df = pd.DataFrame(rows)
            st.dataframe(df, use_container_width=True, hide_index=True)

            rec = get_sorting_recommendation(len(comp_arr), t_map)
            st.success(f"🏆 **Recommendation:** {rec}")

    # ── TAB 3: Complexity table ───────────────────────────────────────────────
    with tab_complexity:
        st.markdown("### 📚 Time & Space Complexity Reference")
        comp_df = pd.DataFrame(sort_complexity_table())
        st.dataframe(comp_df, use_container_width=True, hide_index=True)

        st.markdown("### 📝 Algorithm Descriptions")
        for name, meta in SORTING_ALGORITHMS.items():
            with st.expander(f"**{name}**"):
                st.write(meta["description"])
                cols = st.columns(4)
                cols[0].metric("Best", meta["time_best"])
                cols[1].metric("Average", meta["time_avg"])
                cols[2].metric("Worst", meta["time_worst"])
                cols[3].metric("Space", meta["space"])
