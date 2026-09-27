"""
DukaanDost Database Layer (SQLite - dukaandost.db)
Manages Shops, FAQs, Customer Query Logs, and Fallback Alerts.
"""
import sqlite3
import os
import uuid
from typing import List, Dict, Any, Optional

DATABASE_PATH = os.getenv("DATABASE_PATH", "dukaandost.db")

# Fallback to local workspace dukaandost.db if path is relative
if not os.path.isabs(DATABASE_PATH):
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", DATABASE_PATH),
        DATABASE_PATH,
        os.path.join(os.path.dirname(os.path.abspath(__file__)), DATABASE_PATH)
    ]
    for p in possible_paths:
        if os.path.exists(p):
            DATABASE_PATH = os.path.abspath(p)
            break

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Shops Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        owner TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT,
        category TEXT,
        primary_language TEXT DEFAULT 'hi',
        timings TEXT,
        delivery_min_order TEXT,
        delivery_radius TEXT,
        delivery_time TEXT,
        upi_id TEXT,
        avatar TEXT,
        widget_color TEXT DEFAULT '#10B981',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. FAQs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        id TEXT PRIMARY KEY,
        shop_id TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        question TEXT NOT NULL,
        question_hi TEXT,
        answer TEXT NOT NULL,
        answer_hi TEXT,
        keywords TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
    );
    """)

    # 3. Query Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS query_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        customer_phone TEXT,
        query_text TEXT NOT NULL,
        is_voice BOOLEAN DEFAULT 0,
        matched_faq_id TEXT,
        confidence_score REAL,
        is_fallback BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Fallback Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fallback_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id TEXT NOT NULL,
        customer_phone TEXT,
        unresolved_query TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def get_shop(shop_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_shop_faqs(shop_id: str) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM faqs WHERE shop_id = ? ORDER BY id DESC", (shop_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_faq(
    shop_id: str, 
    category: str = "general", 
    question: str = "", 
    question_hi: str = "", 
    answer: str = "", 
    answer_hi: str = "", 
    keywords: str = ""
) -> str:
    conn = get_db()
    cursor = conn.cursor()
    faq_id = f"faq-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO faqs (id, shop_id, category, question, question_hi, answer, answer_hi, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (faq_id, shop_id, category, question, question_hi or question, answer, answer_hi or answer, keywords))
    conn.commit()
    conn.close()
    return faq_id

def log_query(
    shop_id: str, 
    customer_phone: str, 
    query_text: str, 
    is_voice: bool = False, 
    matched_faq_id: Optional[str] = None, 
    confidence_score: float = 1.0, 
    is_fallback: bool = False
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO query_logs (shop_id, customer_phone, query_text, is_voice, matched_faq_id, confidence_score, is_fallback)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (shop_id, customer_phone, query_text, is_voice, matched_faq_id, confidence_score, is_fallback))

    if is_fallback:
        cursor.execute("""
        INSERT INTO fallback_alerts (shop_id, customer_phone, unresolved_query)
        VALUES (?, ?, ?)
        """, (shop_id, customer_phone, query_text))

    conn.commit()
    conn.close()

def delete_faq(shop_id: str, faq_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM faqs WHERE id = ? AND shop_id = ?", (faq_id, shop_id))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_faq(shop_id: str, faq_id: str, category: str, question: str, answer: str, keywords: str = "") -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE faqs 
    SET category = ?, question = ?, question_hi = ?, answer = ?, answer_hi = ?, keywords = ?
    WHERE id = ? AND shop_id = ?
    """, (category, question, question, answer, answer, keywords, faq_id, shop_id))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated

def get_inbox_logs(shop_id: str, limit: int = 25) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, customer_phone, query_text, is_voice, matched_faq_id, confidence_score, is_fallback, created_at
    FROM query_logs 
    WHERE shop_id = ? 
    ORDER BY id DESC LIMIT ?
    """, (shop_id, limit))
    queries = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT id, customer_phone, unresolved_query, status, created_at
    FROM fallback_alerts
    WHERE shop_id = ? AND status = 'pending'
    ORDER BY id DESC LIMIT 10
    """, (shop_id,))
    alerts = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"queries": queries, "alerts": alerts}

def update_shop_status(shop_id: str, status: str, status_note: str = "", timings: str = None) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    if timings:
        cursor.execute("UPDATE shops SET status = ?, status_note = ?, timings = ? WHERE id = ?", (status, status_note, timings, shop_id))
    else:
        cursor.execute("UPDATE shops SET status = ?, status_note = ? WHERE id = ?", (status, status_note, shop_id))
    conn.commit()
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# Aliases for cross-compatibility
get_shop_by_id = get_shop
get_faqs_for_shop = get_shop_faqs
insert_faq = add_faq
log_customer_query = log_query

log_customer_query = log_query
