import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.document_parser import extract_text_from_file, chunk_text
from app.services.ai_pipeline import add_document_to_store, generate_summary

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF/text document for AI processing."""
    allowed = [".pdf", ".txt", ".md", ".doc", ".docx"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported. Use: {allowed}")

    filepath = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Save to database
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        filepath=filepath,
        content_type=file.content_type or "application/octet-stream",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process document for RAG
    try:
        text = extract_text_from_file(filepath)
        chunks = chunk_text(text)
        add_document_to_store(doc.id, file.filename, chunks)
    except Exception as e:
        print(f"Warning: Could not process document for RAG: {e}")

    return doc


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents uploaded by the current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return docs


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)
    
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted"}

@router.post("/{doc_id}/simplify")
def simplify_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a simplified summary of a document."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        text = extract_text_from_file(doc.filepath)
        summary = generate_summary(text)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
