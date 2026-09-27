"""
DukaanBot Full-Stack API Gateway (FastAPI)
Includes Auth, Shop Profile, FAQ Builder, Bulk LLM Generator, Multilingual Chat, and Analytics.
"""
import os
import uuid
import sqlite3
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import (
    init_db, get_db, get_user_by_phone, get_shop_by_id, 
    get_faqs_for_shop, insert_faq, log_customer_query
)
from auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user
)
from rag_engine import rag_engine
from chat_extractor import bulk_generate_and_save

# Initialize Database Schema
init_db()

app = FastAPI(
    title="DukaanBot API",
    description="Voice-Based Local Language FAQ AI Bot for Small Shops",
    version="2.0.0"
)

# Enable CORS for React + Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Pydantic Request Models
# -----------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    phone: str
    password: str
    shop_name: str
    owner_name: str
    category: Optional[str] = "Grocery & Daily Needs"
    address: Optional[str] = ""
    language_preference: Optional[str] = "en"

class LoginRequest(BaseModel):
    phone: str
    password: str

class FAQCreateRequest(BaseModel):
    shop_id: str
    question: str
    answer: str
    category: Optional[str] = "General"
    keywords: Optional[str] = ""

class FAQUpdateRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"
    keywords: Optional[str] = ""

class BulkGenerateRequest(BaseModel):
    shop_id: str
    raw_text: str

class ChatQueryRequest(BaseModel):
    shop_id: str
    query: str
    is_voice: Optional[bool] = False
    customer_id: Optional[str] = "web_guest"

