"""
ui_components.py
Reusable Streamlit UI components for the UAIS application.
Elimates duplicated HTML/CSS patterns across modules.
"""

import streamlit as st
import traceback
from functools import wraps


# ── Color constants for component styling ────────────────────────────────────

_GRADIENT_PRESETS = {
    "sorting":    ("#667eea", "#764ba2"),
    "searching":  ("#11998e", "#38ef7d"),
    "paradigms":  ("#4facfe", "#00f2fe"),
    "strings":    ("#f093fb", "#f5576c"),
    "graph":      ("#a18cd1", "#fbc2eb"),
    "streaming":  ("#fddb92", "#d1fdff"),
    "default":    ("#667eea", "#764ba2"),
}


def page_header(title: str, subtitle: str = "", module_key: str = "default"):
    """
    Render a consistent technological HUD page header.
    """
    colors_map = {
        "sorting": "#c3c0ff",    # primary (lavender)
        "searching": "#89ceff",  # secondary (sky blue)
        "paradigms": "#4edea3",  # tertiary (neon green)
        "strings": "#c3c0ff",    # primary
        "graph": "#89ceff",      # secondary
        "streaming": "#4edea3",  # tertiary
    }
    accent_color = colors_map.get(module_key, "#c3c0ff")
    
    st.markdown(f"""
    <div style="
        border: 1px solid rgba(70, 69, 85, 0.4);
        padding: 24px;
        background-color: #171f33;
        margin-bottom: 24px;
        border-radius: 4px;
        position: relative;
        overflow: hidden;
    ">
        <!-- Technical HUD style corner markers -->
        <div style="position: absolute; top: -1px; left: -1px; width: 12px; height: 12px; border-top: 2px solid {accent_color}; border-left: 2px solid {accent_color};"></div>
        <div style="position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px; border-bottom: 2px solid {accent_color}; border-right: 2px solid {accent_color};"></div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: {accent_color}; letter-spacing: 0.15em; font-weight: bold; text-transform: uppercase;">
                SYS_MODULE // {module_key.upper()}
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(145, 143, 161, 0.5); letter-spacing: 0.05em;">
                STATUS: ACTIVE
            </div>
        </div>
        
        <h2 style="
            font-family: 'Orbitron', 'Inter', sans-serif !important;
            font-weight: 700;
            font-size: 2.2rem;
            color: #dbe2fd;
            margin: 0 0 10px 0;
            letter-spacing: -0.02em;
            text-transform: uppercase;
            text-shadow: 0 0 15px rgba(195, 192, 255, 0.1);
        ">
            {title}
        </h2>
        
        {f'<p style="font-family: \'Inter\', sans-serif; font-size: 0.95rem; color: #918fa1; margin: 0; line-height: 1.6; border-left: 2px solid {accent_color}; padding-left: 12px;">{subtitle}</p>' if subtitle else ""}
    </div>
    """, unsafe_allow_html=True)


def section_header(title: str):
    """Render a clean section header without emoji."""
    st.markdown(
        f"<h3 style='color:#c3c0ff;font-family:\"Orbitron\", sans-serif;margin:1.5rem 0 1rem;font-weight:600;font-size:1.3rem;text-transform:uppercase;'>// {title}</h3>",
        unsafe_allow_html=True,
    )


def control_panel(title: str = "Configuration"):
    """
    Return a Streamlit container styled as a control panel.
    """
    container = st.container(border=True)
    with container:
        st.markdown(
            f"<h4 style='margin:0 0 0.8rem;color:#c3c0ff;font-family:\"JetBrains Mono\", monospace;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #464555;padding-bottom:6px;'>// {title}</h4>",
            unsafe_allow_html=True,
        )
    return container


def under_development(feature_name: str):
    """Display a professional placeholder for incomplete features."""
    st.markdown(f"""
    <div style='text-align:center;padding:3rem 2rem;
                background:#171f33;border:1px dashed #464555;border-radius:4px;margin:1rem 0;position:relative;'>
        <div style="position: absolute; top: -1px; left: -1px; width: 10px; height: 10px; border-top: 2px solid #ffb4ab; border-left: 2px solid #ffb4ab;"></div>
        <div style="position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-bottom: 2px solid #ffb4ab; border-right: 2px solid #ffb4ab;"></div>
        <div style='font-family: "JetBrains Mono", monospace; font-size:2.5rem;margin-bottom:0.8rem;color:#ffb4ab;opacity:0.8;'>⚠️</div>
        <h3 style='font-family: "Orbitron", sans-serif; color:#ffb4ab;margin:0 0 0.5rem;text-transform:uppercase;'>SYS_ERR // Under Development</h3>
        <p style='font-family: "Inter", sans-serif; color:#918fa1;margin:0;font-size:0.95rem;'>
            <strong>{feature_name}</strong> is currently locked. Implementation active.<br>
            Check back in a future runtime sequence.
        </p>
    </div>
    """, unsafe_allow_html=True)


def error_boundary(module_name: str):
    """
    Decorator that wraps a module's render() function in a
    try/except block, displaying a professional error message.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                st.error(f"An error occurred in the **{module_name}** module.")
                st.markdown(
                    f"<p style='color:#94a3b8;font-size:0.9rem;'>"
                    f"The application encountered an unexpected error. "
                    f"Please try refreshing the page or adjusting your inputs.</p>",
                    unsafe_allow_html=True,
                )
                with st.expander("Technical details"):
                    st.code(traceback.format_exc(), language="text")
        return wrapper
    return decorator


def complexity_table(data: list):
    """Render a complexity reference table from a list of dicts."""
    import pandas as pd
    st.dataframe(pd.DataFrame(data), use_container_width=True, hide_index=True)


def recommendation_box(text: str):
    """Display a recommendation in a styled success box."""
    st.markdown(f"""
    <div style="
        border: 1px solid #464555;
        padding: 16px;
        background-color: #171f33;
        margin: 16px 0;
        border-radius: 4px;
        border-left: 4px solid #4edea3;
        position: relative;
    ">
        <div style="position: absolute; top: -1px; left: -1px; width: 8px; height: 8px; border-top: 2px solid #4edea3; border-left: 2px solid #4edea3;"></div>
        <div style="position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; border-bottom: 2px solid #4edea3; border-right: 2px solid #4edea3;"></div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4edea3; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">
            ANALYSIS RECOMMENDATION //
        </div>
        <div style="font-family: 'Inter', sans-serif; font-size: 0.92rem; color: #dbe2fd; line-height: 1.5;">
            {text}
        </div>
    </div>
    """, unsafe_allow_html=True)


def legend_bar(items: list):
    """
    Render a horizontal color legend.
    """
    boxes = "".join(
        f'<span style="display:inline-flex;align-items:center;margin-right:20px;margin-bottom:8px;">'
        f'<span style="display:inline-block;width:10px;height:10px;'
        f'background:{c};border-radius:2px;margin-right:8px;border:1px solid rgba(255,255,255,0.1);"></span>'
        f'<span style="font-family:\'JetBrains Mono\', monospace;font-size:12px;color:#918fa1;text-transform:uppercase;">{label}</span></span>'
        for c, label in items
    )
    st.markdown(
        f'<div style="padding:10px 14px;margin-bottom:1rem;background-color:#171f33;border:1px solid #464555;border-radius:4px;display:flex;flex-wrap:wrap;">{boxes}</div>',
        unsafe_allow_html=True,
    )

