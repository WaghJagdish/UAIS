"""
searching_visualizer.py
Plotly-based step-by-step visualizer for searching algorithms.
"""

import plotly.graph_objects as go
from utils.constants import COLOR_DEFAULT, COLOR_ACTIVE, COLOR_FOUND, COLOR_COMPARE, COLOR_BG


def _color_search(arr: list, highlights: dict) -> list[str]:
    n = len(arr)
    colors = [COLOR_DEFAULT] * n
    for idx in highlights.get("range", []):
        if 0 <= idx < n:
            colors[idx] = "#2C3E50"  # dim gray for search range
    for idx in highlights.get("active", []):
        if 0 <= idx < n:
            colors[idx] = COLOR_ACTIVE
    for idx in highlights.get("found", []):
        if 0 <= idx < n:
            colors[idx] = COLOR_FOUND
    return colors


def build_search_figure(step: dict, step_num: int, total_steps: int, target) -> go.Figure:
    arr    = step["array"]
    colors = _color_search(arr, step.get("highlights", {}))
    desc   = step.get("description", "")

    fig = go.Figure(go.Bar(
        x=list(range(len(arr))),
        y=arr,
        marker_color=colors,
        text=[str(v) for v in arr],
        textposition="outside",
        hovertemplate="Index: %{x}<br>Value: %{y}<extra></extra>",
    ))
    # Draw a horizontal dashed line at target value
    fig.add_hline(y=target, line_dash="dot", line_color=COLOR_FOUND,
                  annotation_text=f"Target: {target}", annotation_position="right")

    fig.update_layout(
        title=f"Step {step_num}/{total_steps}",
        xaxis=dict(title="Index", tickmode="array", tickvals=list(range(len(arr)))),
        yaxis=dict(title="Value", range=[0, max(arr) * 1.3 if arr else 1]),
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        showlegend=False,
        annotations=[dict(
            text=desc,
            xref="paper", yref="paper",
            x=0.5, y=-0.18,
            showarrow=False,
            font=dict(size=12, color="#F39C12"),
        )],
    )
    return fig
