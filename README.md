# 🧠 Unified Algorithm Intelligence System (UAIS)

> A modular, production-level Streamlit application for visualizing, comparing,  
> and explaining algorithms from **Design and Analysis of Algorithms (DAA)**.

---

## 🚀 Quick Start

```bash
# Run the app
python3 app.py
```

App opens at **http://localhost:8501**

---

## 📁 Project Structure

```
project_root/
├── app.py                          # Main navigation (multi-page dashboard)
├── modules/
│   ├── sorting/
│   │   ├── sorting_algorithms.py   # Selection, Insertion, Merge, Quick Sort
│   │   ├── sorting_visualizer.py   # Plotly bar chart per step
│   │   └── sorting_ui.py           # Full Streamlit UI
│   ├── searching/
│   │   ├── searching_algorithms.py # Linear Search, Binary Search
│   │   ├── searching_visualizer.py # Pointer animation
│   │   └── searching_ui.py
│   ├── paradigms/
│   │   ├── knapsack.py             # Greedy, DP, Branch & Bound
│   │   ├── tsp.py                  # Held-Karp DP, B&B
│   │   ├── shortest_path.py        # Dijkstra + Floyd-Warshall wrapper
│   │   ├── paradigm_visualizer.py  # DP heatmap, B&B scatter, FW matrix
│   │   └── paradigm_ui.py
│   ├── string_matching/
│   │   ├── string_algorithms.py    # Naive, KMP, Rabin-Karp, Boyer-Moore
│   │   ├── string_visualizer.py    # HTML pattern-sliding renderer
│   │   └── string_ui.py
│   ├── graph/
│   │   ├── graph_algorithms.py     # Dijkstra, Floyd-Warshall, Kruskal, Prim
│   │   ├── graph_visualizer.py     # NetworkX + Matplotlib renderer
│   │   ├── graph_image_parser.py   # OCR stub / manual fallback
│   │   └── graph_ui.py
│   └── streaming/
│       ├── streaming_algorithms.py # Exact count, Reservoir, Count-Min Sketch
│       ├── streaming_visualizer.py # Comparison bar, reservoir, heatmap
│       └── streaming_ui.py
├── utils/
│   ├── timer.py                    # Execution time measurement
│   ├── complexity.py               # Complexity metadata + recommendations
│   ├── plotting.py                 # Shared Plotly chart helpers
│   └── constants.py                # Colors, algorithm metadata registry
├── assets/
│   ├── sample_images/
│   └── datasets/
└── README.md
```

---

## 🧩 Modules

### 🔀 Sorting
- **Algorithms:** Selection · Insertion · Merge · Quick Sort  
- **Features:** Step-by-step bar visualization · Auto-play · Comparison charts · Complexity table · Best-algorithm recommendation

### 🔍 Searching
- **Algorithms:** Linear Search · Binary Search  
- **Features:** Pointer animation · Target line overlay · Sorted/unsorted handling · Comparison count

### 🧩 Paradigms
- **0/1 Knapsack:** Greedy (approx) · DP (optimal) · Branch & Bound (optimal)  
  - DP table heatmap · B&B exploration scatter · Optimality gap displayed
- **Shortest Path:** Dijkstra · Floyd-Warshall  
  - Graph rendering with highlighted path · All-pairs distance matrix heatmap
- **TSP:** Held-Karp DP · Branch & Bound  
  - Tour cost comparison · Step-by-step trace

### 📝 String Matching
- **Algorithms:** Naive · Rabin-Karp · KMP · Boyer-Moore  
- **Features:** Pattern sliding HTML animation · KMP LPS table · Boyer-Moore bad-char table · Match position summary

### 🕸️ Graph Algorithms
- **Algorithms:** Dijkstra · Kruskal · Prim  
- **Input:** Manual edge list OR image upload (OCR via pytesseract)  
- **Features:** NetworkX graph rendering · MST/path highlighting · Step explorer

### 📡 Streaming
- **Algorithms:** Exact frequency count · Reservoir Sampling · Count-Min Sketch  
- **Features:** Frequency bar comparison · Reservoir overlay chart · CMS internal table heatmap

---

## 🎨 Color Convention

| Color | Meaning |
|-------|---------|
| 🔴 Red | Elements being compared |
| 🟡 Yellow | Currently active / considered |
| 🟢 Green | Sorted / found / selected |
| 🟣 Purple | Pivot element |
| 🔵 Blue | Default / unsorted |

---

## ⚙️ Tech Stack

| Component | Library |
|-----------|---------|
| UI Framework | Streamlit 1.x |
| Interactive charts | Plotly |
| Graph rendering | NetworkX + Matplotlib |
| Numerical | NumPy / Pandas |
| OCR (optional) | pytesseract |

---

## 📋 Requirements

```
streamlit>=1.20
plotly>=5.0
networkx>=3.0
matplotlib>=3.5
numpy>=1.23
pandas>=1.5
```

---

*Built for DAA Mini-Project · Python 3.10+*
