"""
DukaanBot Bulk FAQ Generator & Chat Log Extractor
Parses raw text / WhatsApp logs, extracts structured Q&A pairs via LLM / Regex,
and saves them to the shop's FAQ knowledge base.
"""
import re
import json
from typing import List, Dict, Any
from database import insert_faq
from rag_engine import openai_client, LLM_MODEL

def scrub_pii(text: str) -> str:
    """Mask phone numbers and UPI IDs for privacy guardrails."""
    text = re.sub(r'(\+91[\-\s]?)?[6-9]\d{9}', '[PHONE_REDACTED]', text)
    text = re.sub(r'[\w\.-]+@[\w\.-]+', '[UPI_REDACTED]', text)
    return text

def extract_faqs_with_llm(raw_text: str) -> List[Dict[str, str]]:
    if not openai_client:
        return []

    clean_text = scrub_pii(raw_text)
    prompt = f"""You are an expert retail FAQ assistant for local Indian shops.
Analyze the following unstructured notes or customer chat messages and extract 4 to 8 clear, standalone Question-Answer pairs for the shop's FAQ bot.

CATEGORIES to classify into: Timings, Delivery, Pricing, Stock, Payments, Location, Services.

TEXT:
{clean_text[:5000]}

Respond ONLY with a valid JSON array of objects in this exact format:
[
  {{
    "question": "Customer question here?",
    "answer": "Clear shopkeeper answer here.",
    "category": "Timings",
    "keywords": "timing, hours, open, close"
  }}
]
"""
    try:
        response = openai_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a JSON-only FAQ extraction system."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        # Strip markdown ```json ... ``` if present
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
    except Exception as e:
        print(f"[Bulk Extraction Error] LLM parsing failed: {e}")

    return []

def extract_faqs_with_heuristics(raw_text: str) -> List[Dict[str, str]]:
    """Heuristic fallback parser using regex dialogue matching."""
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    faqs = []

    patterns = [
        re.compile(r'^(?:\[.*?\]\s*|.*?-\s*)?([^:]+):\s*(.*)$')
    ]

    parsed_msgs = []
    for l in lines:
        for p in patterns:
            m = p.match(l)
            if m:
                parsed_msgs.append({"sender": m.group(1).strip(), "text": m.group(2).strip()})
                break

    for i in range(len(parsed_msgs) - 1):
        m1 = parsed_msgs[i]
        m2 = parsed_msgs[i + 1]
        t1 = m1["text"].lower()

        is_question = "?" in t1 or any(k in t1 for k in ["kya", "kab", "kitne", "rate", "timing", "available", "delivery"])
        if is_question and len(m2["text"]) > 5 and m1["sender"] != m2["sender"]:
            cat = "General"
            if any(k in t1 for k in ["time", "timing", "open", "close", "khul", "band"]):
                cat = "Timings"
            elif any(k in t1 for k in ["deliver", "ghar", "bhejo"]):
                cat = "Delivery"
            elif any(k in t1 for k in ["rate", "price", "daam", "kitne", "₹"]):
                cat = "Pricing"
            elif any(k in t1 for k in ["pay", "upi", "gpay", "phonepe", "cash"]):
                cat = "Payments"
            else:
                cat = "Stock"

            faqs.append({
                "question": m1["text"],
                "answer": m2["text"],
                "category": cat,
                "keywords": ",".join([w for w in re.findall(r'\w+', t1) if len(w) > 3][:4])
            })

    return faqs[:10]

def bulk_generate_and_save(raw_text: str, shop_id: str) -> List[Dict[str, Any]]:
    # 1. Try LLM extraction
    extracted = extract_faqs_with_llm(raw_text)

    # 2. Fallback to heuristic parser if LLM produced nothing
    if not extracted:
        extracted = extract_faqs_with_heuristics(raw_text)

    # 3. Insert into SQLite
    saved_faqs = []
    for item in extracted:
        faq_id = insert_faq(
            shop_id=shop_id,
            question=item.get("question", ""),
            answer=item.get("answer", ""),
            category=item.get("category", "General"),
            keywords=item.get("keywords", "")
        )
        saved_faqs.append({
            "id": faq_id,
            "question": item.get("question", ""),
            "answer": item.get("answer", ""),
            "category": item.get("category", "General")
        })

    return saved_faqs
