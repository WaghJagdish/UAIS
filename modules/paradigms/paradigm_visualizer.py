"""
paradigm_visualizer.py
Visualizes DP tables (e.g., Knapsack) and exploration trees (B&B).
"""

import plotly.graph_objects as go
import plotly.figure_factory as ff
import pandas as pd
import numpy as np
from utils.constants import COLOR_BG, COLOR_SORTED, COLOR_ACTIVE, COLOR_COMPARE


def render_dp_table(dp: list, weights: list, capacity: int) -> go.Figure:
    """Heatmap of the DP table for 0/1 Knapsack."""
    n = len(dp) - 1
    z = [row[:min(capacity + 1, 21)] for row in dp]
    cols = list(range(min(capacity + 1, 21)))
    rows_label = [f"Item {i}" if i > 0 else "0 items" for i in range(n + 1)]

    fig = go.Figure(go.Heatmap(
        z=z,
        x=[str(c) for c in cols],
        y=rows_label,
        colorscale="Viridis",
        text=[[str(v) for v in row] for row in z],
        texttemplate="%{text}",
        showscale=True,
        hovertemplate="Item: %{y}<br>Capacity: %{x}<br>Value: %{z}<extra></extra>",
    ))
    fig.update_layout(
        title="🗂️ DP Table — Value[item][weight]",
        xaxis_title="Weight capacity →",
        yaxis_title="Items →",
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        height=400,
    )
    return fig


def render_bnb_tree(steps: list, max_nodes: int = 40) -> go.Figure:
    """
    Simple scatter representation of B&B exploration nodes.
    X = node index, Y = current value at that node.
    """
    xs, ys, labels, colours = [], [], [], []
    for i, s in enumerate(steps[:max_nodes]):
        xs.append(i)
        ys.append(s.get("cur_val", 0))
        labels.append(s.get("description", "")[:60])
        colours.append(COLOR_SORTED if s.get("action") == "include" else COLOR_COMPARE)

    fig = go.Figure(go.Scatter(
        x=xs, y=ys,
        mode="markers+lines",
        marker=dict(color=colours, size=10, line=dict(width=1, color="#fff")),
        text=labels, hoverinfo="text+y",
        line=dict(color="#555", width=1, dash="dot"),
    ))
    fig.update_layout(
        title="🌳 Branch & Bound Exploration",
        xaxis_title="Node explored",
        yaxis_title="Partial value",
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        height=350,
    )
    return fig


def render_fw_matrix(dist: list, nodes: list) -> go.Figure:
    """Heatmap for Floyd-Warshall distance matrix."""
    display = [[v if v != float("inf") else -1 for v in row] for row in dist]
    text    = [[("∞" if v == float("inf") else str(round(v, 2))) for v in row] for row in dist]

    fig = go.Figure(go.Heatmap(
        z=display, x=nodes, y=nodes,
        colorscale="Plasma",
        text=text, texttemplate="%{text}",
        showscale=True,
        hovertemplate="From %{y} → To %{x}: %{text}<extra></extra>",
    ))
    fig.update_layout(
        title="📐 Floyd-Warshall Distance Matrix",
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        height=380,
    )
    return fig
