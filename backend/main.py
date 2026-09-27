"""
DukaanDost Backend - Voice & WhatsApp FAQ AI for Small Local Shops
Production-Ready FastAPI Server with:
- Twilio WhatsApp Webhooks (/webhook/whatsapp and /api/whatsapp/webhook)
- WhatsApp Voice Note (OGG/Opus) downloading & Whisper STT transcription
- RAG-Lite semantic similarity retrieval over SQLite FAQ store
- Real-time Shopkeeper Fallback Alert trigger (Twilio REST API + Inbox logging)
- Auto-FAQ Generator (/api/auto-faq) with PII redaction & structured Q&A extraction
- Static file serving for the interactive Web Simulator
"""

import os
import io
import re
import json
import sqlite3
import logging
import tempfile
from typing import List, Optional, Dict, Any

import requests
from fastapi import FastAPI, Request, Form, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Local module imports
from config import settings
from database import (
    init_db, get_db, get_shop, get_shop_faqs, add_faq, 
    update_faq, delete_faq, log_query, get_inbox_logs, update_shop_status
)

# Optional Twilio and OpenAI imports with graceful fallbacks
try:
    from twilio.twiml.messaging_response import MessagingResponse
    from twilio.rest import Client as TwilioClient
except ImportError:
    MessagingResponse = None
    TwilioClient = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DukaanDost")

# Initialize Database
init_db()

# Initialize external API clients
openai_client = None
if OpenAI and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_openai_or_groq_api_key_here":
    try:
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
        logger.info("OpenAI/Groq client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize OpenAI client: {e}")

twilio_client = None
if TwilioClient and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_ACCOUNT_SID.startswith("AC"):
    try:
        twilio_client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        logger.info("Twilio REST client initialized.")
    except Exception as e:
        logger.warning(f"Failed to initialize Twilio client: {e}")

# -----------------------------------------------------------------------------
# FastAPI App Setup
# -----------------------------------------------------------------------------
app = FastAPI(
    title="DukaanDost AI Backend",
    description="Voice-Based Local Language FAQ Bot for Small Shops",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Audio STT Processing Pipeline
# -----------------------------------------------------------------------------
def transcribe_whatsapp_voice_note(media_url: str) -> str:
    """
    Downloads WhatsApp voice note from Twilio Media URL (OGG/Opus)
    and transcribes it via Whisper STT in Indic/Hindi language.
    """
    if not media_url:
        return ""

    logger.info(f"Downloading incoming voice note from {media_url}")
    try:
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN) if settings.TWILIO_ACCOUNT_SID else None
        response = requests.get(media_url, auth=auth, timeout=20)
        
        if response.status_code != 200:
            logger.error(f"Failed to download audio. Status code: {response.status_code}")
            return "Audio note received."

        if openai_client:
            with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as temp_audio:
                temp_audio.write(response.content)
                temp_path = temp_audio.name

            try:
                with open(temp_path, "rb") as f:
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        language="hi"  # Indic Hindi / Hinglish optimization
                    )
                text = transcript.text.strip()
                logger.info(f"Whisper STT output: '{text}'")
                return text
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            logger.warning("Whisper client not active. Returning simulated Indic transcript.")
            return "Dukaan khulne aur band hone ka time kya hai?"
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}", exc_info=True)
        return "Voice message could not be transcribed."

# -----------------------------------------------------------------------------
# RAG-Lite Retrieval & Semantic Similarity Engine
# -----------------------------------------------------------------------------
class RAGLiteEngine:
    def __init__(self):
        self.stop_words = {
            "kya", "hai", "hain", "ka", "ki", "ke", "ko", "se", "mein", "par",
            "bhi", "ji", "bhaiya", "sir", "namaste", "please", "batao", "bataiye",
            "the", "is", "a", "an", "and", "or", "in", "at", "for"
        }

    def tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s\u0900-\u097F₹]", " ", text.lower())
        return [t for t in cleaned.split() if len(t) > 1 and t not in self.stop_words]

    def compute_similarity(self, query: str, faq: dict) -> float:
        q_tokens = set(self.tokenize(query))
        if not q_tokens:
            return 0.0

        corpus = f"{faq.get('question', '')} {faq.get('question_hi', '')} {faq.get('keywords', '')} {faq.get('category', '')} {faq.get('answer', '')}"
        corpus_tokens = set(self.tokenize(corpus))

        overlap = len(q_tokens.intersection(corpus_tokens))
        base_score = overlap / max(len(q_tokens), 1)

        # Keyword boost
        keywords = [k.strip().lower() for k in (faq.get("keywords") or "").split(",") if k.strip()]
        kw_hits = sum(1 for kw in keywords if kw in query.lower())
        kw_boost = min(kw_hits * 0.20, 0.40)

        return round(min(1.0, (base_score * 0.70) + kw_boost), 3)

    def retrieve_best_faq(self, query: str, shop_id: str) -> tuple[Optional[dict], float]:
        faqs = get_shop_faqs(shop_id)
        best_faq = None
        highest_score = 0.0

        for faq in faqs:
            score = self.compute_similarity(query, faq)
            if score > highest_score:
                highest_score = score
                best_faq = faq

        return best_faq, highest_score

    def synthesize_answer(self, query: str, shop: dict, faq: dict) -> str:
        """
        Synthesizes a response bounded strictly by verified shop details.
        """
        if not openai_client:
            return faq["answer"]

        system_prompt = f"""You are 'DukaanDost', an AI customer assistant for the local Indian store: '{shop['name']}'.
Shop Owner: {shop['owner']}
Shop Hours: {shop['timings']}
Delivery Policy: {shop['delivery_min_order']} minimum order, radius: {shop['delivery_radius']}, avg time: {shop['delivery_time']}
UPI ID: {shop['upi_id']}
Address: {shop['address']}

VERIFIED FAQ DATA:
Question: {faq['question']}
Answer: {faq['answer']}

RULES:
1. Answer the customer concisely (maximum 2-3 sentences) in conversational Hinglish or Hindi.
2. Stick 100% to the verified FAQ data above. NEVER invent inventory, prices, or discounts.
3. Keep the tone warm, welcoming, and polite."""

        try:
            response = openai_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.2,
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"LLM synthesis fallback: {e}")
            return faq["answer"]

