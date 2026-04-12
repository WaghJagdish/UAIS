"""
plotting.py
Shared Plotly chart helpers.
"""

import plotly.graph_objects as go
import plotly.express as px
from utils.constants import COLOR_SORTED, COLOR_COMPARE, COLOR_ACTIVE, COLOR_BG


def timing_bar_chart(timings: dict, title: str = "Execution Time Comparison") -> go.Figure:
    """
    Bar chart comparing execution times of multiple algorithms.

    Parameters
    ----------
    timings : {algorithm_name: elapsed_seconds}
    title   : chart title string
    """
    names  = list(timings.keys())
    values = [timings[n] * 1000 for n in names]   # convert to ms
    colours = [COLOR_SORTED if v == min(values) else COLOR_ACTIVE for v in values]

    fig = go.Figure(go.Bar(
        x=names,
        y=values,
        marker_color=colours,
        text=[f"{v:.4f} ms" for v in values],
        textposition="outside",
    ))
    fig.update_layout(
        title=title,
        yaxis_title="Time (ms)",
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        title_font_size=16,
        showlegend=False,
    )
    return fig


def operations_bar_chart(ops: dict, title: str = "Operations / Steps Comparison") -> go.Figure:
    """Bar chart comparing step counts of multiple algorithms."""
    names  = list(ops.keys())
    values = [ops[n] for n in names]
    colours = [COLOR_SORTED if v == min(values) else COLOR_COMPARE for v in values]

    fig = go.Figure(go.Bar(
        x=names,
        y=values,
        marker_color=colours,
        text=[str(v) for v in values],
        textposition="outside",
    ))
    fig.update_layout(
        title=title,
        yaxis_title="Steps",
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
        title_font_size=16,
        showlegend=False,
    )
    return fig


def dark_layout(fig: go.Figure) -> go.Figure:
    """Apply dark theme to any Plotly figure."""
    fig.update_layout(
        paper_bgcolor=COLOR_BG,
        plot_bgcolor=COLOR_BG,
        font=dict(color="#ECF0F1", family="Inter, sans-serif"),
    )
    return fig
