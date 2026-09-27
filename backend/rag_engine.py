"""
DukaanBot RAG-Lite Engine
Lightweight in-memory semantic retrieval + Groq/Gemini/OpenAI LLM contextual Q&A
Auto-detects customer's language and replies in the exact same language (Hindi, Telugu, Tamil, English, etc.)
"""
import os
import re
from typing import List, Dict, Any, Optional
from database import get_faqs_for_shop, get_shop_by_id

# LLM Configuration (Supports Groq / Gemini / OpenAI via standard OpenAI API format)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "") or os.getenv("GROQ_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

openai_client = None
if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_or_groq_api_key_here":
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
    except Exception as e:
        print(f"[RAG Init Warning] OpenAI client initialization: {e}")

class DukaanBotRAGEngine:
    def __init__(self):
        self.stop_words = {
            "a", "an", "the", "is", "are", "am", "in", "at", "to", "for", "of", "and", "or",
            "kya", "hai", "hain", "ka", "ki", "ke", "ko", "se", "mein", "par", "bhi", "ji",
            "bhaiya", "sir", "namaste", "please", "batao", "bataiye", "hoga", "undi", "undha",
            "irukka", "illaya", "anna", "cheppandi", "sollinga"
        }

        # Intent keywords map for small shops
        self.intent_signals = {
            "timings": ["timing", "timings", "time", "kab", "samay", "open", "close", "khul", "band", "khula", "khulti", "khulega", "hours", "sunday", "eppudu", "eppo", "opening"],
            "delivery": ["delivery", "deliver", "deliv", "home", "ghar", "bhejo", "bhejna", "order", "charge", "free", "doorstep", "deliv"],
            "payments": ["pay", "payment", "upi", "gpay", "googlepay", "phonepe", "paytm", "cash", "qr", "online", "card", "paise", "rupaye"],
            "location": ["location", "address", "pata", "kahan", "jagah", "near", "landmark", "where", "road", "gali", "ikkada", "enga"],
            "pricing": ["price", "rate", "cost", "daam", "kitna", "bhav", "kitne", "rupaye", "rs", "₹", "vila", "dhara", "discount", "offer"],
            "stock": ["stock", "available", "milega", "rakhte", "milta", "hoga", "undi", "undha", "irukka", "paruppu", "atta", "oil", "rice", "dawa", "medicine"]
        }

    def tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        cleaned = re.sub(r"[^\w\s\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF₹]", " ", text.lower())
        return [t for t in cleaned.split() if len(t) > 1 and t not in self.stop_words]

    def compute_similarity(self, query: str, faq: Dict[str, Any]) -> float:
        q_tokens = self.tokenize(query)
        if not q_tokens:
            return 0.0

        corpus = f"{faq.get('question', '')} {faq.get('keywords', '')} {faq.get('category', '')} {faq.get('answer', '')}".lower()
        corpus_tokens = set(self.tokenize(corpus))

        # 1. Exact token overlap
        overlap_count = 0
        for qt in q_tokens:
            if qt in corpus_tokens:
                overlap_count += 1
            # 2. Prefix / stem match (e.g. khul vs khulti/khulne, deliver vs delivery)
            elif len(qt) >= 3 and any(ct.startswith(qt[:3]) or qt.startswith(ct[:3]) for ct in corpus_tokens if len(ct) >= 3):
                overlap_count += 0.8

        base_score = overlap_count / max(len(q_tokens), 1)

        # 3. Intent Cluster Matching
        intent_boost = 0.0
        q_lower = query.lower()
        faq_cat = (faq.get("category") or "").lower()
        faq_kw = (faq.get("keywords") or "").lower()

        for intent, signals in self.intent_signals.items():
            query_has_signal = any(sig in q_lower for sig in signals)
            faq_has_intent = (intent in faq_cat) or any(sig in faq_kw for sig in signals[:4])
            if query_has_signal and faq_has_intent:
                intent_boost = max(intent_boost, 0.40)

        # 4. Explicit keyword boost
        keywords = [k.strip().lower() for k in (faq.get("keywords") or "").split(",") if k.strip()]
        kw_hits = sum(1 for kw in keywords if kw in q_lower)
        kw_boost = min(kw_hits * 0.20, 0.35)

        total_score = min(1.0, (base_score * 0.45) + intent_boost + kw_boost)
        return round(total_score, 3)

    def retrieve_top_faqs(self, query: str, shop_id: str, limit: int = 3) -> tuple[List[Dict[str, Any]], float]:
        faqs = get_faqs_for_shop(shop_id)
        if not faqs:
            return [], 0.0

        scored = []
        for faq in faqs:
            score = self.compute_similarity(query, faq)
            scored.append((score, faq))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = [item[1] for item in scored[:limit]]
        top_score = scored[0][0] if scored else 0.0

        return top_matches, top_score

    def detect_language_simple(self, text: str) -> str:
        # Check unicode ranges
        for ch in text:
            if '\u0900' <= ch <= '\u097F':
                return 'hi' # Hindi / Devanagari
            if '\u0C00' <= ch <= '\u0C7F':
                return 'te' # Telugu
            if '\u0B80' <= ch <= '\u0BFF':
                return 'ta' # Tamil
        
        # Check vernacular Hinglish / Tamil / Telugu romanized keywords
        t = text.lower()
        if any(w in t for w in ["kya", "hai", "dukaan", "kitne", "bhaiya", "kaise", "samay", "khula", "rate"]):
            return 'hinglish'
        if any(w in t for w in ["undha", "cheppandi", "eppudu", "dhara", "shop"]):
            return 'telugu'
        if any(w in t for w in ["irukka", "sollinga", "eppo", "vila", "anna"]):
            return 'tamil'
        return 'en'

    def answer_query(self, query: str, shop_id: str) -> Dict[str, Any]:
        shop = get_shop_by_id(shop_id)
        if not shop:
            return {
                "answer": "Shop details not found.",
                "language": "en",
                "confidence": 0.0,
                "is_fallback": True,
                "matched_faq": None
            }

        top_faqs, confidence = self.retrieve_top_faqs(query, shop_id)
        detected_lang = self.detect_language_simple(query)
        CONFIDENCE_THRESHOLD = 0.40

        # Fallback check
        if confidence < CONFIDENCE_THRESHOLD or not top_faqs:
            fallback_msgs = {
                "hi": f"माफ़ कीजिए, मुझे इसकी जानकारी नहीं है। कृपया दुकानदार ({shop['owner']}) जी से सीधे संपर्क करें।",
                "te": f"క్షమించండి, నాకు ఈ సమాచారం తెలియదు. దయచేసి దుకాణదారుడిని ({shop['owner']}) నేరుగా సంప్రదించండి.",
                "ta": f"மன்னிக்கவும், எனக்கு இந்த தகவல் தெரியவில்லை. கடைக்காரரை ({shop['owner']}) நேரடியாக தொடர்பு கொள்ளவும்.",
                "hinglish": f"Maaf kijiye, mujhe iski pakki jankari nahi hai. Kripya dukaandar ({shop['owner']}) ji se seedhe call/WhatsApp par baat karein.",
                "en": f"Sorry, I don't have information on this. Please connect directly with the shop owner ({shop['owner']})."
            }
            msg = fallback_msgs.get(detected_lang, fallback_msgs["en"])
            return {
                "answer": msg,
                "language": detected_lang,
                "confidence": round(confidence * 100, 1),
                "is_fallback": True,
                "shop_owner": shop["owner"],
                "shop_phone": shop["phone"],
                "matched_faq": None
            }

        # Generative contextual answer using LLM
        best_faq = top_faqs[0]

        if openai_client:
            faq_context = "\n".join([
                f"- Q: {f['question']} | A: {f['answer']} (Category: {f.get('category', 'General')})"
                for f in top_faqs
            ])

            prompt = f"""You are the friendly multilingual voice & chat assistant for the local shop: '{shop['name']}'.
Shop Owner: {shop['owner']}
Shop Hours: {shop.get('timings', '')}
Delivery Info: {shop.get('delivery_rules', '')}
Address: {shop.get('address', '')}
UPI: {shop.get('upi_id', '')}

VERIFIED SHOP FAQS:
{faq_context}

CUSTOMER QUERY:
"{query}"

INSTRUCTIONS:
1. Detect the customer's language and respond in the EXACT same language (e.g. Hindi, Telugu, Tamil, Hinglish, English).
2. Answer concisely in 1-2 friendly sentences.
3. Base your answer strictly on the verified FAQs above. Never invent products or prices.
4. If asked to buy/order, guide them on delivery terms or contacting the shop."""

            try:
                response = openai_client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a concise, helpful local Indian shop AI assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=150
                )
                answer_text = response.choices[0].message.content.strip()
                return {
                    "answer": answer_text,
                    "language": detected_lang,
                    "confidence": round(confidence * 100, 1),
                    "is_fallback": False,
                    "shop_owner": shop["owner"],
                    "shop_phone": shop["phone"],
                    "matched_faq": best_faq
                }
            except Exception as e:
                print(f"[RAG LLM Error] {e}. Using deterministic answer.")

        # Deterministic Answer (No LLM key)
        return {
            "answer": best_faq["answer"],
            "language": detected_lang,
            "confidence": round(confidence * 100, 1),
            "is_fallback": False,
            "shop_owner": shop["owner"],
            "shop_phone": shop["phone"],
            "matched_faq": best_faq
        }

rag_engine = DukaanBotRAGEngine()
