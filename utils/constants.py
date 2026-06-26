"""
constants.py
Global constants for the UAIS application.
"""

# ── Colour palette ────────────────────────────────────────────────────────────
COLOR_DEFAULT   = "#31394d"   # default bar / node (slate gray)
COLOR_COMPARE   = "#89ceff"   # sky blue – elements being compared
COLOR_ACTIVE    = "#c3c0ff"   # lavender – currently considered
COLOR_SORTED    = "#4edea3"   # neon green – finalized / selected
COLOR_PIVOT     = "#bc13fe"   # cyber purple – pivot element
COLOR_FOUND     = "#05ffa1"   # neon cyan – element found
COLOR_PATH      = "#05ffa1"   # neon cyan – shortest path edge
COLOR_MST       = "#4edea3"   # neon green – MST edge
COLOR_BG        = "#0b1326"   # deep-space dark navy background
COLOR_CARD      = "#171f33"   # surface-container dark navy
COLOR_TEXT      = "#dbe2fd"   # on-surface light lavender

# ── Algorithm metadata registry ───────────────────────────────────────────────
SORTING_ALGORITHMS = {
    "Selection Sort": {
        "time_best": "O(n²)", "time_avg": "O(n²)", "time_worst": "O(n²)",
        "space": "O(1)", "stable": False,
        "description": "Finds the minimum element repeatedly and places it at the beginning.",
    },
    "Insertion Sort": {
        "time_best": "O(n)", "time_avg": "O(n²)", "time_worst": "O(n²)",
        "space": "O(1)", "stable": True,
        "description": "Builds the sorted array one element at a time by insertion.",
    },
    "Merge Sort": {
        "time_best": "O(n log n)", "time_avg": "O(n log n)", "time_worst": "O(n log n)",
        "space": "O(n)", "stable": True,
        "description": "Divides, sorts halves recursively, then merges them.",
    },
    "Quick Sort": {
        "time_best": "O(n log n)", "time_avg": "O(n log n)", "time_worst": "O(n²)",
        "space": "O(log n)", "stable": False,
        "description": "Partitions array around a pivot and recursively sorts partitions.",
    },
}

SEARCHING_ALGORITHMS = {
    "Linear Search": {
        "time_best": "O(1)", "time_avg": "O(n)", "time_worst": "O(n)",
        "space": "O(1)",
        "description": "Scans every element from left to right.",
    },
    "Binary Search": {
        "time_best": "O(1)", "time_avg": "O(log n)", "time_worst": "O(log n)",
        "space": "O(1)",
        "description": "Divides sorted array repeatedly to locate the target.",
        "requires_sorted": True,
    },
}

STRING_ALGORITHMS = {
    "Naive":       {"time": "O(nm)", "space": "O(1)"},
    "Rabin-Karp":  {"time": "O(nm) worst / O(n+m) avg", "space": "O(1)"},
    "KMP":         {"time": "O(n+m)", "space": "O(m)"},
    "Boyer-Moore": {"time": "O(nm) worst / O(n/m) best", "space": "O(alphabet)"},
}

GRAPH_ALGORITHMS = {
    "Dijkstra":      {"time": "O((V+E) log V)", "space": "O(V)"},
    "Kruskal":       {"time": "O(E log E)",      "space": "O(V+E)"},
    "Prim":          {"time": "O(E log V)",       "space": "O(V)"},
    "Floyd-Warshall":{"time": "O(V³)",             "space": "O(V²)"},
}

STREAMING_ALGORITHMS = {
    "Exact Count":       {"type": "exact",           "space": "O(n)"},
    "Reservoir Sample":  {"type": "approximate",     "space": "O(k)"},
    "Count-Min Sketch":  {"type": "approximate",     "space": "O(w·d)"},
}

# ── Streamlit page titles ─────────────────────────────────────────────────────
PAGE_TITLES = {
    "home":     "Home — UAIS",
    "sorting":  "Sorting Algorithms",
    "searching":"Searching Algorithms",
    "paradigms":"Algorithm Paradigms",
    "strings":  "String Matching",
    "graph":    "Graph Algorithms",
    "streaming":"Streaming Algorithms",
}
