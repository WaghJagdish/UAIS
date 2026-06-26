"""
streaming_ui.py
Streamlit UI for the Streaming Algorithms module.
"""

import streamlit as st
import pandas as pd
import random
import time

from modules.streaming.streaming_algorithms import (
    exact_frequency, reservoir_sample, count_min_sketch_stream
)
from modules.streaming.streaming_visualizer import frequency_bar, reservoir_chart, sketch_heatmap
from utils.constants import STREAMING_ALGORITHMS
from utils.ui_components import page_header, control_panel, error_boundary, recommendation_box


_SAMPLE_STREAMS = {
    "Letters A-E": list("ABCDEABCABDAEA" * 3),
    "Numbers 1-5": [random.Random(99).randint(1, 5) for _ in range(40)],
    "Words": "apple banana apple cherry banana apple cherry apple banana cherry apple".split() * 2,
}


@error_boundary("Streaming")
def render():
    page_header(
        "Streaming Algorithm Visualizer",
        "Exact vs Approximate frequency estimation in data streams.",
        "streaming"
    )

    with control_panel("Visualization Controls"):
        col_a, col_b, col_c = st.columns(3)
        stream_preset = col_a.selectbox("Sample stream", list(_SAMPLE_STREAMS.keys()))
        stream = _SAMPLE_STREAMS[stream_preset]
        col_a.markdown(f"**Stream length:** {len(stream)}")

        sample_k = col_b.slider("Reservoir size (k)", 2, min(20, len(stream)), 5)
        cms_width = col_c.slider("CMS width (w)", 5, 50, 20)
        cms_depth = col_c.slider("CMS depth (d)", 2, 6, 3)
        explain_mode = col_b.toggle("Explain Mode", value=True)

    st.markdown(f"**Stream preview:** `{stream[:20]}{'...' if len(stream)>20 else ''}`")
    st.divider()

    tab_exact, tab_reservoir, tab_cms, tab_compare, tab_ref = st.tabs(
        ["Exact Count", "Reservoir Sample", "Count-Min Sketch", "Compare", "Reference"]
    )

    # ── Exact ─────────────────────────────────────────────────────────────────
    with tab_exact:
        st.markdown("**Exact Frequency Count** — O(n) time, O(n) space")
        res_exact = exact_frequency(stream)
        freq_df = pd.DataFrame([
            {"Item": k, "Count": v, "Fraction": f"{v/len(stream):.2%}"}
            for k, v in sorted(res_exact["frequencies"].items(), key=lambda x: -x[1])
        ])
        st.dataframe(freq_df, use_container_width=True, hide_index=True)

        if explain_mode:
            n_show = st.slider("Show stream progress up to position", 1, len(stream), len(stream)//2, key="ex_pos")
            so_far = {k: v for s in res_exact["steps"][:n_show]
                      for k, v in s.get("freq", {}).items()}
            partial = exact_frequency(stream[:n_show])
            st.caption(f"After {n_show} items: {partial['frequencies']}")

    # ── Reservoir ─────────────────────────────────────────────────────────────
    with tab_reservoir:
        st.markdown(f"**Reservoir Sampling** — uniform sample of size k={sample_k} from stream.")
        res_rsv = reservoir_sample(stream, sample_k)
        st.success(f"Sample ({sample_k} items): `{res_rsv['sample']}`")
        st.plotly_chart(reservoir_chart(stream, res_rsv["sample"]), use_container_width=True, key="stream_reservoir_chart")

        if explain_mode:
            st.markdown("**Steps (first 15):**")
            for s in res_rsv["steps"][:15]:
                icon = "✅" if s["action"] == "fill" else ("🔄" if s["action"] == "replace" else "⏭️")
                st.caption(f"{icon} Pos {s['position']}: {s['description']}")

    # ── Count-Min Sketch ──────────────────────────────────────────────────────
    with tab_cms:
        st.markdown(f"**Count-Min Sketch** — w={cms_width}, d={cms_depth}")
        res_cms = count_min_sketch_stream(stream, cms_width, cms_depth)
        st.plotly_chart(sketch_heatmap(res_cms["sketch_table"]), use_container_width=True, key="stream_cms_heatmap")

        exact = res_exact["frequencies"]
        approx = res_cms["approx_frequencies"]
        error_rows = []
        for k in sorted(exact.keys()):
            ex = exact.get(k, 0)
            ap = approx.get(str(k) if str(k) in approx else k, 0)
            error_rows.append({"Item": str(k), "Exact": ex, "CMS Approx": ap,
                                "Error": abs(ap - ex), "Error %": f"{abs(ap-ex)/max(ex,1)*100:.1f}%"})
        st.dataframe(pd.DataFrame(error_rows), use_container_width=True, hide_index=True)

    # ── Compare ───────────────────────────────────────────────────────────────
    with tab_compare:
        with control_panel("Benchmark Configuration"):
            st.markdown(
                "<p style='color:#94a3b8;font-size:0.9rem;margin:0;'>"
                "Configure a massive stream size to test Count-Min Sketch approximation against exact counting. (Max 50,000 items)</p>",
                unsafe_allow_html=True
            )
            
            c_col1, c_col2 = st.columns(2)
            comp_stream_n = c_col1.number_input("Large Stream Size", min_value=100, max_value=50000, value=10000, step=1000, key="comp_stream_n")
            comp_vocab = c_col2.number_input("Vocabulary Size (Unique items)", min_value=10, max_value=10000, value=500, step=10, key="comp_vocab")
            
        if st.button("Run Scale Comparison", type="primary", key="run_stream_comp"):
            # Generate stream with skewed distribution (Zipfian-like) to test CMS better
            with st.spinner("Generating stream and running benchmarks..."):
                rng = random.Random(42)
                # Create skewed distribution
                skewed_vocab = []
                for i in range(1, int(comp_vocab) + 1):
                    skewed_vocab.extend([f"Item_{i}"] * max(1, int(100 / i)))
                
                comp_stream = [rng.choice(skewed_vocab) for _ in range(int(comp_stream_n))]
                
                start_exact = time.perf_counter()
                bench_exact = exact_frequency(comp_stream)
                time_exact = time.perf_counter() - start_exact

                start_cms = time.perf_counter()
                bench_cms = count_min_sketch_stream(comp_stream, width=50, depth=5)
                time_cms = time.perf_counter() - start_cms

            st.session_state["stream_bench_results"] = {
                "exact_f": bench_exact["frequencies"],
                "approx_f": bench_cms["approx_frequencies"],
                "time_exact": time_exact,
                "time_cms": time_cms
            }

        if "stream_bench_results" in st.session_state:
            res = st.session_state["stream_bench_results"]
            exact_f, approx_f = res["exact_f"], res["approx_f"]
            time_exact, time_cms = res["time_exact"], res["time_cms"]
            
            # Align keys
            all_keys = set(str(k) for k in exact_f) | set(str(k) for k in approx_f)
            exact_aligned  = {str(k): exact_f.get(k, exact_f.get(str(k), 0)) for k in all_keys}
            approx_aligned = {str(k): approx_f.get(k, 0) for k in all_keys}

            st.plotly_chart(frequency_bar(exact_aligned, approx_aligned,
                                          "Exact Count vs Count-Min Sketch (Top Items)"), use_container_width=True, key="stream_compare_chart")

            c1, c2 = st.columns(2)
            c1.metric("Exact Count Time", f"{time_exact*1000:.2f} ms")
            c2.metric("CMS Time", f"{time_cms*1000:.2f} ms")

            st.markdown("""
            | Property | Exact Count | Reservoir Sample | Count-Min Sketch |
            |---|---|---|---|
            | Space | O(n) | O(k) | O(w×d) |
            | Error | 0% | N/A (random sample) | ε over |
            | Accuracy | 100% | Proportional | Probabilistic |
            """)
            recommendation_box("**Use Case Guide:** Exact count when memory is unlimited; CMS for massive streams; Reservoir for random sampling without repetition.")

    # ── Reference ─────────────────────────────────────────────────────────────
    with tab_ref:
        ref = [{"Algorithm": k, "Type": v["type"], "Space": v["space"]}
               for k, v in STREAMING_ALGORITHMS.items()]
        st.dataframe(pd.DataFrame(ref), use_container_width=True, hide_index=True)
        st.markdown("""
        **Count-Min Sketch** guarantees: Estimated count ≤ True count + ε·N  
        with probability 1 − δ, where ε = e/w and δ = e^(−d).
        """)
