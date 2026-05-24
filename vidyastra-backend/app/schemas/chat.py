from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    level: str = "Intermediate"  # Beginner, Intermediate, Expert
    language: str = "English"

class CitationItem(BaseModel):
    source: str
    page: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    confidence_score: float
    citations: List[CitationItem]
    session_id: int
    level: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # index into options
    explanation: str

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    level: str = "Intermediate"
    language: str = "English"

class FlashcardItem(BaseModel):
    front: str
    back: str

class FlashcardRequest(BaseModel):
    topic: str = "General"
    count: int = 10
    language: str = "English"

class SummaryRequest(BaseModel):
    document_id: int
    level: str = "Intermediate"
    language: str = "English"