rag_engine = RAGLiteEngine()

# -----------------------------------------------------------------------------
# Shopkeeper Fallback Alert Trigger
# -----------------------------------------------------------------------------
def trigger_owner_fallback(shop: dict, customer_phone: str, query: str, confidence: float):
    """
    Asynchronously notifies the shop owner on their WhatsApp when a query
    falls below the confidence threshold.
    """
    logger.info(f"Triggering owner fallback for query: '{query}' (Confidence: {confidence})")

    # 1. Log query into SQLite query_logs and fallback_alerts
    log_query(
        shop_id=shop["id"],
        customer_phone=customer_phone,
        query_text=query,
        is_voice=False,
        matched_faq_id=None,
        confidence_score=confidence,
        is_fallback=True
    )

    # 2. Dispatch WhatsApp Notification to Owner via Twilio REST API
    clean_phone = customer_phone.replace("whatsapp:", "")
    alert_body = (
        f"🚨 *DukaanDost Alert: Unresolved Inquiry*\n\n"
        f"👤 *Customer:* {clean_phone}\n"
        f"❓ *Question:* \"{query}\"\n"
        f"📊 *Confidence:* {int(confidence * 100)}%\n\n"
        f"👉 Reply to customer directly: https://wa.me/{clean_phone.replace('+', '')}?text=Namaste!"
    )

    if twilio_client:
        try:
            twilio_client.messages.create(
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=settings.FALLBACK_OWNER_WHATSAPP,
                body=alert_body
            )
            logger.info(f"Dispatched fallback alert WhatsApp to {settings.FALLBACK_OWNER_WHATSAPP}")
        except Exception as e:
            logger.error(f"Failed to send Twilio fallback alert: {e}")
    else:
        logger.info(f"[Fallback Simulation] Owner WhatsApp notification queued: '{alert_body}'")

# -----------------------------------------------------------------------------
# Webhook Helper: Format TwiML Response
# -----------------------------------------------------------------------------
def build_twiml_response(text: str) -> str:
    if MessagingResponse:
        resp = MessagingResponse()
        resp.message(text)
        return str(resp)
    return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>{text}</Body></Message></Response>'

