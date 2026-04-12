"""
app.py
Unified Algorithm Intelligence System (UAIS)
Main Streamlit application — multi-page sidebar navigation.
"""

import streamlit as st

# Page configuration
st.set_page_config(
    page_title="UAIS — Unified Algorithm Intelligence System",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Global CSS injection ───────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif !important;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Outfit', sans-serif !important;
}

/* Glassmorphic Sidebar */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, rgba(15,12,41,0.95), rgba(48,43,99,0.95), rgba(36,36,62,0.95)) !important;
    backdrop-filter: blur(10px) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.main .block-container {
    background: #0B0E14;
    padding-top: 1.5rem;
}

/* Glassmorphic Metrics */
.stMetric {
    background: rgba(26, 31, 46, 0.6) !important;
    backdrop-filter: blur(12px) !important;
    border-radius: 12px !important;
    padding: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stMetric:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
}

/* Premium Buttons */
button[kind="primary"], .stButton > button {
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%) !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    font-family: 'Outfit', sans-serif !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px !important;
    transition: all 0.3s ease !important;
}
button[kind="primary"]:hover, .stButton > button:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.5) !important;
}

/* Glassmorphic Tabs */
.stTabs [data-baseweb="tab-list"] {
    background: rgba(26, 31, 46, 0.6) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 12px !important;
    padding: 6px !important;
    gap: 8px !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
}
.stTabs [data-baseweb="tab"] {
    border-radius: 8px !important;
    color: #94a3b8 !important;
    font-weight: 500 !important;
    font-family: 'Outfit', sans-serif !important;
    transition: all 0.2s ease !important;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15)) !important;
    color: #e2e8f0 !important;
    border: 1px solid rgba(168, 85, 247, 0.3) !important;
    box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.1) !important;
}

