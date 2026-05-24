from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, QuizRequest, QuizQuestion, FlashcardItem, FlashcardRequest, SummaryRequest
from app.services.ai_pipeline import (
    generate_ai_response, generate_quiz, generate_flashcards, generate_summary,
    explain_like, generate_mind_map, generate_study_plan,
    translate_text, draft_professional_text, simulate_interview, review_logic,
    generate_podcast_script, generate_career_mapping
)
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

    user_msg = ChatMessage(session_id=session.id, sender="user", content=req.message)
    db.add(user_msg)
    db.commit()

    try:
        result = generate_ai_response(req.message, req.level, req.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.started_at.desc()).all()
    return [{"id": s.id, "title": s.title, "started_at": str(s.started_at)} for s in sessions]


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    try:
        questions = generate_quiz(req.topic, req.num_questions, req.level, req.language)
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flashcards", response_model=List[FlashcardItem])
def create_flashcards(
    req: FlashcardRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_flashcards(req.topic, req.count, req.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── UNIQUE FEATURE ENDPOINTS ──────────────────────────────────────────────

class ExplainRequest(BaseModel):
    text: str
    mode: str = "teacher"

@router.post("/explain-like")
def explain_like_endpoint(
    req: ExplainRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = explain_like(req.text, req.mode)
        return {"explanation": result, "mode": req.mode}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class MindMapRequest(BaseModel):
    topic: str

@router.post("/mind-map")
def mind_map_endpoint(
    req: MindMapRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = generate_mind_map(req.topic)
        return {"mermaid": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StudyPlanRequest(BaseModel):
    topic: str
    days: int = 7

@router.post("/study-plan")
def study_plan_endpoint(
    req: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = generate_study_plan(req.topic, req.days)
        return {"plan": result, "topic": req.topic, "days": req.days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TranslateRequest(BaseModel):
    text: str
    target_language: str

@router.post("/translate")
def translate_endpoint(
    req: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = translate_text(req.text, req.target_language)
        return {"translated_text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DraftRequest(BaseModel):
    context: str
    format_type: str = "email"

@router.post("/draft")
def draft_endpoint(
    req: DraftRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = draft_professional_text(req.context, req.format_type)
        return {"draft": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class InterviewRequest(BaseModel):
    role: str

@router.post("/interview")
def interview_endpoint(
    req: InterviewRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = simulate_interview(req.role)
        return {"simulation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ReviewRequest(BaseModel):
    content: str

@router.post("/review")
def review_endpoint(
    req: ReviewRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = review_logic(req.content)
        return {"review": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PodcastRequest(BaseModel):
    topic: str

@router.post("/podcast")
def podcast_endpoint(
    req: PodcastRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        script = generate_podcast_script(req.topic)
        return {"script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CareerRequest(BaseModel):
    topic: str

@router.post("/careers")
def career_endpoint(
    req: CareerRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        mapping = generate_career_mapping(req.topic)
        return {"mapping": mapping}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
