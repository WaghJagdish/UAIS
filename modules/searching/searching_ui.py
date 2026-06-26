"""
searching_ui.py
Streamlit UI for the Searching module.
"""

import streamlit as st
import random
import time
import pandas as pd

from modules.searching.searching_algorithms import linear_search, binary_search
from modules.searching.searching_visualizer import build_search_figure
from utils.complexity import get_searching_recommendation, search_complexity_table
from utils.plotting import timing_bar_chart, operations_bar_chart
from utils.timer import measure_multiple
from utils.constants import SEARCHING_ALGORITHMS
from utils.ui_components import page_header, control_panel, error_boundary, recommendation_box


@error_boundary("Searching")
def render():
    page_header(
        "Searching Algorithm Visualizer",
        "Compare Linear Search and Binary Search with pointer animations.",
        "searching",
    )

    with control_panel("Visualization Controls"):
        col_a, col_b, col_c = st.columns(3)
        input_mode = col_a.radio("Array input", ["Random", "Custom"], horizontal=True)
        if input_mode == "Random":
            n    = col_b.slider("Array size", 5, 25, 12)
            arr  = sorted(random.Random(42).sample(range(1, 200), n))
        else:
            raw  = col_b.text_input("Comma-separated ints", "10,23,34,45,56")
            try:
                arr = [int(x.strip()) for x in raw.split(",") if x.strip()]
            except ValueError:
                st.error("Invalid input.")
                return

        target = col_c.number_input("Target value", value=arr[len(arr) // 2] if arr else 1)
        explain_mode = col_a.toggle("Explain Mode", value=True)

    if not arr:
        st.warning("Array is empty.")
        return

    st.markdown(f"**Array:** `{arr}` | **Target:** `{int(target)}`")
    st.divider()

    tab_linear, tab_binary, tab_compare, tab_complexity = st.tabs(
        ["Linear Search", "Binary Search", "Compare", "Complexity"]
    )

    # ── Linear Search ─────────────────────────────────────────────────────────
    with tab_linear:
        result = linear_search(arr, int(target))
        steps  = result["steps"]
        total  = len(steps)

        found_msg = (f"Found at index **{result['found_at']}**"
                     if result["found_at"] >= 0 else "Not found")
        st.markdown(f"**Linear Search** — {found_msg} | Comparisons: `{result['comparisons']}`")

        step_num = st.slider("Step", 1, max(total, 1), 1, key="ls_step")
        if steps:
            fig = build_search_figure(steps[step_num - 1], step_num, total, int(target))
            st.plotly_chart(fig, use_container_width=True, key="ls_viz_chart")
            if explain_mode:
                st.info(steps[step_num - 1]["description"])

        if st.button("Auto-Play Linear", key="ls_play"):
            ph, ep = st.empty(), st.empty()
            for i, s in enumerate(steps):
                ph.plotly_chart(
                    build_search_figure(s, i + 1, total, int(target)),
                    use_container_width=True,
                    key="ls_autoplay_chart",
                )
                if explain_mode:
                    ep.info(s["description"])
                time.sleep(0.5)

    # ── Binary Search ─────────────────────────────────────────────────────────
    with tab_binary:
        result_bs = binary_search(arr, int(target))
        steps_bs  = result_bs["steps"]
        total_bs  = len(steps_bs)

        found_msg_bs = (f"Found at index **{result_bs['found_at']}** (in sorted array)"
                        if result_bs["found_at"] >= 0 else "Not found")
        st.info("Binary Search requires a sorted array. Input has been sorted automatically.")
        st.markdown(f"**Binary Search** — {found_msg_bs} | Comparisons: `{result_bs['comparisons']}`")
        st.markdown(f"**Sorted array used:** `{result_bs['sorted_array']}`")

        step_num_bs = st.slider("Step", 1, max(total_bs, 1), 1, key="bs_step")
        if steps_bs:
            fig_bs = build_search_figure(steps_bs[step_num_bs - 1], step_num_bs, total_bs, int(target))
            st.plotly_chart(fig_bs, use_container_width=True, key="bs_viz_chart")
            if explain_mode:
                st.info(steps_bs[step_num_bs - 1]["description"])

        if st.button("Auto-Play Binary", key="bs_play"):
            ph, ep = st.empty(), st.empty()
            for i, s in enumerate(steps_bs):
                ph.plotly_chart(
                    build_search_figure(s, i + 1, total_bs, int(target)),
                    use_container_width=True,
                    key="bs_autoplay_chart",
                )
                if explain_mode:
                    ep.info(s["description"])
                time.sleep(0.5)

    # ── Compare ───────────────────────────────────────────────────────────────
    with tab_compare:
        with control_panel("Benchmark Configuration"):
            st.markdown(
                "<p style='color:#94a3b8;font-size:0.9rem;margin:0;'>"
                "Configure a larger dataset strictly for search performance comparison. "
                "(Max 1000 to avoid memory overflow from step tracking)</p>",
                unsafe_allow_html=True,
            )
            c_col1, c_col2 = st.columns(2)
            comp_n = c_col1.number_input(
                "Array Size for Comparison",
                min_value=10, max_value=1000, value=500, step=10,
                key="comp_n_search",
            )
            comp_seed = c_col2.number_input("Random Seed", value=42, key="comp_seed_search")

        if st.button("Run Search Comparison", type="primary", key="run_search_comp"):
            comp_arr = sorted(random.Random(int(comp_seed)).sample(range(1, comp_n * 10), int(comp_n)))
            comp_target = comp_arr[comp_n // 2]

            def _ls(a): return linear_search(a, int(comp_target))
            def _bs(a): return binary_search(a, int(comp_target))

            with st.spinner(f"Running benchmarks on {comp_n} elements looking for {comp_target}..."):
                timings = measure_multiple({"Linear Search": _ls, "Binary Search": _bs}, comp_arr)

            t_map  = {k: v["elapsed"] for k, v in timings.items()}
            op_map = {k: v["result"]["comparisons"] for k, v in timings.items()}

            st.session_state["search_bench_results"] = {
                "timings": timings, "t_map": t_map, "op_map": op_map, "comp_arr": comp_arr
            }

        if "search_bench_results" in st.session_state:
            res = st.session_state["search_bench_results"]
            timings, t_map, op_map, comp_arr = (
                res["timings"], res["t_map"], res["op_map"], res["comp_arr"]
            )

            c1, c2 = st.columns(2)
            c1.plotly_chart(
                timing_bar_chart(t_map, "Execution Time"),
                use_container_width=True,
                key="search_timing_chart",
            )
            c2.plotly_chart(
                operations_bar_chart(op_map, "Comparisons Made"),
                use_container_width=True,
                key="search_ops_chart",
            )

            rows = []
            for name in ("Linear Search", "Binary Search"):
                r = timings[name]["result"]
                rows.append({
                    "Algorithm": name,
                    "Time (ms)": f"{timings[name]['elapsed']*1000:.4f}",
                    "Comparisons": r["comparisons"],
                    "Found at": r["found_at"] if r["found_at"] >= 0 else "Not found",
                })
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

            is_sorted = comp_arr == sorted(comp_arr)
            rec = get_searching_recommendation(len(comp_arr), is_sorted)
            recommendation_box(rec)

    # ── Complexity ────────────────────────────────────────────────────────────
    with tab_complexity:
        st.markdown("### Complexity Reference")
        st.dataframe(pd.DataFrame(search_complexity_table()), use_container_width=True, hide_index=True)
        for name, meta in SEARCHING_ALGORITHMS.items():
            with st.expander(f"**{name}**"):
                st.write(meta["description"])
