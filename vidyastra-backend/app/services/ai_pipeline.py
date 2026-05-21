"""
AI Pipeline service for VidyAstra AI.
Handles RAG queries, quiz generation, summaries, and adaptive explanations.
Uses in-memory vector store as fallback when Qdrant/external services are unavailable.
"""
import json
import hashlib
from typing import List, Optional

# In-memory document store for RAG (works without external vector DB)
_document_store: dict = {}  # doc_id -> {chunks: [], filename: str}
_chunk_index: list = []  # [{text, doc_id, chunk_idx}]


def add_document_to_store(doc_id: int, filename: str, chunks: List[str]):
    """Add document chunks to the in-memory store."""
    _document_store[doc_id] = {"chunks": chunks, "filename": filename}
    for idx, chunk in enumerate(chunks):
        _chunk_index.append({
            "text": chunk,
            "doc_id": doc_id,
            "chunk_idx": idx,
            "filename": filename
        })


def _simple_similarity(query: str, text: str) -> float:
    """Simple keyword-based similarity (works without ML models)."""
    query_words = set(query.lower().split())
    text_words = set(text.lower().split())
    if not query_words or not text_words:
        return 0.0
    intersection = query_words & text_words
    return len(intersection) / max(len(query_words), 1)


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> list:
    """Retrieve the most relevant chunks using keyword similarity."""
    if not _chunk_index:
        return []
    
    scored = []
    for entry in _chunk_index:
        score = _simple_similarity(query, entry["text"])
        scored.append((score, entry))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k]]


def build_rag_prompt(query: str, level: str, language: str, context_chunks: list) -> str:
    """Build the prompt for the AI model with retrieved context."""
    level_instructions = {
        "Beginner": "Explain in very simple terms, use analogies and everyday examples. Avoid jargon.",
        "Intermediate": "Provide a balanced explanation with some technical terms, explained clearly.",
        "Expert": "Give a detailed, technical explanation. Use proper terminology and include nuances."
    }
    
    lang_instruction = ""
    if language != "English":
        lang_instruction = f"\nIMPORTANT: Respond in {language} language. Use {language} script."
    
    context_text = "\n\n".join([
        f"[Source: {c['filename']}, Chunk {c['chunk_idx']+1}]\n{c['text']}" 
        for c in context_chunks
    ]) if context_chunks else "No documents uploaded yet. Answer from general knowledge."
    
    return f"""You are VidyAstra AI, an intelligent educational tutor for Indian students.

Level: {level}
Instruction: {level_instructions.get(level, level_instructions['Intermediate'])}
{lang_instruction}

CONTEXT FROM UPLOADED DOCUMENTS:
{context_text}

STUDENT'S QUESTION:
{query}

Provide a clear, educational response. If using information from the context, mention the source.
Include a confidence indicator: HIGH if answer is directly from documents, MEDIUM if partially supported, LOW if from general knowledge.
"""


def generate_mock_response(query: str, level: str = "Intermediate", language: str = "English") -> dict:
    """
    Generate a response using RAG pipeline.
    Falls back to intelligent mock responses when no AI API key is configured.
    """
    # Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(query, top_k=3)
    
    has_context = len(chunks) > 0
    confidence = 0.92 if has_context else 0.65
    
    # Build citations
    citations = []
    if has_context:
        seen = set()
        for c in chunks:
            key = c["filename"]
            if key not in seen:
                citations.append({"source": c["filename"], "page": c["chunk_idx"] + 1})
                seen.add(key)
    
    # Generate response
    if has_context:
        context_summary = chunks[0]["text"][:300]
        if level == "Beginner":
            reply = f"Great question! Let me explain this simply based on your notes.\n\n{context_summary}...\n\nThink of it like this: the concept works similar to how everyday things function around us. The key idea is to understand the basic building blocks first."
        elif level == "Expert":
            reply = f"Based on the uploaded material:\n\n{context_summary}...\n\nFrom a technical perspective, this involves several interconnected concepts that build upon foundational principles. The mathematical formulation and algorithmic complexity should be considered for a complete understanding."
        else:
            reply = f"Based on your uploaded documents:\n\n{context_summary}...\n\nThis concept is important because it forms the foundation for more advanced topics. Make sure you understand the core principles before moving forward."
    else:
        reply = f"I don't have any uploaded documents to reference yet. Here's what I know about your question:\n\nThis is an important topic in your studies. I recommend uploading your course materials so I can give you more specific, citation-backed answers.\n\nTo get started, go to the Dashboard and upload your PDFs, notes, or syllabus."
    
    if language != "English":
        reply += f"\n\n(Note: Full {language} translation will be available when the AI API key is configured.)"
    
    return {
        "reply": reply,
        "confidence_score": confidence,
        "citations": citations,
        "level": level
    }