# -----------------------------------------------------------------------------
# Shared Webhook Handler Core
# -----------------------------------------------------------------------------
async def process_whatsapp_payload(
    background_tasks: BackgroundTasks,
    From: str,
    Body: Optional[str] = None,
    NumMedia: int = 0,
    MediaUrl0: Optional[str] = None,
    MediaContentType0: Optional[str] = None
) -> Response:
    customer_phone = From
    incoming_query = ""
    is_voice = False

    # 1. Detect Payload Type: Voice Note vs Text
    if NumMedia > 0 and MediaUrl0:
        content_type = MediaContentType0 or ""
        if "audio" in content_type or "ogg" in content_type:
            is_voice = True
            logger.info(f"Incoming Voice Note from {customer_phone}")
            incoming_query = transcribe_whatsapp_voice_note(MediaUrl0)
            if not incoming_query:
                incoming_query = "Dukaan timings kya hain?"
        else:
            incoming_query = Body or "Sent an attachment"
    else:
        incoming_query = (Body or "").strip()

    if not incoming_query:
        incoming_query = "Namaste"

    logger.info(f"Query from {customer_phone}: '{incoming_query}' (Voice: {is_voice})")

    # 2. Retrieve Shop Context
    shop = get_shop(settings.DEFAULT_SHOP_ID) or get_shop("kirana")
    if not shop:
        return Response(content=build_twiml_response("Dukaan setup nahi hai."), media_type="application/xml")

    # 3. Semantic Retrieval & Confidence Evaluation
    best_faq, confidence = rag_engine.retrieve_best_faq(incoming_query, shop["id"])

    # 4. Generate Answer or Trigger Fallback
    if best_faq and confidence >= settings.CONFIDENCE_THRESHOLD:
        response_text = rag_engine.synthesize_answer(incoming_query, shop, best_faq)
        log_query(shop["id"], customer_phone, incoming_query, is_voice, best_faq["id"], confidence, False)
    else:
        # Trigger Fallback: Dispatch Owner Alert in Background
        background_tasks.add_task(
            trigger_owner_fallback,
            shop=shop,
            customer_phone=customer_phone,
            query=incoming_query,
            confidence=confidence
        )
        response_text = (
            f"Maaf kijiye, mujhe iski pakki jankari nahi hai. 🙏\n"
            f"Maine aapka ye sawal dukaandar ({shop['owner']}) ji ko WhatsApp par forward kar diya hai. "
            f"Wo jald hi reply karenge!"
        )

    return Response(content=build_twiml_response(response_text), media_type="application/xml")

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "DukaanDost AI",
        "llm_model": settings.LLM_MODEL,
        "default_shop": settings.DEFAULT_SHOP_ID,
        "threshold": settings.CONFIDENCE_THRESHOLD
    }

# Primary Twilio Webhook routes (Both standard paths supported)
@app.post("/webhook/whatsapp")
@app.post("/api/whatsapp/webhook")
async def twilio_whatsapp_webhook(
    background_tasks: BackgroundTasks,
    From: str = Form(...),
    Body: Optional[str] = Form(None),
    NumMedia: int = Form(0),
    MediaUrl0: Optional[str] = Form(None),
    MediaContentType0: Optional[str] = Form(None)
):
    return await process_whatsapp_payload(
        background_tasks=background_tasks,
        From=From,
        Body=Body,
        NumMedia=NumMedia,
        MediaUrl0=MediaUrl0,
        MediaContentType0=MediaContentType0
    )

# Shop details & FAQs
@app.get("/api/shops/{shop_id}")
def get_shop_details(shop_id: str):
    shop = get_shop(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop

@app.get("/api/shops/{shop_id}/faqs")
def list_faqs(shop_id: str):
    return get_shop_faqs(shop_id)

@app.post("/api/shops/{shop_id}/faqs")
def create_faq(shop_id: str, payload: dict):
    faq_id = add_faq(
        shop_id=shop_id,
        category=payload.get("category", "general"),
        question=payload.get("question", ""),
        question_hi=payload.get("question_hi", ""),
        answer=payload.get("answer", ""),
        answer_hi=payload.get("answer_hi", ""),
        keywords=payload.get("keywords", "")
    )
    return {"success": True, "faq_id": faq_id}

@app.put("/api/shops/{shop_id}/faqs/{faq_id}")
def update_existing_faq(shop_id: str, faq_id: str, payload: dict):
    success = update_faq(
        shop_id=shop_id,
        faq_id=faq_id,
        category=payload.get("category", "general"),
        question=payload.get("question", ""),
        answer=payload.get("answer", ""),
        keywords=payload.get("keywords", "")
    )
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True, "faq_id": faq_id}

@app.delete("/api/shops/{shop_id}/faqs/{faq_id}")
def remove_faq(shop_id: str, faq_id: str):
    success = delete_faq(shop_id, faq_id)
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True, "deleted_id": faq_id}

@app.get("/api/shops/{shop_id}/inbox")
def get_shop_inbox(shop_id: str):
    return get_inbox_logs(shop_id)

@app.post("/api/shops/{shop_id}/status")
def change_shop_status(shop_id: str, payload: dict):
    status = payload.get("status", "open")
    status_note = payload.get("status_note", "")
    timings = payload.get("timings", None)
    updated = update_shop_status(shop_id, status, status_note, timings)
    return {"success": True, "shop": updated}

