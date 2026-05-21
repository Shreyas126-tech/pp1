"""
Document parsing service for VidyAstra AI.
Handles PDF text extraction and text chunking for RAG.
"""
import os
import re


def extract_text_from_file(filepath: str) -> str:
    """Extract text content from uploaded files. Supports .txt and .pdf."""
    ext = os.path.splitext(filepath)[1].lower()

    if ext == ".txt":
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    elif ext == ".pdf":
        try:
            # Try PyPDF2 first
            from PyPDF2 import PdfReader
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        except ImportError:
            # Fallback: read raw bytes and decode
            with open(filepath, "rb") as f:
                raw = f.read()
            # Very basic extraction from PDF bytes
            text_parts = re.findall(rb'\(([^)]+)\)', raw)
            return " ".join(p.decode("utf-8", errors="ignore") for p in text_parts)
    else:
        # For other text-based files, attempt plain read
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """
    Split text into overlapping chunks for vector embedding.
    """
    if not text.strip():
        return []

    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks
