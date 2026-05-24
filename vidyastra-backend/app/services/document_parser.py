"""
Document parsing service for VidyAstra AI.
Handles PDF text extraction, OCR, and text chunking for RAG.
"""
import os
import re
from PIL import Image
import io

def extract_text_from_file(filepath: str) -> str:
    """Extract text content from uploaded files. Supports .txt, .pdf, images with OCR fallback."""
    ext = os.path.splitext(filepath)[1].lower()
    text = ""

    if ext == ".txt":
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    elif ext in [".png", ".jpg", ".jpeg", ".bmp"]:
        try:
            import pytesseract
            img = Image.open(filepath)
            text = pytesseract.image_to_string(img)
        except Exception as e:
            print(f"OCR failed for image: {e}")
            text = f"Error: Could not extract text from image. Make sure Tesseract is installed. ({e})"
    elif ext == ".pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(filepath)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
            # If PyPDF2 found little/no text (e.g., scanned PDF), try OCR fallback
            if len(text.strip()) < 50:
                try:
                    from pdf2image import convert_from_path
                    import pytesseract
                    images = convert_from_path(filepath)
                    for img in images:
                        text += pytesseract.image_to_string(img) + "\n"
                except Exception as e:
                    print(f"PDF OCR fallback failed: {e}")
        except Exception as e:
            print(f"PDF Parsing failed: {e}")
    else:
        # Fallback for other text formats
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
            
    return text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list:
    """Split text into overlapping chunks for vector embedding."""
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