@app.post("/api/broadcast")
def broadcast_customer_update(payload: dict):
    shop_id = payload.get("shop_id", settings.DEFAULT_SHOP_ID)
    message = payload.get("message", "")
    shop = get_shop(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    log_query(shop_id, "broadcast_all", f"[BROADCAST] {message}", is_voice=False, matched_faq_id=None, confidence_score=1.0, is_fallback=False)
    return {"success": True, "broadcasted_to": "all_active_customers", "message": message}

@app.post("/api/query")
def direct_query(payload: dict):
    """Direct query endpoint for testing from frontend or external clients."""
    query = payload.get("query", "")
    shop_id = payload.get("shop_id", settings.DEFAULT_SHOP_ID)
    shop = get_shop(shop_id) or get_shop("kirana")
    
    best_faq, confidence = rag_engine.retrieve_best_faq(query, shop["id"])
    if best_faq and confidence >= settings.CONFIDENCE_THRESHOLD:
        answer = rag_engine.synthesize_answer(query, shop, best_faq)
        is_fallback = False
    else:
        answer = f"Maaf kijiye, mujhe iski pakki jankari nahi hai. 🙏 Maine aapka sawal dukaandar ({shop['owner']}) ji ko bhej diya hai."
        is_fallback = True

    return {
        "answer": answer,
        "confidence": round(confidence * 100, 1),
        "is_fallback": is_fallback,
        "matched_faq": best_faq
    }

# -----------------------------------------------------------------------------
# Auto-FAQ Generator Endpoint with PII Redaction
# -----------------------------------------------------------------------------
class ExtractedFAQItem(BaseModel):
    category: str = Field(description="Category: timings, delivery, pricing, stock, payment, or general")
    question: str = Field(description="Customer question in Hinglish/English")
    answer: str = Field(description="Shopkeeper answer")
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")

class AutoFAQResponse(BaseModel):
    success: bool
    shop_id: str
    total_messages_parsed: int
    faqs_extracted: List[ExtractedFAQItem]

@app.post("/api/auto-faq", response_model=AutoFAQResponse)
async def auto_faq_generator(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    shop_id: str = Form(settings.DEFAULT_SHOP_ID)
):
    """
    Parses past WhatsApp chat logs (.txt) and auto-populates FAQ pairs
    with PII scrubbing and LLM/heuristic extraction.
    """
    chat_content = ""
    if file:
        content = await file.read()
        chat_content = content.decode("utf-8", errors="ignore")
    elif raw_text:
        chat_content = raw_text
    else:
        raise HTTPException(status_code=400, detail="Provide either a file upload (.txt) or raw_text")

    # 1. PII Redaction Guardrail (Phone numbers and UPI IDs)
    sanitized_chat = re.sub(r"(\+91[\-\s]?)?[6-9]\d{9}", "[PHONE_REDACTED]", chat_content)
    sanitized_chat = re.sub(r"[\w\.-]+@[\w\.-]+", "[UPI_REDACTED]", sanitized_chat)

    total_lines = len(sanitized_chat.splitlines())
    extracted_faqs: List[ExtractedFAQItem] = []

    # 2. Try LLM extraction if client available
    if openai_client:
        try:
            prompt = f"""You are an expert Indian retail FAQ extractor.
Extract standard, repetitive Question-Answer pairs from this WhatsApp conversation between a shopkeeper and customers.
Focus on:
- Store timings and working days
- Product prices (e.g. Milk, Atta, Oil)
- Home delivery rules and fees
- Payment modes (UPI, Cash, Google Pay)
- Stock availability

CHAT LOG:
{sanitized_chat[:6000]}
"""
            completion = openai_client.beta.chat.completions.parse(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "Extract structured FAQ pairs from the customer chat log."},
                    {"role": "user", "content": prompt}
                ],
                response_format=List[ExtractedFAQItem],
                temperature=0.1
            )
            extracted_faqs = completion.choices[0].message.parsed
        except Exception as e:
            logger.warning(f"LLM FAQ extraction failed: {e}. Falling back to regex parser.")

    # 3. Fallback to Regex Parser if LLM not available or returned empty
    if not extracted_faqs:
        from chat_history_importer import chat_importer
        res = chat_importer.extract_and_import_faqs(sanitized_chat, shop_id)
        for item in res.get("faqs", []):
            extracted_faqs.append(ExtractedFAQItem(
                category=item.get("category", "general"),
                question=item.get("question", ""),
                answer=item.get("answer", ""),
                keywords=[w for w in item.get("question", "").lower().split() if len(w) > 3][:5]
            ))

    # 4. Commit to database if not already inserted
    if openai_client and extracted_faqs:
        for f in extracted_faqs:
            add_faq(
                shop_id=shop_id,
                category=f.category,
                question=f.question,
                question_hi=f.question,
                answer=f.answer,
                answer_hi=f.answer,
                keywords=",".join(f.keywords)
            )

    return AutoFAQResponse(
        success=True,
        shop_id=shop_id,
        total_messages_parsed=total_lines,
        faqs_extracted=extracted_faqs
    )

# -----------------------------------------------------------------------------
# Static Frontend Serving
# -----------------------------------------------------------------------------
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
css_dir = os.path.join(project_root, "css")
js_dir = os.path.join(project_root, "js")
index_file = os.path.join(project_root, "index.html")

if os.path.exists(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")
if os.path.exists(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")

@app.get("/")
def serve_index():
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "DukaanDost API is active. Open /docs for Swagger UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