/* Inputs */
.stTextInput>div>div>input, .stSelectbox>div>div>div, .stNumberInput>div>div>input {
    background-color: rgba(26, 31, 46, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border-radius: 8px !important;
}
.stTextInput>div>div>input:focus, .stSelectbox>div>div>div:focus, .stNumberInput>div>div>input:focus {
    border-color: #a855f7 !important;
    box-shadow: 0 0 0 1px #a855f7 !important;
}

/* Alerts and Dataframes */
.stAlert {
    background: rgba(26, 31, 46, 0.6) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 12px !important;
    border-left: 4px solid #a855f7 !important;
}

.stDataFrame {
    border-radius: 12px !important;
    overflow: hidden !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
}

hr {
    border-color: rgba(255,255,255,0.1) !important;
    margin: 1.5rem 0 !important;
}
</style>
""", unsafe_allow_html=True)


# ── Home page ─────────────────────────────────────────────────────────────────
def _home():
    st.markdown("""
    <div style='text-align:center;padding:2rem 0 1rem;'>
        <div style='font-size:3.5rem;'>🧠</div>
        <h1 style='background:linear-gradient(135deg,#667eea 0%,#764ba2 40%,#f093fb 100%);
                   -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                   font-size:2.8rem;font-weight:800;letter-spacing:-1px;margin:0;'>
            Unified Algorithm Intelligence System
        </h1>
        <p style='color:#95A5A6;font-size:1.1rem;margin:0.6rem 0 2rem;'>
            Interactive visualization &amp; comparison of DAA algorithms
        </p>
    </div>
    """, unsafe_allow_html=True)

    cards = [
        ("🔀", "Sorting", "Selection · Insertion · Merge · Quick Sort",
         "Step-by-step bar animations, timing comparison, best-algorithm recommendation", "#667eea"),
        ("🔍", "Searching", "Linear · Binary Search",
         "Pointer visualization, sorted/unsorted comparison, comparison count", "#11998e"),
        ("🧩", "Paradigms", "Knapsack · Shortest Path · TSP",
         "Greedy vs DP vs Branch & Bound with DP table and decision tree", "#4facfe"),
        ("📝", "String Matching", "Naive · KMP · Rabin-Karp · Boyer-Moore",
         "Pattern sliding animation, LPS table, bad-character heuristic display", "#f093fb"),
        ("🕸️", "Graph Algorithms", "Dijkstra · Kruskal · Prim",
         "NetworkX graph with highlighted MST/path edges, image upload support", "#a18cd1"),
        ("📡", "Streaming", "Exact Count · Reservoir · Count-Min Sketch",
         "Real-time frequency chart, exact vs approximate comparison", "#fddb92"),
    ]

    cols = st.columns(3)
    for i, (icon, title, algos, desc, color) in enumerate(cards):
        with cols[i % 3]:
            st.markdown(f"""
            <div style='background:#1A1F2E;border-radius:14px;padding:20px;margin-bottom:16px;
                        border:1px solid #2C3E50;border-top:3px solid {color};'>
                <div style='font-size:2rem;margin-bottom:8px;'>{icon}</div>
                <div style='font-weight:700;font-size:1.1rem;color:#ECF0F1;margin-bottom:4px;'>{title}</div>
                <div style='font-size:0.82rem;color:{color};margin-bottom:8px;font-weight:500;'>{algos}</div>
                <div style='font-size:0.8rem;color:#7F8C8D;'>{desc}</div>
            </div>
            """, unsafe_allow_html=True)

    st.divider()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("📦 Modules", "6")
    col2.metric("⚙️ Algorithms", "18+")
    col3.metric("🎨 Visualizations", "Plotly + NetworkX")
    col4.metric("🌐 Framework", "Streamlit")

    st.markdown("""
    <div style='background:linear-gradient(135deg,#1A1F2E,#0d1117);border-radius:14px;
                padding:20px;border:1px solid #2C3E50;margin-top:1rem;'>
        <h3 style='color:#ECF0F1;margin:0 0 12px;'>⚡ Key Features</h3>
        <ul style='color:#95A5A6;margin:0;padding-left:20px;line-height:2;'>
            <li>🎬 <b>Step-by-step visualizations</b> with auto-play and configurable speed</li>
            <li>📖 <b>Explain Mode</b> — natural language description of every algorithm step</li>
            <li>📊 <b>Side-by-side comparison</b> of execution time, space, and operations</li>
            <li>🏆 <b>Dynamic recommendations</b> — best algorithm for your specific input</li>
            <li>🎨 <b>Color-coded animations</b> — 🔴 Compare · 🟡 Active · 🟢 Sorted/Found</li>
            <li>📐 <b>Complexity tables</b> — best / average / worst case + space</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style='text-align:center;padding:1.5rem;color:#566573;font-size:0.85rem;'>
        👈 Use the sidebar to navigate between algorithm modules.
    </div>
    """, unsafe_allow_html=True)


# ── Sidebar navigation ─────────────────────────────────────────────────────────
PAGES = {
    "🏠 Home":              "home",
    "🔀 Sorting":           "sorting",
    "🔍 Searching":         "searching",
    "🧩 Paradigms":         "paradigms",
    "📝 String Matching":   "strings",
    "🕸️ Graph Algorithms":  "graph",
    "📡 Streaming":         "streaming",
}

with st.sidebar:
    st.markdown("""
    <div style='text-align:center;padding:12px 0 20px;'>
        <div style='font-size:2.2rem;'>🧠</div>
        <div style='font-weight:700;font-size:1.1rem;color:#ECF0F1;letter-spacing:0.5px;'>UAIS</div>
        <div style='font-size:0.7rem;color:#7F8C8D;'>Unified Algorithm Intelligence System</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    selected = st.radio(
        "Navigate",
        list(PAGES.keys()),
        label_visibility="collapsed",
    )
    page_key = PAGES[selected]

    st.markdown("---")
    st.markdown("""
    <div style='font-size:0.72rem;color:#566573;text-align:center;padding-top:8px;'>
        DAA Mini-Project &middot; Python + Streamlit<br>
        Algorithms &middot; Visualization &middot; Analysis
    </div>
    """, unsafe_allow_html=True)

# ── Page routing ───────────────────────────────────────────────────────────────
if page_key == "home":
    _home()
elif page_key == "sorting":
    from modules.sorting.sorting_ui import render
    render()
elif page_key == "searching":
    from modules.searching.searching_ui import render
    render()
elif page_key == "paradigms":
    from modules.paradigms.paradigm_ui import render
    render()
elif page_key == "strings":
    from modules.string_matching.string_ui import render
    render()
elif page_key == "graph":
    from modules.graph.graph_ui import render
    render()
elif page_key == "streaming":
    from modules.streaming.streaming_ui import render
    render()
