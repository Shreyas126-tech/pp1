"""Comprehensive test of all VidyAstra features."""
import sys, os, json
sys.path.append(os.path.dirname(__file__))
os.environ["PYTHONIOENCODING"] = "utf-8"

from app.services.ai_pipeline import (
    translate_text, generate_quiz, generate_flashcards, 
    generate_podcast_script, generate_mind_map,
    explain_like, simulate_interview, review_logic, draft_professional_text
)

results = {}
failed = []

# Test 1: Translation
print("[TEST 1] Translation to Hindi...")
try:
    hindi = translate_text("Machine learning is a subset of artificial intelligence.", "Hindi")
    results["translation"] = hindi[:100]
    print(f"  -> OK: {hindi[:60]}...")
except Exception as e:
    results["translation"] = f"ERROR: {e}"
    failed.append("Translation")
    print(f"  -> FAIL: {e}")

# Test 2: Quiz (8 items)
print("[TEST 2] Quiz (8 items)...")
try:
    quiz = generate_quiz("Python programming", num_questions=8)
    results["quiz"] = f"{len(quiz)} questions"
    for i, q in enumerate(quiz[:2]):
        ca = q.get("correct_answer")
        assert isinstance(ca, int), f"correct_answer is {type(ca).__name__}"
    print(f"  -> OK: {len(quiz)} questions, correct_answer types valid")
except Exception as e:
    results["quiz"] = f"ERROR: {e}"
    failed.append("Quiz")
    print(f"  -> FAIL: {e}")

# Test 3: Flashcards (8 items)
print("[TEST 3] Flashcards (8 items)...")
try:
    cards = generate_flashcards("Neural Networks", count=8)
    results["flashcards"] = f"{len(cards)} cards"
    print(f"  -> OK: {len(cards)} cards")
except Exception as e:
    results["flashcards"] = f"ERROR: {e}"
    failed.append("Flashcards")
    print(f"  -> FAIL: {e}")

# Test 4: Podcast
print("[TEST 4] Podcast...")
try:
    podcast = generate_podcast_script("Artificial Intelligence")
    results["podcast"] = f"{len(podcast)} lines"
    # Verify no line mentions "document" or "PDF"
    for line in podcast:
        text_lower = line.get("text", "").lower()
        if "document" in text_lower or "pdf" in text_lower:
            print(f"  WARNING: Podcast mentions 'document' or 'PDF'")
    print(f"  -> OK: {len(podcast)} lines")
except Exception as e:
    results["podcast"] = f"ERROR: {e}"
    failed.append("Podcast")
    print(f"  -> FAIL: {e}")

# Test 5: Mind Map (Mermaid)
print("[TEST 5] Mind Map (Mermaid)...")
try:
    mermaid = generate_mind_map("Data Structures")
    results["mindmap"] = mermaid[:200]
    assert "mindmap" in mermaid.lower() or "root" in mermaid.lower(), "No mermaid syntax found"
    print(f"  -> OK: {len(mermaid)} chars")
except Exception as e:
    results["mindmap"] = f"ERROR: {e}"
    failed.append("MindMap")
    print(f"  -> FAIL: {e}")

# Test 6: Explain Like
print("[TEST 6] Explain Like (teacher)...")
try:
    exp = explain_like("Quantum computing uses qubits", "teacher")
    results["explain"] = exp[:100]
    print(f"  -> OK: {len(exp)} chars")
except Exception as e:
    results["explain"] = f"ERROR: {e}"
    failed.append("Explain")
    print(f"  -> FAIL: {e}")

# Test 7: Interview Simulator
print("[TEST 7] Interview Simulator...")
try:
    interview = simulate_interview("React Developer")
    results["interview"] = interview[:100]
    print(f"  -> OK: {len(interview)} chars")
except Exception as e:
    results["interview"] = f"ERROR: {e}"
    failed.append("Interview")
    print(f"  -> FAIL: {e}")

# Test 8: Draft
print("[TEST 8] Draft (concept explanation)...")
try:
    draft = draft_professional_text("Machine learning algorithms", "concept explanation")
    results["draft"] = draft[:100]
    print(f"  -> OK: {len(draft)} chars")
except Exception as e:
    results["draft"] = f"ERROR: {e}"
    failed.append("Draft")
    print(f"  -> FAIL: {e}")

# Summary
print(f"\n{'='*50}")
print(f"RESULTS: {8 - len(failed)}/8 passed")
if failed:
    print(f"FAILED: {', '.join(failed)}")
else:
    print("ALL TESTS PASSED!")

with open("test_comprehensive.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Results written to test_comprehensive.json")
