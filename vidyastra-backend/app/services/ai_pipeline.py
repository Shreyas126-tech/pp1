"""
AI Pipeline for VidyAstra AI.
Uses OpenAI API (pointing to local Ollama) and ChromaDB for RAG.
Optimized for small local models (qwen2.5:0.5b) running on CPU.
Uses deep-translator for highly reliable multi-lingual support.
"""
import os
import json
import time
import re
import threading
from typing import List, Optional
from app.core.config import settings
from deep_translator import GoogleTranslator

# ── Configuration ──────────────────────────────────────────────────────────
OLLAMA_MODEL = settings.OLLAMA_MODEL
OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")

# ── OpenAI Client (Pointed to Ollama) ──────────────────────────────────────
_openai_client = None

def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        try:
            from openai import OpenAI
            _openai_client = OpenAI(
                api_key="ollama",
                base_url=OLLAMA_BASE_URL,
                timeout=180.0
            )
        except Exception as e:
            print(f"[VidyAstra] Failed to init Ollama client: {e}")
            return None
    return _openai_client

# ── FastEmbed Client ───────────────────────────────────────────────────────
_embedding_model = None

def _get_embedding(text: str) -> List[float]:
    """Generate embedding using FastEmbed local model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from fastembed import TextEmbedding
            _embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        except Exception as e:
            print(f"[VidyAstra] Failed to init FastEmbed: {e}")
            raise Exception("Embedding model not configured.")
    
    if not text.strip():
        return [0.0] * 384
    
    embeddings = list(_embedding_model.embed([text[:8000]]))
    return embeddings[0].tolist()


def _call_llm(prompt: str, retries: int = 2, json_mode: bool = False, max_tokens: int = 512) -> Optional[str]:
    """Call Ollama with a hard timeout. max_tokens keeps responses short and fast."""
    client = _get_openai_client()
    if not client:
        return None

    for attempt in range(retries):
        result = [None]
        error = [None]

        def _do_call():
            try:
                kwargs = {
                    "model": OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": max_tokens,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}
                response = client.chat.completions.create(**kwargs)
                result[0] = response.choices[0].message.content
            except Exception as e:
                error[0] = e

        t = threading.Thread(target=_do_call)
        t.start()
        t.join(timeout=180)

        if t.is_alive():
            print(f"[VidyAstra] LLM call timed out (attempt {attempt+1}/{retries})")
            continue

        if error[0]:
            err_str = str(error[0])
            if "Connection error" in err_str or "ConnectError" in err_str:
                raise Exception(f"Cannot connect to Ollama. Make sure Ollama is running and '{OLLAMA_MODEL}' is downloaded.")
            print(f"[VidyAstra] Ollama error (attempt {attempt+1}/{retries}): {error[0]}")
            time.sleep(1)
            continue

        if result[0]:
            return result[0]

    return None


def _clean_markdown(text: str) -> str:
    """Remove ALL markdown formatting symbols from text for clean display."""
    if not text:
        return text
    # Remove bold/italic markers
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    # Remove headers
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    # Remove remaining stray * and # at line start
    text = re.sub(r'^\*\s*', '- ', text, flags=re.MULTILINE)
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ── TRANSLATION & DICTIONARY TOOLS ────────────────────────────────────────

def translate_text(text: str, target_language: str) -> str:
    """Translate text reliably using deep-translator (Google Translate)."""
    if not text or target_language.lower() == "english":
        return text
    
    lang_map = {
        "english": "en", "hindi": "hi", "tamil": "ta", "telugu": "te",
        "kannada": "kn", "malayalam": "ml", "spanish": "es", "french": "fr"
    }
    lang_code = lang_map.get(target_language.lower(), "en")
    if lang_code == "en": 
        return text

    try:
        translator = GoogleTranslator(source='auto', target=lang_code)
        
        # deep-translator handles up to 5000 chars. We chunk at 4000 to be safe.
        max_chunk = 4000
        if len(text) > max_chunk:
            chunks = []
            sentences = re.split(r'(?<=[.!?\n])\s+', text)
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk) + len(sentence) > max_chunk:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = sentence
                else:
                    current_chunk += " " + sentence if current_chunk else sentence
            if current_chunk:
                chunks.append(current_chunk)
            
            translated_parts = []
            for chunk in chunks:
                if chunk.strip():
                    translated_parts.append(translator.translate(chunk))
            return "\n\n".join(translated_parts)
        else:
            return translator.translate(text)
    except Exception as e:
        print(f"[VidyAstra] GoogleTranslator error: {e}")
        return text # fallback to english

def _translate_json_dict(data, target_language: str, skip_keys=None):
    """Recursively translate all string values in a JSON dictionary/list using batch translation.
    skip_keys: set of dictionary keys whose values should NOT be translated (e.g. 'correct_answer', 'speaker').
    """
    if target_language.lower() == "english":
        return data
        
    lang_map = {
        "english": "en", "hindi": "hi", "tamil": "ta", "telugu": "te",
        "kannada": "kn", "malayalam": "ml", "spanish": "es", "french": "fr"
    }
    lang_code = lang_map.get(target_language.lower(), "en")
    if lang_code == "en": 
        return data

    if skip_keys is None:
        skip_keys = set()

    strings_to_translate = []
    
    # Pass 1: Extract translatable strings (skipping structural keys)
    def extract_strings(item, current_key=None):
        if current_key and current_key in skip_keys:
            return  # skip this value entirely
        if isinstance(item, str) and item.strip():
            strings_to_translate.append(item)
        elif isinstance(item, list):
            for x in item:
                extract_strings(x)
        elif isinstance(item, dict):
            for k, v in item.items():
                extract_strings(v, current_key=k)

    extract_strings(data)
    
    if not strings_to_translate:
        return data

    # Translate in one batch
    try:
        translator = GoogleTranslator(source='auto', target=lang_code)
        translated_strings = translator.translate_batch(strings_to_translate)
    except Exception as e:
        print(f"[VidyAstra] Batch translate error: {e}")
        return data  # fallback to english

    # Pass 2: Reconstruct with translated strings
    translation_iter = iter(translated_strings)
    
    def reconstruct(item, current_key=None):
        if current_key and current_key in skip_keys:
            return item  # return original value unchanged
        if isinstance(item, str):
            if item.strip():
                try:
                    t = next(translation_iter)
                    return t if t else item
                except StopIteration:
                    return item
            return item
        elif isinstance(item, list):
            return [reconstruct(x) for x in item]
        elif isinstance(item, dict):
            return {k: reconstruct(v, current_key=k) for k, v in item.items()}
        else:
            return item
            
    return reconstruct(data)


# ── ChromaDB Vector Store ─────────────────────────────────────────────────
_chroma_collection = None

def _get_chroma():
    global _chroma_collection
    if _chroma_collection is not None:
        return _chroma_collection
    try:
        import chromadb
        chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        _chroma_collection = chroma_client.get_or_create_collection(
            name="vidyastra_docs",
            metadata={"hnsw:space": "cosine"}
        )
        return _chroma_collection
    except Exception as e:
        print(f"[VidyAstra] ChromaDB init failed: {e}")
        return None


def add_document_to_store(doc_id: int, filename: str, chunks: List[str]):
    """Add document chunks to ChromaDB."""
    collection = _get_chroma()
    if collection:
        ids = []
        metadatas = []
        embeddings = []
        for i, chunk in enumerate(chunks):
            emb = _get_embedding(chunk)
            ids.append(f"doc{doc_id}_chunk{i}")
            metadatas.append({"doc_id": doc_id, "filename": filename, "chunk_idx": i})
            embeddings.append(emb)
        collection.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
        print(f"[VidyAstra] Indexed {len(chunks)} chunks from '{filename}'.")


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> list:
    """Retrieve relevant chunks from ChromaDB."""
    collection = _get_chroma()
    if collection and collection.count() > 0:
        query_emb = _get_embedding(query)
        results = collection.query(query_embeddings=[query_emb], n_results=min(top_k, collection.count()))
        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            chunks.append({
                "text": doc,
                "filename": meta.get("filename", "Unknown"),
                "chunk_idx": meta.get("chunk_idx", 0)
            })
        return chunks
    return []


def _extract_json(text: str):
    """Robustly extract JSON from LLM output, handling markdown code blocks and partial JSON."""
    text = text.strip()
    
    # Strip markdown code blocks
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        parts = text.split("```")
        if len(parts) >= 3:
            text = parts[1].strip()
    
    # Try direct parse first
    try:
        return json.loads(text)
    except:
        pass
    
    # Try regex to find JSON object or array
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
    
    match = re.search(r'(\[.*\])', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
    
    # Try to fix truncated JSON by closing brackets
    for suffix in ['"}]}', '"}]', '"]', '"}', '}]', ']', '}']:
        try:
            return json.loads(text + suffix)
        except:
            continue
    
    raise ValueError("Could not parse JSON from LLM output.")


# ── Public AI Functions ───────────────────────────────────────────────────

def generate_ai_response(query: str, level: str = "Intermediate", language: str = "English") -> dict:
    """Generate a RAG-powered AI response."""
    chunks = retrieve_relevant_chunks(query, top_k=5)
    has_context = len(chunks) > 0
    citations = []
    if has_context:
        seen = set()
        for c in chunks:
            if c["filename"] not in seen:
                citations.append({"source": c["filename"], "page": c["chunk_idx"] + 1})
                seen.add(c["filename"])

    context_text = "\n".join([c["text"][:600] for c in chunks]) if chunks else ""
    
    # We ask the LLM to write in English for maximum reliability, then translate.
    prompt = f"""Answer this question concisely and factually. Do NOT use markdown formatting like ** or ##. Use plain English text only.
{("Context: " + context_text[:2000]) if context_text else ""}
Question: {query}"""

    reply = _call_llm(prompt, max_tokens=600)
    if not reply:
        raise Exception("AI failed to respond. Ollama may be overloaded.")
    
    reply = _clean_markdown(reply)
    
    # Translate natively via API
    if language.lower() != "english":
        reply = translate_text(reply, language)
        
    return {"reply": reply, "confidence_score": 0.85 if has_context else 0.6, "citations": citations, "level": level}


def generate_quiz(topic: str, num_questions: int = 8, level: str = "Intermediate", language: str = "English") -> list:
    chunks = retrieve_relevant_chunks(topic, top_k=8)
    context = "\n".join([c["text"][:500] for c in chunks]) if chunks else ""

    # Force English for reliable JSON generation
    prompt = f"""You are a strict JSON quiz generator. Generate exactly {num_questions} high-quality, highly accurate multiple choice questions covering the A-to-Z of "{topic}".
