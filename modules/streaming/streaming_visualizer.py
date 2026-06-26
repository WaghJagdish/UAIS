"""
streaming_visualizer.py
Plotly charts for streaming algorithm results.
"""

import plotly.graph_objects as go
from utils.constants import COLOR_BG, COLOR_SORTED, COLOR_ACTIVE, COLOR_COMPARE, COLOR_TEXT, COLOR_CARD


def frequency_bar(exact: dict, approx: dict, title: str = "Exact vs Approximate Frequency") -> go.Figure:
    """Side-by-side bars comparing exact and approximate frequencies."""
    items   = sorted(set(list(exact.keys()) + list(approx.keys())))
    exact_v = [exact.get(k, 0) for k in items]
    approx_v= [approx.get(k, 0) for k in items]

    fig = go.Figure()
    fig.add_trace(go.Bar(name="Exact Count",   x=items, y=exact_v,  marker_color=COLOR_SORTED))
    fig.add_trace(go.Bar(name="CMS Approx",    x=items, y=approx_v, marker_color=COLOR_COMPARE))
    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=14, color=COLOR_TEXT, family="JetBrains Mono, monospace"),
        ),
        barmode="group",
        xaxis=dict(
            title=dict(text="Item", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        yaxis=dict(
            title=dict(text="Frequency", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color=COLOR_TEXT, family="Inter, sans-serif"),
        legend=dict(bgcolor=COLOR_CARD, bordercolor="#464555", borderwidth=1),
    )
    return fig


def reservoir_chart(stream: list, sample: list) -> go.Figure:
    """Show which stream items ended up in the reservoir."""
    items = sorted(set(stream))
    in_res = {it: sample.count(it) for it in items}
    total  = {it: stream.count(it)  for it in items}

    fig = go.Figure()
    fig.add_trace(go.Bar(name="In Stream",     x=items, y=[total[it] for it in items],  marker_color=COLOR_ACTIVE))
    fig.add_trace(go.Bar(name="In Reservoir",  x=items, y=[in_res[it] for it in items], marker_color=COLOR_SORTED))
    fig.update_layout(
        title=dict(
            text="Reservoir Sample vs Stream",
            font=dict(size=14, color=COLOR_TEXT, family="JetBrains Mono, monospace"),
        ),
        barmode="overlay",
        xaxis=dict(
            title=dict(text="Item", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        yaxis=dict(
            title=dict(text="Count", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color=COLOR_TEXT, family="Inter, sans-serif"),
        legend=dict(bgcolor=COLOR_CARD, bordercolor="#464555", borderwidth=1),
    )
    return fig


def sketch_heatmap(table: list) -> go.Figure:
    """Heatmap of Count-Min Sketch internal table."""
    fig = go.Figure(go.Heatmap(
        z=table,
        colorscale="Viridis",
        text=[[str(v) for v in row] for row in table],
        texttemplate="%{text}",
        showscale=True,
        hovertemplate="Row %{y}, Col %{x}: %{z}<extra></extra>",
    ))
    fig.update_layout(
        title=dict(
            text="Count-Min Sketch Table",
            font=dict(size=14, color=COLOR_TEXT, family="JetBrains Mono, monospace"),
        ),
        xaxis=dict(
            title=dict(text="Columns (hash buckets)", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        yaxis=dict(
            title=dict(text="Hash functions (rows)", font=dict(family="JetBrains Mono, monospace")),
            gridcolor="#464555",
            linecolor="#464555",
        ),
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color=COLOR_TEXT, family="Inter, sans-serif"),
        height=300,
    )
    return fig
