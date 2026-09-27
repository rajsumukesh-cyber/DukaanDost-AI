import re
from typing import Dict, Any, List, Optional
from config import settings
from database import get_shop, get_shop_faqs, log_query

class DukaanRAGService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY

    def clean_text(self, text: str) -> str:
        return re.sub(r'[^\w\s\u0900-\u097F₹]', ' ', text.lower()).strip()

    def calculate_similarity(self, query: str, faq: Dict[str, Any]) -> float:
        """
        Lightweight fast token and keyword similarity calculation
        """
        q_tokens = set(self.clean_text(query).split())
        if not q_tokens:
            return 0.0

        faq_text = f"{faq.get('question', '')} {faq.get('question_hi', '')} {faq.get('keywords', '')} {faq.get('category', '')} {faq.get('answer', '')}"
        faq_tokens = set(self.clean_text(faq_text).split())

        intersection = q_tokens.intersection(faq_tokens)
        
        # Check keyword matches
        keywords = [k.strip() for k in faq.get('keywords', '').split(',') if k.strip()]
        kw_hits = sum(1 for kw in keywords if kw.lower() in query.lower())

        score = (len(intersection) / max(len(q_tokens), 1)) * 0.7 + (min(kw_hits, 2) * 0.15)
        return min(1.0, score)

    def retrieve_context(self, query: str, shop_id: str) -> Dict[str, Any]:
        faqs = get_shop_faqs(shop_id)
        best_faq = None
        best_score = 0.0

        for faq in faqs:
            score = self.calculate_similarity(query, faq)
            if score > best_score:
                best_score = score
                best_faq = faq

        return {
            "best_faq": best_faq,
            "score": best_score,
            "all_faqs": faqs
        }

    def generate_response(self, query: str, shop_id: str, customer_phone: str = "", is_voice: bool = False) -> Dict[str, Any]:
        shop = get_shop(shop_id)
        if not shop:
            return {
                "answer": "Dukaan jankari uplabdh nahi hai.",
                "confidence": 0,
                "is_fallback": True
            }

        retrieval = self.retrieve_context(query, shop_id)
        score = retrieval["score"]
        best_faq = retrieval["best_faq"]
        
        threshold = settings.CONFIDENCE_THRESHOLD

        # If we have an LLM key and want generative synthesis:
        if self.api_key and self.api_key != "your_openai_or_groq_api_key_here":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.api_key, base_url=settings.OPENAI_BASE_URL)
                
                faq_context = "\n".join([
                    f"- Question: {f['question']} | Answer: {f['answer']}"
                    for f in retrieval["all_faqs"][:6]
                ])

                prompt = f"""You are 'DukaanDost', an AI assistant for the local Indian shop: '{shop['name']}'.
Shop Owner: {shop['owner']}
Shop Hours: {shop['timings']}
Delivery Info: {shop['delivery_min_order']} min order, {shop['delivery_radius']} radius
UPI ID: {shop['upi_id']}
Address: {shop['address']}

VERIFIED STORE FAQS:
{faq_context}

INSTRUCTIONS:
1. Respond to the customer's question politely and concisely in warm conversational Hinglish (or Hindi if asked in Hindi).
2. ONLY use the verified FAQ information above. NEVER make up products, prices, or policies.
3. If the answer is NOT in the knowledge base, state politely that you will forward the question to {shop['owner']} on WhatsApp.
4. Keep the response under 2-3 sentences.

Customer Question: {query}
"""
                completion = client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a helpful local Indian shop AI assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=150
                )
                answer = completion.choices[0].message.content
                is_fallback = "forward" in answer.lower() or "dukaandar" in answer.lower() or score < threshold

                log_query(shop_id, customer_phone, query, is_voice, best_faq["id"] if best_faq else None, score, is_fallback)
                return {
                    "answer": answer,
                    "confidence": round(score * 100, 1),
                    "is_fallback": is_fallback,
                    "matched_faq": best_faq
                }
            except Exception as e:
                print(f"[RAG LLM Error] {e}. Falling back to rule-based generation.")

        # Deterministic Rule-Based RAG
        if best_faq and score >= threshold:
            answer = best_faq["answer"]
            is_fallback = False
        else:
            answer = f"Maaf kijiye, mujhe iski pakki jankari nahi hai. 🙏 Maine aapka sawal dukaandar ({shop['owner']}) ji ko forward kar diya hai. Wo jald hi WhatsApp par reply karenge!"
            is_fallback = True

        log_query(shop_id, customer_phone, query, is_voice, best_faq["id"] if best_faq else None, score, is_fallback)

        return {
            "answer": answer,
            "confidence": round(score * 100, 1),
            "is_fallback": is_fallback,
            "matched_faq": best_faq
        }

rag_service = DukaanRAGService()