class ShopUpdateRequest(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    timings: Optional[str] = None
    delivery_rules: Optional[str] = None
    address: Optional[str] = None
    upi_id: Optional[str] = None
    widget_color: Optional[str] = None

# -----------------------------------------------------------------------------
# 1. Authentication Endpoints
# -----------------------------------------------------------------------------
@app.post("/api/auth/register")
def register_shop_owner(payload: RegisterRequest):
    conn = get_db()
    cursor = conn.cursor()

    # Check if phone already registered
    cursor.execute("SELECT id FROM users WHERE phone = ?", (payload.phone,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Phone number already registered. Please login.")

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    # Clean shop ID from name
    clean_slug = "".join(c for c in payload.shop_name.lower() if c.isalnum() or c == " ").strip().replace(" ", "-")[:20]
    shop_id = f"{clean_slug}-{uuid.uuid4().hex[:4]}"

    # Create Shop Entry
    cursor.execute("""
    INSERT INTO shops (id, name, owner, phone, address, category, primary_language)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (shop_id, payload.shop_name, payload.owner_name, payload.phone, payload.address, payload.category, payload.language_preference))

    # Create User Entry
    cursor.execute("""
    INSERT INTO users (id, phone, password_hash, shop_id, language_preference)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, payload.phone, get_password_hash(payload.password), shop_id, payload.language_preference))

    # Add default basic FAQs for new shop
    default_faqs = [
        ("Dukaan khulne aur band hone ka time kya hai?", "Hamari dukaan subah 8:00 AM se raat 9:30 PM tak khuli rehti hai.", "Timings", "timing,open,close,hours"),
        ("Kya home delivery available hai?", "Haan ji! Pass ke area mein free home delivery mil jati hai.", "Delivery", "delivery,home,free"),
        ("Payment kaise kar sakte hain?", "Aap UPI, Google Pay, PhonePe, Paytm aur Cash sabhi se payment kar sakte hain.", "Payments", "pay,payment,upi,cash")
    ]
    for q, a, cat, kw in default_faqs:
        cursor.execute("INSERT INTO faqs (shop_id, question, answer, category, keywords) VALUES (?, ?, ?, ?, ?)", (shop_id, q, a, cat, kw))

    conn.commit()
    conn.close()

    token = create_access_token(user_id=user_id, shop_id=shop_id, phone=payload.phone)
    shop = get_shop_by_id(shop_id)

    return {
        "success": True,
        "token": token,
        "user": {"id": user_id, "phone": payload.phone, "shop_id": shop_id, "language": payload.language_preference},
        "shop": shop
    }

@app.post("/api/auth/login")
def login_shop_owner(payload: LoginRequest):
    user = get_user_by_phone(payload.phone)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    token = create_access_token(user_id=user["id"], shop_id=user["shop_id"], phone=user["phone"])
    shop = get_shop_by_id(user["shop_id"])

    return {
        "success": True,
        "token": token,
        "user": {"id": user["id"], "phone": user["phone"], "shop_id": user["shop_id"], "language": user["language_preference"]},
        "shop": shop
    }

@app.get("/api/auth/me")
def get_current_user_profile(user_payload: dict = Depends(get_current_user)):
    user = get_user_by_phone(user_payload["phone"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    shop = get_shop_by_id(user["shop_id"])
    return {
        "user": {"id": user["id"], "phone": user["phone"], "shop_id": user["shop_id"], "language": user["language_preference"]},
        "shop": shop
    }

# -----------------------------------------------------------------------------
# 2. Shop Profile Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/shop/{shop_id}")
def get_public_shop(shop_id: str):
    shop = get_shop_by_id(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop

@app.get("/api/shops/all")
def get_all_demo_shops():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, owner, category, address, phone FROM shops")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.put("/api/shop/{shop_id}")
def update_shop_profile(shop_id: str, payload: ShopUpdateRequest, user_payload: dict = Depends(get_current_user)):
    if user_payload.get("shop_id") != shop_id:
        raise HTTPException(status_code=403, detail="Unauthorized to edit this shop")

    conn = get_db()
    cursor = conn.cursor()
    updates = []
    values = []

    for field in ["name", "owner", "timings", "delivery_rules", "address", "upi_id", "widget_color"]:
        val = getattr(payload, field, None)
        if val is not None:
            updates.append(f"{field} = ?")
            values.append(val)

    if updates:
        values.append(shop_id)
        cursor.execute(f"UPDATE shops SET {', '.join(updates)} WHERE id = ?", values)
        conn.commit()

    conn.close()
    return get_shop_by_id(shop_id)

# -----------------------------------------------------------------------------
# 3. FAQ Knowledge Base Builder
# -----------------------------------------------------------------------------
@app.get("/api/faq/{shop_id}")
def list_shop_faqs(shop_id: str):
    return get_faqs_for_shop(shop_id)

@app.post("/api/faq")
def add_single_faq(payload: FAQCreateRequest, user_payload: dict = Depends(get_current_user)):
    faq_id = insert_faq(
        shop_id=payload.shop_id,
        question=payload.question,
        answer=payload.answer,
        category=payload.category or "General",
        keywords=payload.keywords or ""
    )
    return {"success": True, "faq_id": faq_id}

@app.put("/api/faq/{faq_id}")
def update_faq(faq_id: int, payload: FAQUpdateRequest, user_payload: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE faqs 
    SET question = ?, answer = ?, category = ?, keywords = ?
    WHERE id = ? AND shop_id = ?
    """, (payload.question, payload.answer, payload.category, payload.keywords, faq_id, user_payload["shop_id"]))
    conn.commit()
    conn.close()
    return {"success": True, "updated_id": faq_id}

@app.delete("/api/faq/{faq_id}")
def delete_faq(faq_id: int, user_payload: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM faqs WHERE id = ? AND shop_id = ?", (faq_id, user_payload["shop_id"]))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": faq_id}

# -----------------------------------------------------------------------------
# 4. Bulk FAQ Generator (Innovation Feature)
# -----------------------------------------------------------------------------
@app.post("/api/faq/bulk-generate")
def bulk_generate_faqs(payload: BulkGenerateRequest, user_payload: dict = Depends(get_current_user)):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Raw text is empty")
    
    extracted = bulk_generate_and_save(payload.raw_text, payload.shop_id)
    return {
        "success": True,
        "count": len(extracted),
        "faqs": extracted
    }

# -----------------------------------------------------------------------------
# 5. Customer Q&A Chat Pipeline (RAG-Lite + Multi-lingual)
# -----------------------------------------------------------------------------
@app.post("/api/chat")
def customer_chat(payload: ChatQueryRequest):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    result = rag_engine.answer_query(payload.query, payload.shop_id)

    # Log query into database for shopkeeper analytics
    log_customer_query(
        shop_id=payload.shop_id,
        query=payload.query,
        answer=result["answer"],
        lang=result["language"],
        is_voice=payload.is_voice or False,
        confidence=result["confidence"],
        is_fallback=result["is_fallback"],
        customer_id=payload.customer_id
    )

    return result

# -----------------------------------------------------------------------------
# 6. Analytics & Performance Dashboard
# -----------------------------------------------------------------------------
@app.get("/api/analytics/{shop_id}")
def get_shop_analytics(shop_id: str, user_payload: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    # Total queries
    cursor.execute("SELECT COUNT(*) as total FROM query_logs WHERE shop_id = ?", (shop_id,))
    total_queries = cursor.fetchone()["total"]

    # Voice queries
    cursor.execute("SELECT COUNT(*) as voice_count FROM query_logs WHERE shop_id = ? AND is_voice = 1", (shop_id,))
    voice_queries = cursor.fetchone()["voice_count"]

    # Fallback / Unanswered queries
    cursor.execute("SELECT COUNT(*) as fallback_count FROM query_logs WHERE shop_id = ? AND is_fallback = 1", (shop_id,))
    fallback_count = cursor.fetchone()["fallback_count"]

    # Recent queries list
    cursor.execute("""
    SELECT id, query_text, answer_text, language_detected, is_voice, confidence_score, is_fallback, created_at
    FROM query_logs
    WHERE shop_id = ?
    ORDER BY id DESC LIMIT 15
    """, (shop_id,))
    recent_logs = [dict(r) for r in cursor.fetchall()]

    # Unresolved inquiries pending owner review
    cursor.execute("""
    SELECT id, customer_phone, query_text, status, created_at
    FROM fallback_queries
    WHERE shop_id = ? AND status = 'pending'
    ORDER BY id DESC LIMIT 10
    """, (shop_id,))
    unanswered_inbox = [dict(r) for r in cursor.fetchall()]

    conn.close()

    resolution_rate = round(((total_queries - fallback_count) / max(total_queries, 1)) * 100, 1)

    return {
        "total_queries": total_queries,
        "voice_queries": voice_queries,
        "voice_percentage": round((voice_queries / max(total_queries, 1)) * 100, 1),
        "fallback_count": fallback_count,
        "resolution_rate": resolution_rate,
        "recent_logs": recent_logs,
        "unanswered_inbox": unanswered_inbox
    }

# -----------------------------------------------------------------------------
# 7. Embeddable Widget Snippet Service
# -----------------------------------------------------------------------------
@app.get("/widget.js")
def get_embed_widget_script():
    """Returns standalone JavaScript snippet for external shopkeeper websites."""
    script_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "widget.js")
    if os.path.exists(script_path):
        return FileResponse(script_path, media_type="application/javascript")
    return JSONResponse(status_code=404, content={"error": "widget.js not found"})

# Health check
@app.get("/api/health")
def api_health():
    return {"status": "online", "platform": "DukaanBot Full-Stack"}

# -----------------------------------------------------------------------------
# 8. Frontend Static Files & SPA Fallback (Unified Deployment)
# -----------------------------------------------------------------------------
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API or widget routes
        if full_path.startswith("api/") or full_path == "widget.js":
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "index.html not found"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

