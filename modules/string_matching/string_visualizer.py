"""
string_visualizer.py
Plotly / HTML string matching visualizer.
"""

from utils.constants import COLOR_BG, COLOR_COMPARE, COLOR_FOUND, COLOR_ACTIVE, COLOR_DEFAULT


def render_string_step_html(step: dict) -> str:
    """
    Build an HTML string showing the text with the pattern window highlighted.

    Returns an HTML snippet safe for st.markdown(..., unsafe_allow_html=True).
    """
    text        = step["text"]
    pattern     = step["pattern"]
    win_start   = step.get("window_start", 0)
    char_pos    = step.get("char_pos", 0)
    is_match    = step.get("match", False)
    matches     = step.get("matches", [])
    m           = len(pattern)

    chars_html = []
    for i, ch in enumerate(text):
        if i in matches:      # previously confirmed match
            style = f"background:{COLOR_FOUND};color:#000;border-radius:3px;padding:2px 4px;font-weight:bold;"
        elif win_start <= i < win_start + m:
            pos_in_win = i - win_start
            if pos_in_win < char_pos:  # already-matched chars in current window
                bg = COLOR_FOUND if is_match else COLOR_ACTIVE
                style = f"background:{bg};color:#000;border-radius:3px;padding:2px 4px;"
            elif pos_in_win == char_pos:  # current comparison
                bg = COLOR_COMPARE if not is_match else COLOR_FOUND
                style = f"background:{bg};color:#000;border-radius:3px;padding:2px 4px;font-weight:bold;"
            else:
                style = f"background:#2C3E50;color:#ECF0F1;border-radius:3px;padding:2px 4px;"
        else:
            style = f"color:#95A5A6;padding:2px 4px;"

        chars_html.append(f'<span style="{style}">{ch}</span>')

    text_line = "".join(chars_html)

    # Build pattern alignment line
    pat_prefix = "&nbsp;" * win_start
    pat_chars = []
    for k, ch in enumerate(pattern):
        if k < char_pos:
            style = f"background:{COLOR_FOUND if is_match else COLOR_ACTIVE};color:#000;border-radius:3px;padding:2px 4px;"
        elif k == char_pos:
            style = f"background:{COLOR_COMPARE};color:#000;border-radius:3px;padding:2px 4px;font-weight:bold;"
        else:
            style = "color:#7F8C8D;padding:2px 4px;"
        pat_chars.append(f'<span style="{style}">{ch}</span>')
    pat_line = pat_prefix + "".join(pat_chars)

    html = f"""
    <div style="font-family:'Courier New',monospace;font-size:17px;
                background:{COLOR_BG};padding:14px 18px;border-radius:8px;
                border:1px solid #2C3E50;margin:6px 0;line-height:2.2em;">
        <div><b style="color:#7F8C8D;font-size:12px;">TEXT &nbsp;&nbsp;</b>{text_line}</div>
        <div><b style="color:#7F8C8D;font-size:12px;">PATTERN</b> {pat_line}</div>
    </div>
    """
    return html


def render_match_summary(matches: list, text: str, pattern: str) -> str:
    if not matches:
        return f'<p style="color:#E74C3C;font-weight:bold;">No matches found for <code>{pattern}</code> in the text.</p>'
    idxs = ", ".join(str(m) for m in matches)
    return (
        f'<p style="color:#2ECC71;font-weight:bold;">'
        f'Pattern <code>{pattern}</code> found {len(matches)}x at index(es): {idxs}</p>'
    )
