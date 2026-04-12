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


def render():
    st.markdown("""
    <h1 style='text-align:center;background:linear-gradient(135deg,#11998e,#38ef7d);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2.4rem;'>
    🔍 Searching Algorithm Visualizer</h1>
    <p style='text-align:center;color:#95A5A6;'>
    Compare Linear Search and Binary Search with pointer animations.</p>
    """, unsafe_allow_html=True)

    with st.sidebar:
        st.markdown("### ⚙️ Controls")
        input_mode = st.radio("Array input", ["Random", "Custom"])
        if input_mode == "Random":
            n    = st.slider("Array size", 5, 25, 12)
            arr  = sorted(random.Random(42).sample(range(1, 200), n))
        else:
            raw  = st.text_input("Comma-separated integers", "10,23,34,45,56,67,78,89,90")
            try:
                arr = [int(x.strip()) for x in raw.split(",") if x.strip()]
            except ValueError:
                st.error("Invalid input.")
                return
        target  = st.number_input("🎯 Target value", value=arr[len(arr)//2] if arr else 45)
        explain_mode = st.toggle("📖 Explain Mode", value=True)

    if not arr:
        st.warning("Array is empty.")
        return

    st.markdown(f"**Array:** `{arr}` | **Target:** `{int(target)}`")
    st.divider()

    tab_linear, tab_binary, tab_compare, tab_complexity = st.tabs(
        ["🔎 Linear Search", "🔀 Binary Search", "📊 Compare", "📚 Complexity"]
    )

    # ── Linear Search ─────────────────────────────────────────────────────────
    with tab_linear:
        result = linear_search(arr, int(target))
        steps  = result["steps"]
        total  = len(steps)

        found_msg = (f"✅ Found at index **{result['found_at']}**"
                     if result["found_at"] >= 0 else "❌ Not found")
        st.markdown(f"**Linear Search** — {found_msg} | Comparisons: `{result['comparisons']}`")

        step_num = st.slider("Step", 1, max(total, 1), 1, key="ls_step")
        if steps:
            fig = build_search_figure(steps[step_num - 1], step_num, total, int(target))
            st.plotly_chart(fig, use_container_width=True)
            if explain_mode:
                st.info(f"📖 {steps[step_num-1]['description']}")

        if st.button("▶️ Auto-Play Linear", key="ls_play"):
            ph, ep = st.empty(), st.empty()
            for i, s in enumerate(steps):
                ph.plotly_chart(build_search_figure(s, i+1, total, int(target)), use_container_width=True)
                if explain_mode:
                    ep.info(f"📖 {s['description']}")
                time.sleep(0.5)

    # ── Binary Search ─────────────────────────────────────────────────────────
    with tab_binary:
        result_bs = binary_search(arr, int(target))
        steps_bs  = result_bs["steps"]
        total_bs  = len(steps_bs)

        found_msg_bs = (f"✅ Found at index **{result_bs['found_at']}** (in sorted array)"
                        if result_bs["found_at"] >= 0 else "❌ Not found")
        st.info("ℹ️ Binary Search requires a sorted array. Input has been sorted automatically.")
        st.markdown(f"**Binary Search** — {found_msg_bs} | Comparisons: `{result_bs['comparisons']}`")
        st.markdown(f"**Sorted array used:** `{result_bs['sorted_array']}`")

        step_num_bs = st.slider("Step", 1, max(total_bs, 1), 1, key="bs_step")
        if steps_bs:
            fig_bs = build_search_figure(steps_bs[step_num_bs - 1], step_num_bs, total_bs, int(target))
            st.plotly_chart(fig_bs, use_container_width=True)
            if explain_mode:
                st.info(f"📖 {steps_bs[step_num_bs - 1]['description']}")

        if st.button("▶️ Auto-Play Binary", key="bs_play"):
            ph, ep = st.empty(), st.empty()
            for i, s in enumerate(steps_bs):
                ph.plotly_chart(build_search_figure(s, i+1, total_bs, int(target)), use_container_width=True)
                if explain_mode:
                    ep.info(f"📖 {s['description']}")
                time.sleep(0.5)

    # ── Compare ───────────────────────────────────────────────────────────────
    with tab_compare:
        st.markdown("""
        <div style='background:rgba(26,31,46,0.6);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1rem;'>
            <h4 style='margin-top:0;color:#e2e8f0;'>⚙️ Benchmark Configuration</h4>
            <p style='color:#94a3b8;font-size:0.9rem;'>Configure a larger dataset strictly for search performance comparison. (Max 1000 to avoid memory overflow from step tracking)</p>
        </div>
        """, unsafe_allow_html=True)
        
        c_col1, c_col2 = st.columns(2)
        comp_n = c_col1.number_input("Array Size for Comparison", min_value=10, max_value=1000, value=500, step=10, key="comp_n_search")
        comp_seed = c_col2.number_input("Random Seed", value=42, key="comp_seed_search")

        if st.button("🚀 Run Search Comparison", type="primary", key="run_search_comp"):
            comp_arr = sorted(random.Random(int(comp_seed)).sample(range(1, comp_n * 10), int(comp_n)))
            comp_target = comp_arr[comp_n // 2] # guarantee a hit in the middle for basic testing

            def _ls(a): return linear_search(a, int(comp_target))
            def _bs(a): return binary_search(a, int(comp_target))
            
            with st.spinner(f"Running benchmarks on {comp_n} elements looking for {comp_target}..."):
                timings = measure_multiple({"Linear Search": _ls, "Binary Search": _bs}, comp_arr)
            
            t_map   = {k: v["elapsed"] for k, v in timings.items()}
            op_map  = {k: v["result"]["comparisons"] for k, v in timings.items()}

            c1, c2 = st.columns(2)
            c1.plotly_chart(timing_bar_chart(t_map, "⏱️ Execution Time"), use_container_width=True)
            c2.plotly_chart(operations_bar_chart(op_map, "🔢 Comparisons Made"), use_container_width=True)

            rows = []
            for name in ("Linear Search", "Binary Search"):
                res = timings[name]["result"]
                rows.append({
                    "Algorithm": name,
                    "Time (ms)": f"{timings[name]['elapsed']*1000:.4f}",
                    "Comparisons": res["comparisons"],
                    "Found at": res["found_at"] if res["found_at"] >= 0 else "Not found",
                })
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

            is_sorted = comp_arr == sorted(comp_arr)
            rec = get_searching_recommendation(len(comp_arr), is_sorted)
            st.success(f"🏆 **Recommendation:** {rec}")

    # ── Complexity ────────────────────────────────────────────────────────────
    with tab_complexity:
        st.markdown("### 📚 Complexity Reference")
        st.dataframe(pd.DataFrame(search_complexity_table()), use_container_width=True, hide_index=True)
        for name, meta in SEARCHING_ALGORITHMS.items():
            with st.expander(f"**{name}**"):
                st.write(meta["description"])
