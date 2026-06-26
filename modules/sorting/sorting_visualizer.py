"""
sorting_visualizer.py
Plotly-based step-by-step bar chart visualizer for sorting algorithms.
"""

import plotly.graph_objects as go
from utils.constants import (
    COLOR_DEFAULT, COLOR_COMPARE, COLOR_ACTIVE,
    COLOR_SORTED, COLOR_PIVOT, COLOR_BG, COLOR_TEXT,
)


def _color_array(arr: list, highlights: dict) -> list[str]:
    """Map each index to a colour based on its highlight role."""
    n = len(arr)
    colors = [COLOR_DEFAULT] * n
    for idx in highlights.get("sorted", []):
        if 0 <= idx < n:
            colors[idx] = COLOR_SORTED
    for idx in highlights.get("active", []):
        if 0 <= idx < n:
            colors[idx] = COLOR_ACTIVE
    for idx in highlights.get("compare", []):
        if 0 <= idx < n:
            colors[idx] = COLOR_COMPARE
    return colors


def build_sort_figure(step: dict, step_num: int, total_steps: int) -> go.Figure:
    """
    Build a Plotly bar-chart figure for a single algorithm step.

    Parameters
    ----------
    step       : one entry from the steps list returned by a sort algorithm
    step_num   : 1-indexed step number
    total_steps: total number of steps
    """
    arr    = step["array"]
    colors = _color_array(arr, step.get("highlights", {}))
    desc   = step.get("description", "")

    fig = go.Figure(go.Bar(
        x=list(range(len(arr))),
        y=arr,
        marker_color=colors,
        text=[str(v) for v in arr],
        textposition="outside",
        hovertemplate="Index: %{x}<br>Value: %{y}<extra></extra>",
    ))

    fig.update_layout(
        title=dict(
            text=f"Step {step_num}/{total_steps}",
            font=dict(size=14, color=COLOR_TEXT, family="JetBrains Mono, monospace"),
        ),
        xaxis=dict(
            title=dict(text="Index", font=dict(family="JetBrains Mono, monospace")),
            tickmode="array",
            tickvals=list(range(len(arr))),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        yaxis=dict(
            title=dict(text="Value", font=dict(family="JetBrains Mono, monospace")),
            range=[0, max(arr) * 1.25 if arr else 1],
            gridcolor="#464555",
            linecolor="#464555",
        ),
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color=COLOR_TEXT, family="Inter, sans-serif"),
        showlegend=False,
        annotations=[dict(
            text=desc,
            xref="paper", yref="paper",
            x=0.5, y=-0.18,
            showarrow=False,
            font=dict(size=13, color=COLOR_ACTIVE, family="JetBrains Mono, monospace"),
        )],
    )
    return fig


def build_legend() -> str:
    """Return an HTML legend string."""
    items = [
        (COLOR_COMPARE, "Comparing"),
        (COLOR_ACTIVE,  "Active / Pivot"),
        (COLOR_SORTED,  "Sorted"),
        (COLOR_DEFAULT, "Unsorted"),
    ]
    boxes = "".join(
        f'<span style="display:inline-block;width:14px;height:14px;'
        f'background:{c};border-radius:3px;margin-right:4px;vertical-align:middle;"></span>'
        f'<span style="margin-right:16px;font-size:13px;">{label}</span>'
        for c, label in items
    )
    return f'<div style="padding:6px 0;">{boxes}</div>'
