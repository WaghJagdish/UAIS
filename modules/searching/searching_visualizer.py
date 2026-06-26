"""
searching_visualizer.py
Plotly-based step-by-step visualizer for searching algorithms.
"""

import plotly.graph_objects as go
from utils.constants import COLOR_DEFAULT, COLOR_ACTIVE, COLOR_FOUND, COLOR_COMPARE, COLOR_BG, COLOR_TEXT


def _color_search(arr: list, highlights: dict) -> list[str]:
    n = len(arr)
    colors = [COLOR_DEFAULT] * n
    for idx in highlights.get("range", []):
        if 0 <= idx < n:
            colors[idx] = "#131b2e"  # dim dark container color for search range
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
                  annotation_text=f"Target: {target}", annotation_position="right",
                  annotation_font=dict(family="JetBrains Mono, monospace", color=COLOR_FOUND))

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
            range=[0, max(arr) * 1.3 if arr else 1],
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
            font=dict(size=12, color=COLOR_ACTIVE, family="JetBrains Mono, monospace"),
        )],
    )
    return fig
