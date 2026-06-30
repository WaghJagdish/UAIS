# 🧠 Unified Algorithm Intelligence System (UAIS)

> A modular, high-fidelity single-page web application for visualizing, benchmarking, and explaining core algorithms from **Design and Analysis of Algorithms (DAA)**.

---

## 🚀 Getting Started

### Local Development Preview
You can run a local preview web server using the Python runner script:
```bash
python3 run.py
```
This starts a lightweight HTTP server serving the static files and automatically opens your browser at **http://localhost:8501**.

### Live Hosting
The project is hosted completely for free on **GitHub Pages**:
👉 **[https://WaghJagdish.github.io/UAIS/](https://WaghJagdish.github.io/UAIS/)**

---

## 📁 Architecture & Directory Layout

The application is structured as a modern client-side Single Page Application (SPA):

```
project_root/
├── run.py                 # Lightweight HTTP server wrapper for local preview
├── index.html             # Main dashboard shell, includes navigation & layouts
├── router.js              # Client-side router & dynamic template loading
├── style.css              # Custom neon HSL cyber-theme utility styling
├── assets/                # Icon sets and static logo assets
├── home/                  # Home page template fragments
└── modules/               # Algorithmic visualizer modules
    ├── home.html          # Dynamic landing view
    ├── sorting.html       # Sorting dashboard controls & layout
    ├── sorting.js         # Sorting step-by-step algorithms
    ├── searching.html     # Searching dashboard controls & layout
    ├── searching.js       # Searching step-by-step algorithms
    ├── paradigms.html     # Knapsack & TSP configurations
    ├── paradigms.js       # Dynamic programming & branch-and-bound logic
    ├── strings.html       # String matching controls & layout
    ├── strings.js         # Pattern sliding algorithms (KMP, BM, RK)
    ├── graph.html         # Graph structures UI
    ├── graph.js           # Dijkstra, Kruskal, and Prim implementations
    ├── streaming.html     # Stream processing visual layouts
    └── streaming.js       # Frequency counting & reservoir sampling
```

---

## 🧩 Visualizer Domains

### 🔀 Sorting
- **Algorithms:** Selection Sort · Insertion Sort · Merge Sort · Quick Sort
- **Features:** Step-by-step progress tracking, auto-play with adjustable speed, live comparisons count, complexity reference tables, and smart algorithm recommendations.

### 🔍 Searching
- **Algorithms:** Linear Search · Binary Search
- **Features:** Element comparison highlighting, pointer index animations, target overlays, and comparisons counts.

### 🧩 Paradigms
- **0/1 Knapsack:** Greedy approximation, DP, and Branch & Bound optimal algorithms with visual DP matrices.
- **TSP:** Held-Karp DP and Branch & Bound tour comparisons with step-by-step traceback.

### 📝 String Matching
- **Algorithms:** Naive Search · Rabin-Karp (RK) · Knuth-Morris-Pratt (KMP) · Boyer-Moore (BM)
- **Features:** Visual pattern sliding cells, KMP LPS lookup matrices, Boyer-Moore bad-character tables, and stable iteration-based performance benchmarking.

### 🕸️ Graph Theory
- **Algorithms:** Dijkstra's Shortest Path · Kruskal's MST · Prim's MST
- **Features:** Interactive SVG graph rendering, manual edge weight inputs, and path/MST highlight states.

### 📡 Streaming
- **Algorithms:** Exact Frequency Count · Reservoir Sampling · Count-Min Sketch (CMS)
- **Features:** CMS internal hash values matrix, reservoir buffer overlays, and frequency bar charts.

---

## 🎨 Color Coding Conventions

| Color Highlight | Meaning |
|:---|:---|
| 🔴 **Cyber Pink** | Elements currently mismatching or in comparison states |
| 🟡 **Cyber Purple** | Current active pointer or pivot element |
| 🟢 **Cyber Cyan** | Completed matches, found indexes, or sorted states |

---

## ⚙️ Technology Stack

- **Core Web**: HTML5 (Semantic elements) and ES Modules JavaScript (Vanilla ES6+).
- **Styling**: Vanilla CSS3 custom variables & responsive styling, utility classes via TailwindCSS (loaded on demand).
- **HUD Interface**: Orbitron & JetBrains Mono typography, custom cyber-hacker neon effects.
- **Hosting**: GitHub Pages (free static web deployment).

---
*Built for DAA Mini-Project*
