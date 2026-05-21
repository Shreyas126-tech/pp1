from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, QuizRequest, QuizQuestion, FlashcardItem, SummaryRequest
from app.services.ai_pipeline import generate_mock_response, generate_quiz, generate_flashcards, generate_summary
from typing import List
import json

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def ask_question(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask the AI tutor a question using RAG."""
    # Create or get session
    if req.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
        if not session:
            session = ChatSession(user_id=current_user.id, title=req.message[:50])
            db.add(session)
            db.commit()
            db.refresh(session)
    else:
        session = ChatSession(user_id=current_user.id, title=req.message[:50])
        db.add(session)
        db.commit()
        db.refresh(session)

    # Save user message
    user_msg = ChatMessage(session_id=session.id, sender="user", content=req.message)
    db.add(user_msg)
    db.commit()

    # Generate AI response
    result = generate_mock_response(req.message, req.level, req.language)

    # Save AI message
    ai_msg = ChatMessage(
        session_id=session.id,
        sender="ai",
        content=result["reply"],
        confidence_score=result["confidence_score"],
        citations=json.dumps(result["citations"]),
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        reply=result["reply"],
        confidence_score=result["confidence_score"],
        citations=[{"source": c["source"], "page": c.get("page")} for c in result["citations"]],
        session_id=session.id,
        level=result["level"],
    )


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all chat sessions for the current user."""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.started_at.desc()).all()
    return [{"id": s.id, "title": s.title, "started_at": str(s.started_at)} for s in sessions]


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages in a chat session."""
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp).all()
    return [{
        "id": m.id,
        "sender": m.sender,
        "content": m.content,
        "confidence_score": m.confidence_score,
        "citations": json.loads(m.citations) if m.citations else [],
        "timestamp": str(m.timestamp),
    } for m in messages]


@router.post("/quiz", response_model=List[QuizQuestion])
def create_quiz(
    req: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a quiz on a topic."""
    questions = generate_quiz(req.topic, req.num_questions, req.level)
    return questions


@router.post("/flashcards", response_model=List[FlashcardItem])
def create_flashcards(
    topic: str = "General",
    count: int = 10,
    current_user: User = Depends(get_current_user),
):
    """Generate flashcards for a topic."""
    return generate_flashcards(topic, count)
