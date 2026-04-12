"""
graph_image_parser.py
Stub for graph image parsing.
Attempts pytesseract OCR; falls back to manual guidance.
"""


def parse_graph_from_image(image_bytes: bytes) -> dict:
    """
    Attempt to extract graph edges from an uploaded image.
    Currently returns a helpful stub (OCR/LLM integration placeholder).

    Returns
    -------
    dict with keys: nodes, edges, raw_text, method
    """
    # Try pytesseract if available
    try:
        import pytesseract
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        raw_text = pytesseract.image_to_string(img)
        return {
            "nodes": [],
            "edges": [],
            "raw_text": raw_text,
            "method": "ocr",
            "status": "partial",
            "message": (
                "OCR extracted text from image. Please parse the edges manually below.\n"
                f"Raw OCR output:\n{raw_text}"
            ),
        }
    except ImportError:
        pass

    return {
        "nodes": [],
        "edges": [],
        "raw_text": "",
        "method": "none",
        "status": "unavailable",
        "message": (
            "Image parsing requires pytesseract (pip install pytesseract). "
            "Please use the manual edge input below to define your graph."
        ),
    }