def generate_quiz(topic: str, num_questions: int = 5, level: str = "Intermediate") -> list:
    """Generate quiz questions on a topic."""
    # Check if we have relevant content
    chunks = retrieve_relevant_chunks(topic, top_k=5)
    
    questions = []
    base_questions = [
        {
            "question": f"What is the fundamental concept behind {topic}?",
            "options": [
                f"A core principle of {topic}",
                f"An unrelated concept",
                f"A deprecated approach",
                f"None of the above"
            ],
            "correct_answer": 0,
            "explanation": f"The fundamental concept of {topic} is based on its core principles that define how it operates."
        },
        {
            "question": f"Which of the following best describes {topic}?",
            "options": [
                f"A methodology used in computing",
                f"A theoretical framework",
                f"An applied technique in {topic}",
                f"A historical concept only"
            ],
            "correct_answer": 2,
            "explanation": f"{topic} is best described as an applied technique that has practical applications."
        },
        {
            "question": f"What is a key advantage of understanding {topic}?",
            "options": [
                f"Better problem-solving skills",
                f"No practical benefit",
                f"Only useful for exams",
                f"Outdated knowledge"
            ],
            "correct_answer": 0,
            "explanation": f"Understanding {topic} enhances your problem-solving capabilities significantly."
        },
        {
            "question": f"In which context is {topic} most commonly applied?",
            "options": [
                f"Academic research only",
                f"Industry and academia",
                f"Entertainment",
                f"None of the above"
            ],
            "correct_answer": 1,
            "explanation": f"{topic} finds applications in both industry and academic settings."
        },
        {
            "question": f"What prerequisite knowledge is helpful for {topic}?",
            "options": [
                f"Basic mathematics and logic",
                f"No prerequisites needed",
                f"Advanced physics only",
                f"Literary analysis"
            ],
            "correct_answer": 0,
            "explanation": f"A foundation in basic mathematics and logical thinking helps in understanding {topic}."
        }
    ]
    
    for i in range(min(num_questions, len(base_questions))):
        questions.append(base_questions[i])
    
    return questions


def generate_flashcards(topic: str, count: int = 10) -> list:
    """Generate flashcards for a topic."""
    chunks = retrieve_relevant_chunks(topic, top_k=5)
    
    flashcards = [
        {"front": f"Define {topic}", "back": f"{topic} is a fundamental concept that involves systematic study and application of core principles."},
        {"front": f"Key components of {topic}", "back": f"The main components include: theoretical foundation, practical application, and analytical framework."},
        {"front": f"Why is {topic} important?", "back": f"It provides essential knowledge for understanding complex systems and solving real-world problems."},
        {"front": f"Common misconception about {topic}", "back": f"A common misconception is that it's only theoretical — in reality, it has extensive practical applications."},
        {"front": f"Real-world application of {topic}", "back": f"Used in technology, research, and industry for optimizing processes and building systems."},
    ]
    
    # Add flashcards from actual document content if available
    if chunks:
        for i, chunk in enumerate(chunks[:5]):
            text = chunk["text"][:150]
            flashcards.append({
                "front": f"From your notes ({chunk['filename']}): What does this describe?",
                "back": text
            })
    
    return flashcards[:count]


def generate_summary(text: str, level: str = "Intermediate") -> str:
    """Generate a summary of provided text."""
    words = text.split()
    if level == "Beginner":
        summary_len = min(100, len(words))
        return " ".join(words[:summary_len]) + "... (Simplified summary — upload documents and configure API key for AI-powered summaries)"
    elif level == "Expert":
        summary_len = min(300, len(words))
        return " ".join(words[:summary_len]) + "... (Detailed summary — upload documents and configure API key for AI-powered summaries)"
    else:
        summary_len = min(200, len(words))
        return " ".join(words[:summary_len]) + "... (Summary — upload documents and configure API key for AI-powered summaries)"
