"""
graph_visualizer.py
networkx + matplotlib-based graph visualizer for Dijkstra, Kruskal, Prim.
"""

import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import io
from utils.constants import (
    COLOR_DEFAULT, COLOR_PATH, COLOR_MST,
    COLOR_ACTIVE, COLOR_FOUND, COLOR_BG
)


def _build_nx(nodes: list, edges: list) -> nx.Graph:
    G = nx.Graph()
    G.add_nodes_from(nodes)
    for e in edges:
        if len(e) == 3:
            G.add_edge(e[0], e[1], weight=e[2])
        else:
            G.add_edge(e[0], e[1])
    return G


def draw_graph(
    nodes: list,
    edges: list,
    highlight_edges: list = None,
    highlight_nodes: list = None,
    edge_color_map: dict = None,
    node_color_map: dict = None,
    title: str = "Graph",
    highlight_label: str = "",
) -> plt.Figure:
    """
    Draw a weighted graph with highlighted edges/nodes.

    Parameters
    ----------
    nodes            : list of node names
    edges            : [(u, v, weight), ...]
    highlight_edges  : edges to colour specially   [(u, v), ...]
    highlight_nodes  : nodes to colour specially
    edge_color_map   : {(u,v): hexcolor}
    node_color_map   : {node: hexcolor}
    """
    G   = _build_nx(nodes, edges)
    pos = nx.spring_layout(G, seed=42)

    fig, ax = plt.subplots(figsize=(8, 5))
    fig.patch.set_facecolor(COLOR_BG)
    ax.set_facecolor(COLOR_BG)
    ax.set_title(title, color="#ECF0F1", fontsize=13, pad=10)

    # Node colours
    n_colors = []
    for nd in G.nodes():
        if node_color_map and nd in node_color_map:
            n_colors.append(node_color_map[nd])
        elif highlight_nodes and nd in highlight_nodes:
            n_colors.append(COLOR_ACTIVE)
        else:
            n_colors.append(COLOR_DEFAULT)

    # Edge colours
    e_colors = []
    hl_set = set()
    if highlight_edges:
        for e in highlight_edges:
            hl_set.add((e[0], e[1]))
            hl_set.add((e[1], e[0]))

    for u, v in G.edges():
        if edge_color_map and ((u, v) in edge_color_map or (v, u) in edge_color_map):
            c = edge_color_map.get((u, v), edge_color_map.get((v, u), "#555"))
            e_colors.append(c)
        elif (u, v) in hl_set or (v, u) in hl_set:
            e_colors.append(COLOR_MST)
        else:
            e_colors.append("#555555")

    nx.draw_networkx_nodes(G, pos, node_color=n_colors, node_size=600, ax=ax)
    nx.draw_networkx_labels(G, pos, font_color="#ECF0F1", font_size=10, ax=ax)
    nx.draw_networkx_edges(G, pos, edge_color=e_colors, width=2.5, ax=ax)
    edge_labels = {(u, v): d["weight"] for u, v, d in G.edges(data=True) if "weight" in d}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels,
                                  font_color="#F39C12", font_size=9, ax=ax)

    # Legend
    if highlight_label:
        patch = mpatches.Patch(color=COLOR_MST, label=highlight_label)
        ax.legend(handles=[patch], loc="upper left",
                  facecolor="#1A1F2E", labelcolor="#ECF0F1", fontsize=9)

    ax.axis("off")
    plt.tight_layout()
    return fig


def fig_to_bytes(fig: plt.Figure) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    buf.seek(0)
    plt.close(fig)
    return buf.read()
