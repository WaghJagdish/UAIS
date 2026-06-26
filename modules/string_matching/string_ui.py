"""
string_ui.py
Streamlit UI for the String Matching module.
"""

import streamlit as st
import pandas as pd
import time

from modules.string_matching.string_algorithms import (
    naive_search, kmp_search, rabin_karp_search, boyer_moore_search
)
from modules.string_matching.string_visualizer import render_string_step_html, render_match_summary
from utils.timer import measure_multiple
from utils.plotting import timing_bar_chart, operations_bar_chart
from utils.constants import STRING_ALGORITHMS
from utils.ui_components import page_header, control_panel, error_boundary, recommendation_box


ALGO_MAP = {
    "Naive":        naive_search,
    "Rabin-Karp":   rabin_karp_search,
    "KMP":          kmp_search,
    "Boyer-Moore":  boyer_moore_search,
}


@error_boundary("String Matching")
def render():
    page_header(
        "String Matching Visualizer",
        "Pattern sliding animations for Naive, KMP, Rabin-Karp, and Boyer-Moore.",
        "strings",
    )

    with control_panel("Visualization Controls"):
        col_a, col_b, col_c = st.columns([2, 1, 1])
        text    = col_a.text_input("Text", "AABAACAADAABAABA")
        pattern = col_b.text_input("Pattern", "AABA")
        algo    = col_c.selectbox("Algorithm", list(ALGO_MAP.keys()))
        explain_mode = col_c.toggle("Explain Mode", value=True)

    if not text or not pattern:
        st.warning("Please enter both text and pattern.")
        return
    if len(pattern) > len(text):
        st.error("Pattern is longer than text.")
        return

    st.markdown(f"**Text** (`{len(text)}` chars): `{text}`")
    st.markdown(f"**Pattern** (`{len(pattern)}` chars): `{pattern}`")
    st.divider()

    tab_viz, tab_compare, tab_ref = st.tabs(["Visualize", "Compare All", "Reference"])

    # ── Visualize ─────────────────────────────────────────────────────────────
    with tab_viz:
        result = ALGO_MAP[algo](text, pattern)
        steps  = result["steps"]
        total  = len(steps)

        if total == 0:
            st.info("No steps to display (pattern may be empty or not found).")
            return

        st.markdown(f"**{algo}** — {total} steps | Comparisons: `{result['comparisons']}` | "
                    f"Matches: `{len(result['matches'])}`")

        step_num = st.slider("Step", 1, total, 1, key=f"str_step_{algo}")
        step     = steps[step_num - 1]

        st.markdown(render_string_step_html(step), unsafe_allow_html=True)
        if explain_mode:
            st.info(f"**Step {step_num}:** {step['description']}")

        # KMP LPS table
        if algo == "KMP" and "lps" in result:
            st.markdown("**KMP Failure Function (LPS Table):**")
            lps_df = pd.DataFrame({"Pattern char": list(pattern), "LPS value": result["lps"]})
            st.dataframe(lps_df, use_container_width=True, hide_index=True)

        # Boyer-Moore bad character table
        if algo == "Boyer-Moore" and "bad_char" in result:
            st.markdown("**Bad Character Table (last occurrence):**")
            bc = result["bad_char"]
            bc_df = pd.DataFrame([{"Char": k, "Last index in pattern": v} for k, v in sorted(bc.items())])
            st.dataframe(bc_df, use_container_width=True, hide_index=True)

        st.markdown(render_match_summary(result["matches"], text, pattern), unsafe_allow_html=True)

        if st.button("Auto-Play", key="str_play"):
            ph, ep = st.empty(), st.empty()
            for i, s in enumerate(steps):
                ph.markdown(render_string_step_html(s), unsafe_allow_html=True)
                if explain_mode:
                    ep.info(f"Step {i+1}: {s['description']}")
                time.sleep(0.3)

    # ── Compare all ───────────────────────────────────────────────────────────
    with tab_compare:
        with control_panel("Benchmark Configuration"):
            st.markdown(
                "<p style='color:#94a3b8;font-size:0.9rem;margin:0;'>"
                "Test algorithms on a much larger custom text block. "
                "(Keep under 2000 chars to avoid memory issues from tracking all steps).</p>",
                unsafe_allow_html=True,
            )

        default_lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

        comp_text = st.text_area("Large Text for Comparison", value=default_lorem, height=150, key="comp_text")
        comp_pattern = st.text_input("Pattern to Search For", value="dolore", key="comp_pattern")

        if st.button("Run String Comparison", type="primary", key="run_str_comp"):
            if len(comp_pattern) > len(comp_text) or not comp_pattern:
                st.error("Invalid text or pattern.")
            else:
                with st.spinner("Running all algorithms on custom text..."):
                    timings = measure_multiple(ALGO_MAP, comp_text, comp_pattern)

                t_map  = {k: v["elapsed"] for k, v in timings.items()}
                op_map = {k: v["result"]["comparisons"] for k, v in timings.items()}

                st.session_state["string_bench_results"] = {
                    "timings": timings, "t_map": t_map, "op_map": op_map
                }

        if "string_bench_results" in st.session_state:
            res = st.session_state["string_bench_results"]
            timings, t_map, op_map = res["timings"], res["t_map"], res["op_map"]

            c1, c2 = st.columns(2)
            c1.plotly_chart(
                timing_bar_chart(t_map, "Execution Time"),
                use_container_width=True,
                key="str_timing_chart",
            )
            c2.plotly_chart(
                operations_bar_chart(op_map, "Comparisons"),
                use_container_width=True,
                key="str_ops_chart",
            )

            rows = []
            for name, r in timings.items():
                rows.append({
                    "Algorithm": name,
                    "Time (ms)": f"{r['elapsed']*1000:.4f}",
                    "Comparisons": r["result"]["comparisons"],
                    "Matches found": len(r["result"]["matches"]),
                })
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

            fastest = min(t_map, key=t_map.get)
            fewest  = min(op_map, key=op_map.get)
            recommendation_box(f"**Fastest:** {fastest} | **Fewest comparisons:** {fewest}")

    # ── Reference ─────────────────────────────────────────────────────────────
    with tab_ref:
        st.markdown("### Algorithm Complexities")
        ref_rows = [{"Algorithm": k, "Time": v["time"], "Space": v["space"]}
                    for k, v in STRING_ALGORITHMS.items()]
        st.dataframe(pd.DataFrame(ref_rows), use_container_width=True, hide_index=True)

        st.markdown("""
        | Algorithm | Key Idea |
        |---|---|
        | Naive | Slide pattern 1 char at a time, compare all |
        | KMP | Use failure function to skip re-comparisons |
        | Rabin-Karp | Rolling hash to find candidate windows |
        | Boyer-Moore | Skip using bad-character & good-suffix rules |
        """)