Make the questions real-world, highly informative, and inspired by technical interviews (like LeetCode, NeetCode, or GitHub technical questions) if applicable.
{("Use ONLY this specific document material to create fact-based questions: " + context[:2500]) if context else ""}
Do NOT use outside knowledge. 

Each question MUST have exactly 4 options: exactly 1 correct option and exactly 3 different incorrect options.
The correct_answer field must be the integer index (0-3) of the correct option.
The explanation field MUST ONLY justify the correct option and explain why it is correct. Do NOT explain or justify the wrong options.

IMPORTANT: Output ONLY valid JSON in English. Use this EXACT format:
{{"items": [
  {{"question": "What is machine learning?", "options": ["A subset of AI", "A programming language", "A database", "An operating system"], "correct_answer": 0, "explanation": "Machine learning is a subset of artificial intelligence."}}
]}}"""

    for attempt in range(3):
        reply = _call_llm(prompt, json_mode=True, max_tokens=2000)
        if not reply:
            continue
        try:
            parsed = _extract_json(reply)
            items = parsed.get("items", parsed) if isinstance(parsed, dict) else parsed
            if isinstance(items, list) and len(items) > 0:
                valid = []
                for item in items:
                    if isinstance(item, dict) and "question" in item and "options" in item:
                        # Ensure correct_answer is an int (Pydantic schema expects int)
                        try:
                            item["correct_answer"] = int(item.get("correct_answer", 0))
                        except (ValueError, TypeError):
                            item["correct_answer"] = 0
                        if "explanation" not in item:
                            item["explanation"] = ""
                            
                        item["question"] = _clean_markdown(item["question"])
                        item["explanation"] = _clean_markdown(item["explanation"])
                        valid.append(item)
                if valid:
                    # Translate but skip structural keys
                    translated_valid = _translate_json_dict(
                        valid[:num_questions], language,
                        skip_keys={"correct_answer"}
                    )
                    # Ensure correct_answer stays int after translation
                    for item in translated_valid:
                        try:
                            item["correct_answer"] = int(item["correct_answer"])
                        except (ValueError, TypeError):
                            item["correct_answer"] = 0
                    return translated_valid
        except Exception as e:
            print(f"[VidyAstra] Quiz parse attempt {attempt+1} failed: {e}")
            continue
    raise Exception("Failed to generate quiz. Please try a different topic.")


def generate_flashcards(topic: str, count: int = 8, language: str = "English") -> list:
    chunks = retrieve_relevant_chunks(topic, top_k=8)
    context = "\n".join([c["text"][:500] for c in chunks]) if chunks else ""

    # Force English JSON
    prompt = f"""Generate exactly {count} detailed educational flashcards covering the key concepts of "{topic}". 
{("Extract specific definitions and facts ONLY from this material: " + context[:2500]) if context else ""}
Do NOT use outside knowledge. The flashcards must be based entirely on the provided text.

IMPORTANT: Output ONLY valid JSON in English. No text before or after:
{{"items": [{{"front": "What is X?", "back": "X is defined as..."}}]}}"""

    for attempt in range(3):
        reply = _call_llm(prompt, json_mode=True, max_tokens=1500)
        if not reply:
            continue
        try:
            parsed = _extract_json(reply)
            items = parsed.get("items", parsed) if isinstance(parsed, dict) else parsed
            if isinstance(items, list) and len(items) > 0:
                valid = []
                for item in items:
                    if isinstance(item, dict) and "front" in item and "back" in item:
                        item["front"] = _clean_markdown(str(item["front"]))
                        item["back"] = _clean_markdown(str(item["back"]))
                        valid.append(item)
                if valid:
                    translated_valid = _translate_json_dict(valid[:count], language)
                    return translated_valid
        except Exception as e:
            print(f"[VidyAstra] Flashcard parse attempt {attempt+1} failed: {e}")
            continue
    raise Exception("Failed to generate flashcards. Please try a different topic.")


def generate_summary(text: str, level: str = "Intermediate") -> str:
    prompt = f"""Act as an expert, patient tutor. Simplify the following text. Do NOT use any markdown formatting (no **, no ##, no ` symbols). Use plain text only.

Follow these steps:
1. Core Idea: In one sentence, tell me the main point.
2. Plain-English Rewrite: Paraphrase replacing all jargon with simple words.
3. Break It Down: Rewrite complex sentences into 2-3 shorter ones.
4. Real-World Analogy: Give one relatable real-life analogy.
5. Key Terms Glossary: List 3-4 important words with simple definitions.

Rules:
- Break long sentences into simple statements.
- Replace dense academic words with everyday synonyms.
- Never omit the core truth, only reduce cognitive load.

Text to simplify:
{text[:2000]}"""
    reply = _call_llm(prompt, max_tokens=800)
    if not reply:
        raise Exception("Failed to generate summary.")
    return _clean_markdown(reply)


# ── UNIQUE FEATURES ───────────────────────────────────────────────────────

def explain_like(text: str, mode: str = "teacher") -> str:
    mode_prompts = {
        "5-year-old": "Explain like I'm 5. Simple words, fun analogies.",
        "storyteller": "Explain as a short story.",
        "meme-lord": "Explain with humor and memes.",
        "interviewer": "Explain for a job interview.",
        "teacher": "Explain step-by-step like a teacher.",
        "poet": "Explain as a short poem.",
    }
    instruction = mode_prompts.get(mode, mode_prompts["teacher"])
    prompt = f"""{instruction} Do NOT use markdown formatting (no **, no ##). Use plain text only.

Topic: {text[:1500]}"""
    reply = _call_llm(prompt, max_tokens=500)
    if not reply:
        raise Exception("Failed to generate explanation.")
    return _clean_markdown(reply)


def generate_mind_map(topic: str) -> str:
    prompt = f"""Create a Mermaid flowchart diagram for "{topic}" using a top-down tree structure.
Start the diagram with 'graph TD', then define nodes.
Do NOT output anything except the raw mermaid code. No markdown code blocks, no explanations.

Example format:
graph TD
  A["Machine Learning"] --> B["Supervised"]
  A --> C["Unsupervised"]
  B --> D["Regression"]
  B --> E["Classification"]
"""
    reply = _call_llm(prompt, max_tokens=600)
    if not reply:
        raise Exception("Failed to generate mind map.")
    # Strip any markdown code blocks that the LLM might have added
    reply = reply.replace("```mermaid", "").replace("```", "").strip()
    return reply


def generate_study_plan(topic: str, days: int = 7) -> str:
    prompt = f"""Create a {days}-day study plan for "{topic}". Include daily topics and time estimates. Do NOT use markdown formatting. Use plain text only."""
    reply = _call_llm(prompt, max_tokens=500)
    if not reply:
        raise Exception("Failed to generate study plan.")
    return _clean_markdown(reply)


def generate_podcast_script(topic: str) -> list:
    # Increased top_k to 8 to pull much more information for a deeper podcast script
    chunks = retrieve_relevant_chunks(topic, top_k=8)
    context = "\n".join([c["text"][:500] for c in chunks]) if chunks else ""

    prompt = f"""You are generating an AI Podcast script. Dive directly into the core concepts and make it highly informative and educational about the topic "{topic}".
{("Use this specific document material: " + context[:2500]) if context else ""}
CRITICAL: Do NOT mention "the document", "the PDF", "the file", or the document's name. Speak directly about the subject matter.
Ensure deep, factual coverage of the concepts.

The speakers are "Host" and "Expert". Write 6 dialogue lines that deeply explore the content. Do NOT use markdown.
IMPORTANT: Output ONLY valid JSON:
{{"script": [
  {{"speaker": "Host", "text": "Welcome! Today we are discussing a fascinating topic..."}},
  {{"speaker": "Expert", "text": "Thanks for having me. The core concept is..."}}
]}}"""
    for attempt in range(3):
        reply = _call_llm(prompt, json_mode=True, max_tokens=1500)
        if not reply:
            continue
        try:
            parsed = _extract_json(reply)
            script = parsed.get("script", parsed) if isinstance(parsed, dict) else parsed
            if isinstance(script, list) and len(script) > 0:
                for line in script:
                    if "text" in line:
                        line["text"] = _clean_markdown(str(line["text"]))
                return script
        except Exception as e:
            print(f"[VidyAstra] Podcast parse attempt {attempt+1} failed: {e}")
            continue
    raise Exception("Failed to generate podcast script.")


def generate_career_mapping(topic: str) -> str:
    # Increased top_k to 8 for deeper context
    chunks = retrieve_relevant_chunks(topic, top_k=8)
    context = "\n".join([c["text"][:500] for c in chunks]) if chunks else ""

    prompt = f"""Explain IN DETAIL how the concepts of "{topic}" apply to 3 specific real-world careers.
{("Use ONLY the following facts and material from the document: " + context[:3000]) if context else ""}
Do NOT include any outside knowledge not supported by the document.

For each career, write a dedicated paragraph explaining exactly how they use these concepts daily.
Do NOT use markdown formatting (no **, no ##). Use plain text with clear bullet points using dashes (-)."""
    reply = _call_llm(prompt, max_tokens=1000)
    if not reply:
        raise Exception("Failed to generate career mapping.")
    return _clean_markdown(reply)


def draft_professional_text(context: str, format_type: str = "email") -> str:
    if format_type.lower() == "concept explanation":
        prompt = f"""Write a highly technical and detailed concept explanation based on: {context[:1500]}. 
Focus on theoretical definitions, underlying mechanics, and academic clarity. Do NOT use markdown formatting."""
    elif format_type.lower() == "report summary":
        prompt = f"""Write an executive report summary based on: {context[:1500]}. 
Focus on key findings, actionable insights, and business impact. Use bullet points (dashes). Do NOT use markdown formatting."""
    else:
        prompt = f"""Draft a professional {format_type} based on: {context[:1500]}
Do NOT use markdown formatting. Use plain text only."""
        
    reply = _call_llm(prompt, max_tokens=700)
    if not reply:
        raise Exception("Failed to draft text.")
    return _clean_markdown(reply)

def simulate_interview(role: str) -> str:
    prompt = f"""You are an expert technical interviewer. Generate 5 highly realistic interview questions for a "{role}" position.
For each question, provide the EXACT answer the user should give to impress the interviewer.
Format as:
Q1: [Question]
Ideal Answer: [Exact answer to say]

Do NOT use markdown formatting (no **, no ##). Use plain text only."""
    reply = _call_llm(prompt, max_tokens=1000)
    if not reply:
        raise Exception("Failed to simulate interview.")
    return _clean_markdown(reply)

def review_logic(code_or_text: str) -> str:
    prompt = f"""Act as a Senior Engineer reviewing this code/logic. 
1. Identify any bugs or optimizations.
2. Explain DEEPLY *why* certain features or patterns are used here.
3. Provide knowing information about the underlying logic.

Do NOT use markdown formatting (no **, no ##). Use plain text only.

{code_or_text[:2000]}"""
    reply = _call_llm(prompt, max_tokens=500)
    if not reply:
        raise Exception("Failed to generate review.")
    return _clean_markdown(reply)
